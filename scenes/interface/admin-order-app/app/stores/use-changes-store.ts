import React from 'react';
import type { To } from 'react-router';
import { create } from 'zustand';

type ChangesEntry = {
  id: string;
  label: string;
  hasChanges: boolean;
  onSave?: () => void | Promise<void>;
  onDiscard: () => void;
};

type ChangesSnapshot = {
  blockedNavigationTarget: BlockedNavigationTarget | null;
  entriesById: Map<string, ChangesEntry>;
  entries: ChangesEntry[];
  entriesWithChanges: ChangesEntry[];
  hasUnsavedChanges: boolean;
  isBlockedNavigationFeedbackActive: boolean;
  blockedNavigationFeedbackId: number;
};

type BlockedNavigationTarget = {
  state?: unknown;
  to: To;
};

type ChangesActions = {
  blockNavigationIfUnsavedChanges: (
    target?: BlockedNavigationTarget,
  ) => boolean;
  clearBlockedNavigationTarget: () => void;
  setEntry: (entry: ChangesEntry) => void;
  removeEntry: (id: string) => void;
};

function areEntriesEqual(a: ChangesEntry, b: ChangesEntry) {
  return (
    a.id === b.id &&
    a.label === b.label &&
    a.hasChanges === b.hasChanges &&
    a.onSave === b.onSave &&
    a.onDiscard === b.onDiscard
  );
}

const blockedNavigationFeedbackDurationMs = 400;
let blockedNavigationFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;

function getSnapshot({
  blockedNavigationTarget = null,
  blockedNavigationFeedbackId = 0,
  entriesById,
  isBlockedNavigationFeedbackActive = false,
}: {
  blockedNavigationTarget?: BlockedNavigationTarget | null;
  blockedNavigationFeedbackId?: number;
  entriesById: Map<string, ChangesEntry>;
  isBlockedNavigationFeedbackActive?: boolean;
}): ChangesSnapshot {
  const entries = Array.from(entriesById.values());
  const entriesWithChanges = entries.filter((entry) => entry.hasChanges);

  return {
    blockedNavigationTarget,
    entriesById,
    entries,
    entriesWithChanges,
    hasUnsavedChanges: entriesWithChanges.length > 0,
    isBlockedNavigationFeedbackActive,
    blockedNavigationFeedbackId,
  };
}

export const useChangesStore = create<ChangesSnapshot & ChangesActions>(
  (set, get) => ({
    ...getSnapshot({ entriesById: new Map() }),
    blockNavigationIfUnsavedChanges: (target) => {
      if (!get().hasUnsavedChanges) {
        return false;
      }

      if (blockedNavigationFeedbackTimeout) {
        clearTimeout(blockedNavigationFeedbackTimeout);
      }

      set((state) => ({
        blockedNavigationTarget: target ?? state.blockedNavigationTarget,
        isBlockedNavigationFeedbackActive: true,
        blockedNavigationFeedbackId: state.blockedNavigationFeedbackId + 1,
      }));

      blockedNavigationFeedbackTimeout = setTimeout(() => {
        blockedNavigationFeedbackTimeout = undefined;
        set({ isBlockedNavigationFeedbackActive: false });
      }, blockedNavigationFeedbackDurationMs);

      return true;
    },
    clearBlockedNavigationTarget: () => set({ blockedNavigationTarget: null }),
    setEntry: (entry) =>
      set((state) => {
        const existing = state.entriesById.get(entry.id);

        if (existing && areEntriesEqual(existing, entry)) {
          return state;
        }

        const nextEntriesById = new Map(state.entriesById);
        nextEntriesById.set(entry.id, entry);
        return getSnapshot({
          blockedNavigationTarget: state.blockedNavigationTarget,
          blockedNavigationFeedbackId: state.blockedNavigationFeedbackId,
          entriesById: nextEntriesById,
          isBlockedNavigationFeedbackActive:
            state.isBlockedNavigationFeedbackActive,
        });
      }),
    removeEntry: (id) =>
      set((state) => {
        if (!state.entriesById.has(id)) {
          return state;
        }

        const nextEntriesById = new Map(state.entriesById);
        nextEntriesById.delete(id);
        return getSnapshot({
          blockedNavigationTarget: state.blockedNavigationTarget,
          blockedNavigationFeedbackId: state.blockedNavigationFeedbackId,
          entriesById: nextEntriesById,
          isBlockedNavigationFeedbackActive:
            state.isBlockedNavigationFeedbackActive,
        });
      }),
  }),
);

export function useChangesEntry(entry: ChangesEntry | null) {
  const removeEntry = useChangesStore((state) => state.removeEntry);
  const setEntry = useChangesStore((state) => state.setEntry);

  React.useEffect(() => {
    if (!entry) return;

    setEntry(entry);

    return () => removeEntry(entry.id);
  }, [entry, removeEntry, setEntry]);
}

export function useResourceChangesEntry(
  entryConfig: {
    fallbackLabel: string;
    hasChanges: boolean;
    id: string;
    label: string;
    onDiscard: () => void;
    onSave: () => void | Promise<void>;
    type: string;
  } | null,
) {
  const entry = React.useMemo(() => {
    if (!entryConfig) return null;

    return entryConfig.type
      ? {
          id: `${entryConfig.type}:${entryConfig.id}`,
          label: entryConfig.label || entryConfig.fallbackLabel,
          hasChanges: entryConfig.hasChanges,
          onSave: entryConfig.onSave,
          onDiscard: entryConfig.onDiscard,
        }
      : null;
  }, [entryConfig]);

  useChangesEntry(entry);
}
