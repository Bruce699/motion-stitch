import { iconManifest, type IconName } from '~/icons/icon-manifest';
import type { NucleoIconComponent } from '~/icons/icon-manifest';
import type { IconProps as NucleoIconProps } from 'nucleo-ui-outline-18';

export type { IconName } from '~/icons/icon-manifest';
export type IconSize = 10 | 12 | 14 | 16 | 18 | 20 | 24;

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.5,
  ...props
}: Omit<NucleoIconProps, 'className' | 'size' | 'strokeWidth'> & {
  name: IconName;
  size?: IconSize;
  strokeWidth?: 1.5 | 1.75 | 2 | 2.5;
}) {
  const IconComponent: NucleoIconComponent = iconManifest[name];

  return (
    <IconComponent
      className="shrink-0"
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
