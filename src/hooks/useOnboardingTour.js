import { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
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
   * Transform tour config steps to Driver.js format
   */
  const getDriverSteps = useCallback(() => {
    if (!tourConfig?.steps) return [];

    return tourConfig.steps.map((step, index) => {
      const isLast = index === tourConfig.steps.length - 1;

      return {
        element: step.target || step.element,
        popover: {
          title: getLocalizedContent(step.title),
          description: getLocalizedContent(step.content || step.description),
          side: step.placement || step.side || 'bottom',
          align: step.align || 'center',
          showButtons: step.showButtons !== false ? ['next', 'previous'] : [],
          disableButtons: step.disableButtons || [],
          nextBtnText: isLast ? t('tour.finish') : t('tour.next'),
          prevBtnText: t('tour.back'),
          doneBtnText: t('tour.finish'),
          closeBtnText: t('tour.close'),
          showProgress: true,
          progressText: t('tour.progress', {
            current: '{{current}}',
            total: '{{total}}'
          }),
          onNextClick: step.onNextClick,
          onPrevClick: step.onPrevClick,
          onCloseClick: () => {
            handleDismiss();
          },
        },
        onHighlightStarted: step.onHighlightStarted,
        onHighlighted: step.onHighlighted,
        onDeselected: step.onDeselected,
      };
    });
  }, [tourConfig, getLocalizedContent, t]);

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
   * Initialize Driver.js instance
   */
  const initializeDriver = useCallback(() => {
    const steps = getDriverSteps();

    if (driverInstance.current) {
      driverInstance.current.destroy();
    }

    driverInstance.current = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: t('tour.next'),
      prevBtnText: t('tour.back'),
      doneBtnText: t('tour.finish'),
      closeBtnText: t('tour.close'),
      progressText: t('tour.progress', {
        current: '{{current}}',
        total: '{{total}}'
      }),
      popoverClass: 'onboarding-tour-popover',
      animate: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : true,
      overlayOpacity: 0.7,
      smoothScroll: true,
      allowClose: true,
      disableActiveInteraction: false,

      steps,

      onDestroyed: () => {
        contextStopTour();
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

    return driverInstance.current;
  }, [getDriverSteps, contextStopTour, handleComplete, handleDismiss, t]);

  /**
   * Start the tour
   */
  const start = useCallback(() => {
    if (!tourConfig?.id) {
      console.error('Tour ID is required to start a tour');
      return;
    }

    contextStartTour(tourConfig.id);

    const driverObj = initializeDriver();
    driverObj.drive();
  }, [tourConfig, contextStartTour, initializeDriver]);

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
   * Language change handling
   */
  useEffect(() => {
    if (isRunning && activeTour === tourConfig?.id) {
      // Re-initialize driver with new language
      const currentIndex = driverInstance.current?.getActiveIndex() || 0;
      const driverObj = initializeDriver();
      driverObj.drive(currentIndex);
    }
  }, [currentLanguage, isRunning, activeTour, tourConfig, initializeDriver]);

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
