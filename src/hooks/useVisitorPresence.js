import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const getSessionId = () => {
  let sid = sessionStorage.getItem('visitor_session_id');
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('visitor_session_id', sid);
  }
  return sid;
};

// --- SINGLETON PRESENCE MANAGER --- //
let globalChannel = null;
let globalState = { onlineCount: 0, visitorCount: 0, adminUsers: [] };
const listeners = new Set();
let isJoined = false;

// We need a registry of who is actively asking to be tracked among all Hook instances.
// Usually only App.jsx tracks. We just store the single tracked payload here.
let activeTrackingPayload = null; 

const notifyListeners = () => {
  for (const listener of listeners) {
    listener(globalState);
  }
};

const syncPresenceState = () => {
  if (!globalChannel) return;
  const state = globalChannel.presenceState();
  let visitors = 0;
  let admins = [];

  Object.entries(state).forEach(([key, presences]) => {
    // Only care about the latest payload for a specific connection key
    const presence = presences[0];
    if (presence?.is_admin) {
      const displayEmail = presence.email || 'Admin';
      admins.push({ email: displayEmail, key: key, online_at: presence.online_at });
    } else {
      visitors++;
    }
  });

  // Deduplicate admins by email so if the same admin is logged in 
  // on multiple devices/browser tabs, they gracefully count as 1 Admin.
  const uniqueAdminsByEmail = Array.from(new Map(admins.map(a => [a.email, a])).values());

  globalState = {
    onlineCount: Object.keys(state).length,
    visitorCount: visitors,
    adminUsers: uniqueAdminsByEmail
  };
  notifyListeners();
};

export default function useVisitorPresence(shouldTrack = false, user = null) {
  const [localState, setLocalState] = useState(globalState);

  useEffect(() => {
    listeners.add(setLocalState);

    // Initialize the shared websocket channel once globally
    if (!globalChannel) {
      const sessionId = getSessionId();
      const presenceKey = user?.id || sessionId;

      globalChannel = supabase.channel('global_visitors', {
        config: { presence: { key: presenceKey } },
      });

      globalChannel.on('presence', { event: 'sync' }, syncPresenceState);

      globalChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isJoined = true;
          // If a tracking payload was queued up while we were connecting, formally push it
          if (activeTrackingPayload) {
            globalChannel.track(activeTrackingPayload).catch(console.error);
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isJoined = false;
        }
      });
    }

    return () => {
      listeners.delete(setLocalState);
      
      // If no components are listening anymore across the whole app, cleanly shut down
      if (listeners.size === 0 && globalChannel) {
        supabase.removeChannel(globalChannel);
        globalChannel = null;
        isJoined = false;
        activeTrackingPayload = null;
      }
    };
  }, []); // Run socket initializer exactly once

  // Isolate Tracking Actions specifically so non-tracking components (like Dashboard)
  // don't accidentally "untrack" the main App component's connection.
  useEffect(() => {
    // If this Hook instance isn't trying to broadcast presence (shouldTrack = false)
    // do absolutely nothing. Do not interfere with global tracking!
    if (!shouldTrack) return; 

    // Capture newest available trackable state for this user/admin
    const newState = {
      is_admin: !!user,
      email: user?.email,
      online_at: new Date().toISOString()
    };
    
    // Store in global memory in case the socket is still handshaking
    activeTrackingPayload = newState;

    // Send the dynamic user heartbeat over the network right now if socket is open
    if (globalChannel && isJoined) {
      globalChannel.track(newState).catch(console.error);
    }

    // Cleanup: ONLY untrack if the component that explicitly originally asked to track unmounts.
    // (e.g. App.jsx unmounting... which rarely ever happens).
    return () => {
      if (isJoined && globalChannel) {
         activeTrackingPayload = null;
         globalChannel.untrack().catch(console.error);
      }
    };
  }, [shouldTrack, user]);

  return localState;
}
