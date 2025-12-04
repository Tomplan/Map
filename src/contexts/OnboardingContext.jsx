import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { usePreferences } from './PreferencesContext';
import { supabase } from '../supabaseClient';

const OnboardingContext = createContext(null);

/**
 * OnboardingProvider - Manages onboarding tour state across the application
 *
 * Features:
 * - Track active tour and running state
 * - Persist completed/dismissed tours to Supabase (logged-in) or localStorage (anonymous)
 * - Provide tour control functions (start, stop, reset, dismiss)
 * - Query tour completion status
 */
export function OnboardingProvider({ children }) {
  const { preferences, loading: preferencesLoading, updatePreferences } = usePreferences();
  const [activeTour, setActiveTour] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  // Track where the current/last tours were started from (eg 'help', 'admin', 'ui')
  const [activeTourSource, setActiveTourSource] = useState(null);
  const activeTourSourceRef = useRef(null);
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Get completed/dismissed tours from preferences or localStorage
  const getToursFromStorage = useCallback(() => {
    if (user && preferences) {
      // Logged-in user: Use Supabase preferences
      return {
        completed: preferences.tours_completed || [],
        dismissed: preferences.tours_dismissed || [],
      };
    } else {
      // Anonymous user: Use localStorage
      const completed = [];
      const dismissed = [];

      // Scan localStorage for tour entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('onboarding_')) {
          const tourId = key.replace('onboarding_', '');
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.completed) completed.push(tourId);
            if (data.dismissed) dismissed.push(tourId);
          } catch (e) {
            console.error('Error parsing tour data from localStorage:', e);
          }
        }
      }

      return { completed, dismissed };
    }
  }, [user, preferences]);

  const { completed: completedTours, dismissed: dismissedTours } = getToursFromStorage();

  /**
   * Start a tour
   */
  // startTour can accept optional metadata, e.g. { source: 'help' }
  const startTour = useCallback((tourId, meta = {}) => {
    setActiveTour(tourId);
    setIsRunning(true);
    setActiveTourSource(meta?.source || null);
  }, []);

  /**
   * Stop the current tour
   */
  const stopTour = useCallback(() => {
    // Ensure driver-active class is removed (defensive cleanup)
    document.body.classList.remove('driver-active');
    setActiveTour(null);
    setIsRunning(false);
  }, []);

  /**
   * Mark a tour as completed
   */
  const completeTour = useCallback(async (tourId) => {
    if (user && updatePreferences) {
      // Logged-in user: Update Supabase
      const currentCompleted = preferences?.tours_completed || [];
      if (!currentCompleted.includes(tourId)) {
        await updatePreferences({
          tours_completed: [...currentCompleted, tourId],
          last_tour_date: new Date().toISOString(),
        });
      }
    } else {
      // Anonymous user: Update localStorage
      const key = `onboarding_${tourId}`;
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      localStorage.setItem(key, JSON.stringify({
        ...data,
        completed: true,
        lastSeen: Date.now(),
      }));
    }

    // Record the last completed tour alongside its starting source
    try {
      const source = activeTourSourceRef?.current ?? activeTourSource ?? null;
      const payload = { id: tourId, source };
      setLastCompletedTour(payload);
      try {
        if (typeof window !== 'undefined') {
          try { window.__onboarding_last_completed__ = payload; } catch (e) { /* ignore */ }
          if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('onboarding:completed', { detail: payload }));
          }
        }
      } catch (e) { /* ignore */ }
    } catch (e) {
      // non-fatal
    }

    // Reset running source state
    setActiveTourSource(null);

    stopTour();
  }, [user, preferences, updatePreferences, stopTour]);

    // Keep a mutable ref to always read the latest activeTourSource synchronously
    useEffect(() => {
      activeTourSourceRef.current = activeTourSource;
    }, [activeTourSource]);

  

  /**
   * Permanently dismiss a tour
   */
  const dismissTour = useCallback(async (tourId) => {
    if (user && updatePreferences) {
      // Logged-in user: Update Supabase
      const currentDismissed = preferences?.tours_dismissed || [];
      if (!currentDismissed.includes(tourId)) {
        await updatePreferences({
          tours_dismissed: [...currentDismissed, tourId],
          last_tour_date: new Date().toISOString(),
        });
      }
    } else {
      // Anonymous user: Update localStorage
      const key = `onboarding_${tourId}`;
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      localStorage.setItem(key, JSON.stringify({
        ...data,
        dismissed: true,
        lastSeen: Date.now(),
      }));
    }

    stopTour();
  }, [user, preferences, updatePreferences, stopTour]);

  /**
   * Reset a tour (clear completion/dismissal status)
   */
  const resetTour = useCallback(async (tourId) => {
    if (user && updatePreferences) {
      // Logged-in user: Update Supabase
      const currentCompleted = preferences?.tours_completed || [];
      const currentDismissed = preferences?.tours_dismissed || [];

      await updatePreferences({
        tours_completed: currentCompleted.filter(id => id !== tourId),
        tours_dismissed: currentDismissed.filter(id => id !== tourId),
      });
    } else {
      // Anonymous user: Remove from localStorage
      const key = `onboarding_${tourId}`;
      localStorage.removeItem(key);
    }
  }, [user, preferences, updatePreferences]);

  // Last completed tour metadata (id + source) so consumers can react to
  // completion events (for example, reopen help when the user completed a
  // tour that was started from the Help panel)
  const [lastCompletedTour, setLastCompletedTour] = useState(null);

  const clearLastCompletedTour = useCallback(() => setLastCompletedTour(null), []);

  /**
   * Check if a tour has been completed
   */
  const isTourCompleted = useCallback((tourId) => {
    return completedTours.includes(tourId);
  }, [completedTours]);

  /**
   * Check if a tour has been dismissed
   */
  const isTourDismissed = useCallback((tourId) => {
    return dismissedTours.includes(tourId);
  }, [dismissedTours]);

  /**
   * Check if a tour should auto-start (not completed and not dismissed)
   */
  const shouldAutoStart = useCallback((tourId) => {
    return !completedTours.includes(tourId) && !dismissedTours.includes(tourId);
  }, [completedTours, dismissedTours]);

  /**
   * Reset all tours (admin function)
   */
  const resetAllTours = useCallback(async () => {
    if (user && updatePreferences) {
      // Logged-in user: Clear Supabase
      await updatePreferences({
        tours_completed: [],
        tours_dismissed: [],
        last_tour_date: null,
      });
    } else {
      // Anonymous user: Clear localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('onboarding_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }, [user, updatePreferences]);

  // Developer/test helper: expose a safe test hook in non-production so
  // end-to-end tests can trigger completion deterministically. This is
  // attached only in dev/test environments and is not present in
  // production builds.
  useEffect(() => {
    // Expose test helpers for local dev (NODE_ENV !== 'production')
    // or when CI explicitly opts-in via build-time Vite env var
    // VITE_E2E_TEST_HELPERS=1. This keeps production bundles clean while
    // allowing deterministic E2E runs in CI preview builds.
    // We avoid using `import.meta` directly so Jest (node) won't fail parsing.
    // Support multiple opt-ins so CI can enable test helpers during a preview
    // build by setting VITE_E2E_TEST_HELPERS or E2E_TEST_HELPERS in the build env.
    const envOptIn = typeof process !== 'undefined' && (
      process.env?.VITE_E2E_TEST_HELPERS === '1' || process.env?.E2E_TEST_HELPERS === '1'
    );

    const allowTestHelpers = (typeof window !== 'undefined' &&
      (process.env.NODE_ENV !== 'production' || envOptIn || globalThis?.__E2E_TEST_HELPERS__ === '1'));
    if (allowTestHelpers) {
      try {
        window.__onboarding_test_helpers__ = {
          startTour: (id, source = null) => {
            try { window.__onboarding_active_source__ = source; } catch (e) {}
            return startTour(id, { source });
          },
          getActiveSource: () => activeTourSourceRef.current,
          completeTour: (id) => completeTour(id),
          resetAll: () => resetAllTours(),
        };
      } catch (e) {
        // non-fatal — testing helper best effort
      }
    }

    return () => {
      try {
        try {
          if (typeof window !== 'undefined' && window.__onboarding_test_helpers__) {
          delete window.__onboarding_test_helpers__;
          }
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }
    };
  }, [completeTour, resetAllTours]);

  const value = {
    // State
    activeTour,
    isRunning,
    activeTourSource,
    lastCompletedTour,
    completedTours,
    dismissedTours,
    loading: preferencesLoading,

    // Control functions
    startTour,
    stopTour,
    completeTour,
    dismissTour,
    resetTour,
    resetAllTours,

    // Last-completed helpers
    clearLastCompletedTour,

    // Query functions
    isTourCompleted,
    isTourDismissed,
    shouldAutoStart,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

OnboardingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * useOnboarding - Hook to access onboarding context
 *
 * Use this in components to access tour state and control functions.
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    // Provide a safe fallback for environments (tests, isolated components)
    // where the provider isn't mounted. This avoids tests crashing when
    // rendering tour components in isolation while preserving behavior
    // for normal app usage.
    return {
      activeTour: null,
      isRunning: false,
      activeTourSource: null,
      lastCompletedTour: null,
      completedTours: [],
      dismissedTours: [],
      loading: false,

      // No-op control functions
      startTour: () => {},
      stopTour: () => {},
      completeTour: () => {},
      dismissTour: () => {},
      resetTour: () => {},
      resetAllTours: () => {},
      clearLastCompletedTour: () => {},

      // Query helpers
      isTourCompleted: () => false,
      isTourDismissed: () => false,
      shouldAutoStart: () => false,
    };
  }

  return context;
}
