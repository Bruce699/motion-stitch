import { create } from 'zustand';

export const useSearchStore = create<{
  isSearchOpen: boolean;
  closeSearch: () => void;
  openSearch: () => void;
  toggleSearch: () => void;
}>((set) => ({
  isSearchOpen: false,
  closeSearch: () => set({ isSearchOpen: false }),
  openSearch: () => set({ isSearchOpen: true }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
}));
