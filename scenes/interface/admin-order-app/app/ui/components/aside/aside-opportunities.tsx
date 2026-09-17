import { useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import type { Variants } from 'motion/react';
import { AsideOpportunitiesBg } from '~/ui/components/aside/aside-opportunities-bg';
import { Button } from '~/ui/components/button/button';
import { Icon, type IconName } from '~/ui/components/icon/icon';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

export type AsideOpportunity = {
  icon: IconName;
  title: string;
  description: string;
};

const opportunityVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    filter: 'blur(2px)',
    transform: `translateX(${direction > 0 ? 16 : -16}px) scale(0.9)`,
  }),
  center: {
    opacity: 1,
    filter: 'blur(0px)',
    transform: 'translateX(0px) scale(1)',
  },
  exit: (direction: number) => ({
    opacity: 0,
    filter: 'blur(2px)',
    transform: `translateX(${direction > 0 ? -16 : 16}px) scale(0.9)`,
  }),
};

export function AsideOpportunities({
  opportunities,
}: {
  opportunities: readonly AsideOpportunity[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const opportunity = opportunities[activeIndex];
  const hasMultiple = opportunities.length > 1;
  const canShowPrevious = activeIndex > 0;
  const canShowNext = activeIndex < opportunities.length - 1;

  if (!opportunity) return null;

  const showPrevious = () => {
    setDirection(-1);
    setActiveIndex((index) => Math.max(0, index - 1));
  };

  const showNext = () => {
    setDirection(1);
    setActiveIndex((index) => Math.min(opportunities.length - 1, index + 1));
  };

  return (
    <div
      data-slot="aside-opportunities"
      className="relative flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          data-slot="aside-group-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Opportunities
        </h2>
        {hasMultiple ? (
          <div className="-mr-2 flex items-center text-sm text-muted-foreground">
            <CarouselButton
              disabled={!canShowPrevious}
              label="Previous opportunity"
              onClick={showPrevious}
            >
              <Icon name="ChevronLeft" size={12} strokeWidth={1.75} />
            </CarouselButton>
            <span className="inline-block w-10 text-center tabular-nums">
              {activeIndex + 1} of {opportunities.length}
            </span>
            <CarouselButton
              disabled={!canShowNext}
              label="Next opportunity"
              onClick={showNext}
            >
              <Icon name="ChevronRight" size={12} strokeWidth={1.75} />
            </CarouselButton>
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-0 -top-4 h-12 w-full">
        <AsideOpportunitiesBg />
      </div>
      <div className="overflow-hidden">
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          <m.div
            key={opportunity.title}
            custom={direction}
            className="flex cursor-pointer flex-col gap-1"
            variants={opportunityVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: motionDurations.base,
              ease: motionEasings.easeOut,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-ai">
                <Icon name={opportunity.icon} />
              </span>
              <h3 className="font-medium">{opportunity.title}</h3>
            </div>
            <p className="text-sm text-secondary">{opportunity.description}</p>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function CarouselButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      size="sm-icon"
      variant="plain"
    >
      {children}
    </Button>
  );
}
