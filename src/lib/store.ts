import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WSChannel {
  id: string;
  name: string;
  type: string;
  targetTable: string;
  authLevel: string;
  triggers: {
    insert: boolean;
    update: boolean;
    delete: boolean;
    custom: boolean;
  };
  clientsCount: number;
  eventsCount: number;
  status: 'active' | 'idle';
  createdAt: string;
}

interface ProjectState {
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
  channels: WSChannel[];
  addChannel: (channel: WSChannel) => void;
  deleteChannel: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      toggleThemeMode: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
      channels: [],
      addChannel: (channel) => set((state) => ({ channels: [channel, ...state.channels] })),
      deleteChannel: (id) => set((state) => ({ channels: state.channels.filter((c) => c.id !== id) })),
    }),
    {
      name: 'zibaas-project-storage',
    }
  )
);
