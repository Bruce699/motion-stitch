import React from 'react';
import clsx from 'clsx';

function SystemAlertStripes({
  className,
  ...props
}: React.ComponentProps<'svg'>) {
  const patternId = React.useId().replace(/:/g, '');

  return (
    <svg
      aria-hidden
      className={clsx(
        'pointer-events-none absolute inset-0 size-full',
        className,
      )}
      preserveAspectRatio="none"
      {...props}
    >
      <defs>
        <pattern
          id={patternId}
          width="17"
          height="17"
          patternTransform="rotate(-45)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="8" height="17" fill="currentColor" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

export { SystemAlertStripes };
