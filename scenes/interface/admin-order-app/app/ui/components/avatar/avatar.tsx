import type { ComponentProps } from 'react';
import { clsx } from 'clsx';
import { Icon, type IconName } from '../icon/icon';

type AvatarSize = 'sm' | 'md' | 'lg';

const avatarBaseClasses =
  'bg-gray-300 text-secondary relative flex items-center justify-center overflow-hidden';

const avatarSizes: Record<AvatarSize, string> = {
  sm: 'size-5',
  md: 'size-6',
  lg: 'size-8',
};

const avatarRadii: Record<AvatarSize, string> = {
  sm: 'rounded-sm',
  md: 'rounded-sm',
  lg: 'rounded-md',
};

const avatarFontSizes: Record<AvatarSize, string> = {
  sm: 'text-[9px]',
  md: 'text-xs',
  lg: 'text-md',
};

export function Avatar({
  className,
  iconName,
  initials,
  name,
  rounded = false,
  size = 'md',
  src,
  ...props
}: Omit<ComponentProps<'span'>, 'children'> & {
  iconName?: IconName;
  initials?: string;
  name?: string;
  rounded?: boolean;
  size?: AvatarSize;
  src?: string;
}) {
  return (
    <span
      aria-label={name}
      className={clsx(
        avatarBaseClasses,
        avatarSizes[size],
        rounded ? 'rounded-full' : avatarRadii[size],
        className,
      )}
      title={name}
      {...props}
    >
      {src ? (
        <img className="size-full object-cover" src={src} alt="" />
      ) : iconName ? (
        <Icon name={iconName} />
      ) : (
        <span className={clsx(avatarFontSizes[size])}>{initials}</span>
      )}
    </span>
  );
}

export type { AvatarSize };
