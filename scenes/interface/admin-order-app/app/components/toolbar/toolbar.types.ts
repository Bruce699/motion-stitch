import type React from 'react';
import type { IconName } from '~/ui/components/icon/icon';

export type ToolbarBreadcrumbItem = {
  animateOnMount?: boolean;
  hideLabel?: boolean;
  icon?: React.ReactNode;
  label: string;
  url?: string;
  variant?: 'button' | 'link' | 'title';
};

export type ToolbarClickHandler =
  React.MouseEventHandler<HTMLButtonElement> | null;

export type ToolbarButtonAction = {
  id?: string;
  type: 'primary' | 'secondary';
  icon?: IconName;
  iconNode?: React.ReactNode;
  label: string;
  disabled?: boolean;
  iconOnly?: boolean;
  url?: string;
  onClick?: ToolbarClickHandler;
};

export type ToolbarGroupAction = {
  type: 'group';
  label?: string;
  actions: ToolbarButtonAction[];
};

export type ToolbarPreviousNextAction = {
  type: 'previousNext';
  previous: ToolbarPreviousNextItem;
  next: ToolbarPreviousNextItem;
};

export type ToolbarCustomAction = {
  type: 'custom';
  label: string;
  content: React.ReactNode;
};

export type ToolbarAction =
  | ToolbarButtonAction
  | ToolbarGroupAction
  | ToolbarPreviousNextAction
  | ToolbarCustomAction;

export type ToolbarPreviousNextItem = {
  label?: string;
  disabled?: boolean;
  url?: string;
  onClick?: ToolbarClickHandler;
};
