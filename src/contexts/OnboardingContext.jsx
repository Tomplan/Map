import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const startTour = useCallback((tourId) => {
    setActiveTour(tourId);
    setIsRunning(true);
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

    stopTour();
  }, [user, preferences, updatePreferences, stopTour]);

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

  const value = {
    // State
    activeTour,
    isRunning,
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
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
