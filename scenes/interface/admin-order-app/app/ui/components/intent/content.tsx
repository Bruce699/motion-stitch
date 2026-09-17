import React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';
import { IntentPortalContainer } from './portal-container';

export function Content({
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
        'inset-0',
        type === 'intent' ? 'intent-portal absolute' : 'fixed',
      )}
    >
      <BaseDialog.Backdrop className="absolute inset-0 bg-black/40 transition-opacity ease-out data-ending-style:opacity-0 data-ending-style:delay-75 data-starting-style:opacity-0" />

      <BaseDialog.Popup
        className={clsx(
          'absolute bottom-0 isolate h-[calc(100%-12px)] w-full origin-bottom rounded-3xl bg-background shadow-xl shadow-black/20 outline-none',
          'transition-[opacity,filter,translate,scale] delay-75 ease-out',
          'data-starting-style:translate-y-2 data-starting-style:opacity-0 data-starting-style:blur-[2px]',
          'data-ending-style:translate-y-2 data-ending-style:opacity-0 data-ending-style:blur-[2px] data-ending-style:delay-0',
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}
