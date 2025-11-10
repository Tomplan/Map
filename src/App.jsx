import React, { useState, useEffect } from 'react';
import { getLogoPath } from './utils/getLogoPath';
import { supabase } from './supabaseClient';
import { HashRouter, BrowserRouter } from 'react-router-dom';
import useMarkersState from './hooks/useMarkersState';
import useEventMarkers from './hooks/useEventMarkers_v2';
import AppRoutes from './components/AppRoutes';
import { BRANDING_CONFIG } from './config/mapConfig';
import './i18n';
import './App.css';

function App() {
  // Fetch marker data from Supabase
  const { markers } = useEventMarkers();
  // Shared marker state for map and dashboard
  const [markersState, updateMarker, setMarkersState] = useMarkersState(markers);

  // Sync markersState whenever markers change
  useEffect(() => {
    if (Array.isArray(markers)) {
      setMarkersState(markers);
    }
  }, [markers, setMarkersState]);

  const [branding, setBranding] = useState({
    logo: BRANDING_CONFIG.getDefaultLogoPath(),
    themeColor: '#ffffff',
    fontFamily: 'Arvo, Sans-serif',
    eventName: '4x4 Vakantiebeurs',
    id: 1,
    zIndex: 900,
  });

  // Fetch branding from Supabase and subscribe to changes
  useEffect(() => {
    async function fetchBranding() {
      const { data } = await supabase.from('Branding').select('*').eq('id', 1).single();
      if (data) {
        setBranding({
          ...data,
          logo: getLogoPath(data.logo),
        });
      }
    }
    fetchBranding();
    const channel = supabase
      .channel('branding-user-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Branding',
          filter: 'id=eq.1',
        },
        (payload) => {
          if (payload.new) {
            setBranding({
              ...payload.new,
              logo: getLogoPath(payload.new.logo),
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
    <Router {...routerProps}>
      <AppRoutes
        branding={branding}
        user={user}
        markersState={markersState}
        updateMarker={updateMarker}
        setMarkersState={setMarkersState}
        onLogin={setUser}
      />
    </Router>
  );
}

export default App;
