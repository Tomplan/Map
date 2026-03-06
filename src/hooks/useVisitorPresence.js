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
export default function useVisitorPresence(shouldTrack = false, user = null) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [visitorCount, setVisitorCount] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);

  useEffect(() => {
    const sessionId = getSessionId();
    // Using a shared room for all project visitors
    const presenceKey = user ? user.id : sessionId;

    const channel = supabase.channel('global_visitors', {
      config: {
        presence: { key: presenceKey },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let visitors = 0;
        let admins = [];

        Object.values(state).forEach((presences) => {
          // Take the first presence payload for this key (in case of multiple tabs)
          const presence = presences[0];
          if (presence.is_admin) {
            admins.push({ email: presence.email, online_at: presence.online_at });
          } else {
            visitors++;
          }
        });

        // Ensure unique admins by email if needed
        const uniqueAdmins = Array.from(new Map(admins.map((a) => [a.email, a])).values());

        setOnlineCount(Object.keys(state).length);
        setVisitorCount(visitors);
        setAdminUsers(uniqueAdmins);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && shouldTrack) {
          // Once subscribed, track this user's presence so others see them
          await channel.track({ 
            is_admin: !!user,
            email: user?.email,
            online_at: new Date().toISOString() 
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shouldTrack, user]); // Re-run if auth state changes

  return { onlineCount, visitorCount, adminUsers };
}
