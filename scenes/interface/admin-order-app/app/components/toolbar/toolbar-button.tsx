import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import * as Tooltip from '~/ui/components/tooltip';
import type { ToolbarButtonAction } from './toolbar.types';

const toolbarButtonTooltipDelay = 500;

export function ToolbarButton({ action }: { action: ToolbarButtonAction }) {
  const button = (
    <Button
      variant={action.type === 'primary' ? 'primary' : 'elevated'}
      prefix={action.iconNode ?? (action.icon && <Icon name={action.icon} />)}
      aria-label={action.iconOnly ? action.label : undefined}
      size={action.iconOnly ? 'icon' : 'default'}
      disabled={action.disabled}
      href={action.disabled ? undefined : action.url}
      onClick={action.onClick ?? undefined}
    >
      {!action.iconOnly && action.label}
    </Button>
  );

  if (!action.iconOnly) return button;

  return (
    <Tooltip.Provider delay={toolbarButtonTooltipDelay} closeDelay={0}>
      <Tooltip.Root>
        <Tooltip.Trigger render={button} />
        <Tooltip.Portal>
          <Tooltip.Positioner side="bottom">
            <Tooltip.Popup>{action.label}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
