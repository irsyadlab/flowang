import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  dbReady: boolean;
  dbError: string | null;
  theme: Theme;
}

interface UIActions {
  setDbReady: (ready: boolean) => void;
  setDbError: (error: string | null) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      dbReady: false,
      dbError: null,
      theme: 'system',
      setDbReady: (ready) => set({ dbReady: ready }),
      setDbError: (error) => set({ dbError: error }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'flowang-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);