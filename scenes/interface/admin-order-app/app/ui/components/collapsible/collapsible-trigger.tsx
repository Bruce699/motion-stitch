import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import type { ComponentProps } from 'react';
import { clsx } from 'clsx';

function Trigger({
  className,
  ...props
}: ComponentProps<typeof BaseCollapsible.Trigger>) {
  return (
    <BaseCollapsible.Trigger
      className={clsx(
        'focus-visible:outline-2 focus-visible:outline-blue-600',
        className,
      )}
      {...props}
    />
  );
}

export { Trigger };
