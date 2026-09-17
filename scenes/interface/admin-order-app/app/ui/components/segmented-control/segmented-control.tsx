import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { useState, type CSSProperties } from 'react';
import { Icon, type IconName } from '~/ui/components/icon/icon';
import { clsx } from 'clsx';

export type SegmentedControlSegment = {
  label?: string;
  icon?: IconName;
  value?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

function getSegmentValue(segment: SegmentedControlSegment, index: number) {
  return segment.value ?? segment.label ?? segment.icon ?? String(index);
}

function getInitialValue(
  segments: SegmentedControlSegment[],
  defaultValue?: string,
) {
  return (
    defaultValue ??
    getSegmentValue(
      segments.find((segment) => !segment.disabled) ?? segments[0],
      0,
    )
  );
}

function SegmentContent({ segment }: { segment: SegmentedControlSegment }) {
  return (
    <>
      {segment.icon ? <Icon name={segment.icon} /> : null}
      {segment.label ? <span>{segment.label}</span> : null}
    </>
  );
}

export function SegmentedControl({
  segments,
  value,
  defaultValue,
  onValueChange,
  ariaLabel,
}: {
  segments: SegmentedControlSegment[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
}) {
  const initialValue = getInitialValue(segments, defaultValue);
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
  const selectedValue = value ?? uncontrolledValue;
  const selectedIndex = Math.max(
    segments.findIndex(
      (segment, index) => getSegmentValue(segment, index) === selectedValue,
    ),
    0,
  );

  const handleValueChange = (
    nextValues: string[],
    eventDetails: { cancel: () => void },
  ) => {
    const nextValue = nextValues[0];

    if (!nextValue) {
      eventDetails.cancel();
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <BaseToggleGroup
      aria-label={ariaLabel}
      value={[selectedValue]}
      onValueChange={handleValueChange}
      style={
        {
          '--segmented-control-segment-count': segments.length,
          '--segmented-control-indicator-translate': `${selectedIndex * 100}%`,
        } as CSSProperties
      }
      className="relative isolate inline-grid h-control shrink-0 [grid-auto-columns:minmax(0,1fr)] grid-flow-col items-center justify-center rounded-full bg-gray-200 p-0.5 font-medium before:absolute before:top-0.5 before:bottom-0.5 before:left-0.5 before:z-0 before:w-[calc((100%_-_var(--spacing))_/_var(--segmented-control-segment-count))] before:transform-[translateX(var(--segmented-control-indicator-translate))] before:rounded-full before:bg-white before:shadow-[0_1px_1px_-0.5px_rgba(0,0,0,0.06),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.06),0_2px_8px_0_rgba(0,0,0,0.06)] before:transition-transform before:ease-out dark:before:bg-gray-900"
    >
      {segments.map((segment, index) => {
        const segmentValue = getSegmentValue(segment, index);
        const isSelected = selectedValue === segmentValue;
        const segmentLabel = segment.ariaLabel ?? segment.label ?? segment.icon;

        return (
          <BaseToggle
            key={segmentValue}
            value={segmentValue}
            aria-label={segmentLabel}
            disabled={segment.disabled}
            className={clsx(
              'relative z-10 inline-flex h-full shrink-0 items-center justify-center gap-2 rounded-full px-2 font-medium whitespace-nowrap text-muted-foreground transition-colors ease-out focus:outline-none disabled:pointer-events-none disabled:opacity-50',
              isSelected
                ? 'cursor-default text-primary'
                : 'cursor-pointer hover:bg-black/5 hover:text-primary dark:hover:bg-white/8',
            )}
          >
            <SegmentContent segment={segment} />
          </BaseToggle>
        );
      })}
    </BaseToggleGroup>
  );
}
