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

// Global state for presence so multiple hooks can share it
let globalChannel = null;
let globalState = { onlineCount: 0, visitorCount: 0, adminUsers: [] };
const listeners = new Set();

const notifyListeners = () => {
  for (const listener of listeners) {
    listener(globalState);
  }
};

export default function useVisitorPresence(shouldTrack = false, user = null) {
  const [localState, setLocalState] = useState(globalState);

  useEffect(() => {
    // Add this component to listeners
    listeners.add(setLocalState);

    // Provide initial state
    setLocalState(globalState);

    const sessionId = getSessionId();
    const presenceKey = user ? user.id : sessionId;

    if (!globalChannel) {
      // Create channel only once
      globalChannel = supabase.channel('global_visitors', {
        config: {
          presence: { key: presenceKey },
        },
      });

      globalChannel
        .on('presence', { event: 'sync' }, () => {
          const state = globalChannel.presenceState();
          let visitors = 0;
          let admins = [];

          Object.values(state).forEach((presences) => {
            const presence = presences[0];
            if (presence.is_admin) {
              admins.push({ email: presence.email, online_at: presence.online_at });
            } else {
              visitors++;
            }
          });

          const uniqueAdmins = Array.from(new Map(admins.map((a) => [a.email, a])).values());
          
          globalState = {
            onlineCount: Object.keys(state).length,
            visitorCount: visitors,
            adminUsers: uniqueAdmins
          };
          notifyListeners();
        })
        .subscribe();
    }

    // Effect for tracking - handle separately from channel creation
    if (shouldTrack) {
      if (globalChannel.state === 'joined') {
        globalChannel.track({
          is_admin: !!user,
          email: user?.email,
          online_at: new Date().toISOString()
        }).catch(console.error);
      } else {
        // Wait for channel to join before tracking
        const handleJoin = (status) => {
          if (status === 'SUBSCRIBED') {
            globalChannel.track({
              is_admin: !!user,
              email: user?.email,
              online_at: new Date().toISOString()
            }).catch(console.error);
          }
        };
        // Re-subscribe just to get the status callback if it's already connecting
        globalChannel.subscribe(handleJoin);
      }
    }

    return () => {
      listeners.delete(setLocalState);
      
      // Keep channel alive while app runs unless all listeners drop
      if (listeners.size === 0) {
        if (globalChannel) {
          supabase.removeChannel(globalChannel);
          globalChannel = null;
        }
      } else if (shouldTrack && globalChannel?.state === 'joined') {
        globalChannel.untrack().catch(console.error);
      }
    };
  }, [shouldTrack, user]);

  return localState;
}
