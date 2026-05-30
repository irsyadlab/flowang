import { create } from 'zustand';
import { setStatus, clearStatus } from '@/lib/tourStorage';

export interface TourState {
  run: boolean;
  stepIndex: number;
  hasAutoStarted: boolean;
}

export interface TourActions {
  startTour: () => void;
  stopTour: () => void;
  setStepIndex: (index: number) => void;
  restartTour: () => void;
  completeTour: () => void;
  skipTour: () => void;
  markAutoStarted: () => void;
}

export const useTourStore = create<TourState & TourActions>((set, get) => ({
  run: false,
  stepIndex: 0,
  hasAutoStarted: false,

  startTour: () => {
    set({ run: true });
    setStatus('in_progress');
  },

  stopTour: () => {
    set({ run: false });
  },

  setStepIndex: (index: number) => {
    set({ stepIndex: index });
  },

  restartTour: () => {
    const { run: previousRun } = get();
    clearStatus();
    set({ run: true, stepIndex: 0 });
    setStatus('in_progress');

    // Restore status if run is still false (safeguard)
    if (!get().run) {
      if (previousRun) {
        setStatus('in_progress');
      } else {
        clearStatus();
      }
    }
  },

  completeTour: () => {
    set({ run: false });
    setStatus('completed');
  },

  skipTour: () => {
    set({ run: false });
    setStatus('skipped');
  },

  markAutoStarted: () => {
    set({ hasAutoStarted: true });
  },
}));