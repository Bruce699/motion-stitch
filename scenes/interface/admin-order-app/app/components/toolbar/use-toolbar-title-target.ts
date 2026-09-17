import React from 'react';

const toolbarTitleTargetSelector = '[data-breadcrumb-title-target]';

export function useToolbarTitleTarget({
  toolbarRef,
  visibilityKey,
}: {
  toolbarRef: React.RefObject<HTMLElement | null>;
  visibilityKey: string;
}) {
  const [isToolbarTitleTargetVisible, setToolbarTitleTargetVisible] =
    React.useState(false);

  React.useLayoutEffect(() => {
    setToolbarTitleTargetVisible(false);
  }, [toolbarRef, visibilityKey]);

  React.useEffect(() => {
    const toolbar = toolbarRef.current;
    const scrollRoot = toolbar ? getScrollRoot(toolbar) : null;
    const targetRoot = scrollRoot ?? document.body;

    if (!toolbar) {
      return;
    }

    let intersectionObserver: IntersectionObserver | undefined;
    let observedTitleTarget: Element | undefined;
    let canShowToolbarTitle = false;
    let shouldShowToolbarTitleAfterInitialFrame = false;
    let showTitleAnimationFrame: number | undefined;
    let showTitleReadyAnimationFrame: number | undefined;

    showTitleAnimationFrame = requestAnimationFrame(() => {
      showTitleReadyAnimationFrame = requestAnimationFrame(() => {
        canShowToolbarTitle = true;

        if (shouldShowToolbarTitleAfterInitialFrame) {
          showToolbarTitle();
        }
      });
    });

    function showToolbarTitle() {
      if (!canShowToolbarTitle) {
        shouldShowToolbarTitleAfterInitialFrame = true;
        return;
      }

      setToolbarTitleTargetVisible(true);
    }

    function hideToolbarTitle() {
      shouldShowToolbarTitleAfterInitialFrame = false;
      setToolbarTitleTargetVisible(false);
    }

    function observeTitleTarget() {
      const titleTargets = targetRoot.querySelectorAll(
        toolbarTitleTargetSelector,
      );
      const titleTarget = titleTargets[titleTargets.length - 1];

      if (!titleTarget) {
        intersectionObserver?.disconnect();
        observedTitleTarget = undefined;
        hideToolbarTitle();
        return;
      }

      if (observedTitleTarget === titleTarget) {
        return;
      }

      intersectionObserver?.disconnect();
      observedTitleTarget = titleTarget;

      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            hideToolbarTitle();
          } else {
            showToolbarTitle();
          }
        },
        {
          root: scrollRoot,
        },
      );

      intersectionObserver.observe(titleTarget);
    }

    observeTitleTarget();

    const mutationObserver = new MutationObserver(observeTitleTarget);
    mutationObserver.observe(targetRoot, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (showTitleAnimationFrame !== undefined) {
        cancelAnimationFrame(showTitleAnimationFrame);
      }

      if (showTitleReadyAnimationFrame !== undefined) {
        cancelAnimationFrame(showTitleReadyAnimationFrame);
      }

      hideToolbarTitle();
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
    };
  }, [toolbarRef, visibilityKey]);

  return isToolbarTitleTargetVisible;
}

function getScrollRoot(element: HTMLElement) {
  let parent = element.parentElement;

  while (parent) {
    const overflowY = getComputedStyle(parent).overflowY;

    if (
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflowY === 'overlay'
    ) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}
