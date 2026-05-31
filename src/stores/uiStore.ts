import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  dbReady: boolean;
  dbError: string | null;
  appReady: boolean;
  theme: Theme;
}

interface UIActions {
  setDbReady: (ready: boolean) => void;
  setDbError: (error: string | null) => void;
  setAppReady: (ready: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      dbReady: false,
      dbError: null,
      appReady: false,
      theme: 'system',
      setDbReady: (ready) => set({ dbReady: ready }),
      setDbError: (error) => set({ dbError: error }),
      setAppReady: (ready) => set({ appReady: ready }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'flowang-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);