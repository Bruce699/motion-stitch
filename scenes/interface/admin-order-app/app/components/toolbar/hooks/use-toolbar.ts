import React from 'react';
import type { ToolbarAction, ToolbarBreadcrumbItem } from '../toolbar.types';
import {
  useChangesStore,
  useResourceChangesEntry,
} from '~/stores/use-changes-store';
import { motionDurations } from '~/ui/tokens/motion';

type ToolbarResourceConfig = {
  type: string;
  id: string;
  hasChanges: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
};

export type ToolbarOptions = {
  title: string;
  icon?: React.ReactNode;
  actions?: ToolbarAction[];
  breadcrumbs?: ToolbarBreadcrumbItem[];
  hidden?: boolean;
  resource?: ToolbarResourceConfig;
  showTitleOnScroll?: boolean;
  testMode?: boolean;
};

type ToolbarConfig = ToolbarOptions &
  (
    | {
        hasSaveActions: true;
        hasUnsavedChanges: boolean;
        isSaveComplete: boolean;
        onDiscardChanges: () => void;
        onSaveChanges: () => void | Promise<void>;
        onSaveCompleteViewed: () => void;
        showSaveAffordance: boolean;
      }
    | {
        hasSaveActions?: false;
        hasUnsavedChanges?: false;
        isSaveComplete?: false;
        onDiscardChanges?: never;
        onSaveChanges?: never;
        onSaveCompleteViewed?: never;
        showSaveAffordance?: false;
      }
  );

let toolbarConfig: ToolbarConfig | undefined;
const toolbarListeners = new Set<() => void>();
let toolbarClearTimeout: ReturnType<typeof setTimeout> | undefined;
const toolbarClearDelayMs = motionDurations.base * 1000 + 50;

function subscribeToolbar(listener: () => void) {
  toolbarListeners.add(listener);

  return () => toolbarListeners.delete(listener);
}

function getToolbarSnapshot() {
  return toolbarConfig;
}

function setToolbarConfig(
  update: React.SetStateAction<ToolbarConfig | undefined>,
) {
  if (toolbarClearTimeout) {
    clearTimeout(toolbarClearTimeout);
    toolbarClearTimeout = undefined;
  }

  const nextConfig =
    typeof update === 'function' ? update(toolbarConfig) : update;

  if (Object.is(toolbarConfig, nextConfig)) {
    return;
  }

  toolbarConfig = nextConfig;

  for (const listener of toolbarListeners) {
    listener();
  }
}

function clearToolbarConfig(config: ToolbarConfig) {
  if (toolbarClearTimeout) {
    clearTimeout(toolbarClearTimeout);
  }

  toolbarClearTimeout = setTimeout(() => {
    toolbarClearTimeout = undefined;

    setToolbarConfig((currentConfig) =>
      currentConfig === config ? undefined : currentConfig,
    );
  }, toolbarClearDelayMs);
}

export function useToolbarState() {
  const config = React.useSyncExternalStore(
    subscribeToolbar,
    getToolbarSnapshot,
    getToolbarSnapshot,
  );

  return { config };
}

export function useToolbarHidden() {
  const { config } = useToolbarState();

  return config?.hidden === true;
}

export function useToolbar({
  actions,
  breadcrumbs,
  hidden,
  icon,
  resource,
  showTitleOnScroll,
  testMode,
  title,
}: ToolbarOptions) {
  const entriesWithChanges = useChangesStore(
    (state) => state.entriesWithChanges,
  );
  const isBlockedNavigationFeedbackActive = useChangesStore(
    (state) => state.isBlockedNavigationFeedbackActive,
  );
  const [isSaveComplete, setSaveComplete] = React.useState(false);
  const resourceHasChanges = resource?.hasChanges ?? false;
  const resourceId = resource?.id;
  const resourceOnDiscard = resource?.onDiscard;
  const resourceOnSave = resource?.onSave;
  const resourceType = resource?.type;
  const changesEntryConfig = React.useMemo(
    () =>
      resourceId && resourceOnDiscard && resourceOnSave && resourceType
        ? {
            type: resourceType,
            id: resourceId,
            label: title,
            fallbackLabel: title,
            hasChanges: resourceHasChanges,
            onSave: resourceOnSave,
            onDiscard: resourceOnDiscard,
          }
        : null,
    [
      resourceHasChanges,
      resourceId,
      resourceOnDiscard,
      resourceOnSave,
      resourceType,
      title,
    ],
  );
  const hasUnsavedChanges = entriesWithChanges.length > 0;
  const hasSaveActions = hasUnsavedChanges || isSaveComplete;
  const shouldShowSaveAffordance =
    isBlockedNavigationFeedbackActive && hasUnsavedChanges;
  const handleDiscard = React.useCallback(() => {
    setSaveComplete(false);

    for (const entry of entriesWithChanges) {
      entry.onDiscard();
    }
  }, [entriesWithChanges]);
  const handleSave = React.useCallback(async () => {
    setSaveComplete(false);

    await Promise.all(
      entriesWithChanges.map((entry) => (entry.onSave ? entry.onSave() : null)),
    );
    setSaveComplete(true);
  }, [entriesWithChanges]);
  const handleSaveCompleteViewed = React.useCallback(() => {
    setSaveComplete(false);
  }, []);
  const nextConfig = React.useMemo<ToolbarConfig>(
    () => ({
      actions,
      breadcrumbs,
      hidden,
      icon,
      resource,
      showTitleOnScroll,
      testMode,
      title,
      ...(hasSaveActions
        ? {
            hasSaveActions,
            hasUnsavedChanges,
            isSaveComplete,
            onDiscardChanges: handleDiscard,
            onSaveChanges: handleSave,
            onSaveCompleteViewed: handleSaveCompleteViewed,
            showSaveAffordance: shouldShowSaveAffordance,
          }
        : {
            hasUnsavedChanges,
          }),
    }),
    [
      actions,
      breadcrumbs,
      hasSaveActions,
      handleDiscard,
      handleSave,
      handleSaveCompleteViewed,
      hasUnsavedChanges,
      hidden,
      icon,
      isSaveComplete,
      resource,
      shouldShowSaveAffordance,
      showTitleOnScroll,
      testMode,
      title,
    ],
  );

  useResourceChangesEntry(changesEntryConfig);

  React.useLayoutEffect(() => {
    setToolbarConfig(nextConfig);

    return () => {
      // Route transitions can overlap, so only clear the config this route set.
      clearToolbarConfig(nextConfig);
    };
  }, [nextConfig]);
}
