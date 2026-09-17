import React from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import * as Tooltip from '~/ui/components/tooltip';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import type { ToolbarButtonAction } from './toolbar.types';

const groupedActionTooltipDelay = 500;

type ToolbarGroupedActionTooltipPayload = {
  label: string;
};

export function ToolbarGroup({ actions }: { actions: ToolbarButtonAction[] }) {
  const tooltipHandle = React.useMemo(
    () => Tooltip.createHandle<ToolbarGroupedActionTooltipPayload>(),
    [],
  );

  return (
    <Tooltip.Provider delay={groupedActionTooltipDelay} closeDelay={0}>
      <div className="inline-flex items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-button-elevated">
        {actions.map((action) => (
          <Tooltip.Trigger
            key={action.id ?? action.label}
            handle={tooltipHandle}
            payload={{ label: action.label }}
            render={
              <Button
                variant="plain"
                size="sm-icon"
                type="button"
                aria-label={action.label}
                disabled={action.disabled}
                href={action.disabled ? undefined : action.url}
                prefix={
                  <span className="relative grid size-4 place-items-center">
                    <AnimatePresence initial={false} mode="popLayout">
                      {(action.iconNode ?? action.icon) ? (
                        <m.span
                          key={action.icon ?? action.label}
                          initial={{
                            opacity: 0,
                            scale: 0.75,
                            filter: 'blur(2px)',
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            filter: 'blur(0px)',
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.75,
                            filter: 'blur(2px)',
                          }}
                          transition={{
                            duration: motionDurations.base,
                            ease: motionEasings.easeOut,
                          }}
                        >
                          {action.iconNode ??
                            (action.icon && <Icon name={action.icon} />)}
                        </m.span>
                      ) : null}
                    </AnimatePresence>
                  </span>
                }
                onClick={action.onClick ?? undefined}
              />
            }
          />
        ))}
      </div>

      <Tooltip.Root handle={tooltipHandle}>
        {({ payload }: { payload: unknown }) => {
          const tooltipPayload = payload as
            | ToolbarGroupedActionTooltipPayload
            | undefined;

          return tooltipPayload ? (
            <Tooltip.Portal>
              <Tooltip.Positioner side="bottom">
                <Tooltip.Popup>{tooltipPayload.label}</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          ) : null;
        }}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
