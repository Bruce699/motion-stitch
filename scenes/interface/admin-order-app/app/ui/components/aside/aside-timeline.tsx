import { useLayoutEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Avatar } from '~/ui/components/avatar/avatar';
import * as Collapsible from '~/ui/components/collapsible/collapsible';
import { Input } from '~/ui/components/input/input';
import { buttonClass } from '~/ui/components/button/button-class';

export type AsideTimelineEvent = {
  date: string;
  staffMember: {
    id: string;
    image: string;
    initials: string;
    name: string;
  };
  body: string;
  time: string;
};

const timelineItemClasses =
  'relative grid grid-cols-[--spacing(7)_minmax(0,1fr)] gap-x-2';
const collapsedTimelineHeight = 200;

function AsideTimeline({
  events,
  placeholder = 'Leave a comment',
}: {
  events: AsideTimelineEvent[];
  placeholder?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(collapsedTimelineHeight);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;

    function updateContentHeight() {
      const timeline = contentRef.current;
      if (timeline) setContentHeight(timeline.scrollHeight);
    }

    updateContentHeight();

    const resizeObserver = new ResizeObserver(updateContentHeight);
    resizeObserver.observe(content);

    return () => resizeObserver.disconnect();
  }, [events]);

  return (
    <div className="group mt-2 flex flex-col">
      <Input placeholder={placeholder} />
      <Collapsible.Root
        className="relative"
        open={expanded}
        onOpenChange={setExpanded}
      >
        <div
          className={clsx(
            'relative overflow-hidden transition-[height] ease-out',
            !expanded &&
              'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-40 after:bg-linear-to-b after:from-transparent after:from-10% after:via-background/85 after:via-55% after:to-background',
          )}
          style={{
            height: expanded ? contentHeight : collapsedTimelineHeight,
          }}
        >
          <div
            ref={contentRef}
            className="relative flex flex-col gap-4 pbs-4 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-px before:bg-border before:mask-[linear-gradient(to_bottom,transparent_0,black_1rem)]"
          >
            {events.map((event, index) => (
              <div
                key={`${event.date}-${event.staffMember.id}`}
                className={timelineItemClasses}
              >
                {index === events.length - 1 ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute top-[calc(--spacing(5)+--spacing(1)+--spacing(3))] bottom-0 left-3 w-px bg-background"
                  />
                ) : null}
                <div className="col-start-2 mb-1 text-sm font-medium text-muted-foreground">
                  {event.date}
                </div>
                <Avatar
                  className="col-start-1 row-start-2"
                  initials={event.staffMember.initials}
                  name={event.staffMember.name}
                  rounded
                  src={event.staffMember.image}
                />
                <div className="col-start-2 row-start-2 mt-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-primary">
                      {event.staffMember.name}
                    </p>
                    <span className="text-muted-foreground">{event.time}</span>
                  </div>
                  <p className="mt-0.5 text-secondary">{event.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {!expanded ? (
          <div className="absolute right-0 bottom-3 left-10 z-10 flex justify-center opacity-0 transition-opacity ease-out group-hover:opacity-100">
            <Collapsible.Trigger
              className={clsx(buttonClass('plain'), 'w-fit')}
            >
              Show more
            </Collapsible.Trigger>
          </div>
        ) : null}
      </Collapsible.Root>
    </div>
  );
}

export { AsideTimeline };
