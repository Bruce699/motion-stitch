import React from 'react';
import { AnimatePresence, m } from 'motion/react';
import { MediaStopIcon } from '~/icons/sidekick/media-stop';
import { SendButtonIcon } from '~/icons/sidekick/send-button';
import { VoiceIcon } from '~/icons/sidekick/voice';
import { motionEasings, motionDurations } from '~/ui/tokens/motion';

const iconAnimation = {
  initial: { opacity: 0, scale: 0.8, filter: 'blur(3px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.8, filter: 'blur(3px)' },
};

export function SidekickSendButton({
  onClick,
  onPointerDown,
  state = 'empty',
}: {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  state?: 'empty' | 'filled' | 'loading';
}) {
  return (
    <button
      type="submit"
      aria-label={state === 'loading' ? 'Stop response' : 'Send message'}
      className="relative flex h-[24px] w-[24px] items-center justify-center"
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      <AnimatePresence mode="popLayout">
        {state === 'loading' ? (
          <m.div
            key="stop"
            {...iconAnimation}
            transition={{
              duration: motionDurations.base,
              ease: motionEasings.easeOut,
            }}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-black text-white">
              <MediaStopIcon size={14} />
            </span>
          </m.div>
        ) : state === 'filled' ? (
          <m.div
            key="send"
            {...iconAnimation}
            transition={{
              duration: motionDurations.base,
              ease: motionEasings.easeOut,
            }}
          >
            <SendButtonIcon />
          </m.div>
        ) : (
          <m.div
            key="voice"
            {...iconAnimation}
            transition={{
              duration: motionDurations.base,
              ease: motionEasings.easeOut,
            }}
          >
            <VoiceIcon />
          </m.div>
        )}
      </AnimatePresence>
    </button>
  );
}
