import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BRANDING_CONFIG } from '../config/mapConfig';

const OrganizationLogoContext = createContext();

/**
 * Provides the organization logo from Organization_Profile as the default fallback logo
 * throughout the entire application
 */
export function OrganizationLogoProvider({ children }) {
  const [organizationLogo, setOrganizationLogo] = useState(BRANDING_CONFIG.DEFAULT_LOGO);
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

        if (data && data.logo && data.logo.trim() !== '') {
          setOrganizationLogo(data.logo);
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
          if (payload.new && payload.new.logo) {
            if (payload.new.logo.trim() !== '') {
              setOrganizationLogo(payload.new.logo);
            } else {
              // If logo is cleared, fall back to static default
              setOrganizationLogo(BRANDING_CONFIG.DEFAULT_LOGO);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <OrganizationLogoContext.Provider value={{ organizationLogo, loading }}>
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
