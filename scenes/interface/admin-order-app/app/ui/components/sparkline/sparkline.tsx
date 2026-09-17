import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { useEffect, useId, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  AnimatedNumber,
  type AnimatedNumberTone,
} from '~/ui/components/animated-number/animated-number';
import { clsx } from 'clsx';

type SparklineVariant = 'default' | 'positive' | 'negative';

const strokeStyles: Record<SparklineVariant, string> = {
  default: 'text-muted-foreground',
  positive: 'text-green-600 dark:text-green-500',
  negative: 'text-red-600 dark:text-red-500',
};

const strokeGradients: Partial<
  Record<SparklineVariant, { from: string; to: string }>
> = {
  positive: {
    from: 'var(--color-green-100)',
    to: 'var(--color-green-600)',
  },
  negative: {
    from: 'var(--color-red-100)',
    to: 'var(--color-red-600)',
  },
};

function buildPath(
  data: number[],
  width: number,
  height: number,
  strokeWidth: number,
): string {
  if (data.length === 0) return '';
  if (data.length === 1) return `M0,${height / 2}L${width},${height / 2}`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth;
  const yScale = (height - pad * 2) / range;
  const xStep = width / (data.length - 1);

  const points = data.map((value, index) => ({
    x: index * xStep,
    y: pad + (max - value) * yScale,
  }));

  if (points.length === 2) {
    return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
  }

  const cornerRadius = 0.12;
  const [firstPoint] = points;
  let path = `M${firstPoint.x},${firstPoint.y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previousPoint = points[index - 1];
    const point = points[index];
    const nextPoint = points[index + 1];
    const cornerStart = {
      x: point.x + (previousPoint.x - point.x) * cornerRadius,
      y: point.y + (previousPoint.y - point.y) * cornerRadius,
    };
    const cornerEnd = {
      x: point.x + (nextPoint.x - point.x) * cornerRadius,
      y: point.y + (nextPoint.y - point.y) * cornerRadius,
    };

    path += `L${cornerStart.x},${cornerStart.y}Q${point.x},${point.y} ${cornerEnd.x},${cornerEnd.y}`;
  }

  const lastPoint = points[points.length - 1];

  return `${path}L${lastPoint.x},${lastPoint.y}`;
}

function useSparklineReveal(animated: boolean, pathD: string) {
  const [revealedPathD, setRevealedPathD] = useState('');

  useEffect(() => {
    if (!animated) {
      return;
    }

    const frame = window.requestAnimationFrame(() => setRevealedPathD(pathD));

    return () => window.cancelAnimationFrame(frame);
  }, [animated, pathD]);

  return !animated || revealedPathD === pathD;
}

function SparklinePath({
  animated,
  d,
  filter,
  isRevealed,
  opacity,
  stroke,
  strokeWidth,
}: {
  animated: boolean;
  d: string;
  filter?: string;
  isRevealed: boolean;
  opacity?: number;
  stroke: string;
  strokeWidth: number;
}) {
  const pathOpacity = animated ? (isRevealed ? (opacity ?? 1) : 0) : opacity;

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      filter={filter}
      opacity={pathOpacity}
      pathLength={1}
      strokeDasharray={animated ? 1 : undefined}
      strokeDashoffset={animated && !isRevealed ? 1 : 0}
      className={
        animated
          ? 'transition-[stroke-dashoffset,opacity] duration-1000 ease-out'
          : undefined
      }
    />
  );
}

function Sparkline({
  data,
  variant = 'default',
  label,
  prefix,
  suffix,
  animated = false,
  tooltip = false,
  width = 64,
  height = 20,
  strokeWidth = 1.5,
  className: className,
  ...props
}: {
  data: number[];
  variant?: SparklineVariant;
  label?: number;
  prefix?: string;
  suffix?: string;
  animated?: boolean;
  tooltip?: boolean | ((value: number, index: number) => string);
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
} & Omit<ComponentProps<'svg'>, 'width' | 'height' | 'className'>) {
  const pathD = useMemo(
    () => buildPath(data, width, height, strokeWidth),
    [data, width, height, strokeWidth],
  );
  const isRevealed = useSparklineReveal(animated, pathD);

  const id = useId();
  const filterId = `sparkline-glow-${id}`;
  const gradientId = `sparkline-gradient-${id}`;
  const strokeGradient = strokeGradients[variant];
  const stroke = strokeGradient ? `url(#${gradientId})` : 'currentColor';

  const svgContent = (
    <>
      <defs>
        {strokeGradient ? (
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={width}
            y2={0}
          >
            <stop stopColor={strokeGradient.from} />
            <stop offset="1" stopColor={strokeGradient.to} />
          </linearGradient>
        ) : null}
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      <SparklinePath
        d={pathD}
        animated={animated}
        filter={`url(#${filterId})`}
        isRevealed={isRevealed}
        opacity={0.3}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <SparklinePath
        d={pathD}
        animated={animated}
        isRevealed={isRevealed}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </>
  );

  if (tooltip && data.length > 0) {
    return (
      <SparklineWithTooltip
        data={data}
        variant={variant}
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        className={className}
        label={label}
        prefix={prefix}
        suffix={suffix}
        animated={animated}
        tooltip={tooltip}
        svgProps={props}
      >
        {svgContent}
      </SparklineWithTooltip>
    );
  }

  if (label !== undefined && label !== null) {
    return (
      <span
        className={clsx(
          'inline-grid grid-cols-[auto_minmax(2rem,max-content)] items-center gap-1 align-middle',
          strokeStyles[variant],
        )}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          overflow="visible"
          className={clsx('inline-block', className)}
          {...props}
        >
          {svgContent}
        </svg>
        <SparklineLabel
          animated={animated}
          label={label}
          prefix={prefix}
          tone={getNumberTone(variant)}
          suffix={suffix}
        />
      </span>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      overflow="visible"
      className={clsx('inline-block', strokeStyles[variant], className)}
      {...props}
    >
      {svgContent}
    </svg>
  );
}

function SparklineWithTooltip({
  data,
  variant,
  width,
  height,
  strokeWidth,
  className,
  label,
  prefix,
  suffix,
  animated,
  tooltip,
  svgProps,
  children,
}: {
  data: number[];
  variant: SparklineVariant;
  width: number;
  height: number;
  strokeWidth: number;
  className?: string;
  label?: number;
  prefix?: string;
  suffix?: string;
  animated: boolean;
  tooltip: boolean | ((value: number, index: number) => string);
  svgProps: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const tooltipHandle = useMemo(
    () => BaseTooltip.createHandle<{ value: number; index: number }>(),
    [],
  );

  const xStep = data.length > 1 ? width / (data.length - 1) : width;
  const segWidth = width / data.length;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = strokeWidth;
  const range = max - min || 1;
  const yScale = (height - pad * 2) / range;

  const formatValue =
    typeof tooltip === 'function' ? tooltip : (v: number) => String(v);

  const sparkline = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      overflow="visible"
      className={clsx(
        'inline-block',
        label !== undefined && label !== null
          ? undefined
          : strokeStyles[variant],
        className,
      )}
      {...svgProps}
    >
      {children}
      {data.map((value, i) => (
        <BaseTooltip.Trigger
          key={`${value}-${i === 0 ? 'first' : data[i - 1]}-${i === data.length - 1 ? 'last' : data[i + 1]}`}
          handle={tooltipHandle}
          payload={{ value, index: i }}
          render={
            <g className="group">
              <circle
                cx={i * xStep}
                cy={pad + (max - value) * yScale}
                r={2.5}
                fill="currentColor"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
              <rect
                x={i * segWidth}
                y={0}
                width={segWidth}
                height={height}
                fill="transparent"
              />
            </g>
          }
        />
      ))}
    </svg>
  );

  return (
    <BaseTooltip.Provider delay={0} closeDelay={0}>
      {label !== undefined && label !== null ? (
        <span
          className={clsx(
            'inline-grid grid-cols-[auto_minmax(2rem,max-content)] items-center gap-1 align-middle',
            strokeStyles[variant],
          )}
        >
          {sparkline}
          <SparklineLabel
            animated={animated}
            label={label}
            prefix={prefix}
            tone={getNumberTone(variant)}
            suffix={suffix}
            size="sm"
          />
        </span>
      ) : (
        sparkline
      )}
      <BaseTooltip.Root handle={tooltipHandle} trackCursorAxis="both">
        {({ payload }) => (
          <BaseTooltip.Portal>
            <BaseTooltip.Positioner className="outline-none" sideOffset={8}>
              <BaseTooltip.Popup
                className={clsx(
                  'flex origin-(--transform-origin) flex-col rounded-md bg-[canvas] px-2 py-1 text-sm',
                  'shadow-lg shadow-gray-200 outline-1 outline-gray-200',
                  'dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300',
                  'transition-[opacity,transform] duration-100',
                  'data-starting-style:scale-90 data-starting-style:opacity-0',
                  'data-ending-style:scale-90 data-ending-style:opacity-0',
                )}
              >
                {payload !== undefined &&
                  formatValue(payload.value, payload.index)}
              </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
          </BaseTooltip.Portal>
        )}
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

function SparklineLabel({
  animated,
  label,
  prefix,
  size,
  suffix,
  tone,
}: {
  animated: boolean;
  label: number;
  prefix?: string;
  size?: 'sm';
  suffix?: string;
  tone?: AnimatedNumberTone;
}) {
  const sign = prefix ?? (label < 0 ? '-' : undefined);
  const metric = sign === '-' ? Math.abs(label) : label;
  const accessibleLabel = `${prefix ?? ''}${label}${suffix ?? ''}`;

  return (
    <span
      aria-label={accessibleLabel}
      className={clsx(
        'inline-grid justify-end font-medium',
        size === 'sm' && 'text-sm',
      )}
    >
      <span aria-hidden className="grid grid-cols-[0.65em_auto] items-baseline">
        <span className={clsx('text-right', !sign && 'invisible')}>
          {sign ?? '+'}
        </span>
        <AnimatedNumber
          aria-hidden
          animated={animated}
          metric={metric}
          suffix={suffix}
          tone={tone}
        />
      </span>
    </span>
  );
}

function getNumberTone(variant: SparklineVariant): AnimatedNumberTone {
  return variant === 'default' ? 'default' : variant;
}

export { Sparkline };
