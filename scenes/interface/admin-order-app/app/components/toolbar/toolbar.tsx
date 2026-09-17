import React from 'react';
import { clsx } from 'clsx';
import { AnimatePresence } from 'motion/react';
import { ToolbarActions } from './toolbar-actions';
import { ToolbarBreadcrumbs } from './toolbar-breadcrumbs';
import { ToolbarSaveActions } from './toolbar-save-actions';
import { SystemAlertStripes } from '~/components/components/system-alerts/system-alert-stripes';
import type { ToolbarAction, ToolbarBreadcrumbItem } from './toolbar.types';
import { useToolbarTitleTarget } from './use-toolbar-title-target';
import { useToolbarState } from './hooks/use-toolbar';

export type { ToolbarAction, ToolbarBreadcrumbItem } from './toolbar.types';

const emptyToolbarActions: ToolbarAction[] = [];

export function Toolbar() {
  const { config: toolbarConfig } = useToolbarState();
  const isHidden = toolbarConfig?.hidden === true;
  const visibleToolbar =
    toolbarConfig && toolbarConfig.hidden !== true ? toolbarConfig : undefined;
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  const actions = visibleToolbar?.actions ?? emptyToolbarActions;
  const showSaveAffordance = visibleToolbar?.showSaveAffordance ?? false;
  const breadcrumbs = visibleToolbar?.breadcrumbs;
  const hasSaveActions = visibleToolbar?.hasSaveActions === true;
  const saveStatus =
    visibleToolbar?.isSaveComplete === true ? 'saved' : 'unsaved';
  const hasBreadcrumbs = breadcrumbs !== undefined && breadcrumbs.length > 0;
  const showTitleOnScroll = visibleToolbar?.showTitleOnScroll ?? true;
  const testMode = visibleToolbar?.testMode ?? false;
  const visibilityKey = [
    visibleToolbar?.title,
    breadcrumbs?.map(
      (breadcrumb) =>
        `${breadcrumb.variant ?? 'link'}:${breadcrumb.url ?? ''}:${
          breadcrumb.label
        }`,
    ),
  ].join(':');

  const showScrollTitle = useToolbarTitleTarget({ toolbarRef, visibilityKey });
  const isTitleVisible = showTitleOnScroll && showScrollTitle;
  const visibleBreadcrumbs = React.useMemo<ToolbarBreadcrumbItem[]>(() => {
    const nextBreadcrumbs = breadcrumbs ? [...breadcrumbs] : [];

    if (isTitleVisible && visibleToolbar) {
      nextBreadcrumbs.push({
        animateOnMount: showScrollTitle,
        icon: hasBreadcrumbs ? undefined : visibleToolbar.icon,
        label: visibleToolbar.title,
        variant: 'title',
      });
    }

    return nextBreadcrumbs;
  }, [
    breadcrumbs,
    hasBreadcrumbs,
    isTitleVisible,
    showScrollTitle,
    showTitleOnScroll,
    visibleToolbar,
  ]);

  return (
    <header
      aria-hidden={isHidden ? true : undefined}
      className={clsx(
        'sticky inset-x-0 top-0 isolate z-10 flex h-(--toolbar-height)',
        visibleToolbar ? 'px-0' : 'px-3',
        isHidden && 'hidden',
      )}
    >
      {visibleToolbar && (
        <>
          <div
            className={clsx(
              'pointer-events-none absolute inset-0 rounded-t-3xl transition-opacity ease-out',
              'mask-[radial-gradient(ellipse_72%_160%_at_50%_-64%,black_0%,black_82%,rgb(0_0_0/0.62)_90%,rgb(0_0_0/0.24)_96%,transparent_100%)]',
              testMode ? 'opacity-100' : 'opacity-0',
            )}
          >
            <SystemAlertStripes className="text-yellow-300" />
          </div>
          <div
            ref={toolbarRef}
            className="group/toolbar relative grid w-full grid-cols-1 items-center px-3"
          >
            <div className="col-start-1 row-start-1 min-w-0 justify-self-start">
              <ToolbarBreadcrumbs breadcrumbs={visibleBreadcrumbs} />
            </div>
            <div className="pointer-events-none col-start-1 row-start-1 flex w-full items-center justify-center">
              <AnimatePresence initial={false}>
                {hasSaveActions && (
                  <div className="pointer-events-auto">
                    <ToolbarSaveActions
                      onDiscard={visibleToolbar.onDiscardChanges}
                      onSave={visibleToolbar.onSaveChanges}
                      onSaveCompleteViewed={visibleToolbar.onSaveCompleteViewed}
                      showSaveAffordance={showSaveAffordance}
                      status={saveStatus}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
            {actions.length > 0 && (
              <div className="col-start-1 row-start-1 justify-self-end">
                <ToolbarActions
                  actions={actions}
                  actionsKey={`toolbar-actions-${visibilityKey}`}
                />
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
