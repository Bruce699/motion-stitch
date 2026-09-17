import { create } from 'zustand';

export const useViewAsStore = create<{
  isViewAsModeActive: boolean;
  toggleViewAsMode: () => void;
  openViewAsMode: () => void;
  closeViewAsMode: () => void;
}>((set) => ({
  isViewAsModeActive: false,
  toggleViewAsMode: () =>
    set((state) => ({ isViewAsModeActive: !state.isViewAsModeActive })),
  openViewAsMode: () => set({ isViewAsModeActive: true }),
  closeViewAsMode: () => set({ isViewAsModeActive: false }),
}));
