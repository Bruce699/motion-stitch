import React from 'react';
import { createRoot, type Root as ReactRoot } from 'react-dom/client';
import { clsx } from 'clsx';
import { motionEasings } from '~/ui/tokens/motion';
import type {
  CursorPopoverConfig,
  SharedPopoverAlign,
  SharedPopoverPosition,
  SharedPopoverSide,
  SharedPopoverTriggerProps,
} from './shared-popover-types';

type CursorPopoverState = Required<
  Pick<CursorPopoverConfig, 'align' | 'content' | 'id' | 'role' | 'side'>
> &
  Pick<CursorPopoverConfig, 'className'> & {
    position: SharedPopoverPosition;
  };

const popoverTransitionEasing = motionEasings.easeOut;
const popoverTransitionEasingCss = `cubic-bezier(${popoverTransitionEasing.join(', ')})`;
const popoverTransitionDuration = 0.2;
const popoverTransitionDurationCss = `${popoverTransitionDuration * 1000}ms`;
const cursorPopoverVisible: React.CSSProperties = {
  opacity: 1,
  scale: '1',
  filter: 'blur(0px)',
};
const cursorPopoverHidden: React.CSSProperties = {
  opacity: 0,
  scale: '0.975',
  filter: 'blur(2px)',
};
const defaultOpenDelay = 250;
const closeDelay = 80;
const cursorOffset = 14;
const viewportMargin = 8;
const suppressOpenAfterDismissMs = 250;

let cursorPopoverRoot: ReactRoot | null = null;
let cursorPopoverContainer: HTMLDivElement | null = null;
let openPopoverId: string | null = null;
let cursorPopoverIsOpen = false;
let openTimeout: number | null = null;
let closeTimeout: number | null = null;
let animationFrame: number | null = null;
let nextPosition: SharedPopoverPosition = { x: 0, y: 0 };
let globalDismissListenersAttached = false;
let suppressOpenUntil = 0;

function getCursorTriggerProps({
  align = 'start',
  className,
  content,
  delay = defaultOpenDelay,
  id,
  role = 'dialog',
  side = 'top',
}: CursorPopoverConfig): SharedPopoverTriggerProps {
  function openPopover(position: SharedPopoverPosition, nextDelay = delay) {
    if (performance.now() < suppressOpenUntil) return;

    clearCloseTimeout();
    clearOpenTimeout();
    nextPosition = position;
    openPopoverId = id;

    if (cursorPopoverIsOpen) {
      renderCursorPopover({
        align,
        className,
        content,
        id,
        position,
        role,
        side,
      });
      return;
    }

    openTimeout = window.setTimeout(() => {
      openTimeout = null;
      renderCursorPopover({
        align,
        className,
        content,
        id,
        position: nextPosition,
        role,
        side,
      });
    }, nextDelay);
  }

  function closePopover() {
    clearOpenTimeout();
    clearCloseTimeout();

    closeTimeout = window.setTimeout(() => {
      closeTimeout = null;

      if (openPopoverId !== id) return;
      openPopoverId = null;
      cursorPopoverIsOpen = false;
      renderCursorPopover(null);
    }, closeDelay);
  }

  function updatePointerPosition(event: React.PointerEvent<HTMLElement>) {
    nextPosition = { x: event.clientX, y: event.clientY };
    if (!cursorPopoverIsOpen || openPopoverId !== id) return;
    schedulePositionUpdate({
      align,
      className,
      content,
      id,
      role,
      side,
    });
  }

  return {
    tabIndex: 0,
    onPointerEnter(event) {
      openPopover({ x: event.clientX, y: event.clientY });
    },
    onPointerMove: updatePointerPosition,
    onPointerLeave: closePopover,
    onFocus(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      openPopover(
        {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
        cursorPopoverIsOpen ? 0 : delay,
      );
    },
    onBlur: closePopover,
  };
}

function clearOpenTimeout() {
  if (openTimeout === null) return;
  window.clearTimeout(openTimeout);
  openTimeout = null;
}

function clearCloseTimeout() {
  if (closeTimeout === null) return;
  window.clearTimeout(closeTimeout);
  closeTimeout = null;
}

function closeCursorPopoverNow() {
  suppressOpenUntil = performance.now() + suppressOpenAfterDismissMs;
  clearOpenTimeout();
  clearCloseTimeout();

  openPopoverId = null;
  cursorPopoverIsOpen = false;
  renderCursorPopover(null);
}

function ensureCursorPopoverRoot() {
  if (typeof document === 'undefined') return null;
  if (cursorPopoverRoot && cursorPopoverContainer) return cursorPopoverRoot;

  cursorPopoverContainer = document.createElement('div');
  cursorPopoverContainer.setAttribute('data-shared-popover-root', '');
  document.body.append(cursorPopoverContainer);
  cursorPopoverRoot = createRoot(cursorPopoverContainer);

  return cursorPopoverRoot;
}

function renderCursorPopover(state: CursorPopoverState | null) {
  const root = ensureCursorPopoverRoot();
  if (!root) return;

  cursorPopoverIsOpen = Boolean(state);
  if (state) {
    attachGlobalDismissListeners();
  } else {
    detachGlobalDismissListeners();
  }
  root.render(state ? React.createElement(CursorPopover, { state }) : null);
}

function attachGlobalDismissListeners() {
  if (globalDismissListenersAttached || typeof document === 'undefined') return;

  document.addEventListener('pointerdown', closeCursorPopoverNow, true);
  document.addEventListener('click', closeCursorPopoverNow, true);
  document.addEventListener('visibilitychange', closePopoverOnHidden);
  window.addEventListener('blur', closeCursorPopoverNow);
  globalDismissListenersAttached = true;
}

function detachGlobalDismissListeners() {
  if (!globalDismissListenersAttached || typeof document === 'undefined')
    return;

  document.removeEventListener('pointerdown', closeCursorPopoverNow, true);
  document.removeEventListener('click', closeCursorPopoverNow, true);
  document.removeEventListener('visibilitychange', closePopoverOnHidden);
  window.removeEventListener('blur', closeCursorPopoverNow);
  globalDismissListenersAttached = false;
}

function closePopoverOnHidden() {
  if (document.visibilityState === 'hidden') {
    closeCursorPopoverNow();
  }
}

function schedulePositionUpdate({
  align,
  className,
  content,
  id,
  role,
  side,
}: Omit<CursorPopoverState, 'position'>) {
  if (animationFrame !== null) return;

  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = null;
    renderCursorPopover({
      align,
      className,
      content,
      id,
      position: nextPosition,
      role,
      side,
    });
  });
}

