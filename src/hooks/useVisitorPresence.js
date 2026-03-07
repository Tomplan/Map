import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const getSessionId = () => {
  let sid = sessionStorage.getItem('visitor_session_id');
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('visitor_session_id', sid);
  }
  return sid;
};

// Singleton state
let globalChannel = null;
let globalState = { onlineCount: 0, visitorCount: 0, adminUsers: [] };
let isJoined = false;
let currentTrackedState = null; // keeps track of the latest params we tried to track

const listeners = new Set();

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

  // Iterate over exactly the unique keys Supabase Presence identifies 
  Object.entries(state).forEach(([key, presences]) => {
    // If a single user ID/session has multiple connections, group them
    const presence = presences[0];
    if (presence?.is_admin) {
      // Use user.email if available, else fallback to something visible
      const displayEmail = presence.email || 'Admin';
      admins.push({ email: displayEmail, key: key, online_at: presence.online_at });
    } else {
      visitors++;
    }
  });

  // Since presences are grouped by presenceKey (which is user.id or sessionId),
  // they are intrinsically uniquely scoped per device/user account.
  // Using email strictly for uniqueness hides two separate Admins with the same email.
  // Instead, rely on unique key presence map:
  const uniqueAdminsByKey = Array.from(new Map(admins.map(a => [a.key, a])).values());

  globalState = {
    // Real accurate count of distinctly connected presence keys
    onlineCount: Object.keys(state).length,
    visitorCount: visitors,
    adminUsers: uniqueAdminsByKey
  };
  notifyListeners();
};

export default function useVisitorPresence(shouldTrack = false, user = null) {
  const [localState, setLocalState] = useState(globalState);

  useEffect(() => {
    listeners.add(setLocalState);
    setLocalState(globalState);

    // Initialize channel once globally
    if (!globalChannel) {
      const sessionId = getSessionId();
      // Supabase will link presence exactly to this key.
      const presenceKey = user?.id || sessionId;

      globalChannel = supabase.channel('global_visitors', {
        config: { presence: { key: presenceKey } },
      });

      globalChannel.on('presence', { event: 'sync' }, syncPresenceState);

      globalChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isJoined = true;
          // Apply any pending tracking state now that we are formally joined
          if (currentTrackedState) {
            globalChannel.track(currentTrackedState).catch(console.error);
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isJoined = false;
        }
      });
    }

    return () => {
      listeners.delete(setLocalState);
      
      // If no one is listening anymore, safely shutdown channel
      if (listeners.size === 0 && globalChannel) {
        supabase.removeChannel(globalChannel);
        globalChannel = null;
        isJoined = false;
      }
    };
  }, []); // Run setup strictly once for listeners

  // Track user presence if shouldTrack changes or user changes
  useEffect(() => {
    if (!shouldTrack) {
      if (currentTrackedState && isJoined && globalChannel) {
         currentTrackedState = null;
         globalChannel.untrack().catch(console.error);
      }
      return;
    }

    // Capture newest available trackable state
    const newState = {
      is_admin: !!user,
      email: user?.email,
      online_at: new Date().toISOString()
    };
    
    currentTrackedState = newState;

    // Only broadcast track if we are already safely joined
    // otherwise the pending state will be picked up by the subscribe callback
    if (globalChannel && isJoined) {
      globalChannel.track(newState).catch(console.error);
    }
  }, [shouldTrack, user]);

  return localState;
}
