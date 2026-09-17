import React from 'react';
import { ToolbarButton } from './toolbar-button';
import { ToolbarGroup } from './toolbar-group';
import { ToolbarPreviousNext } from './toolbar-previous-next';
import type { ToolbarAction } from './toolbar.types';

export function getToolbarActionItemKey(action: ToolbarAction) {
  if ('id' in action && action.id) return action.id;
  if ('label' in action && action.label) return `${action.type}:${action.label}`;

  return action.type;
}

export function ToolbarActionItem({ action }: { action: ToolbarAction }) {
  if (action.type === 'group') {
    return <ToolbarGroup actions={action.actions} />;
  }

  if (action.type === 'previousNext') {
    return (
      <ToolbarPreviousNext previous={action.previous} next={action.next} />
    );
  }

  if (action.type === 'custom') {
    return <React.Fragment>{action.content}</React.Fragment>;
  }

  return <ToolbarButton action={action} />;
}
