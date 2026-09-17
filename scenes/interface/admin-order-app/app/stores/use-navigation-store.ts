import { create } from 'zustand';

export const useNavigationStore = create<{
  storedSettingsPath: string | null;
  setStoredSettingsPath: (path: string | null) => void;
  storedChatsPath: string | null;
  setStoredChatsPath: (path: string | null) => void;
}>((set) => ({
  storedSettingsPath: null,
  setStoredSettingsPath: (path: string | null) =>
    set({ storedSettingsPath: path }),
  storedChatsPath: null,
  setStoredChatsPath: (path: string | null) => set({ storedChatsPath: path }),
}));
