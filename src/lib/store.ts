import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectState {
  project: string;
  setProject: (project: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      project: 'zibaas-default-project',
      setProject: (project) => set({ project }),
    }),
    {
      name: 'zibaas-project-storage',
    }
  )
);
