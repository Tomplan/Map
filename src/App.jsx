import React, { useState, useEffect } from 'react';
import { getLogoPath } from './utils/getLogoPath';
import { supabase } from './supabaseClient';
import { HashRouter, BrowserRouter } from 'react-router-dom';
import useMarkersState from './hooks/useMarkersState';
import useEventMarkers from './hooks/useEventMarkers_v2';
import AppRoutes from './components/AppRoutes';
import { OrganizationLogoProvider } from './contexts/OrganizationLogoContext';
import { getDefaultLogoPath } from './utils/getDefaultLogo';
import './i18n';
import './App.css';

function App() {
  // Global year selector for filtering markers by event year
  const currentYear = new Date().getFullYear();

  // Load selected year from localStorage or default to current year
  const [selectedYear, setSelectedYear] = useState(() => {
    const stored = localStorage.getItem('selectedEventYear');
    return stored ? parseInt(stored, 10) : currentYear;
  });

  // Persist selected year to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedEventYear', selectedYear.toString());
  }, [selectedYear]);

  // Fetch marker data from Supabase filtered by selected year
  const { markers } = useEventMarkers(selectedYear);
  // Shared marker state for map and dashboard - real-time updates handled by useEventMarkers
  const [markersState, updateMarker, setMarkersState] = useMarkersState(markers);

  const [branding, setBranding] = useState({
    logo: null, // Will be set from Organization_Profile
    themeColor: '#ffffff',
    fontFamily: 'Arvo, Sans-serif',
    eventName: '4x4 Vakantiebeurs',
  });

  // Fetch branding from Organization_Profile and subscribe to changes
  useEffect(() => {
    async function fetchBranding() {
      const { data, error } = await supabase.from('Organization_Profile').select('*').eq('id', 1).single();
      if (error) {
        console.error('Error fetching Organization_Profile:', error);
        // Keep default branding if table doesn't exist or has no data
        return;
      }
      if (data) {
        // Always use the logo from Organization_Profile (even if empty, context will handle fallback)
        const logoPath = data.logo || '';
        setBranding({
          logo: logoPath ? getLogoPath(logoPath) : null,
          eventName: data.name || '4x4 Vakantiebeurs',
          themeColor: '#ffffff',
          fontFamily: 'Arvo, Sans-serif',
        });
      }
    }
    fetchBranding();
    const channel = supabase
      .channel('organization-profile-branding-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Organization_Profile',
          filter: 'id=eq.1',
        },
        (payload) => {
          if (payload.new) {
            // Always use the logo from Organization_Profile
            const logoPath = payload.new.logo || '';
            setBranding({
              logo: logoPath ? getLogoPath(logoPath) : null,
              eventName: payload.new.name || '4x4 Vakantiebeurs',
              themeColor: '#ffffff',
              fontFamily: 'Arvo, Sans-serif',
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Track Supabase auth state
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const isProd = import.meta.env.PROD;
  const safeBase =
    import.meta.env.BASE_URL &&
    import.meta.env.BASE_URL !== '/' &&
    import.meta.env.BASE_URL !== '/./'
      ? import.meta.env.BASE_URL
      : undefined;

  const Router = isProd ? HashRouter : BrowserRouter;
  const routerProps = isProd ? {} : { basename: safeBase };

  return (
    <OrganizationLogoProvider>
      <Router {...routerProps}>
        <AppRoutes
          branding={branding}
          user={user}
          markersState={markersState}
          updateMarker={updateMarker}
          setMarkersState={setMarkersState}
          onLogin={setUser}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />
      </Router>
    </OrganizationLogoProvider>
  );
}

export default App;
