import { useId, type ComponentProps } from 'react';
import { clsx } from 'clsx';

type StatusIndicatorStatus = 'active' | 'caution' | 'warning' | 'inactive';

const statusIndicatorColors = {
  active: {
    glow: '0 0 0 0 0.76 0 0 0 0 0.95 0 0 0 0 0.55 0 0 0 1 0',
    start: '#4DD600',
    end: '#44BD00',
  },
  caution: {
    glow: '0 0 0 0 0.95 0 0 0 0 0.79 0 0 0 0 0 0 0 0 1 0',
    start: '#F6D900',
    end: '#F1C900',
  },
  warning: {
    glow: '0 0 0 0 0.94 0 0 0 0 0.27 0 0 0 0 0.27 0 0 0 1 0',
    start: '#F87171',
    end: '#DC2626',
  },
} as const;

export function StatusIndicator({
  className,
  label,
  status,
  ...props
}: ComponentProps<'span'> & {
  status: StatusIndicatorStatus;
  label?: string;
}) {
  return (
    <span
      className={clsx('inline-flex items-center gap-2 text-base', className)}
      {...props}
    >
      <IndicatorSvg status={status} />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

function IndicatorSvg({ status }: { status: StatusIndicatorStatus }) {
  const id = useId().replace(/:/g, '');
  const gradientId = `${id}-status-indicator-gradient`;
  const filterId = `${id}-status-indicator-filter`;
  const colors =
    status === 'inactive'
      ? statusIndicatorColors.active
      : statusIndicatorColors[status];
  const active = status !== 'inactive';
  return (
    <svg
      aria-hidden
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="-m-4 size-12 shrink-0"
    >
      <g
        filter={`url(#${filterId})`}
        className={clsx(
          'transition-opacity ease-out',
          active ? 'opacity-100' : 'opacity-0',
        )}
      >
        <path
          d="M20 23C20 21.34 21.34 20 23 20H25C26.66 20 28 21.34 28 23V25C28 26.66 26.66 28 25 28H23C21.34 28 20 26.66 20 25V23Z"
          fill={`url(#${gradientId})`}
        />
      </g>
      <path
        d="M23 20.75H25C26.24 20.75 27.25 21.76 27.25 23V25C27.25 26.24 26.24 27.25 25 27.25H23C21.76 27.25 20.75 26.24 20.75 25V23C20.75 21.76 21.76 20.75 23 20.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        className={clsx(
          'transition-opacity ease-out',
          'text-gray-300 dark:text-gray-700',
          active ? 'opacity-0' : 'opacity-100',
        )}
      />
      <defs>
        <filter
          id={filterId}
          x="0"
          y="0"
          width="48"
          height="48"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="10" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values={colors.glow}
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-0.5" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="shape" result="effect2_innerShadow" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="0.5" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="effect2_innerShadow"
            result="effect3_innerShadow"
          />
        </filter>
        <radialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(24 24) rotate(90) scale(4)"
        >
          <stop stopColor={colors.start} />
          <stop offset="1" stopColor={colors.end} />
        </radialGradient>
      </defs>
    </svg>
  );
}

export type { StatusIndicatorStatus };
