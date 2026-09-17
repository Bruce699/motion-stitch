import clsx from 'clsx';
import React from 'react';

export function SidekickFieldWrapper({
  children,
  hasMessages,
}: {
  children: React.ReactNode;
  hasMessages: boolean;
}) {
  return (
    <div
      data-tilt-id="composer"
      className={clsx(
        'transition-rounded relative bg-background ease-out',
        'before:shadow-button-elevated before:pointer-events-none before:absolute before:inset-0 before:rounded-inherit before:opacity-0 before:transition-opacity before:ease-out',
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-inherit after:opacity-0 after:shadow-3xl after:transition-opacity after:ease-out',
        hasMessages ? 'after:opacity-100' : 'before:opacity-100',
        hasMessages ? 'rounded-5xl' : 'rounded-full',
      )}
    >
      {children}
    </div>
  );
}