function CursorPopover({ state }: { state: CursorPopoverState }) {
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [popoverSize, setPopoverSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);
  const placement = popoverSize
    ? boundedPlacement({
        align: state.align,
        position: state.position,
        side: state.side,
        size: popoverSize,
      })
    : positionForSide(state.position, state.side);

  React.useLayoutEffect(() => {
    const node = popoverRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setPopoverSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, [state.content]);

  return React.createElement(
    'div',
    {
      ref: popoverRef,
      role: state.role,
      className: clsx(
        'fixed z-50 rounded-xl bg-white px-3 py-3 shadow-lg',
        state.className,
      ),
      style: {
        left: placement.x,
        top: placement.y,
        pointerEvents: 'none',
        visibility: popoverSize ? undefined : 'hidden',
      },
    },
    React.createElement(
      CursorPopoverContent,
      { key: state.id },
      state.content,
    ),
  );
}

function CursorPopoverContent({ children }: { children?: React.ReactNode }) {
  const [entering, setEntering] = React.useState(true);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntering(false));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return React.createElement(
    'div',
    {
      style: {
        ...(entering ? cursorPopoverHidden : cursorPopoverVisible),
        transitionDuration: popoverTransitionDurationCss,
        transitionProperty: 'opacity, scale, filter',
        transitionTimingFunction: popoverTransitionEasingCss,
      },
    },
    children,
  );
}

function positionForSide(
  position: SharedPopoverPosition,
  side: SharedPopoverSide,
) {
  switch (side) {
    case 'right':
      return { x: position.x + cursorOffset, y: position.y };
    case 'bottom':
      return { x: position.x, y: position.y + cursorOffset };
    case 'left':
      return { x: position.x - cursorOffset, y: position.y };
    case 'top':
      return { x: position.x, y: position.y - cursorOffset };
  }
}

function boundedPlacement({
  align,
  position,
  side,
  size,
}: {
  align: SharedPopoverAlign;
  position: SharedPopoverPosition;
  side: SharedPopoverSide;
  size: { width: number; height: number };
}) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const preferred = placementForSide({ align, position, side, size });
  const flippedSide = flippedSideForBounds({
    placement: preferred,
    position,
    side,
    size,
    viewportHeight,
    viewportWidth,
  });
  const placement =
    flippedSide === side
      ? preferred
      : placementForSide({ align, position, side: flippedSide, size });

  return {
    x: clamp(
      placement.x,
      viewportMargin,
      viewportWidth - size.width - viewportMargin,
    ),
    y: clamp(
      placement.y,
      viewportMargin,
      viewportHeight - size.height - viewportMargin,
    ),
  };
}

function placementForSide({
  align,
  position,
  side,
  size,
}: {
  align: SharedPopoverAlign;
  position: SharedPopoverPosition;
  side: SharedPopoverSide;
  size: { width: number; height: number };
}) {
  const crossAxisOffset = {
    start: 0,
    center: 0.5,
    end: 1,
  }[align];

  switch (side) {
    case 'right':
      return {
        x: position.x + cursorOffset,
        y: position.y - size.height * crossAxisOffset,
      };
    case 'bottom':
      return {
        x: position.x - size.width * crossAxisOffset,
        y: position.y + cursorOffset,
      };
    case 'left':
      return {
        x: position.x - cursorOffset - size.width,
        y: position.y - size.height * crossAxisOffset,
      };
    case 'top':
      return {
        x: position.x - size.width * crossAxisOffset,
        y: position.y - cursorOffset - size.height,
      };
  }
}

function flippedSideForBounds({
  placement,
  position,
  side,
  size,
  viewportHeight,
  viewportWidth,
}: {
  placement: SharedPopoverPosition;
  position: SharedPopoverPosition;
  side: SharedPopoverSide;
  size: { width: number; height: number };
  viewportHeight: number;
  viewportWidth: number;
}) {
  switch (side) {
    case 'top':
      return placement.y < viewportMargin &&
        viewportHeight - position.y > position.y
        ? 'bottom'
        : side;
    case 'bottom':
      return placement.y + size.height > viewportHeight - viewportMargin &&
        position.y > viewportHeight - position.y
        ? 'top'
        : side;
    case 'left':
      return placement.x < viewportMargin &&
        viewportWidth - position.x > position.x
        ? 'right'
        : side;
    case 'right':
      return placement.x + size.width > viewportWidth - viewportMargin &&
        position.x > viewportWidth - position.x
        ? 'left'
        : side;
  }
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export { getCursorTriggerProps };
