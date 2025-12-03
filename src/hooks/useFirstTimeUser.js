import { useState, useEffect } from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';

/**
 * Hook to determine if a user is seeing a tour for the first time
 *
 * @param {string} tourId - The ID of the tour to check
 * @returns {{ isFirstTime: boolean|null, loading: boolean }}
 */
export default function useFirstTimeUser(tourId) {
  const { isTourCompleted, isTourDismissed, loading } = useOnboarding();
  const [isFirstTime, setIsFirstTime] = useState(null);

  useEffect(() => {
    if (loading) {
      setIsFirstTime(null);
      return;
    }

    // Check if user has never completed or dismissed this tour
    const hasCompleted = isTourCompleted(tourId);
    const hasDismissed = isTourDismissed(tourId);

    setIsFirstTime(!hasCompleted && !hasDismissed);
  }, [tourId, isTourCompleted, isTourDismissed, loading]);

  return { isFirstTime, loading };
}
