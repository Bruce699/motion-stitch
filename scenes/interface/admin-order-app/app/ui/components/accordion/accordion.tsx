import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import type { ComponentProps, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Icon } from '~/ui/components/icon/icon';

function Root({
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Root>) {
  return (
    <BaseAccordion.Root
      className={clsx('flex flex-col text-primary', className)}
      {...props}
    />
  );
}

function Item({
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Item>) {
  return (
    <BaseAccordion.Item
      className={clsx('border-b border-border', className)}
      {...props}
    />
  );
}

function Header(props: ComponentProps<typeof BaseAccordion.Header>) {
  return <BaseAccordion.Header {...props} />;
}

function Trigger({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Trigger> & {
  children?: ReactNode;
}) {
  return (
    <BaseAccordion.Trigger
      className={clsx(
        'group relative flex w-full items-center justify-between gap-3 bg-background py-2 pr-2 pl-3 text-left text-base font-medium hover:bg-gray-100 focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="">{children}</span>
      <span
        aria-hidden
        className="shrink-0 text-muted-foreground transition-transform ease-out group-data-[panel-open]:rotate-180"
      >
        <Icon name="ChevronDown" size={14} />
      </span>
    </BaseAccordion.Trigger>
  );
}

function Panel({
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Panel>) {
  return (
    <BaseAccordion.Panel
      className={clsx(
        'h-(--accordion-panel-height) overflow-hidden text-base text-secondary transition-[height] ease-out data-ending-style:h-0 data-starting-style:h-0',
        className,
      )}
      {...props}
    />
  );
}

export { Root, Item, Header, Trigger, Panel };
