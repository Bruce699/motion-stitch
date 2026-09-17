import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import type { ComponentProps } from 'react';

function Root({
  className,
  ...props
}: ComponentProps<typeof BaseCollapsible.Root>) {
  return <BaseCollapsible.Root className={className} {...props} />;
}

export { Root };
