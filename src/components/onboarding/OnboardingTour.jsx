import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import useOnboardingTour from '../../hooks/useOnboardingTour';
import { useOnboarding } from '../../contexts/OnboardingContext';
import TourErrorBoundary from './TourErrorBoundary';

/**
 * OnboardingTour Component
 *
 * Wrapper component for Driver.js tours that handles auto-start and lifecycle
 * Includes error boundary for robust error handling
 *
 * @param {Object} tourConfig - Tour configuration
 * @param {string} tourConfig.id - Unique tour ID
 * @param {Array} tourConfig.steps - Tour steps array
 * @param {boolean} tourConfig.autoStart - Auto-start for first-time users
 * @param {Function} onComplete - Callback when tour completes
 * @param {Function} onDismiss - Callback when tour is dismissed
 */
export default function OnboardingTour({ tourConfig, onComplete, onDismiss, children }) {
  const { start, stop, isActive } = useOnboardingTour(tourConfig, {
    onComplete,
    onDismiss,
  });

  const { activeTour } = useOnboarding();

  // If some other part of the app set the active tour (for example a
  // navigation + retry flow), automatically start when our tour becomes
  // the active one. This allows the Help panel to request navigation and
  // then rely on the mounted page to start the tour when it arrives.
  React.useEffect(() => {
    if (activeTour === tourConfig?.id && !isActive && typeof start === 'function') {
      // Start with the default options — callers (Help panel) will request
      // nav + set context activeTour when appropriate.
      start();
    }
  }, [activeTour, isActive, start, tourConfig]);

  // Handle tour-specific retry logic
  const handleRetry = () => {
    if (start) {
      start();
    }
  };

  // Handle tour-specific dismiss logic
  const handleDismiss = () => {
    if (stop) {
      stop();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  // Create the tour content with error boundary
  const tourContent = () => {
    // Expose start/stop functions to children if it's a function (render prop pattern)
    if (typeof children === 'function') {
      return children({ start, stop, isActive });
    }

    return children || null;
  };

  return (
    <TourErrorBoundary 
      onRetry={handleRetry}
      onDismiss={handleDismiss}
    >
      {tourContent()}
    </TourErrorBoundary>
  );
}

OnboardingTour.propTypes = {
  tourConfig: PropTypes.shape({
    id: PropTypes.string.isRequired,
    steps: PropTypes.arrayOf(PropTypes.shape({
      target: PropTypes.string,
      element: PropTypes.string,
      title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      description: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      placement: PropTypes.string,
      side: PropTypes.string,
      align: PropTypes.string,
    })).isRequired,
    autoStart: PropTypes.bool,
  }).isRequired,
  onComplete: PropTypes.func,
  onDismiss: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

OnboardingTour.defaultProps = {
  onComplete: null,
  onDismiss: null,
  children: null,
};
