import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to get the current user's role from Supabase auth metadata
 *
 * Roles:
 * - super_admin: Full access to all admin features
 * - system_manager: Map Management only (marker positioning, styling)
 * - event_manager: Companies, Event Subscriptions, Assignments only
 * - null: Not logged in or no role assigned
 */
export default function useUserRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ email: null, name: null });

  useEffect(() => {
    // Listen for auth state changes (INITIAL_SESSION event will fire from App.jsx's getSession call)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      const userRole = user?.user_metadata?.role || null;
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || null;
      const userEmail = user?.email || null;

      setRole(userRole);
      setUserInfo({ email: userEmail, name: userName });
      setLoading(false);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Helper functions for role checks
  const hasRole = (requiredRole) => {
    if (!role) return false;
    if (role === 'super_admin') return true; // Super admin has all permissions
    return role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    if (!role) return false;
    if (role === 'super_admin') return true;
    return requiredRoles.includes(role);
  };

  return {
    role,
    loading,
    userInfo,
    hasRole,
    hasAnyRole,
    isSuperAdmin: role === 'super_admin',
    isSystemManager: role === 'system_manager',
    isEventManager: role === 'event_manager',
  };
}
