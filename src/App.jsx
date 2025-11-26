import React, { useState, useEffect, useRef } from 'react';
import { getLogoPath } from './utils/getLogoPath';
import { supabase } from './supabaseClient';
import { HashRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useMarkersState from './hooks/useMarkersState';
import useEventMarkers from './hooks/useEventMarkers';
import useUserPreferences from './hooks/useUserPreferences';
import AppRoutes from './components/AppRoutes';
import { OrganizationLogoProvider } from './contexts/OrganizationLogoContext';
import { DialogProvider } from './contexts/DialogContext';
import { getDefaultLogoPath } from './utils/getDefaultLogo';
import './i18n';
import './App.css';

function App() {
  // Global year selector for filtering markers by event year
  const currentYear = new Date().getFullYear();

  // i18n hook for language management
  const { i18n } = useTranslation();

  // Load user preferences from database with cross-device sync
  const { preferences, loading: preferencesLoading, updatePreference } = useUserPreferences();

  // Initialize selected year from localStorage (will be synced with DB when preferences load)
  const [selectedYear, setSelectedYear] = useState(() => {
    const stored = localStorage.getItem('selectedEventYear');
    return stored ? parseInt(stored, 10) : currentYear;
  });

  // Ref to track the last synced year from database (prevents feedback loops)
  const lastSyncedYearRef = useRef(null);

  // Sync selectedYear FROM database when preferences load
  useEffect(() => {
    if (!preferencesLoading && preferences?.default_year) {
      const dbYear = preferences.default_year;
      if (dbYear !== selectedYear) {
        lastSyncedYearRef.current = dbYear;
        setSelectedYear(dbYear);
        localStorage.setItem('selectedEventYear', dbYear.toString());
      }
    }
  }, [preferencesLoading, preferences?.default_year]);

  // Sync selectedYear TO database when changed locally (with loop prevention)
  useEffect(() => {
    if (!preferencesLoading && preferences) {
      const dbYear = preferences.default_year || currentYear;
      const yearChanged = selectedYear !== dbYear;
      const notFromSync = selectedYear !== lastSyncedYearRef.current;

      if (yearChanged && notFromSync) {
        updatePreference('default_year', selectedYear);
        localStorage.setItem('selectedEventYear', selectedYear.toString());
      }
    }
  }, [selectedYear, preferencesLoading, preferences, updatePreference, currentYear]);

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

  // Fetch branding from organization_profile and subscribe to changes
  useEffect(() => {
    async function fetchBranding() {
      const { data, error } = await supabase.from('organization_profile').select('*').eq('id', 1).single();
      if (error) {
        console.error('Error fetching organization_profile:', error);
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
          table: 'organization_profile',
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
    // Get initial session (this is the ONLY getSession call in the app)
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <DialogProvider>
      <OrganizationLogoProvider>
        <HashRouter>
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
        </HashRouter>
      </OrganizationLogoProvider>
    </DialogProvider>
  );
}

export default App;
