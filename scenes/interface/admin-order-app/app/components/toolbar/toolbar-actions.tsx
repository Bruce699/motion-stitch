import { AnimatePresence, m } from 'motion/react';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import {
  getToolbarActionItemKey,
  ToolbarActionItem,
} from './toolbar-action-item';
import type { ToolbarAction } from './toolbar.types';

export function ToolbarActions({
  actions,
  actionsKey,
}: {
  actions: ToolbarAction[];
  actionsKey: string;
}) {
  if (actions.length === 0) return null;

  return (
    <AnimatePresence initial={false} mode="wait">
      <m.div
        key={actionsKey}
        className="relative flex items-end justify-end gap-2"
        initial={{ x: 8, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: motionDurations.base,
          ease: motionEasings.easeOut,
        }}
      >
        {actions.map((action) => (
          <ToolbarActionItem
            action={action}
            key={getToolbarActionItemKey(action)}
          />
        ))}
      </m.div>
    </AnimatePresence>
  );
}
