import type * as React from 'react';
import { Icon } from '~/ui/components/icon/icon';
import { Link } from '~/ui/components/link/link';
import {
  getResourcePreviewTriggerProps,
  type ResourcePreviewConfig,
} from '~/ui/components/resource-preview/resource-preview';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { createContext, use, useMemo, useState } from 'react';

type TableCellType = 'checkbox' | 'picker';

const TableContext = createContext<{
  bleed: boolean;
  dense: boolean;
  grid: boolean;
  striped: boolean;
  stickyHeader: boolean;
}>({
  bleed: false,
  dense: false,
  grid: false,
  striped: false,
  stickyHeader: false,
});

export function Root({
  bleed = false,
  dense = false,
  grid = false,
  striped = false,
  stickyHeader = true,
  className: cls,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  bleed?: boolean;
  dense?: boolean;
  grid?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
  children?: ReactNode;
}) {
  const contextValue = useMemo(
    () => ({ bleed, dense, grid, striped, stickyHeader }),
    [bleed, dense, grid, striped, stickyHeader],
  );

  return (
    <TableContext.Provider value={contextValue}>
      <div
        {...props}
        className={clsx(
          'w-full overflow-x-auto',
          bleed ? 'px-3' : 'px-px',
          cls,
        )}
      >
        <table className="w-max min-w-full caption-bottom border-separate border-spacing-0 text-left">
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export function Head({
  className: cls,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  children?: ReactNode;
}) {
  const { stickyHeader } = use(TableContext);

  return (
    <thead
      {...props}
      className={clsx(
        'relative top-0 z-1',
        stickyHeader && 'sticky top-0 z-10',
        cls,
      )}
    >
      {children}
    </thead>
  );
}

export function Body({
  className: cls,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  children?: ReactNode;
}) {
  return (
    <tbody className={clsx('before:block before:h-0.5', cls)} {...props}>
      {children}
    </tbody>
  );
}

const TableRowContext = createContext<{
  href?: string;
  target?: string;
  title?: string;
}>({
  href: undefined,
  target: undefined,
  title: undefined,
});

export function Row({
  href,
  muted = false,
  target,
  title,
  className: cls,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & {
  href?: string;
  muted?: boolean;
  target?: string;
  title?: string;
  children?: ReactNode;
}) {
  const { striped } = use(TableContext);
  const contextValue = useMemo(
    () => ({ href, target, title }),
    [href, target, title],
  );

  return (
    <TableRowContext.Provider value={contextValue}>
      <tr
        {...props}
        className={clsx(
          'group group/row transition-colors hover:*:border-t-transparent [&+tr>*]:border-t [&+tr>*]:border-gray-100 hover:[&+tr>*]:border-t-transparent',
          striped && 'even:bg-zinc-950/2.5 dark:even:bg-white/2.5',
          muted && '[&>td]:text-secondary',
          href && striped && 'hover:bg-zinc-950/5 dark:hover:bg-white/5',
          href && !striped && 'hover:bg-zinc-950/2.5 dark:hover:bg-white/2.5',
          cls,
        )}
      >
        {children}
      </tr>
    </TableRowContext.Provider>
  );
}

export function Header({
  className: cls,
  children,
  onClick,
  type,
  ...props
}: React.HTMLAttributes<HTMLTableCellElement> & {
  type?: TableCellType;
  children?: ReactNode;
}) {
  const { grid } = use(TableContext);

  function activateHeaderCheckbox(
    event: React.MouseEvent<HTMLTableCellElement>,
  ) {
    onClick?.(event);

    if (type !== 'checkbox' || event.defaultPrevented) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[role=checkbox]')) return;

    event.currentTarget.querySelector<HTMLElement>('[role=checkbox]')?.click();
  }

  return (
    <th
      {...props}
      onClick={activateHeaderCheckbox}
      className={clsx(
        'relative h-control justify-center bg-gray-200 pt-px text-sm font-medium whitespace-nowrap text-secondary transition-colors first:rounded-l-md last:rounded-r-md dark:bg-gray-950',
        type === 'checkbox'
          ? 'flex w-8 max-w-8 min-w-8 cursor-pointer items-center px-0 text-center **:[[role=checkbox]]:pointer-events-none'
          : 'px-2 text-left first:pl-3 last:pr-3',
        type === 'picker' && 'pr-7 last:pr-7',
        grid &&
          'border-l-zinc-950/5 border-l first:border-l-0 dark:border-l-white/5',
        cls,
      )}
    >
      {children}
    </th>
  );
}

export function Cell({
  className: cls,
  children,
  link = false,
  onBlur,
  onClick,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  preview,
  tabIndex,
  type,
  ...props
}: React.HTMLAttributes<HTMLTableCellElement> & {
  type?: TableCellType;
  link?: boolean;
  preview?: ResourcePreviewConfig;
  children?: ReactNode;
}) {
  const { dense, grid } = use(TableContext);
  const { href, target, title } = use(TableRowContext);
  const [cellRef, setCellRef] = useState<HTMLElement | null>(null);
  const hasRowLink =
    link && Boolean(href) && type !== 'checkbox' && type !== 'picker';
  const hasPreview = Boolean(preview);
  const isFirstRowLinkCell =
    cellRef?.parentElement?.querySelector('[data-row-link-cell]') === cellRef;
  const previewTriggerProps = preview
    ? getResourcePreviewTriggerProps(preview)
    : undefined;

  function activateCellCheckbox(event: React.MouseEvent<HTMLTableCellElement>) {
    onClick?.(event);

    if (type !== 'checkbox' || event.defaultPrevented) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[role=checkbox]')) return;

    event.currentTarget.querySelector<HTMLElement>('[role=checkbox]')?.click();
  }

  const cellContent = children;

  return (
    <td
      ref={hasRowLink ? setCellRef : undefined}
      data-row-link-cell={hasRowLink ? '' : undefined}
      {...props}
      tabIndex={previewTriggerProps ? (tabIndex ?? 0) : tabIndex}
      onClick={activateCellCheckbox}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) previewTriggerProps?.onPointerEnter(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) previewTriggerProps?.onPointerMove(event);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented) previewTriggerProps?.onPointerLeave();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) previewTriggerProps?.onFocus(event);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented) previewTriggerProps?.onBlur();
      }}
      className={clsx(
        'group/cell py-2 align-middle whitespace-nowrap transition-colors [--hover-color:--alpha(var(--color-black)/2%)] *:align-middle group-hover/row:first:rounded-l-md group-hover/row:last:rounded-r-md dark:[--hover-color:--alpha(var(--color-white)/4%)]',
        'group-hover/row:bg-(--hover-color)',
        '[&_a]:no-underline [&:has([role=checkbox])]:text-center **:[[role=checkbox]]:mx-auto',

        grid &&
          'border-l-zinc-950/5 border-l first:border-l-0 dark:border-l-white/5',
        dense ? 'py-1.5' : 'py-2',
        type === 'checkbox'
          ? 'w-8 max-w-8 min-w-8 cursor-pointer px-0 align-middle **:[[role=checkbox]]:pointer-events-none'
          : 'px-2',
        hasRowLink && 'cursor-pointer',
        hasPreview && 'cursor-pointer',
        (hasRowLink || hasPreview) && 'relative',
        cls,
      )}
    >
      {hasRowLink && href && (
        <Link
          data-row-link
          to={href}
          target={target}
          aria-label={title}
          tabIndex={isFirstRowLinkCell ? 0 : -1}
          className="absolute inset-0 focus:outline-hidden"
        />
      )}
      {type === 'picker' ? (
        <span className="inline-flex items-center gap-1.5">
          {cellContent}
          <span
            aria-hidden
            className="inline-flex text-muted-foreground opacity-0 transition-opacity group-hover/cell:opacity-100"
          >
            <Icon name="ChevronExpandY" size={14} />
          </span>
        </span>
      ) : (
        cellContent
      )}
    </td>
  );
}
