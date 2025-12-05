import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BRANDING_CONFIG } from '../config/mapConfig';
import { getLogoPath } from '../utils/getLogoPath';
import { getDefaultLogoPath } from '../utils/getDefaultLogo';

const OrganizationLogoContext = createContext();

/**
 * Provides the organization logo from Organization_Profile as the default fallback logo
 * throughout the entire application
 */
export function OrganizationLogoProvider({ children }) {
  // Keep both the raw DB value and a resolved path so consumers can choose
  // which form they need. Some consumers (like HomePage) need the original
  // DB value to attempt fallback when a generated variant doesn't exist.
  const [organizationLogoRaw, setOrganizationLogoRaw] = useState(BRANDING_CONFIG.DEFAULT_LOGO);
  const [organizationLogo, setOrganizationLogo] = useState(getDefaultLogoPath());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch organization profile logo
    async function fetchOrganizationLogo() {
      try {
        const { data, error } = await supabase
          .from('organization_profile')
          .select('logo')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('Error fetching organization logo:', error);
          return;
        }

        console.log('[OrganizationLogoContext] Fetched data:', data);
        console.log('[OrganizationLogoContext] data.logo:', data?.logo);

        if (data && data.logo && data.logo.trim() !== '') {
          // Keep the raw DB value and provide a resolved variant for consumers
          // that prefer a predictable URL.
          const raw = data.logo;
          const normalized = getLogoPath(raw);
          console.log('[OrganizationLogoContext] Setting logo raw:', raw);
          console.log('[OrganizationLogoContext] Setting logo to:', normalized);
          setOrganizationLogoRaw(raw);
          setOrganizationLogo(normalized);
        } else {
          console.log('[OrganizationLogoContext] Keeping default logo:', BRANDING_CONFIG.DEFAULT_LOGO);
        }
      } catch (err) {
        console.error('Error fetching organization logo:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizationLogo();

    // Subscribe to changes in organization_profile
    const channel = supabase
      .channel('organization-logo-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_profile',
          filter: 'id=eq.1',
        },
        (payload) => {
          if (payload.new) {
            // If the new value is empty/cleared, fall back to static default path
            if (!payload.new.logo || payload.new.logo.trim() === '') {
              // Cleared -> restore raw default & resolved default
              setOrganizationLogoRaw(BRANDING_CONFIG.DEFAULT_LOGO);
              setOrganizationLogo(getDefaultLogoPath());
            } else {
              const raw = payload.new.logo;
              const normalized = getLogoPath(raw);
              setOrganizationLogoRaw(raw);
              setOrganizationLogo(normalized);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <OrganizationLogoContext.Provider value={{ organizationLogo, organizationLogoRaw, loading }}>
      {children}
    </OrganizationLogoContext.Provider>
  );
}

/**
 * Hook to get the organization logo (used as default fallback throughout the app)
 */
export function useOrganizationLogo() {
  const context = useContext(OrganizationLogoContext);
  if (context === undefined) {
    throw new Error('useOrganizationLogo must be used within OrganizationLogoProvider');
  }
  return context;
}
