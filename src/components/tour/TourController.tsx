import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Joyride, type EventData, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTourStore } from '@/stores/tourStore';
import { shouldAutoStart } from '@/lib/tourStorage';
import { TOUR_STEPS } from '@/lib/tourSteps';
import { TourTooltip } from './TourTooltip';

const TOUR_STEP_COUNT = 27;
const AUTO_START_DELAY_MS = 800;
const DOM_READY_DELAY_MS = 400;

// Map: step index → route to navigate to BEFORE showing that step
const NAVIGATE_BEFORE: Record<number, string> = {
  // Transactions
  5:  '/transactions',       // tx-date-nav
  6:  '/transactions',       // tx-filter-btn
  7:  '/transactions',       // tx-add-fab
  8:  '/transactions/new',   // tx-form-type
  // Reports
  9:  '/reports',            // nav-reports
  10: '/reports',            // report-tab-realtime
  11: '/reports',            // report-tab-monthly
  12: '/reports',            // report-tab-custom
  // Loans
  13: '/loans',              // nav-loans
  14: '/loans',              // loans-fab
  15: '/loans/new',          // loan-form-direction
  16: '/loans/new',          // loan-form-create-tx (same page)
  // More → Wallets
  17: '/more',               // more-wallets
  18: '/wallets',            // wallets-eye-toggle
  19: '/wallets',            // wallets-add
  // More → Categories
  20: '/more',               // more-categories
  21: '/categories',         // categories-add
  // More → Settings
  22: '/more',               // more-settings
  23: '/settings',           // settings-sync-status
  24: '/settings',           // settings-sync-key
  25: '/settings',           // settings-google-drive
  26: '/settings',           // settings-theme
};

export default function TourController() {
  const navigate = useNavigate();

  const {
    run,
    stepIndex,
    hasAutoStarted,
    startTour,
    setStepIndex,
    completeTour,
    skipTour,
    markAutoStarted,
  } = useTourStore();

  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Auto-start: navigate to dashboard first, wait for DOM, then start tour
  useEffect(() => {
    if (hasAutoStarted) return;
    if (!shouldAutoStart()) return;
    if (TOUR_STEPS.length !== TOUR_STEP_COUNT) return;

    const cancelled = { current: false };

    const timer = setTimeout(() => {
      if (cancelled.current) return;
      previousFocusRef.current = document.activeElement as HTMLElement;
      navigate('/', { replace: true });

      setTimeout(() => {
        if (cancelled.current) return;
        markAutoStarted();
        startTour();
      }, DOM_READY_DELAY_MS);
    }, AUTO_START_DELAY_MS);

    return () => {
      cancelled.current = true;
      clearTimeout(timer);
    };
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore focus when tour closes
  useEffect(() => {
    if (!run && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [run]);

  const goToStep = (nextIndex: number) => {
    const route = NAVIGATE_BEFORE[nextIndex];
    if (route) {
      navigate(route);
      setTimeout(() => setStepIndex(nextIndex), DOM_READY_DELAY_MS);
    } else {
      setStepIndex(nextIndex);
    }
  };

  const handleEvent = (data: EventData) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        goToStep(index + 1);
      } else if (action === ACTIONS.PREV) {
        goToStep(index - 1);
      } else if (action === ACTIONS.CLOSE || action === ACTIONS.SKIP) {
        skipTour();
        return;
      }
    }

    if (status === STATUS.FINISHED) {
      completeTour();
    } else if (status === STATUS.SKIPPED) {
      skipTour();
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      tooltipComponent={TourTooltip}
      options={{
        zIndex: 10100,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        spotlightRadius: 12,
      }}
      floatingOptions={{}}
    />
  );
}
