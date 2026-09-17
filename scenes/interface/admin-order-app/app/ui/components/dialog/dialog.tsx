import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import React from 'react';
import { clsx } from 'clsx';
import { IntentPortalContainer } from '~/ui/components/intent';

const dialogPlacementClasses = {
  middle: 'items-center justify-center',
  top: 'items-start justify-center pt-48',
};

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
  placement,
  style,
  type = 'dialog',
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & {
  placement?: keyof typeof dialogPlacementClasses;
  type?: 'dialog' | 'intent';
}) {
  const resolvedPlacement = placement ?? (type === 'dialog' ? 'top' : 'middle');

  return (
    <BaseDialog.Portal
      container={type === 'intent' ? IntentPortalContainer.ref : undefined}
      className={clsx(
        'inset-0 flex',
        dialogPlacementClasses[resolvedPlacement],
        type === 'intent' ? 'absolute' : 'fixed',
      )}
    >
      <BaseDialog.Backdrop className="absolute inset-0 bg-black/40 transition-opacity ease-out data-ending-style:opacity-0 data-ending-style:delay-75 data-starting-style:opacity-0" />

      <BaseDialog.Popup
        className={clsx(
          'isolate rounded-3xl bg-background shadow-xl shadow-black/10 outline-none',
          'transition-[opacity,filter,translate,scale] delay-75 ease-out',
          'data-starting-style:translate-y-3 data-starting-style:scale-96 data-starting-style:opacity-0 data-starting-style:blur-[2px]',
          'data-ending-style:translate-y-3 data-ending-style:scale-96 data-ending-style:opacity-0 data-ending-style:blur-[2px] data-ending-style:delay-0',
          className,
        )}
        style={style}
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

export const Dialog = Object.assign(Root, {
  Trigger,
  Content,
  Close,
});
