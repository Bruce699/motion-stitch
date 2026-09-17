import type { ComponentProps, CSSProperties } from 'react';
import { clsx } from 'clsx';
import { AnimatedNumber } from '~/ui/components/animated-number/animated-number';
import { Sparkline } from '~/ui/components/sparkline/sparkline';

type MetricsBarNumber = Omit<ComponentProps<typeof AnimatedNumber>, 'children'>;

export type MetricsBarItem = {
  id: string;
  label: string;
  value: MetricsBarNumber;
  change?: MetricsBarNumber;
  sparkline?: ComponentProps<typeof Sparkline>;
};

export function MetricsBar({
  animated = true,
  ariaLabel,
  className,
  metrics,
  ...props
}: Omit<ComponentProps<'section'>, 'children' | 'aria-label'> & {
  animated?: boolean;
  ariaLabel: string;
  metrics: readonly MetricsBarItem[];
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={clsx(
        'relative pb-4 after:pointer-events-none after:absolute after:inset-x-1 after:bottom-0 after:-z-1 after:h-1 after:bg-[repeating-linear-gradient(to_right,var(--color-gray-200)_0,var(--color-gray-200)_1px,transparent_1px,transparent_8px)] after:mask-[linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]',
        className,
      )}
      {...props}
    >
      <div
        className="grid grid-cols-[repeat(var(--metrics-bar-column-count),minmax(0,1fr))] gap-6 px-1 pt-1"
        style={
          {
            '--metrics-bar-column-count': metrics.length,
          } as CSSProperties
        }
      >
        {metrics.map((metric) => (
          <div key={metric.id} className="">
            <p className="text-sm text-secondary">{metric.label}</p>
            <div className="mt-1 flex items-end gap-2">
              <AnimatedNumber animated={animated} size="lg" {...metric.value} />
              {metric.change ? (
                <AnimatedNumber animated={animated} {...metric.change} />
              ) : null}
              {metric.sparkline ? (
                <Sparkline
                  animated={animated}
                  width={96}
                  height={16}
                  {...metric.sparkline}
                  className={clsx(
                    'mb-1 ml-2 min-w-8 flex-1',
                    metric.sparkline.className,
                  )}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
