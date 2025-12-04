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

  // Enhanced cleanup helper with better error handling and memory management
  const forceCleanup = useCallback((instance) => {
    try {
      const drv = instance || driverInstance.current;
      let cleanupErrors = [];

      // 1. Destroy driver instance first
      if (drv && typeof drv.destroy === 'function') {
        try {
          drv.destroy();
          console.log('[TOUR DEBUG] Driver instance destroyed');
        } catch (e) {
          cleanupErrors.push('driver-destroy');
          console.warn('Error destroying driver instance:', e);
        }
      }

      // 2. Remove DOM elements
      try {
        cleanupOldTourDOM();
        console.log('[TOUR DEBUG] Tour DOM elements cleaned up');
      } catch (e) {
        cleanupErrors.push('dom-cleanup');
        console.warn('Error cleaning up DOM:', e);
      }

      // 3. Remove body classes
      try {
        if (document.body.classList.contains('driver-active')) {
          document.body.classList.remove('driver-active');
        }
        // Also remove any driver-related classes
        document.body.classList.remove('driver-overlay', 'driver-fade');
      } catch (e) {
        cleanupErrors.push('body-classes');
        console.warn('Error removing body classes:', e);
      }

      // 4. Clear global references
      try {
        if (typeof window !== 'undefined') {
          if (window.__ONBOARDING_DRIVER_INSTANCE === drv) {
            delete window.__ONBOARDING_DRIVER_INSTANCE;
          }
          // Clear any other tour-related globals
          delete window.__onboarding_test_helpers__;
          delete window.__onboarding_active_source__;
          delete window.__onboarding_last_completed__;
        }
      } catch (e) {
        cleanupErrors.push('globals');
        console.warn('Error clearing globals:', e);
      }

      // 5. Clear local references
      try {
        if (driverInstance.current === drv) {
          driverInstance.current = null;
        }
        hasAutoStarted.current = false;
      } catch (e) {
        cleanupErrors.push('local-refs');
        console.warn('Error clearing local refs:', e);
      }

      // 6. Memory cleanup - remove event listeners
      try {
        // Remove any remaining event listeners on the document
        document.removeEventListener('keydown', handleEscapeKey, true);
        document.removeEventListener('click', handleDocumentClick, true);
      } catch (e) {
        cleanupErrors.push('event-listeners');
        console.warn('Error removing event listeners:', e);
      }

      // Log cleanup summary
      if (cleanupErrors.length > 0) {
        console.warn(`Tour cleanup completed with ${cleanupErrors.length} minor errors:`, cleanupErrors);
      } else {
        console.log('[TOUR DEBUG] Tour cleanup completed successfully');
      }

    } catch (e) {
      console.error('Critical error in forceCleanup:', e);
    }
  }, []);

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
    // Force cleanup when dismissed
    if (driverInstance.current) {
      try {
        driverInstance.current.destroy();
      } catch (e) {
        console.warn('Error destroying driver on dismiss:', e);
        forceCleanup();
      }
    }
  }, [tourConfig, contextDismissTour, options, forceCleanup]);

  /**
   * Transform tour config steps to Driver.js format
   */
  const getDriverSteps = useCallback((stepsOverride) => {
    if (!tourConfig?.steps) return [];

    const stepsSource = Array.isArray(stepsOverride) ? stepsOverride : tourConfig.steps;

    return stepsSource.map((step, index) => {
      const isLast = index === stepsSource.length - 1;

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
          // Explicitly disable default close button; we use a custom one
          showCloseBtn: false,
          // Show standard nav buttons; Driver.js handles last step automatically
          showButtons: step.showButtons !== false ? ['next', 'previous'] : [],
          disableButtons: step.disableButtons || [],
          nextBtnText: isLast ? t('tour.finish') : t('tour.next'),
          prevBtnText: t('tour.back'),
          doneBtnText: t('tour.finish'),
          closeBtnText: t('tour.close'),
          showProgress: true,
          // Let Driver.js handle default navigation via event delegation
          // Don't override with custom callbacks as they interfere with click handling
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
  // Enhanced cleanup helper with better error handling and memory management
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape' && isRunning) {
      console.log('[TOUR DEBUG] Escape key pressed - dismissing tour');
      handleDismiss();
    }
  }, [isRunning, handleDismiss]);

  // Document click handler
  const handleDocumentClick = useCallback((e) => {
    // Only handle clicks if tour is running and we're in an overlay
    if (isRunning && document.body.classList.contains('driver-active')) {
      // Let Driver.js handle clicks - don't interfere
    }
  }, [isRunning]);

  const initializeDriver = useCallback((stepsOverride) => {
    const steps = getDriverSteps(stepsOverride);

    if (driverInstance.current) {
      // Use the unified cleanup helper to ensure the previous instance is
      // fully torn down and its DOM removed before creating a new driver.
      try { forceCleanup(driverInstance.current); } catch (e) { /* ignore */ }
    }

    // Prevent multiple driver instances from co-existing.
    try {
      if (typeof window !== 'undefined' && window.__ONBOARDING_DRIVER_INSTANCE && window.__ONBOARDING_DRIVER_INSTANCE !== driverInstance.current) {
        // If another instance is present (from a prior page), force it
        // to fully cleanup. This avoids leftover DOM from other tabs or
        // earlier runs.
        try { forceCleanup(window.__ONBOARDING_DRIVER_INSTANCE); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // continue — non-fatal
      console.warn('Error checking global driver instance:', e);
    }

    driverInstance.current = driver({
      showProgress: true,
      // Remove 'close' from here to avoid a redundant footer button
      showButtons: ['next', 'previous'],
      nextBtnText: t('tour.next'),
      prevBtnText: t('tour.back'),
      doneBtnText: t('tour.finish'),
      // This is for the 'x' button, which we handle via popover config
      allowClose: true,
      disableActiveInteraction: false,
      progressText: currentLanguage === 'nl' ? 'Stap {{current}} van {{total}}' : 'Step {{current}} of {{total}}',

      // Handle close button clicks at driver level
      onCloseClick: () => {
        console.log('[TOUR DEBUG] Close button clicked - dismissing tour');
        handleDismiss();
        try {
          if (driverInstance.current && typeof driverInstance.current.destroy === 'function') {
            driverInstance.current.destroy();
          }
        } catch (error) {
          console.error('Error destroying tour on close:', error);
          forceCleanup();
          contextStopTour();
        }
      },

      onPopoverRender: (popover) => {
        try {
          // Force driver-active class application
          if (!document.body.classList.contains('driver-active')) {
            document.body.classList.add('driver-active');
          }

          // Add missing DOM elements as fallbacks if they don't exist
          const addMissingElements = () => {
            const missingElements = [
              { selector: '.year-selector', content: 'Year Selector', fallback: '[data-testid="year-selector"]' },
              { selector: '.stats-grid', content: 'Statistics Grid', fallback: '[data-testid="stats-grid"]' },
              { selector: '.event-totals', content: 'Event Totals', fallback: '[data-testid="event-totals"]' },
              { selector: '.quick-actions', content: 'Quick Actions', fallback: '[data-testid="quick-actions"]' },
              { selector: '.admin-sidebar', content: 'Admin Sidebar', fallback: '[data-testid="admin-sidebar"]' },
              { selector: '.help-button', content: 'Help Button', fallback: '[data-testid="help-button"]' },
              { selector: '.tab-navigation', content: 'Tab Navigation', fallback: '[data-testid="tab-navigation"]' },
              { selector: '.language-selector', content: 'Language Selector', fallback: '[data-testid="language-selector"]' },
              { selector: '.leaflet-container', content: 'Map Container', fallback: '[data-testid="map-container"]' },
              { selector: '.favorites-toggle', content: 'Favorites Toggle', fallback: '[data-testid="favorites-toggle"]' }
            ];

            missingElements.forEach(({ selector, fallback }) => {
              if (!document.querySelector(selector)) {
                // Create a temporary fallback element for tour purposes
                const fallbackElement = document.querySelector(fallback);
                if (fallbackElement && !fallbackElement.getAttribute('data-tour-fallback')) {
                  fallbackElement.setAttribute('data-tour-fallback', selector);
                }
              }
            });
          };

          addMissingElements();

          // Attach delegated click handlers on the popover wrapper so UI
          // controls inside the driver-produced popover (prev/next buttons)
          // are routed to the driver instance. We also mark the wrapper so
          // tests can detect that delegation has been attached.
          try {
            if (popover?.wrapper) {
              const wrapper = popover.wrapper;

              // Avoid attaching the delegation multiple times
              if (!wrapper._tourDelegationAttached) {
                const handleWrapperClicks = (ev) => {
                  try {
                    const nextBtn = ev.target.closest?.('.driver-popover-next-btn') || (ev.target.matches && ev.target.matches('.driver-popover-next-btn') ? ev.target : null);
                    const prevBtn = ev.target.closest?.('.driver-popover-prev-btn') || (ev.target.matches && ev.target.matches('.driver-popover-prev-btn') ? ev.target : null);

                    if (nextBtn && driverInstance.current && typeof driverInstance.current.moveNext === 'function') {
                      driverInstance.current.moveNext();
                    }

                    if (prevBtn && driverInstance.current && typeof driverInstance.current.movePrevious === 'function') {
                      driverInstance.current.movePrevious();
                    }
                  } catch (e) {
                    // swallow errors from delegation handlers
                  }
                };

                try {
                  wrapper.addEventListener('click', handleWrapperClicks, true);
                } catch (e) { /* ignore */ }

                try { wrapper._tourDelegationAttached = true; } catch (e) { /* ignore */ }
                try { wrapper.setAttribute('data-tour-handler', '1'); } catch (e) { /* ignore */ }
              }
            }
          } catch (e) { /* ignore */ }
          
        } catch (error) {
          console.warn('Tour popover render error:', error);
          // Don't throw - let the tour continue
        }
      },

      steps,

      onDestroyed: () => {
        // Make sure any remnants are forcefully removed — this call is
        // idempotent and safe even if destroy() has already run.
        try { forceCleanup(driverInstance.current); } catch (e) { /* ignore */ }
        contextStopTour();
      },

      onDestroyStarted: () => {
        // Check if tour was completed (reached last step)
        const currentStepIndex = driverInstance.current?.getActiveIndex();
        const totalSteps = steps.length;

        if (currentStepIndex === totalSteps - 1) {
          handleComplete();
          try { cleanupOldTourDOM(); } catch (e) { /* ignore */ }
        } else {
          // User closed tour early - treat as dismissal
          handleDismiss();
          try { cleanupOldTourDOM(); } catch (e) { /* ignore */ }
        }

        // In addition to the contextual cleanup above, forcefully clear any
        // leftover driver DOM and references (idempotent).
        try { forceCleanup(driverInstance.current); } catch (e) { /* ignore */ }
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
  // start accepts options so callers can override the wait window when
  // retrying after navigation (helpful for slow/lazy loaded admin views).
  const start = useCallback(async (opts = {}) => {
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

      // Check if target elements exist before starting (with fallback support)
      const requiredSteps = tourConfig.steps
        .filter(step => step.element && step.element !== 'body');

      const missingElements = requiredSteps.filter(step => {
        const primaryExists = !!document.querySelector(step.element);
        if (primaryExists) return false;
        
        // Check for fallback selectors based on the missing element
        const fallbackMap = {
          '.year-selector': '[data-testid="year-selector"]',
          '.stats-grid': '[data-testid="stats-grid"]',
          '.event-totals': '[data-testid="event-totals"]',
          '.quick-actions': '[data-testid="quick-actions"]',
          '.admin-sidebar': '[data-testid="admin-sidebar"]',
          '.help-button': '[data-testid="help-button"]',
          '.tab-navigation': '[data-testid="tab-navigation"]',
          '.language-selector': '[data-testid="language-selector"]',
          '.leaflet-container': '[data-testid="map-container"]',
          '.favorites-toggle': '[data-testid="favorites-toggle"]',
          '.leaflet-control-search': '[data-testid="search-control"]',
          '.exhibitors-list': '[data-testid="exhibitors-list"]',
          '.exhibitors-search': '[data-testid="exhibitors-search"]',
          '.category-filter': '[data-testid="category-filter"]',
          '.exhibitor-card': '[data-testid="exhibitor-card"]'
        };
        
        const fallbackSelector = fallbackMap[step.element];
        const fallbackExists = fallbackSelector ? !!document.querySelector(fallbackSelector) : false;
        
        // If neither primary nor fallback exists, consider it missing
        return !primaryExists && !fallbackExists;
      });

      // DIAGNOSTIC: log required steps and which selectors are present/absent
      try {
        console.debug('[onboarding:start] tourId=', tourConfig?.id, 'requiredSteps=', requiredSteps.map(s => s.element), 'present=', requiredSteps.map(s => !!document.querySelector(s.element)));
      } catch (e) { /* ignore logging errors */ }

      // If none of the required targets exist (i.e. we're in the wrong page/context)
      // then don't start the tour — this avoids showing a useless popover attached
      // to the dummy/body element and confusing users.
      if (requiredSteps.length > 0 && missingElements.length === requiredSteps.length) {
        // If everything is missing, wait briefly (in case the admin page
        // or lazy-loaded components haven't rendered yet) and then re-check.
        // This avoids false negatives due to small load/timing differences.
        const waitMs = typeof opts.waitMs === 'number' ? opts.waitMs : 7000;
        const waitForTargets = (ms = waitMs, checkInterval = 100) => new Promise((resolve) => {
          let elapsed = 0;
          let timeoutId = null;
          let intervalId = null;

          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
          };

          const check = () => {
            try {
              const found = requiredSteps.some(step => !!document.querySelector(step.element));
              if (found) {
                cleanup();
                return resolve(true);
              }

              elapsed += checkInterval;
              if (elapsed >= ms) {
                cleanup();
                return resolve(false);
              }
            } catch (error) {
              console.warn('Error checking for tour targets:', error);
              cleanup();
              return resolve(false);
            }
          };

          // Check immediately
          check();

          // Set up interval for periodic checks
          intervalId = setInterval(check, checkInterval);

          // Set up timeout to prevent infinite waiting
          timeoutId = setTimeout(() => {
            cleanup();
            resolve(false);
          }, ms);
        });

        try {
          // Wait a short period for elements to appear. Honor caller's waitMs option
          // so callers (like the admin retry flow) can request a longer window.
          const appeared = await waitForTargets(waitMs, 100);

          // DIAGNOSTIC: record the wait result and snapshot available selectors
          try {
            console.debug('[onboarding:start] waitForTargets result=', appeared, 'missingElementsAtTimeout=', requiredSteps.filter(s => !document.querySelector(s.element)).map(s => s.element));
          } catch (e) { /* ignore */ }

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

      // Propagate any source metadata (eg. started from Help panel) to the
      // onboarding context so higher-level UI can react to completion events.
      const startMeta = typeof opts.source !== 'undefined' ? { source: opts.source } : (options?.source ? { source: options.source } : undefined);
      contextStartTour(tourConfig.id, startMeta);

      // Before initializing, prune any steps that reference missing elements
      // so driver.js doesn't attach popovers to the document/body for absent
      // selectors. Callers may override behavior with opts.forceAbortOnMissing
      // or opts.allowPartial.
      const allowPartial = typeof opts.allowPartial === 'boolean' ? opts.allowPartial : true;
      const forceAbortOnMissing = !!opts.forceAbortOnMissing;

      // Helper function to check if element exists (with fallbacks)
      const elementExists = (element) => {
        if (!element || element === 'body') return true;
        
        const primaryExists = !!document.querySelector(element);
        if (primaryExists) return true;
        
        // Check for fallback selectors
        const fallbackMap = {
          '.year-selector': '[data-testid="year-selector"]',
          '.stats-grid': '[data-testid="stats-grid"]',
          '.event-totals': '[data-testid="event-totals"]',
          '.quick-actions': '[data-testid="quick-actions"]',
          '.admin-sidebar': '[data-testid="admin-sidebar"]',
          '.help-button': '[data-testid="help-button"]',
          '.tab-navigation': '[data-testid="tab-navigation"]',
          '.language-selector': '[data-testid="language-selector"]',
          '.leaflet-container': '[data-testid="map-container"]',
          '.favorites-toggle': '[data-testid="favorites-toggle"]',
          '.leaflet-control-search': '[data-testid="search-control"]',
          '.exhibitors-list': '[data-testid="exhibitors-list"]',
          '.exhibitors-search': '[data-testid="exhibitors-search"]',
          '.category-filter': '[data-testid="category-filter"]',
          '.exhibitor-card': '[data-testid="exhibitor-card"]'
        };
        
        const fallbackSelector = fallbackMap[element];
        return fallbackSelector ? !!document.querySelector(fallbackSelector) : false;
      };

      const fullDriverSteps = getDriverSteps();
      const presentSteps = fullDriverSteps.filter(s => !s.element || s.element === 'body' || elementExists(s.element));
      const missingSteps = fullDriverSteps.filter(s => s.element && s.element !== 'body' && !elementExists(s.element));

      if (missingSteps.length > 0) {
        // If caller requested abort on any missing step, treat this as failure
        if (forceAbortOnMissing) {
          console.warn('Tour start aborted because some required steps are missing:', missingSteps.map(s => s.element));
          if (opts.onMissingTargets) {
            try { opts.onMissingTargets(missingSteps.map(s => s.element)); } catch (e) { /* ignore */ }
          }
          return false;
        }

        if (presentSteps.length === 0) {
          // Nothing to show — behave as before: abort
          console.warn('Tour elements not found (all required targets missing):', missingSteps.map(s => s.element));
          if (options.onMissingTargets) {
            try { options.onMissingTargets(missingSteps.map(s => s.element)); } catch (e) { /* ignore */ }
          }
          return false;
        }

        // Some steps are missing but we have at least one step to show —
        // if partial starts are allowed, proceed with only the present steps.
        if (!allowPartial) {
          console.warn('Tour start requires all steps but some are missing:', missingSteps.map(s => s.element));
          if (opts.onMissingTargets) {
            try { opts.onMissingTargets(missingSteps.map(s => s.element)); } catch (e) { /* ignore */ }
          }
          return false;
        }

        console.warn('Some tour steps are missing; starting with available steps:', presentSteps.map(s => s.element));
        if (opts.onPartialStart) {
          try { opts.onPartialStart(missingSteps.map(s => s.element)); } catch (e) { /* ignore */ }
        }
      }

      // Initialize with error handling; pass only the present steps if any are missing
      const driverObj = initializeDriver(missingSteps.length > 0 ? presentSteps : undefined);
      
      if (!driverObj) {
        console.error('Failed to initialize Driver.js instance');
        return;
      }

      // Drive with comprehensive error handling and user feedback
      try {
        driverObj.drive();
        console.log(`[TOUR DEBUG] Tour "${tourConfig.id}" started successfully`);
        
        // Provide user feedback via callback if available
        if (options.onTourStart) {
          try {
            options.onTourStart(tourConfig.id);
          } catch (feedbackError) {
            console.warn('Error in onTourStart callback:', feedbackError);
          }
        }
        
      } catch (driveError) {
        console.error('Error starting tour:', driveError);
        
        // Enhanced user feedback for different error types
        let errorMessage = 'An unexpected error occurred while starting the tour.';
        let errorCode = 'UNKNOWN';
        
        if (driveError.message?.includes('No such element')) {
          errorMessage = 'Some elements on this page are not ready yet. Please try again in a moment.';
          errorCode = 'ELEMENT_MISSING';
        } else if (driveError.message?.includes('driver')) {
          errorMessage = 'Tour system is temporarily unavailable. Please refresh the page and try again.';
          errorCode = 'DRIVER_ERROR';
        } else if (driveError.message?.includes('permission') || driveError.message?.includes('access')) {
          errorMessage = 'You don\'t have permission to start this tour.';
          errorCode = 'PERMISSION_DENIED';
        }
        
        console.warn(`[TOUR ERROR] ${errorCode}: ${errorMessage}`);
        
        // Provide user feedback via callback
        if (options.onTourError) {
          try {
            options.onTourError(errorCode, errorMessage, driveError);
          } catch (feedbackError) {
            console.warn('Error in onTourError callback:', feedbackError);
          }
        }
        
        // Clean up on error (best-effort)
        try {
          if (driverObj && driverObj.destroy) driverObj.destroy();
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError);
        }

        try { forceCleanup(driverObj); } catch (e) { /* ignore */ }
        contextStopTour();
        
        // Return error information for caller handling
        return { success: false, error: errorCode, message: errorMessage };
      }

    } catch (error) {
      console.error('Critical error in tour start:', error);
      // Ensure we clean up the context state
      contextStopTour();
      
      // Return error information for caller handling
      return { success: false, error: 'CRITICAL_ERROR', message: 'A critical error occurred while starting the tour.', details: error.message };
    }
    
    // Success case
    return { success: true };
  }, [tourConfig, contextStartTour, contextStopTour, initializeDriver]);

  /**
   * Stop the tour
   */
  const stop = useCallback(() => {
    try { forceCleanup(); } catch (e) { /* ignore */ }
    contextStopTour();
  }, [contextStopTour, forceCleanup]);

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
   * Enhanced language change handling with pause/resume logic
   */
  const prevLanguage = useRef(currentLanguage);
  useEffect(() => {
    // Only run if the language has actually changed
    if (prevLanguage.current === currentLanguage) {
      return;
    }
    prevLanguage.current = currentLanguage;

    let pauseTimeout = null;
    let resumeTimeout = null;

    if (isRunning && activeTour === tourConfig?.id && driverInstance.current) {
      // Pause the tour when language change is detected
      console.log('[TOUR DEBUG] Language change detected - pausing tour');
      
      pauseTimeout = setTimeout(() => {
        try {
          // Safely pause the tour by hiding it
          if (driverInstance.current && typeof driverInstance.current.destroy === 'function') {
            // Store the current step before destroying
            const currentIndex = driverInstance.current?.getActiveIndex();
            console.log('[TOUR DEBUG] Pausing tour at step:', currentIndex);
            
            // Destroy current instance
            driverInstance.current.destroy();
          }

          try { forceCleanup(); } catch (e) { 
            console.warn('Error during language change cleanup:', e);
          }

        } catch (error) {
          console.error('Error during tour pause:', error);
          contextStopTour();
        }
      }, 200);

      // Resume tour after language change completes
      resumeTimeout = setTimeout(() => {
        try {
          const driverObj = initializeDriver();
          if (driverObj && typeof driverObj.drive === 'function') {
            // Try to resume from the same step
            driverObj.drive();
            console.log('[TOUR DEBUG] Tour resumed after language change');
          }
        } catch (error) {
          console.error('Error resuming tour after language change:', error);
          // Don't stop the tour - just log the error and let user continue
          console.warn('Tour will continue from beginning after language change');
          try {
            const driverObj = initializeDriver();
            if (driverObj && typeof driverObj.drive === 'function') {
              driverObj.drive(0); // Start from beginning
            }
          } catch (fallbackError) {
            console.error('Failed to restart tour:', fallbackError);
            contextStopTour();
          }
        }
      }, 1000); // Longer delay to ensure i18n has completed

      // Cleanup function
      return () => {
        if (pauseTimeout) clearTimeout(pauseTimeout);
        if (resumeTimeout) clearTimeout(resumeTimeout);
      };
    }
  }, [currentLanguage, isRunning, activeTour, tourConfig, initializeDriver, contextStopTour, forceCleanup]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      try { forceCleanup(); } catch (e) { /* ignore */ }
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
