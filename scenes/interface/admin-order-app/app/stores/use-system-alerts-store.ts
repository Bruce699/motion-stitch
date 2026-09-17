import { create } from 'zustand';

type SystemAlertEntry = {
  enabled: boolean;
};

export const useSystemAlertsStore = create<{
  paymentsTestMode: SystemAlertEntry;
  payoutsPaused: SystemAlertEntry;
  setPaymentsTestModeEnabled: (enabled: boolean) => void;
  setPayoutsPaused: (paused: boolean) => void;
}>((set) => ({
  paymentsTestMode: { enabled: false },
  payoutsPaused: { enabled: false },
  setPaymentsTestModeEnabled: (enabled) =>
    set({ paymentsTestMode: { enabled } }),
  setPayoutsPaused: (paused) => set({ payoutsPaused: { enabled: paused } }),
}));
