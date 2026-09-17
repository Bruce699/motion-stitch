import { ToolbarGroup } from './toolbar-group';
import type {
  ToolbarButtonAction,
  ToolbarPreviousNextItem,
} from './toolbar.types';

export function ToolbarPreviousNext({
  previous,
  next,
}: {
  previous: ToolbarPreviousNextItem;
  next: ToolbarPreviousNextItem;
}) {
  const actions = [
    {
      type: 'secondary',
      label: previous.label ?? 'Previous',
      icon: 'ChevronUp',
      disabled: previous.disabled ?? previous.url === undefined,
      url: previous.url,
      onClick: previous.onClick,
    },
    {
      type: 'secondary',
      label: next.label ?? 'Next',
      icon: 'ChevronDown',
      disabled: next.disabled ?? next.url === undefined,
      url: next.url,
      onClick: next.onClick,
    },
  ] satisfies ToolbarButtonAction[];

  return <ToolbarGroup actions={actions} />;
}
