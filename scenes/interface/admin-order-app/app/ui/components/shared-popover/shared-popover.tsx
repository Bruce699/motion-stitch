import React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { AnimatePresence, m } from 'motion/react';
import { clsx } from 'clsx';
import { motionEasings } from '~/ui/tokens/motion';
import { getCursorTriggerProps } from './shared-popover-cursor';
import type {
  CursorPopoverConfig,
  InternalPopoverPayload,
  SharedPopoverAlign,
  SharedPopoverHandle,
  SharedPopoverSide,
} from './shared-popover-types';

const popoverTransitionEasing = motionEasings.easeOut;
const popoverTransitionDuration = 0.2;
const popoverTransition = {
  duration: popoverTransitionDuration,
  ease: popoverTransitionEasing,
};
const popoverVisible = {
  opacity: 1,
  scale: 1,
  filter: 'blur(0px)',
};
const popoverHidden = {
  opacity: 0,
  scale: 0.975,
  filter: 'blur(2px)',
};

function Root<Payload>({
  align,
  alignOffset,
  children,
  disabled,
  handle,
  onOpenChange,
  open,
  popupClassName,
  side,
  sideOffset,
}: {
  align?: SharedPopoverAlign;
  alignOffset?: number;
  children: (payload: Payload) => React.ReactNode;
  disabled?: boolean;
  handle: SharedPopoverHandle<Payload>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  popupClassName?: string;
  side?: SharedPopoverSide;
  sideOffset?: number;
}) {
  return (
    <BaseTooltip.Root
      handle={handle}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
    >
      {({
        payload: internalPayload,
      }: {
        payload: InternalPopoverPayload<Payload> | undefined;
      }) => {
        return (
          <AnimatePresence>
            {internalPayload && open ? (
              <BaseTooltip.Portal keepMounted>
                <BaseTooltip.Positioner
                  side={side}
                  align={align}
                  alignOffset={alignOffset}
                  sideOffset={sideOffset}
                >
                  <Popup
                    className={popupClassName}
                    contentKey={internalPayload.contentKey}
                  >
                    {children(internalPayload.payload)}
                  </Popup>
                </BaseTooltip.Positioner>
              </BaseTooltip.Portal>
            ) : null}
          </AnimatePresence>
        );
      }}
    </BaseTooltip.Root>
  );
}

function Trigger<Payload>({
  contentKey,
  handle,
  payload,
  ...props
}: Omit<
  React.ComponentProps<typeof BaseTooltip.Trigger>,
  'handle' | 'payload'
> & {
  contentKey?: React.Key;
  handle: SharedPopoverHandle<Payload>;
  payload: Payload;
}) {
  return (
    <BaseTooltip.Trigger
      handle={handle}
      payload={{
        contentKey: contentKey ?? getContentKeyForPayload(payload),
        payload,
      }}
      {...props}
    />
  );
}

function Provider({
  delay = 0,
  ...props
}: React.ComponentProps<typeof BaseTooltip.Provider>) {
  return <BaseTooltip.Provider delay={delay} {...props} />;
}

function Popup({
  children,
  className,
  contentKey,
  ...props
}: Omit<React.ComponentProps<typeof BaseTooltip.Popup>, 'render'> & {
  contentKey?: React.Key;
}) {
  return (
    <BaseTooltip.Popup
      render={<div className="relative overflow-hidden" />}
      className={className}
      {...props}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <m.div
          key={contentKey}
          initial={popoverHidden}
          animate={popoverVisible}
          exit={{
            ...popoverHidden,
            transition: popoverTransition,
          }}
          transition={popoverTransition}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </BaseTooltip.Popup>
  );
}

function CursorTrigger({
  align,
  children,
  className,
  content,
  delay,
  id,
  role,
  side,
  triggerClassName,
}: CursorPopoverConfig & {
  children: React.ReactElement;
  triggerClassName?: string;
}) {
  const triggerProps = getCursorTriggerProps({
    align,
    className,
    content,
    delay,
    id,
    role,
    side,
  });

  return (
    <span
      className={clsx(
        'relative z-10 cursor-default rounded-sm outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800',
        triggerClassName ?? 'inline-flex',
      )}
      {...triggerProps}
    >
      {children}
    </span>
  );
}

function Content({
  children,
}: {
  children: React.ReactNode;
  contentKey?: React.Key;
}) {
  return children;
}

function getContentKeyForPayload(payload: unknown): React.Key {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'href' in payload &&
    typeof payload.href === 'string'
  ) {
    return payload.href;
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'id' in payload &&
    (typeof payload.id === 'string' || typeof payload.id === 'number')
  ) {
    return payload.id;
  }

  return 'content';
}

export {
  Content,
  CursorTrigger,
  Popup,
  Provider,
  Root,
  Trigger,
};
export type { CursorPopoverConfig, SharedPopoverAlign, SharedPopoverHandle, SharedPopoverSide, SharedPopoverTriggerProps } from './shared-popover-types';
