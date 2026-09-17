import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const defaultFlags = {
  darkTooltips: true,
  sidekickIconVariant: 'orb',
} satisfies FeatureFlagsSchema;

type FeatureFlagsSchema = {
  darkTooltips: boolean;
  sidekickIconVariant: 'orb' | 'shader' | 'classic';
};

type FeatureFlags = {
  [Name in keyof typeof defaultFlags]: FeatureFlagsSchema[Name];
};

export const useFeatureFlags = create<{
  flags: FeatureFlags;
  setFlag: <Name extends keyof FeatureFlags>(
    name: Name,
    value: FeatureFlags[Name],
  ) => void;
}>()(
  persist(
    (set) => ({
      flags: defaultFlags,
      setFlag: (name, value) =>
        set((state) => ({
          flags: { ...state.flags, [name]: value },
        })),
    }),
    {
      name: 'admin-next:feature-flags',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ flags: state.flags }),
      merge: (persisted, current) => ({
        ...current,
        flags: {
          ...current.flags,
          ...(persisted as { flags?: Partial<FeatureFlags> } | undefined)
            ?.flags,
        },
      }),
    },
  ),
);
