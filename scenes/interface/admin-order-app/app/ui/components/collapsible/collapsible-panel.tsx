import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import type { ComponentProps, ReactNode } from 'react';
import { clsx } from 'clsx';

type PanelProps = ComponentProps<typeof BaseCollapsible.Panel> & {
  contentClassName?: string;
  children: ReactNode;
};

function Panel({
  children,
  className,
  contentClassName,
  ...props
}: PanelProps) {
  return (
    <BaseCollapsible.Panel
      className={clsx(
        'h-(--collapsible-panel-height) overflow-hidden transition-[height] ease-out',
        'data-ending-style:h-0 data-ending-style:overflow-hidden data-open:overflow-visible data-starting-style:h-0 data-starting-style:overflow-hidden',
        '[&[data-open]>[data-collapsible-content]]:translate-y-0 [&[data-open]>[data-collapsible-content]]:opacity-100',
        '[&[data-closed]>[data-collapsible-content]]:-translate-y-1 [&[data-closed]>[data-collapsible-content]]:opacity-0',
        '[&[data-starting-style]>[data-collapsible-content]]:-translate-y-1 [&[data-starting-style]>[data-collapsible-content]]:opacity-0',
        '[&[data-ending-style]>[data-collapsible-content]]:-translate-y-1 [&[data-ending-style]>[data-collapsible-content]]:opacity-0',
        className,
      )}
      {...props}
    >
      <div
        data-collapsible-content
        className={clsx(
          'origin-top transition-[opacity,translate] ease-out',
          '-translate-y-1',
          contentClassName,
        )}
      >
        {children}
      </div>
    </BaseCollapsible.Panel>
  );
}

export { Panel };
