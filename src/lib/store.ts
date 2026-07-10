import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectState {
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      toggleThemeMode: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'zibaas-project-storage',
    }
  )
);
