import React from 'react';

import { SidekickWordReveal } from './sidekick-word-reveal';
import type { SidekickTurn } from '~/stores/use-sidekick-thread-store';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import * as Tooltip from '~/ui/components/tooltip';

const sidekickActionTooltipDelay = 500;

type SidekickActionTooltipPayload = {
  label: string;
};

export function SidekickTurnMessage({
  turn,
  reveal,
}: {
  turn: SidekickTurn;
  reveal?: boolean;
}) {
  const tooltipHandle = React.useMemo(
    () => Tooltip.createHandle<SidekickActionTooltipPayload>(),
    [],
  );

  if (turn.user === 'merchant') {
    return (
      <div className="flex justify-end">
        <div className="inline-block max-w-8/10 rounded-3xl bg-gray-100 px-3 py-2">
          {turn.message}
        </div>
      </div>
    );
  }

  return (
    <div className="group/message">
      <p>
        {reveal ? <SidekickWordReveal content={turn.message} /> : turn.message}
      </p>
      <Tooltip.Provider delay={sidekickActionTooltipDelay} closeDelay={0}>
        <div className="-ms-1 mt-2 flex items-center gap-1 opacity-0 transition-opacity ease-out group-hover/message:opacity-100">
          <SidekickMessageAction
            label="Copy message"
            iconName="Duplicate"
            tooltipHandle={tooltipHandle}
          />
          <SidekickMessageAction
            label="Good response"
            iconName="ThumbsUp"
            tooltipHandle={tooltipHandle}
          />
          <SidekickMessageAction
            label="Bad response"
            iconName="ThumbsDown"
            tooltipHandle={tooltipHandle}
          />
        </div>

        <Tooltip.Root handle={tooltipHandle}>
          {({ payload }: { payload: unknown }) => {
            const tooltipPayload = payload as
              | SidekickActionTooltipPayload
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
    </div>
  );
}

function SidekickMessageAction({
  iconName,
  label,
  tooltipHandle,
}: {
  iconName: React.ComponentProps<typeof Icon>['name'];
  label: string;
  tooltipHandle: ReturnType<
    typeof Tooltip.createHandle<SidekickActionTooltipPayload>
  >;
}) {
  return (
    <Tooltip.Trigger
      handle={tooltipHandle}
      payload={{ label }}
      render={
        <Button
          onClick={() => {}}
          variant="plain"
          size="sm-icon"
          aria-label={label}
        >
          <span className="text-muted-foreground">
            <Icon name={iconName} size={14} />
          </span>
        </Button>
      }
    />
  );
}
