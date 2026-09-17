import type * as React from 'react';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icon/icon';

const variants = [
  'default',
  'success',
  'info',
  'caution',
  'warning',
  'ai',
] as const;

type BadgeVariant = (typeof variants)[number];

const badgeBase =
  'inline-flex items-center justify-center rounded px-1.5 py-0.25 text-sm font-medium whitespace-nowrap shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-200 text-secondary',
  success: 'bg-green-300 text-green-900',
  info: 'bg-blue-300 text-blue-900',
  caution: 'bg-yellow-300 text-yellow-900',
  warning: 'bg-red-200 text-red-900',
  ai: 'bg-purple-50 text-purple-700',
};

export function Badge({
  variant = 'default',
  className: cls,
  children,
  iconName,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  iconName?: IconName;
  children?: ReactNode;
}) {
  return (
    <span
      className={clsx(
        badgeBase,
        iconName && 'gap-1',
        variantStyles[variant],
        cls,
      )}
      {...props}
    >
      {iconName ? <Icon name={iconName} size={12} /> : null}
      {children}
    </span>
  );
}
