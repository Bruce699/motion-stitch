import React from 'react';
import { m } from 'motion/react';
import { useNavigate } from 'react-router';
import { homeSidekickActions, homeSidekickItems } from '~/data/home-sidekick';
import { OrdersIcon } from '~/icons/navigation/orders';
import { clsx } from 'clsx';
import { Button, Icon, ShimmerText } from '~/ui';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import { SidekickFieldWrapper } from '../sidekick/floating-input/sidekick-field-wrapper';
import { SidekickField } from '../sidekick/floating-input/sidekick-field';
import { useSidekickThreadStore } from '~/stores/use-sidekick-thread-store';

const sidekickActionEntranceStagger = 0.1;

function SidekickActionIcon({
  action,
}: {
  action: (typeof homeSidekickActions)[number];
}) {
  if (action.navigationIcon === 'orders') return <OrdersIcon />;

  return <Icon name={action.iconName} />;
}

export function SidekickSection({
  entranceDelay = 0,
  hasEntered = true,
}: {
  entranceDelay?: number;
  hasEntered?: boolean;
}) {
  const [sidekickDraft, setSidekickDraft] = React.useState('');
  const [sidekickFieldFocused, setSidekickFieldFocused] = React.useState(false);
  const navigate = useNavigate();
  const submitPrompt = useSidekickThreadStore((state) => state.submitPrompt);
  const shouldAnimateEntrance = entranceDelay > 0;

  function openChats() {
    navigate('/store/chats');
  }

  function handleSidekickSubmit() {
    const message = sidekickDraft.trim();
    if (!message) return;

    submitPrompt(message);
    setSidekickDraft('');
    openChats();
  }

  return (
    <section className="relative flex flex-col items-center justify-center gap-8">
      <h1 className="mt-10 flex flex-col items-center gap-1 text-center text-3xl font-medium">
        <m.span
          initial={false}
          animate={{
            opacity: hasEntered ? 1 : 0,
            y: hasEntered ? 0 : 16,
            filter: hasEntered ? 'blur(0px)' : 'blur(2px)',
          }}
          transition={{
            delay: shouldAnimateEntrance ? entranceDelay : 0,
            duration: motionDurations.slower,
            ease: motionEasings.easeOut,
          }}
          style={
            shouldAnimateEntrance && !hasEntered
              ? { willChange: 'transform, opacity, filter' }
              : undefined
          }
        >
          BFCM cooled off, as expected
        </m.span>
        <m.span
          className="text-muted-foreground"
          initial={false}
          animate={{
            opacity: hasEntered ? 1 : 0,
            y: hasEntered ? 0 : 16,
            filter: hasEntered ? 'blur(0px)' : 'blur(2px)',
          }}
          transition={{
            delay: shouldAnimateEntrance
              ? entranceDelay + motionDurations.fast
              : 0,
            duration: motionDurations.slower,
            ease: motionEasings.easeOut,
          }}
          style={
            shouldAnimateEntrance && !hasEntered
              ? { willChange: 'transform, opacity, filter' }
              : undefined
          }
        >
          Let's focus on repeat buyers
        </m.span>
      </h1>
      <m.div
        className={clsx(
          'rounded-b-6xl mx-auto flex w-full max-w-160 flex-col rounded-[30px] border p-0.5 shadow-[inset_0_1px_0.5px_0_rgba(0,0,0,0.02)] transition-colors ease-out',
          hasEntered || !shouldAnimateEntrance
            ? 'border-black/4 bg-gray-50'
            : 'border-transparent bg-transparent',
          shouldAnimateEntrance && 'delay-800',
        )}
        initial={false}
        animate={{
          opacity: hasEntered ? 1 : 0,
          scale: hasEntered ? 1 : 0.95,
          y: hasEntered ? 0 : 16,
        }}
        transition={{
          delay: entranceDelay,
          duration: motionDurations.slower,
          ease: motionEasings.easeOut,
        }}
        style={
          shouldAnimateEntrance && !hasEntered
            ? { willChange: 'transform, opacity' }
            : undefined
        }
      >
        <SidekickFieldWrapper hasMessages={false}>
          <div className="p-3">
            <SidekickField
              isFocused={sidekickFieldFocused}
              showActions
              value={sidekickDraft}
              onChange={setSidekickDraft}
              onFocus={() => setSidekickFieldFocused(true)}
              onBlur={() => setSidekickFieldFocused(false)}
              onOpenSidekickPanel={openChats}
              onSubmit={handleSidekickSubmit}
            />
          </div>
        </SidekickFieldWrapper>
        <div className="flex flex-col gap-2 px-5 py-4 pt-3.5 pb-3">
          {homeSidekickItems.map((item) => (
            <div key={item.label} className="grid grid-cols-[1fr_auto]">
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-xs border border-purple-500/70" />
                <span>{item.label}</span>
              </div>
              <span className="text-muted-foreground">
                <ShimmerText>{item.status}</ShimmerText>
              </span>
            </div>
          ))}
        </div>
      </m.div>
      <div className="flex items-center gap-3">
        {homeSidekickActions.map((action, index) => (
          <m.div
            key={action.label}
            initial={false}
            animate={{
              opacity: hasEntered ? 1 : 0,
              scale: hasEntered ? 1 : 0.8,
              y: hasEntered ? 0 : 12,
            }}
            transition={{
              delay: shouldAnimateEntrance
                ? entranceDelay + index * sidekickActionEntranceStagger
                : 0,
              duration: motionDurations.slower,
              ease: motionEasings.easeOut,
            }}
            style={
              shouldAnimateEntrance && !hasEntered
                ? { willChange: 'transform, opacity' }
                : undefined
            }
          >
            <Button
              onClick={() => {}}
              variant="elevated"
              prefix={
                <span className="-ml-0.5 text-muted-foreground">
                  <SidekickActionIcon action={action} />
                </span>
              }
              suffix={
                <span className="-mr-1.5 min-w-6 rounded-full bg-gray-200 px-1.5 py-1 text-secondary tabular-nums">
                  {action.value}
                </span>
              }
            >
              {action.label}
            </Button>
          </m.div>
        ))}
      </div>
    </section>
  );
}
