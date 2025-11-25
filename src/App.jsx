import React, { useState, useEffect } from 'react';
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

  // Load user preferences from database
  const { preferences, loading: preferencesLoading, updatePreference } = useUserPreferences();

  // Initialize selected year from preferences or fallback to localStorage/current year
  const [selectedYear, setSelectedYear] = useState(() => {
    // Fallback to localStorage for backwards compatibility during migration
    const stored = localStorage.getItem('selectedEventYear');
    return stored ? parseInt(stored, 10) : currentYear;
  });

  // Sync selectedYear with database preferences when they load
  useEffect(() => {
    if (!preferencesLoading && preferences?.default_year) {
      setSelectedYear(preferences.default_year);
    }
  }, [preferencesLoading, preferences?.default_year]);

  // Update database when selectedYear changes (also keep localStorage for backwards compatibility)
  useEffect(() => {
    // Update localStorage for backwards compatibility
    localStorage.setItem('selectedEventYear', selectedYear.toString());

    // Update database if preferences are loaded and year is different
    if (!preferencesLoading && preferences && preferences.default_year !== selectedYear) {
      updatePreference('default_year', selectedYear);
    }
  }, [selectedYear, preferencesLoading, preferences, updatePreference]);

  // Sync language preference with database when preferences load
  useEffect(() => {
    if (!preferencesLoading && preferences?.preferred_language) {
      // Only change language if it's different from current
      if (i18n.language !== preferences.preferred_language) {
        i18n.changeLanguage(preferences.preferred_language);
      }
    }
  }, [preferencesLoading, preferences?.preferred_language, i18n]);

  // Update database when language changes in i18n (also syncs with i18next's localStorage)
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      // Update database if preferences are loaded and language is different
      if (!preferencesLoading && preferences && preferences.preferred_language !== lng) {
        updatePreference('preferred_language', lng);
      }
    };

    // Listen for language changes from i18next
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, preferencesLoading, preferences, updatePreference]);

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
