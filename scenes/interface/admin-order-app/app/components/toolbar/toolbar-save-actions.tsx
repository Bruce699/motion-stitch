import { AnimatePresence, m } from 'motion/react';
import React from 'react';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

type SaveStatus = 'saved' | 'unsaved';

export function ToolbarSaveActions({
  onDiscard,
  onSave,
  onSaveCompleteViewed,
  showSaveAffordance,
  status,
}: {
  onDiscard: () => void;
  onSave: () => void | Promise<void>;
  onSaveCompleteViewed: () => void;
  showSaveAffordance: boolean;
  status: SaveStatus;
}) {
  const isEditing = status === 'unsaved';

  React.useEffect(() => {
    if (status !== 'saved') return;

    const timeout = setTimeout(onSaveCompleteViewed, 5000);

    return () => {
      clearTimeout(timeout);
    };
  }, [onSaveCompleteViewed, status]);

  return (
    <m.div
      layout
      className="dark relative flex h-9.5 origin-center items-center gap-2 overflow-hidden rounded-full bg-background p-1 pr-4 pl-3 shadow-2xl"
      initial={{ y: -56, scale: 0.8, opacity: 0 }}
      animate={
        showSaveAffordance
          ? {
              y: 0,
              scale: 1,
              opacity: 1,
              x: [0, -6, 6, -4, 4, -2, 2, 0],
            }
          : {
              y: 0,
              scale: 1,
              opacity: 1,
              filter: 'blur(0px)',
            }
      }
      exit={{ y: -56, scale: 0.8, opacity: 0 }}
      transition={{
        duration: showSaveAffordance
          ? motionDurations.slower
          : motionDurations.slow,
        ease: motionEasings.easeOut,
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        {isEditing ? (
          <m.div
            layout
            key="unsaved-status"
            className="whitespace-nowrap"
            initial={{
              opacity: 0,
              filter: 'blur(2px)',
            }}
            animate={{
              opacity: 1,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              filter: 'blur(2px)',
            }}
            transition={{
              duration: motionDurations.slow,
              ease: motionEasings.easeOut,
            }}
          >
            <p>Unsaved changes</p>
          </m.div>
        ) : (
          <m.div
            layout
            key="saved-status"
            initial={{
              opacity: 0,
              filter: 'blur(2px)',
            }}
            animate={{
              opacity: 1,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              filter: 'blur(2px)',
            }}
            transition={{
              duration: motionDurations.slow,
              ease: motionEasings.easeOut,
            }}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <m.span
              key={status}
              aria-hidden
              className="text-green-500"
              initial={{
                opacity: 0,
                scale: 0.5,
                filter: 'blur(4px)',
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
              }}
              transition={{
                duration: motionDurations.slow,
                ease: motionEasings.easeOut,
              }}
            >
              <Icon name="CircleCheck" size={18} />
            </m.span>
            <p>Changes saved</p>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="popLayout">
        {isEditing && (
          <m.div
            key="save-actions-buttons"
            className="-mr-3 flex shrink-0 items-center gap-1"
            initial={{ opacity: 0, filter: 'blur(4px)', paddingLeft: 16 }}
            animate={{ opacity: 1, filter: 'blur(0px)', paddingLeft: 16 }}
            exit={{ opacity: 0, filter: 'blur(4px)', paddingLeft: 0 }}
            transition={{
              duration: motionDurations.slow,
              ease: motionEasings.easeOut,
            }}
          >
            <Button
              onClick={() => {
                onDiscard();
              }}
              variant="secondary"
            >
              Discard
            </Button>
            <Button
              onClick={() => {
                void onSave();
              }}
              variant="primary"
            >
              Save
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
