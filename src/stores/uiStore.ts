import { create } from 'zustand';

interface UIState {
  dbReady: boolean;
  dbError: string | null;
}

interface UIActions {
  setDbReady: (ready: boolean) => void;
  setDbError: (error: string | null) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  dbReady: false,
  dbError: null,
  setDbReady: (ready) => set({ dbReady: ready }),
  setDbError: (error) => set({ dbError: error }),
}));