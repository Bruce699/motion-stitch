import React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

type SharedPopoverSide = 'top' | 'right' | 'bottom' | 'left';
type SharedPopoverAlign = 'start' | 'center' | 'end';

type InternalPopoverPayload<Payload> = {
  contentKey: React.Key;
  payload: Payload;
};

type SharedPopoverHandle<Payload> = ReturnType<
  typeof BaseTooltip.createHandle<InternalPopoverPayload<Payload>>
>;

type SharedPopoverTriggerProps = {
  tabIndex: number;
  onPointerEnter: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
  onFocus: (event: React.FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
};

type CursorPopoverConfig = {
  id: string;
  content: React.ReactNode;
  align?: SharedPopoverAlign;
  className?: string;
  delay?: number;
  role?: React.AriaRole;
  side?: SharedPopoverSide;
};

type SharedPopoverPosition = {
  x: number;
  y: number;
};

export type {
  CursorPopoverConfig,
  InternalPopoverPayload,
  SharedPopoverAlign,
  SharedPopoverHandle,
  SharedPopoverPosition,
  SharedPopoverSide,
  SharedPopoverTriggerProps,
};
