import { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../assets/driver-overrides.css';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useTranslation } from 'react-i18next';

/**
 * Hook to manage Driver.js tours with React integration
 *
 * @param {Object} tourConfig - Tour configuration object
 * @param {string} tourConfig.id - Unique tour identifier
 * @param {Array} tourConfig.steps - Array of tour steps
 * @param {boolean} tourConfig.autoStart - Whether to auto-start for first-time users
 * @param {Object} options - Additional options
 * @returns {Object} Tour control functions
 */
export default function useOnboardingTour(tourConfig, options = {}) {
  const {
    startTour: contextStartTour,
    stopTour: contextStopTour,
    completeTour: contextCompleteTour,
    dismissTour: contextDismissTour,
    shouldAutoStart,
    isRunning,
    activeTour,
  } = useOnboarding();

  const { t, i18n } = useTranslation();
  const driverInstance = useRef(null);
  const hasAutoStarted = useRef(false);

  // Get current language
  const currentLanguage = i18n.language;

  /**
   * Get bilingual content based on current language
   */
  const getLocalizedContent = useCallback((content) => {
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      return content[currentLanguage] || content.en || '';
    }
    return '';
  }, [currentLanguage]);

  /**
   * Handle tour completion
   */
  const handleComplete = useCallback(() => {
    if (tourConfig?.id) {
      contextCompleteTour(tourConfig.id);
    }
    if (options.onComplete) {
      options.onComplete();
    }
  }, [tourConfig, contextCompleteTour, options]);

  /**
   * Handle tour dismissal
   */
  const handleDismiss = useCallback(() => {
    if (tourConfig?.id) {
      contextDismissTour(tourConfig.id);
    }
    if (options.onDismiss) {
      options.onDismiss();
    }
  }, [tourConfig, contextDismissTour, options]);

  /**
   * Transform tour config steps to Driver.js format
   */
  const getDriverSteps = useCallback(() => {
    if (!tourConfig?.steps) return [];

    return tourConfig.steps.map((step, index) => {
      const isLast = index === tourConfig.steps.length - 1;

      // Handle both flat and nested popover structures
      const title = step.popover?.title || step.title;
      const description = step.popover?.description || step.content || step.description;
      const side = step.popover?.side || step.placement || step.side || 'bottom';
      const align = step.popover?.align || step.align || 'center';

      return {
        element: step.target || step.element,
        popover: {
          title: getLocalizedContent(title),
          description: getLocalizedContent(description),
          side,
          align,
          showButtons: step.showButtons !== false ? ['next', 'previous'] : [],
          disableButtons: step.disableButtons || [],
          nextBtnText: isLast ? t('tour.finish') : t('tour.next'),
          prevBtnText: t('tour.back'),
          doneBtnText: t('tour.finish'),
          closeBtnText: t('tour.close'),
          showProgress: true,
          // Driver.js will replace {{current}} and {{total}} automatically
          progressText: currentLanguage === 'nl' ? 'Stap {{current}} van {{total}}' : 'Step {{current}} of {{total}}',
          onNextClick: step.onNextClick || step.popover?.onNextClick,
          onPrevClick: step.onPrevClick || step.popover?.onPrevClick,
          onCloseClick: () => {
            handleDismiss();
          },
        },
        onHighlightStarted: step.onHighlightStarted,
        onHighlighted: step.onHighlighted,
        onDeselected: step.onDeselected,
      };
    });
  }, [tourConfig, getLocalizedContent, t, handleDismiss, currentLanguage]);

  /**
   * Initialize Driver.js instance
   */
  const initializeDriver = useCallback(() => {
    const steps = getDriverSteps();

    if (driverInstance.current) {
      try {
        driverInstance.current.destroy();
      } catch (e) {
        console.warn('Error while destroying existing driver instance:', e);
      }

      // Defensive cleanup: ensure any leftover popovers or overlays from
      // previous driver instances are removed before we create a new one.
      try {
        // Use cleanup helper to remove leftover DOM created by previous driver instances
        cleanupOldTourDOM();
      } catch (e) {
        console.warn('Error cleaning up old tour DOM elements:', e);
      }
    }

    // Prevent multiple driver instances from co-existing.
    try {
      if (typeof window !== 'undefined' && window.__ONBOARDING_DRIVER_INSTANCE && window.__ONBOARDING_DRIVER_INSTANCE !== driverInstance.current) {
        try { window.__ONBOARDING_DRIVER_INSTANCE.destroy && window.__ONBOARDING_DRIVER_INSTANCE.destroy(); } catch (e) { /* ignore */ }
        cleanupOldTourDOM();
      }
    } catch (e) {
      // continue — non-fatal
      console.warn('Error checking global driver instance:', e);
    }

    driverInstance.current = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: t('tour.next'),
      prevBtnText: t('tour.back'),
      doneBtnText: t('tour.finish'),
      closeBtnText: t('tour.close'),
      // Driver.js will replace {{current}} and {{total}} automatically
      progressText: currentLanguage === 'nl' ? 'Stap {{current}} van {{total}}' : 'Step {{current}} of {{total}}',
      popoverClass: 'onboarding-tour-popover',
      // Guard against environments (like some test runners) that don't implement matchMedia
      animate: (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? false : true,
      overlayOpacity: 0.7,
      smoothScroll: true,
      allowClose: true,
      disableActiveInteraction: true,

      onPopoverRender: (popover) => {
        try {
          // Force driver-active class application
          if (!document.body.classList.contains('driver-active')) {
            document.body.classList.add('driver-active');
          }
          
          // Force pointer-events on popover wrapper and all interactive elements
          if (popover && popover.wrapper) {
            popover.wrapper.style.pointerEvents = 'auto';
            
            // Force pointer events on all buttons and interactive elements
            const interactiveElements = popover.wrapper.querySelectorAll('button, [role="button"], .driver-popover-navigation-btns button');
            interactiveElements.forEach(element => {
              if (element) {
                element.style.pointerEvents = 'auto';
                element.style.cursor = 'pointer';
                element.style.userSelect = 'none';
              }
            });
            
            // Ensure popover content is not blocked
            const contentElements = popover.wrapper.querySelectorAll('.driver-popover-title, .driver-popover-description');
            contentElements.forEach(element => {
              if (element) {
                element.style.pointerEvents = 'auto';
                element.style.userSelect = 'text';
              }
            });
          }
          
            // Defensive: Ensure no conflicting event listeners
          setTimeout(() => {
            // Ensure interactive buttons in the popover are enabled and visually clickable.
            // NOTE: Replacing nodes with clones removes existing event listeners and can
            // cause the tour UI to become unresponsive. Do NOT clone or replace elements here.
            const buttons = document.querySelectorAll('.driver-popover button, .driver-popover-navigation-btns button, .driver-popover-close-btn');
            buttons.forEach(button => {
              if (button && !button.hasAttribute('data-tour-fixed')) {
                button.setAttribute('data-tour-fixed', 'true');
                button.style.pointerEvents = 'auto';
                button.style.cursor = 'pointer';
                // Keep existing event handlers intact — do not replace the node.
                // If additional behavior is required, attach non-destructive listeners here.
              }
            });
            
            // Robustness: Attach fail-safe handlers to next/prev/close buttons
            // so clicks will still control the driver instance even if driver's
            // internal listeners are missing (race conditions, DOM replacements, etc.)
            try {
              const nextBtn = document.querySelector('.driver-popover-next-btn');
              const prevBtn = document.querySelector('.driver-popover-prev-btn');
              const closeBtn = document.querySelector('.driver-popover-close-btn');

              if (nextBtn && !nextBtn.hasAttribute('data-tour-handler')) {
                nextBtn.setAttribute('data-tour-handler', 'true');
                nextBtn.addEventListener('click', () => {
                  try { driverInstance.current?.moveNext?.(); } catch (e) { /* swallow */ }
                });
              }

              if (prevBtn && !prevBtn.hasAttribute('data-tour-handler')) {
                prevBtn.setAttribute('data-tour-handler', 'true');
                prevBtn.addEventListener('click', () => {
                  try { driverInstance.current?.movePrevious?.(); } catch (e) { /* swallow */ }
                });
              }

              if (closeBtn && !closeBtn.hasAttribute('data-tour-handler')) {
                closeBtn.setAttribute('data-tour-handler', 'true');
                closeBtn.addEventListener('click', () => {
                  try { driverInstance.current?.destroy?.(); } catch (e) { /* swallow */ }
                });
              }
            } catch (e) {
              // non-fatal
            }
          }, 50);
          
        } catch (error) {
          console.warn('Tour popover render error:', error);
          // Don't throw - let the tour continue
        }
      },

      steps,

      onDestroyed: () => {
        document.body.classList.remove('driver-active');
        contextStopTour();
        // If this instance was the global instance, clear it
        try {
          if (typeof window !== 'undefined' && window.__ONBOARDING_DRIVER_INSTANCE === driverInstance.current) {
            delete window.__ONBOARDING_DRIVER_INSTANCE;
          }
        } catch (e) {
          /* ignore */
        }
      },

      onDestroyStarted: () => {
        // Check if tour was completed (reached last step)
        const currentStepIndex = driverInstance.current?.getActiveIndex();
        const totalSteps = steps.length;

        if (currentStepIndex === totalSteps - 1) {
          handleComplete();
        } else {
          // User closed tour early - treat as dismissal
          handleDismiss();
        }
      },
    });

    // Save as the global driver instance so other starts will clean up first
    try {
      if (typeof window !== 'undefined') window.__ONBOARDING_DRIVER_INSTANCE = driverInstance.current;
    } catch (e) {
      /* ignore */
    }

    return driverInstance.current;
  }, [getDriverSteps, contextStopTour, handleComplete, handleDismiss, t, currentLanguage]);

  /**
   * Start the tour with comprehensive error handling
   */
  const start = useCallback(async () => {
    try {
      if (!tourConfig?.id) {
        console.error('Tour ID is required to start a tour');
        return;
      }

      // Validate tour steps
      if (!tourConfig.steps || !Array.isArray(tourConfig.steps) || tourConfig.steps.length === 0) {
        console.error('Tour must have valid steps');
        return;
      }

      // Check if target elements exist before starting
      const requiredSteps = tourConfig.steps
        .filter(step => step.element && step.element !== 'body');

      const missingElements = requiredSteps.filter(step => !document.querySelector(step.element));

      // If none of the required targets exist (i.e. we're in the wrong page/context)
      // then don't start the tour — this avoids showing a useless popover attached
      // to the dummy/body element and confusing users.
      if (requiredSteps.length > 0 && missingElements.length === requiredSteps.length) {
        // If everything is missing, wait briefly (in case the admin page
        // or lazy-loaded components haven't rendered yet) and then re-check.
        // This avoids false negatives due to small load/timing differences.
        const waitForTargets = (ms = 3000, checkInterval = 100) => new Promise((resolve) => {
          let elapsed = 0;

          const check = () => {
            const found = requiredSteps.some(step => !!document.querySelector(step.element));
            if (found) return resolve(true);

            elapsed += checkInterval;
            if (elapsed >= ms) return resolve(false);

            setTimeout(check, checkInterval);
          };

          check();
        });

        try {
          // Wait a short period for elements to appear
          const appeared = await waitForTargets(3000, 100);

          if (!appeared) {
            console.warn('Tour elements not found (all required targets missing):', requiredSteps.map(s => s.element));
            if (options.onMissingTargets) {
              try { options.onMissingTargets(requiredSteps.map(s => s.element)); } catch (e) { /* ignore */ }
            }

            // Return false — the caller can show UI or navigate as desired
            return false;
          }
        } catch (e) {
          console.warn('Error while waiting for tour targets:', e);
          return false;
        }
      }

      contextStartTour(tourConfig.id);

      // Initialize with error handling
      const driverObj = initializeDriver();
      
      if (!driverObj) {
        console.error('Failed to initialize Driver.js instance');
        return;
      }

      // Drive with error handling
      try {
        driverObj.drive();
      } catch (driveError) {
        console.error('Error starting tour:', driveError);
        // Clean up on error
        if (driverObj && driverObj.destroy) {
          try {
            driverObj.destroy();
          } catch (cleanupError) {
            console.warn('Error during cleanup:', cleanupError);
          }
        }
        contextStopTour();
      }

    } catch (error) {
      console.error('Critical error in tour start:', error);
      // Ensure we clean up the context state
      contextStopTour();
    }
    // default: return undefined (indicates started successfully)
    return true;
  }, [tourConfig, contextStartTour, contextStopTour, initializeDriver]);

  /**
   * Stop the tour
   */
  const stop = useCallback(() => {
    if (driverInstance.current) {
      driverInstance.current.destroy();
    }
    contextStopTour();
  }, [contextStopTour]);

  /**
   * Auto-start logic
   */
  useEffect(() => {
    if (!tourConfig?.autoStart) return;
    if (hasAutoStarted.current) return;
    if (isRunning) return;

    const sessionKey = `tour_${tourConfig.id}_autostarted`;
    if (sessionStorage.getItem(sessionKey)) return;

    if (shouldAutoStart(tourConfig.id)) {
      // Delay auto-start to ensure DOM is ready
      const timer = setTimeout(() => {
        start();
        sessionStorage.setItem(sessionKey, 'true');
        hasAutoStarted.current = true;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [tourConfig, shouldAutoStart, isRunning, start]);

  /**
   * Language change handling with improved error handling
   */
  useEffect(() => {
    if (isRunning && activeTour === tourConfig?.id && driverInstance.current) {
      // Debounce language change to prevent rapid re-initialization
      const timer = setTimeout(() => {
        try {
          const currentIndex = driverInstance.current?.getActiveIndex();
          if (typeof currentIndex !== 'number') {
            console.warn('Invalid tour index during language change');
            return;
          }

          // Safely destroy old instance
          if (driverInstance.current && typeof driverInstance.current.destroy === 'function') {
            driverInstance.current.destroy();
          }

          // Ensure cleanup before reinitializing
          setTimeout(() => {
            try {
              const driverObj = initializeDriver();
              if (driverObj && typeof driverObj.drive === 'function') {
                driverObj.drive(currentIndex);
              }
            } catch (error) {
              console.error('Error reinitializing tour after language change:', error);
              // Fallback: restart tour from beginning
              try {
                const driverObj = initializeDriver();
                driverObj.drive();
              } catch (fallbackError) {
                console.error('Fallback tour restart failed:', fallbackError);
                contextStopTour();
              }
            }
          }, 150); // Increased delay for better cleanup
          
        } catch (error) {
          console.error('Error during language change handling:', error);
          contextStopTour();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentLanguage, isRunning, activeTour, tourConfig, initializeDriver, contextStopTour]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (driverInstance.current) {
        driverInstance.current.destroy();
        driverInstance.current = null;
      }
    };
  }, []);

  return {
    start,
    stop,
    isActive: isRunning && activeTour === tourConfig?.id,
    driver: driverInstance.current,
  };
}

/**
 * Helper exported for tests — removes leftover Driver.js DOM elements
 * (popovers and overlays) so repeated initialization doesn't leave
 * duplicate UI elements behind.
 */
export function cleanupOldTourDOM() {
  try {
    document.querySelectorAll('.onboarding-tour-popover').forEach(el => el.remove());
    document.querySelectorAll('.driver-overlay').forEach(el => el.remove());
  } catch (e) {
    // swallow errors in cleanup — best effort
    console.warn('cleanupOldTourDOM error:', e);
  }
}
