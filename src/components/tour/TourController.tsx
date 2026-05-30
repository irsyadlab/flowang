import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Joyride, type EventData, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTourStore } from '@/stores/tourStore';
import { shouldAutoStart } from '@/lib/tourStorage';
import { TOUR_STEPS } from '@/lib/tourSteps';
import { TourTooltip } from './TourTooltip';

const TOUR_STEP_COUNT = 13;
const AUTO_START_DELAY_MS = 800;
const DOM_READY_DELAY_MS = 300;

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

      // Wait for dashboard DOM to be ready before starting tour
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
  // Only run once on mount — deps intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore focus when tour closes
  useEffect(() => {
    if (!run && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [run]);

  // v3: onEvent replaces callback. In controlled mode, we manage stepIndex ourselves.
  const handleEvent = (data: EventData) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        // Step 3 (nav-transactions) → navigate to /transactions first, then advance
        if (index === 3) {
          navigate('/transactions');
          setTimeout(() => setStepIndex(4), 400);
        // Step 6 (nav-reports) → navigate to /reports first, then advance
        } else if (index === 6) {
          navigate('/reports');
          setTimeout(() => setStepIndex(7), 400);
        // Step 10 (nav-loans) → navigate to /loans first, then advance
        } else if (index === 10) {
          navigate('/loans');
          setTimeout(() => setStepIndex(11), 400);
        } else {
          setStepIndex(index + 1);
        }
      } else if (action === ACTIONS.PREV) {
        // Step 4 (tx-date-nav) going back → navigate to dashboard first
        if (index === 4) {
          navigate('/');
          setTimeout(() => setStepIndex(3), 400);
        // Step 7 (report-tab-realtime) going back → navigate to /transactions
        } else if (index === 7) {
          navigate('/transactions');
          setTimeout(() => setStepIndex(6), 400);
        // Step 11 (loans-summary-strip) going back → navigate to /reports
        } else if (index === 11) {
          navigate('/reports');
          setTimeout(() => setStepIndex(10), 400);        } else {
          setStepIndex(index - 1);
        }
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
