import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import * as Table from '../table/table';

export type ColumnDef<T> = {
  header: string;
  render: (item: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
};

export type DataTableProps<T> = {
  items: T[];
  columns: ColumnDef<T>[];
  emptyState?: string | { title: string; description?: string };
  rowKey?: (item: T, index: number) => string | number;
  stickyHeader?: boolean;
  className?: string;
};

const alignClass: Record<NonNullable<ColumnDef<unknown>['align']>, string> = {
  left: '',
  right: 'text-right',
  center: 'text-center',
};

export function DataTable<T>({
  items,
  columns,
  emptyState,
  rowKey,
  stickyHeader,
  className: cls,
}: DataTableProps<T>) {
  if (items.length === 0 && emptyState) {
    const empty =
      typeof emptyState === 'string' ? { title: emptyState } : emptyState;
    return (
      <div className={clsx('w-full', cls)}>
        <p className="py-10 text-center text-sm text-muted-foreground">
          {empty.title}
          {empty.description && (
            <>
              <br />
              <span className="text-xs">{empty.description}</span>
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className={clsx('w-full', cls)}>
      <Table.Root stickyHeader={stickyHeader}>
        <Table.Head>
          <Table.Row>
            {columns.map((col) => (
              <Table.Header
                key={col.header}
                className={alignClass[col.align ?? 'left']}
              >
                {col.header}
              </Table.Header>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {items.map((item, i) => (
            <Table.Row key={rowKey ? rowKey(item, i) : i}>
              {columns.map((col) => (
                <Table.Cell
                  key={col.header}
                  className={clsx(
                    alignClass[col.align ?? 'left'],
                    col.align === 'right' ? 'tabular-nums' : undefined,
                  )}
                >
                  {col.render(item, i)}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  );
}
