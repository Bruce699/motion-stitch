import React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';
import { IntentPortalContainer } from './portal-container';
export { IntentPortalContainer } from './portal-container';

function Trigger({
  children,
  ...props
}: Omit<React.ComponentProps<typeof BaseDialog.Trigger>, 'children'> & {
  children: React.ReactElement<unknown>;
}) {
  return <BaseDialog.Trigger render={children} {...props} />;
}

function Root(props: React.ComponentProps<typeof BaseDialog.Root>) {
  return <BaseDialog.Root {...props} />;
}

function Content({
  children,
  className,
  type = 'intent',
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & {
  type?: 'dialog' | 'intent';
}) {
  return (
    <BaseDialog.Portal
      container={type === 'intent' ? IntentPortalContainer.ref : undefined}
      className={clsx(
        'inset-0 overflow-hidden',
        type === 'intent' ? 'intent-portal absolute' : 'fixed',
      )}
    >
      <BaseDialog.Backdrop
        className={clsx(
          'absolute inset-0 bg-black/40 transition-opacity ease-out',
          'data-ending-style:opacity-0 data-ending-style:delay-100',
          'data-starting-style:opacity-0',
        )}
      />

      <BaseDialog.Popup
        className={clsx(
          'absolute top-3 bottom-0 isolate w-full rounded-3xl bg-background shadow-xl outline-none',
          'transition-[top] ease-out',
          'data-starting-style:top-full',
          'data-ending-style:top-full',
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

function Close({
  children,
  ...props
}: Omit<React.ComponentProps<typeof BaseDialog.Close>, 'children'> & {
  children: React.ReactElement<unknown>;
}) {
  return <BaseDialog.Close render={children} {...props} />;
}

export const Intent = Object.assign(Root, {
  Trigger,
  Content,
  Close,
});
