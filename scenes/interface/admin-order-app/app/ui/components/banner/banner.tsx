import React from 'react';
import { clsx } from 'clsx';
import { Button } from '~/ui/components/button/button';

const variants = ['caution'] as const;

type BannerVariant = (typeof variants)[number];

const variantStyles: Record<BannerVariant, string> = {
  caution: 'bg-yellow-200 border-yellow-200 text-yellow-900',
};

function Banner({
  actionLabel,
  children,
  className,
  icon,
  onActionClick,
  variant = 'caution',
  ...props
}: React.ComponentProps<'div'> & {
  actionLabel?: string;
  icon?: React.ReactNode;
  onActionClick?: () => void;
  variant?: BannerVariant;
}) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-5 rounded-3xl border px-5 py-4 pr-3',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <span>{icon}</span>
        <p>{children}</p>
      </div>
      {actionLabel && (
        <Button onClick={onActionClick} variant="plain">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export { Banner };
