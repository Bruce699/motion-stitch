import { Input as BaseInput } from '@base-ui/react/input';
import { AnimatePresence, m } from 'motion/react';
import {
  isValidElement,
  useCallback,
  useId,
  useRef,
  type ComponentProps,
  type Key,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { clsx } from 'clsx';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

type InputVariant = 'default' | 'borderless';

export type InputProps = Omit<
  ComponentProps<typeof BaseInput>,
  'prefix' | 'suffix'
> & {
  helper?: string;
  label?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  variant?: InputVariant;
};

const inputRootBaseClasses =
  'ease-out group/input flex items-stretch rounded-lg transition-[background-color,shadow] has-aria-[invalid]:border-red-500 has-aria-[invalid]:ring-3 has-aria-[invalid]:inset-shadow-[0_0_0_1px_--theme(--color-white),0_0_8px_1px_--alpha(var(--color-red-500)/15%)] has-aria-[invalid]:ring-red-500/10 dark:has-aria-[invalid]:inset-shadow-[0_0_8px_1px_--alpha(var(--color-red-500)/15%)] dark:has-aria-[invalid]:ring-red-500/15 has-disabled:border-foreground/20 has-disabled:bg-gray-100 has-disabled:opacity-50 has-disabled:shadow-none dark:has-disabled:border-white/15 dark:has-disabled:bg-white/2.5';

const inputRootVariants: Record<InputVariant, string> = {
  default:
    'bg-background shadow-input hover:bg-gray-50 has-focus:bg-background has-focus:shadow-input-focus has-focus:ring-3 has-focus:ring-blue-500/10 has-focus:outline-hidden dark:bg-white/5 dark:has-focus:ring-blue-500/15',
  borderless:
    'bg-transparent shadow-none rounded-none hover:bg-transparent has-focus:bg-transparent has-focus:shadow-none has-focus:ring-0 has-focus:outline-hidden dark:bg-transparent dark:has-focus:ring-0',
};

function inputRootClass(variant: InputVariant = 'default') {
  return `${inputRootBaseClasses} ${inputRootVariants[variant]}`;
}

export function Input({
  className,
  helper,
  id,
  label,
  prefix,
  ref,
  suffix,
  variant = 'default',
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const setInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;

      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    },
    [ref],
  );

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleAddonMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    focusInput();
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-base font-medium">
          {label}
        </label>
      )}
      <div
        data-slot="input"
        className={clsx(inputRootClass(variant), className)}
      >
        <InputAddon
          slotKey={getInputAddonKey(prefix, 'prefix')}
          onMouseDown={handleAddonMouseDown}
        >
          {prefix}
        </InputAddon>
        <BaseInput
          id={inputId}
          ref={setInputRef}
          data-slot="input-control"
          className={clsx(
            'h-control flex-1 px-2.5 text-base text-foreground placeholder:text-muted-foreground',
            'rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0',
            'focus:outline-hidden',
            'disabled:cursor-not-allowed',
          )}
          {...props}
        />
        <InputAddon
          align="inline-end"
          slotKey={getInputAddonKey(suffix, 'suffix')}
          onMouseDown={handleAddonMouseDown}
        >
          {suffix}
        </InputAddon>
      </div>
      {helper ? <p className="mt-0.5 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function InputAddon({
  align = 'inline-start',
  children,
  onMouseDown,
  slotKey,
}: {
  align?: 'inline-start' | 'inline-end';
  children?: ReactNode;
  onMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
  slotKey: Key;
}) {
  return (
    <AnimatePresence initial={false}>
      {children && (
        <m.div
          key={align}
          className="grid items-center overflow-hidden"
          initial={{
            opacity: 0,
            gridTemplateColumns: '0fr',
            filter: 'blur(2px)',
          }}
          animate={{
            opacity: 1,
            gridTemplateColumns: '1fr',
            filter: 'blur(0px)',
          }}
          exit={{
            opacity: 0,
            gridTemplateColumns: '0fr',
            filter: 'blur(2px)',
          }}
          transition={{
            duration: motionDurations.base,
            ease: motionEasings.easeOut,
          }}
        >
          <div className="relative overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <m.div
                key={slotKey}
                initial={{ opacity: 0, filter: 'blur(2px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(2px)' }}
                transition={{
                  duration: motionDurations.base,
                  ease: motionEasings.easeOut,
                }}
              >
                <Addon align={align} onMouseDown={onMouseDown}>
                  {children}
                </Addon>
              </m.div>
            </AnimatePresence>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

function Addon({
  align = 'inline-start',
  className,
  ...props
}: ComponentProps<'div'> & {
  align?: 'inline-start' | 'inline-end';
}) {
  return (
    <div
      data-slot="input-addon"
      data-align={align}
      className={clsx(
        'flex shrink-0 cursor-text items-center text-base text-muted-foreground',
        align === 'inline-start' ? 'pl-2' : 'pr-2',
        className,
      )}
      {...props}
    />
  );
}

function getInputAddonKey(node: ReactNode, fallback: Key): Key {
  if (typeof node === 'string' || typeof node === 'number') return node;

  if (isValidElement<{ name?: unknown }>(node)) {
    if (node.key != null) return node.key;
    if (typeof node.props.name === 'string') return node.props.name;
  }

  return fallback;
}
