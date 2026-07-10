import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectState {
  project: string;
  setProject: (project: string) => void;
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      project: 'zibaas-default-project',
      setProject: (project) => set({ project }),
      themeMode: 'light',
      toggleThemeMode: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'zibaas-project-storage',
    }
  )
);
