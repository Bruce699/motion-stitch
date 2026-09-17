import { AnimatePresence, m } from 'motion/react';
import React from 'react';
import { motionEasings } from '~/ui/tokens/motion';
import { SidekickToolCall } from './sidekick-tool-call';
import { SidekickTurnMessage } from './sidekick-turn-message';
import { getSidekickWordRevealDurationMs } from './sidekick-word-reveal';
import type { SidekickTurn } from '~/stores/use-sidekick-thread-store';

export function SidekickThread({
  toolCallText,
  turns,
  onHeightUpdate,
  onTurnRevealComplete,
}: {
  toolCallText?: string;
  turns: Array<SidekickTurn>;
  onHeightUpdate?: () => void;
  onTurnRevealComplete?: (turnId: string) => void;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    setContentHeight(contentRef.current?.scrollHeight ?? 0);
  }, [toolCallText, turns]);

  React.useEffect(() => {
    if (!onTurnRevealComplete) return undefined;

    const revealingTurn = turns.find(
      (turn) => turn.user === 'sidekick' && !turn.revealed,
    );
    if (!revealingTurn) return undefined;

    const timeoutId = window.setTimeout(() => {
      onTurnRevealComplete(revealingTurn.id);
    }, getSidekickWordRevealDurationMs(revealingTurn.message));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onTurnRevealComplete, turns]);

  return (
    <m.div
      initial={false}
      animate={{
        height: turns.length > 0 || toolCallText ? contentHeight : 0,
        opacity: turns.length > 0 || toolCallText ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: motionEasings.easeOut }}
      onUpdate={onHeightUpdate}
      onAnimationComplete={onHeightUpdate}
      className="shrink-0 overflow-hidden"
    >
      <div ref={contentRef} className="flex flex-col gap-3 px-2 pb-3 pt-3">
        <AnimatePresence initial={false} mode="popLayout">
          {turns.map((turn) => (
            <m.div
              layout
              key={turn.id}
              initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
              transition={{ duration: 0.25, ease: motionEasings.easeOut }}
            >
              <SidekickTurnMessage
                turn={turn}
                reveal={turn.user === 'sidekick' && !turn.revealed}
              />
            </m.div>
          ))}
        </AnimatePresence>
        {toolCallText ? (
          <SidekickToolCall text={toolCallText} />
        ) : null}
      </div>
    </m.div>
  );
}
