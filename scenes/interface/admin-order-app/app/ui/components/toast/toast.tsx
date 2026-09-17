import { Toast as BaseToast } from '@base-ui/react/toast';
import { clsx } from 'clsx';
import React from 'react';
import { buttonClass } from '~/ui/components/button/button-class';
import { Icon } from '~/ui/components/icon/icon';
import { IntentPortalContainer } from '~/ui/components/intent';

type ToastManager = ReturnType<typeof BaseToast.useToastManager>;
type ToastPayload = Parameters<ToastManager['add']>[0];
type ToastContentOptions = {
  actionLabel?: React.ReactNode;
  label: React.ReactNode;
  onActionClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const ToastContentContext = React.createContext<{
  contentRef: React.MutableRefObject<ToastPayload | null>;
} | null>(null);

function Root({
  children,
  timeout = 5000,
  viewport = true,
  ...props
}: React.ComponentProps<typeof BaseToast.Provider> & {
  viewport?: boolean | React.ReactElement<unknown>;
}) {
  const contentRef = React.useRef<ToastPayload | null>(null);
  const contextValue = React.useMemo(() => ({ contentRef }), []);

  return (
    <ToastContentContext.Provider value={contextValue}>
      <BaseToast.Provider timeout={timeout} {...props}>
        {children}
        {viewport === true ? <Viewport /> : viewport || null}
      </BaseToast.Provider>
    </ToastContentContext.Provider>
  );
}

function Trigger({
  children,
}: {
  children: React.ReactElement<{
    onClick?: React.MouseEventHandler<HTMLElement>;
  }>;
}) {
  const toastManager = BaseToast.useToastManager();
  const toastContext = useToastContentContext('Toast.Trigger');
  const childOnClick = children.props.onClick;

  return React.cloneElement(children, {
    onClick(event: React.MouseEvent<HTMLElement>) {
      childOnClick?.(event);
      if (event.defaultPrevented) return;

      toastManager.add(toastContext.contentRef.current ?? {});
    },
  });
}

function Content({
  actionLabel,
  label,
  onActionClick,
  ...props
}: ToastContentOptions) {
  const toastContext = useToastContentContext('Toast.Content');

  toastContext.contentRef.current = {
    ...props,
    description: label,
    actionProps: actionLabel
      ? {
          children: actionLabel,
          onClick: onActionClick,
        }
      : undefined,
  };

  return null;
}

function Viewport({
  children,
  className,
  portal = true,
  ...props
}: React.ComponentProps<typeof BaseToast.Viewport> & {
  portal?: boolean;
}) {
  const manager = BaseToast.useToastManager();
  const [hasPortalContainer, setHasPortalContainer] = React.useState(false);

  React.useLayoutEffect(() => {
    let frame: number | undefined;

    function syncPortalContainer() {
      if (IntentPortalContainer.ref.current) {
        setHasPortalContainer(true);
        return;
      }

      frame = window.requestAnimationFrame(syncPortalContainer);
    }

    syncPortalContainer();

    return () => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  const content =
    children ??
    manager.toasts.map((toast, toastIndex) => (
      <BaseToast.Root
        key={toast.id}
        className={clsx(
          '[--gap:--spacing(3)] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)+(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))] [--peek:--spacing(3)] [--scale:calc(max(0,1-(var(--toast-index)*0.08)))] [--shrink:calc(1-var(--scale))]',
          'dark pointer-events-auto absolute top-0 right-0 left-0 z-[calc(1000-var(--toast-index))] w-full origin-top overflow-hidden rounded-full text-primary',
          'h-(--height) transition-[opacity,filter,transform,height] delay-75 ease-out',
          toastIndex === 0
            ? 'bg-background shadow-2xl'
            : 'bg-gray-950/80 shadow-lg backdrop-blur-md',
          'transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))]',
          'after:pointer-events-auto after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[""]',
          'data-expanded:h-(--toast-height) data-expanded:transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
          'data-starting-style:transform-[translateY(calc(--spacing(8)*-1))_scale(0.96)] data-starting-style:opacity-0 data-starting-style:blur-[2px]',
          'data-ending-style:opacity-0 data-ending-style:blur-[2px] data-ending-style:delay-0 [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:transform-[translateY(calc(--spacing(8)*-1))_scale(0.96)]',
          'data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))] data-expanded:data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))] data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-expanded:data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-expanded:data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))] data-expanded:data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))]',
          'data-limited:opacity-0',
        )}
        swipeDirection="right"
        toast={toast}
      >
        <BaseToast.Content className="flex h-9.5 flex-center gap-2 overflow-hidden p-1 pl-3 transition-opacity ease-out data-behind:opacity-0 data-expanded:opacity-100">
          <span className="text-green-500">
            <Icon name="CircleCheck" size={18} />
          </span>
          <BaseToast.Description className="flex-1">
            {toast.description}
          </BaseToast.Description>
          {toast.actionProps?.children ? (
            <BaseToast.Close
              className={buttonClass('secondary')}
              onClick={toast.actionProps.onClick}
              type="button"
            >
              {toast.actionProps.children}
            </BaseToast.Close>
          ) : null}
        </BaseToast.Content>
      </BaseToast.Root>
    ));

  const viewport = (
    <BaseToast.Viewport
      className={clsx(
        'pointer-events-none relative h-(--toast-frontmost-height) w-80 max-w-full outline-none',
        className,
      )}
      {...props}
    >
      {content}
    </BaseToast.Viewport>
  );

  const layerClassName = clsx(
    'pointer-events-none inset-0 z-50 flex items-start justify-center p-2',
    'intent-portal absolute',
  );

  if (!portal) {
    return <div className={layerClassName}>{viewport}</div>;
  }

  if (!hasPortalContainer) {
    return null;
  }

  return (
    <BaseToast.Portal
      container={IntentPortalContainer.ref}
      className={layerClassName}
    >
      {viewport}
    </BaseToast.Portal>
  );
}

function useToastContentContext(componentName: string) {
  const context = React.use(ToastContentContext);

  if (!context) {
    throw new Error(`${componentName} must be used within <Toast>.`);
  }

  return context;
}

const Toast = Object.assign(Root, {
  Content,
  Trigger,
  createToastManager: BaseToast.createToastManager,
  useToastManager: BaseToast.useToastManager,
});

export { Toast };
export type { ToastManager };
