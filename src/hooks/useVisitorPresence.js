import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Generates a simple random ID for the current session/tab so we don't need user login
const getSessionId = () => {
  let sid = sessionStorage.getItem('visitor_session_id');
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('visitor_session_id', sid);
  }
  return sid;
};

/**
 * Tracks and reports amount of online users.
 * 
 * @param {boolean} shouldTrack - If true, this client will add itself to the presence count.
 * @returns {object} { onlineCount } the current number of online users
 */
export default function useVisitorPresence(shouldTrack = false) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const sessionId = getSessionId();
    // Using a shared room for all project visitors
    const channel = supabase.channel('global_visitors', {
      config: {
        presence: { key: sessionId },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Count how many unique keys are currently present
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && shouldTrack) {
          // Once subscribed, track this user's presence so others see them
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shouldTrack]);

  return { onlineCount };
}
