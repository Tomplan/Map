import React, { useState, useEffect, useRef } from 'react';
import { getLogoPath } from './utils/getLogoPath';
import { supabase } from './supabaseClient';
import { HashRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useMarkersState from './hooks/useMarkersState';
import useEventMarkers from './hooks/useEventMarkers';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import AppRoutes from './components/AppRoutes';
import { OrganizationLogoProvider } from './contexts/OrganizationLogoContext';
import { DialogProvider } from './contexts/DialogContext';
import { getDefaultLogoPath } from './utils/getDefaultLogo';
import './i18n';
import './App.css';

function AppContent() {
  // Global year selector for filtering markers by event year
  const currentYear = new Date().getFullYear();

  // i18n hook for language management
  const { i18n } = useTranslation();

  // Load user preferences from context (single source of truth)
  const { preferences, loading: preferencesLoading, updatePreference } = usePreferences();

  // Load language from localStorage on mount (instant feedback while DB loads)
  useEffect(() => {
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang && i18n.language !== storedLang) {
      i18n.changeLanguage(storedLang);
    }
  }, [i18n]);

  // Sync language bidirectionally: localStorage (login choice) takes priority on first load
  useEffect(() => {
    if (!preferencesLoading && preferences?.preferred_language) {
      const storedLang = localStorage.getItem('preferredLanguage');
      const dbLang = preferences.preferred_language;
      const currentLang = i18n.language;

      // If localStorage differs from DB (user changed at login), sync TO database
      if (storedLang && storedLang !== dbLang) {
        updatePreference('preferred_language', storedLang);
        if (currentLang !== storedLang) {
          i18n.changeLanguage(storedLang);
        }
      }
      // Otherwise, sync FROM database (multi-device sync)
      else if (currentLang !== dbLang) {
        i18n.changeLanguage(dbLang);
        localStorage.setItem('preferredLanguage', dbLang);
      }
    }
  }, [preferencesLoading, preferences?.preferred_language, i18n, updatePreference]);

  // Initialize selected year from localStorage (will sync with DB when preferences load)
  const [selectedYear, setSelectedYear] = useState(() => {
    const stored = localStorage.getItem('selectedEventYear');
    return stored ? parseInt(stored, 10) : currentYear;
  });

  // Track if we're currently syncing FROM database to prevent feedback loops
  // This flag prevents the TO database effect from firing when we update selectedYear from a DB sync
  const syncingFromDbRef = useRef(false);

  /**
   * Bidirectional year sync with feedback loop prevention
   *
   * Pattern:
   * - FROM database: When preferences.default_year changes, update selectedYear (and set flag)
   * - TO database: When selectedYear changes locally, write to database (unless flag is set)
   * - Flag prevents: DB update → state update → DB write loop
   * - Real-time updates: row_version dependency triggers fresh sync from other devices
   */

  // Sync selectedYear FROM database when preferences load (one-way: DB → state)
  useEffect(() => {
    if (!preferencesLoading && preferences?.default_year) {
      const dbYear = preferences.default_year;

      if (dbYear !== selectedYear) {
        // Set flag to prevent write-back in the next effect
        syncingFromDbRef.current = true;
        setSelectedYear(dbYear);
        localStorage.setItem('selectedEventYear', dbYear.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesLoading, preferences?.default_year, preferences?.row_version]);

  // Sync selectedYear TO database when changed locally
  // Only write if this is a LOCAL change, not a sync FROM database
  useEffect(() => {
    if (!preferencesLoading && preferences && selectedYear !== preferences.default_year) {
      // Skip write if we're currently syncing FROM database
      if (syncingFromDbRef.current) {
        syncingFromDbRef.current = false; // Reset flag
        return;
      }

      updatePreference('default_year', selectedYear);
      localStorage.setItem('selectedEventYear', selectedYear.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, preferencesLoading, updatePreference]);

  // Fetch marker data from Supabase filtered by selected year
  const { markers, archiveCurrentYear: archiveMarkers, copyFromPreviousYear: copyMarkers } = useEventMarkers(selectedYear);
  // Shared marker state for map and dashboard - real-time updates handled by useEventMarkers
  const [markersState, updateMarker, setMarkersState] = useMarkersState(markers, selectedYear);

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
    <OnboardingProvider>
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
              archiveMarkers={archiveMarkers}
              copyMarkers={copyMarkers}
            />
          </HashRouter>
        </OrganizationLogoProvider>
      </DialogProvider>
    </OnboardingProvider>
  );
}

// Wrap AppContent with PreferencesProvider for single source of truth
function App() {
  return (
    <PreferencesProvider>
      <AppContent />
    </PreferencesProvider>
  );
}

export default App;
