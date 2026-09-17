import { clsx } from 'clsx';
import React from 'react';

const progressiveBlurLayerClasses = [
  'backdrop-blur-[0.5px]  [mask:linear-gradient(var(--mask-direction),rgba(0,0,0,0)_0%,rgba(0,0,0,1)_20%,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_60%)]',
  'backdrop-blur-[1px]  [mask:linear-gradient(var(--mask-direction),rgba(0,0,0,0)_20%,rgba(0,0,0,1)_40%,rgba(0,0,0,1)_60%,rgba(0,0,0,0)_80%)]',
  'backdrop-blur-[2px]  [mask:linear-gradient(var(--mask-direction),rgba(0,0,0,0)_40%,rgba(0,0,0,0)_60%,rgba(0,0,0,1)_80%,rgba(0,0,0,1)_100%)]',
];

const progressiveBlurSideClasses = {
  top: 'inset-x-0 top-0 [--mask-direction:to_top] [--scrim-direction:to_bottom]',
  bottom:
    'inset-x-0 bottom-0 [--mask-direction:to_bottom] [--scrim-direction:to_top]',
  left: 'inset-y-0 left-0 [--mask-direction:to_left] [--scrim-direction:to_right]',
  right:
    'inset-y-0 right-0 [--mask-direction:to_right] [--scrim-direction:to_left]',
};

export function ProgressiveBlur({
  side = 'top',
  className,
  style,
}: {
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}) {
  const itemClassname = clsx(
    'absolute rounded-inherit',
    side === 'top' || side === 'bottom'
      ? 'inset-y-0 right-3 left-3'
      : 'inset-x-0 top-5.5 bottom-5.5',
  );

  return (
    <div
      className={clsx(
        'pointer-events-none absolute transition-opacity ease-out',
        className,
        progressiveBlurSideClasses[side],
      )}
      style={style}
    >
      {progressiveBlurLayerClasses.map((layerClassName) => (
        <div
          key={layerClassName}
          className={clsx(itemClassname, layerClassName)}
        />
      ))}
      <div className="absolute inset-0 rounded-inherit [background:linear-gradient(var(--scrim-direction),rgba(255,255,255,0.9)_30%,transparent)]" />
    </div>
  );
}
