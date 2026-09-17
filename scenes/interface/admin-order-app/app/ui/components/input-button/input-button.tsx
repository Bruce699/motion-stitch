import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type Key,
  type MouseEvent,
  type Ref,
  type ReactNode,
} from 'react';
import { AnimatePresence, m, type HTMLMotionProps } from 'motion/react';
import * as Checkbox from '~/ui/components/checkbox/checkbox';
import { Icon } from '~/ui/components/icon/icon';
import { Switch } from '~/ui/components/switch/switch';
import { clsx } from 'clsx';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

type InputButtonBaseProps = {
  icon?: ReactNode;
  label: string;
};

type InputButtonValueProps = InputButtonBaseProps & {
  value?: string;
};

type InputButtonRootEvent =
  | MouseEvent<HTMLButtonElement | HTMLDivElement>
  | KeyboardEvent<HTMLButtonElement | HTMLDivElement>;

type InputButtonRootProps = Omit<
  HTMLMotionProps<'button'>,
  | 'children'
  | 'disabled'
  | 'layout'
  | 'onClick'
  | 'onKeyDown'
  | 'ref'
  | 'transition'
  | 'value'
> & {
  children: ReactNode;
  disabled?: boolean;
  element?: 'button' | 'div';
  focusOnMount?: boolean;
  interactive?: boolean;
  onActivate?: (event: InputButtonRootEvent) => void;
  onClick?: (event: InputButtonRootEvent) => void;
  onKeyDown?: (event: InputButtonRootEvent) => void;
  ref?: Ref<HTMLButtonElement | HTMLDivElement>;
  squared?: boolean;
  surface?: 'button' | 'input';
};

const inputButtonRootClasses =
  'group relative isolate inline-flex origin-left shrink-0 items-center justify-start overflow-visible leading-none font-medium whitespace-nowrap no-underline select-none focus:outline-none cursor-pointer';

const inputButtonSizeClasses = 'gap-2 h-7.5 px-2.5 text-base has-[>svg]:px-2';

const inputButtonMotionTransition = {
  duration: motionDurations.fast,
  ease: motionEasings.easeOut,
};

const inputButtonSurfaceClasses: Record<
  NonNullable<InputButtonRootProps['surface']>,
  string
> = {
  button:
    'shadow-none bg-gray-200 hover:bg-gray-300 dark:bg-gray-950 dark:inset-shadow-[0_0_0_1px] dark:inset-shadow-white/2',
  input: 'shadow-input bg-white hover:bg-white',
};

const inputButtonTrailingSlotClasses =
  'ease-out shrink transition-[width,opacity,transform,margin]';

const inputButtonTrailingMaskClasses =
  '[overflow:clip] [overflow-clip-margin:8px]';

const inputButtonInputMaxSize = 16;
const inputButtonEditSlotWidth = 64;
const inputButtonInlineValueMinEditWidth = 80;
const inputButtonInlineValueHorizontalPadding = 16;
const inputButtonInlineValueEditWidthOffset = 48;

function InputButtonRoot({
  children,
  className,
  disabled = false,
  element = 'div',
  focusOnMount = false,
  interactive = true,
  onActivate,
  onClick,
  onKeyDown,
  ref,
  role,
  squared = false,
  surface = 'button',
  tabIndex,
  ...props
}: InputButtonRootProps) {
  const setRootRef = useCallback(
    (element: HTMLButtonElement | HTMLDivElement | null) => {
      if (focusOnMount) element?.focus();
      setRef(ref, element);
    },
    [focusOnMount, ref],
  );

  const activateInputButtonFromPointer = (
    event: MouseEvent<HTMLButtonElement | HTMLDivElement>,
  ) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (!interactive) return;

    onClick?.(event);
    if (!event.defaultPrevented) onActivate?.(event);
  };

  const activateInputButtonFromKeyboard = (
    event: KeyboardEvent<HTMLButtonElement | HTMLDivElement>,
  ) => {
    onKeyDown?.(event);
    if (!interactive || disabled || event.defaultPrevented) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate?.(event);
    }
  };

  const rootProps = {
    ...props,
    ref: setRootRef,
    'data-slot': 'input-button-root',
    className: clsx(
      inputButtonRootClasses,
      inputButtonSizeClasses,
      inputButtonSurfaceClasses[surface],
      squared
        ? 'rounded-md [--input-button-focus-radius:var(--radius-md)]'
        : 'rounded-full [--input-button-focus-radius:9999px]',
      surface === 'input' && 'pointer-events-none',
      disabled && 'pointer-events-none opacity-50',
      className,
    ),
    onClick: activateInputButtonFromPointer,
    onKeyDown: activateInputButtonFromKeyboard,
  };

  if (element === 'button') {
    return (
      <m.button
        {...rootProps}
        type="button"
        disabled={disabled}
        role={role}
        tabIndex={tabIndex}
      >
        {children}
      </m.button>
    );
  }

  return (
    <m.div
      {...(rootProps as HTMLMotionProps<'div'>)}
      role={interactive ? (role ?? 'button') : role}
      tabIndex={interactive ? (disabled ? -1 : (tabIndex ?? 0)) : tabIndex}
      aria-disabled={disabled || undefined}
    >
      {children}
    </m.div>
  );
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

type InputButtonTextProps = Omit<
  InputButtonRootProps,
  | 'children'
  | 'interactive'
  | 'onActivate'
  | 'onChange'
  | 'prefix'
  | 'surface'
  | 'value'
> &
  Omit<InputButtonBaseProps, 'value'> & {
    editOnMount?: boolean;
    placeholder?: string;
    prefix?: ReactNode;
    suffix?: ReactNode;
    showPill?: boolean;
    value: string;
    onRemove?: () => void;
    onValueChange: (value: string) => void;
  };

function InputButtonText(props: InputButtonTextProps) {
  return props.showPill === false ? (
    <InputButtonInlineText {...props} />
  ) : (
    <InputButtonPillText {...props} />
  );
}

type TextEditState = {
  isEditing: boolean;
  draftValue: string;
};

type TextEditAction =
  | { type: 'start'; value: string }
  | { type: 'draft'; value: string }
  | { type: 'commit' }
  | { type: 'cancel'; value?: string };

function textEditReducer(
  state: TextEditState,
  action: TextEditAction,
): TextEditState {
  switch (action.type) {
    case 'start':
      return { isEditing: true, draftValue: action.value };
    case 'draft':
      return { ...state, draftValue: action.value };
    case 'commit':
      return { ...state, isEditing: false };
    case 'cancel':
      return {
        isEditing: false,
        draftValue: action.value ?? state.draftValue,
      };
  }
}

function getInitialTextEditState({
  editOnMount = false,
  value,
}: Pick<InputButtonTextProps, 'editOnMount' | 'value'>): TextEditState {
  return { isEditing: editOnMount, draftValue: value };
}

export function InputButtonPillText({
  className,
  editOnMount = false,
  icon,
  label,
  onClick,
  onRemove,
  onValueChange,
  placeholder,
  prefix,
  disabled,
  showPill: _showPill = true,
  suffix,
  value,
  ...props
}: InputButtonTextProps) {
  const shouldCommitRef = useRef(true);
  const trailingContentRef = useRef<HTMLSpanElement | null>(null);
  const [{ draftValue, isEditing }, dispatch] = useReducer(
    textEditReducer,
    { editOnMount, value },
    getInitialTextEditState,
  );
  const [trailingWidth, setTrailingWidth] = useState<number | undefined>();
  const hasValue = Boolean(value);
  const displayValue = hasValue
    ? `${prefix ?? ''}${value}${suffix ?? ''}`
    : undefined;
  const visibleLabel = label;
  const trailingSlot = isEditing ? 'input' : hasValue ? 'value' : 'hidden';

  useLayoutEffect(() => {
    if (trailingSlot === 'hidden') {
      setTrailingWidth(0);
      return;
    }

    if (trailingSlot === 'input') {
      setTrailingWidth(inputButtonEditSlotWidth);
      return;
    }

    const nextWidth = trailingContentRef.current?.offsetWidth;
    if (nextWidth !== undefined) setTrailingWidth(nextWidth);
  }, [displayValue, trailingSlot]);

  const focusEditingInput = useCallback((element: HTMLInputElement | null) => {
    element?.focus();
  }, []);

  const startEditing = () => {
    shouldCommitRef.current = true;
    dispatch({ type: 'start', value });
  };

  const commit = () => {
    onValueChange(draftValue);
    dispatch({ type: 'commit' });
  };

  const commitTextOnBlur = () => {
    if (shouldCommitRef.current) {
      commit();
    } else {
      shouldCommitRef.current = true;
      dispatch({ type: 'commit' });
    }
  };

  const editTextFromButton = (event: InputButtonRootEvent) => {
    if (disabled) return;

    if (event.type === 'click') onClick?.(event as MouseEvent<HTMLDivElement>);
    if (!event.defaultPrevented) startEditing();
  };

  const commitOrCancelFromKeyboard = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      commit();
    } else if (event.key === 'Escape') {
      shouldCommitRef.current = false;
      dispatch({ type: 'cancel' });
    }
  };

  return (
    <InputButtonRoot
      className={className}
      disabled={disabled}
      interactive={!isEditing}
      onActivate={editTextFromButton}
      surface={isEditing ? 'input' : 'button'}
      {...props}
    >
      <InputButtonIcon>{icon}</InputButtonIcon>
      <InputButtonLabel
        muted={isEditing || !hasValue}
        pointerEvents={isEditing ? false : undefined}
      >
        {visibleLabel}
      </InputButtonLabel>
      <span
        aria-hidden={trailingSlot === 'hidden'}
        className={clsx(
          inputButtonTrailingSlotClasses,
          trailingSlot === 'hidden'
            ? '-ml-2 scale-75 opacity-0'
            : 'scale-100 opacity-100',
          trailingSlot === 'value' && '-mr-1.5 origin-center',
        )}
        style={{
          width: trailingSlot === 'hidden' ? 0 : trailingWidth,
        }}
      >
        <span className={inputButtonTrailingMaskClasses}>
          <AnimatePresence initial={false} mode="popLayout">
            {isEditing ? (
              <m.span
                key="input"
                className="pointer-events-auto inline-flex w-16 max-w-full items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={inputButtonMotionTransition}
              >
                <InputButtonInput
                  inputRef={focusEditingInput}
                  aria-label={placeholder ?? label}
                  placeholder={placeholder ?? label}
                  prefix={prefix}
                  suffix={suffix}
                  value={draftValue}
                  onBlur={commitTextOnBlur}
                  onChange={(event) =>
                    dispatch({
                      type: 'draft',
                      value: event.currentTarget.value,
                    })
                  }
                  onKeyDown={commitOrCancelFromKeyboard}
                />
                {onRemove ? (
                  <InputButtonRemoveButton
                    aria-label={`Remove ${label}`}
                    onRemove={onRemove}
                  />
                ) : null}
              </m.span>
            ) : trailingSlot === 'value' ? (
              <m.span
                key="value"
                ref={trailingContentRef}
                className="inline-flex max-w-16"
                initial={{ opacity: 0, transform: 'scale(0.75)' }}
                animate={{ opacity: 1, transform: 'scale(1)' }}
                exit={{ opacity: 0, transform: 'scale(0.75)' }}
                transition={inputButtonMotionTransition}
              >
                <InputButtonValue>{displayValue}</InputButtonValue>
              </m.span>
            ) : null}
          </AnimatePresence>
        </span>
      </span>
    </InputButtonRoot>
  );
}

export function InputButtonInlineText({
  className,
  editOnMount = false,
  label,
  onRemove,
  onValueChange,
  placeholder,
  prefix,
  suffix,
  value,
  ...props
}: InputButtonTextProps) {
  const shouldCommitRef = useRef(true);
  const inlineRootRef = useRef<HTMLSpanElement | null>(null);
  const inlineValueRef = useRef<HTMLSpanElement | null>(null);
  const [{ draftValue, isEditing }, dispatch] = useReducer(
    textEditReducer,
    { editOnMount, value },
    getInitialTextEditState,
  );
  const [inlineRestingWidth, setInlineRestingWidth] = useState<
    number | undefined
  >();
  const hasValue = Boolean(value);
  const fallbackLabel = placeholder ?? label;
  const visibleLabel = hasValue
    ? `${prefix ?? ''}${value}${suffix ?? ''}`
    : fallbackLabel;
  const inlineEditWidth = Math.max(
    (inlineRestingWidth ?? 0) + inputButtonInlineValueEditWidthOffset,
    inputButtonInlineValueMinEditWidth,
  );
  const inlineRestingLabel = hasValue ? (
    <>
      <InputButtonInputAddon>{prefix}</InputButtonInputAddon>
      <span className="truncate">{value}</span>
      <InputButtonInputAddon>{suffix}</InputButtonInputAddon>
    </>
  ) : (
    fallbackLabel
  );

  const startEditing = () => {
    shouldCommitRef.current = true;
    dispatch({ type: 'start', value });
  };

  const commit = () => {
    onValueChange(draftValue);
    dispatch({ type: 'commit' });
  };
  const commitEffectEvent = useEffectEvent(commit);

  const cancel = () => {
    shouldCommitRef.current = false;
    dispatch({ type: 'cancel', value });
  };

  const focusInput = useCallback((element: HTMLInputElement | null) => {
    element?.focus();
  }, []);

  useEffect(() => {
    if (!isEditing) return;

    const commitOnOutsidePointerDown = (event: PointerEvent) => {
      const root = inlineRootRef.current;
      if (!root || root.contains(event.target as Node)) return;

      commitEffectEvent();
    };

    document.addEventListener('pointerdown', commitOnOutsidePointerDown);

    return () => {
      document.removeEventListener('pointerdown', commitOnOutsidePointerDown);
    };
  }, [isEditing]);

  useLayoutEffect(() => {
    if (isEditing) return;

    const nextWidth = inlineValueRef.current
      ? inlineValueRef.current.offsetWidth +
        inputButtonInlineValueHorizontalPadding
      : undefined;
    if (nextWidth !== undefined) setInlineRestingWidth(nextWidth);
  }, [isEditing, visibleLabel]);

  return (
    <span
      ref={inlineRootRef}
      role={isEditing ? undefined : 'button'}
      tabIndex={isEditing ? undefined : 0}
      className={clsx(
        'relative inline-flex h-7.5 shrink-0 items-center gap-1 overflow-visible px-2 text-base leading-none font-medium whitespace-nowrap transition-[width,background-color,box-shadow] ease-out focus:outline-none',
        props.squared
          ? 'rounded-md [--input-button-focus-radius:var(--radius-md)]'
          : 'rounded-full [--input-button-focus-radius:9999px]',
        isEditing
          ? 'bg-white shadow-input'
          : 'cursor-pointer bg-gray-200 hover:bg-gray-300',
        className,
      )}
      style={{ width: isEditing ? inlineEditWidth : undefined }}
      onClick={isEditing ? undefined : startEditing}
      onKeyDown={(event) => {
        if (isEditing) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        startEditing();
      }}
    >
      {isEditing ? (
        <>
          <InputButtonInput
            inputRef={focusInput}
            aria-label={fallbackLabel}
            prefix={prefix}
            suffix={suffix}
            value={draftValue}
            placeholder={fallbackLabel}
            onBlur={() => {
              if (shouldCommitRef.current) {
                commit();
              } else {
                shouldCommitRef.current = true;
                dispatch({ type: 'commit' });
              }
            }}
            onChange={(event) =>
              dispatch({ type: 'draft', value: event.currentTarget.value })
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') cancel();
            }}
          />
          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${visibleLabel}`}
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-primary"
              onClick={onRemove}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                shouldCommitRef.current = false;
              }}
            >
              <Icon name="Trash" size={12} />
            </button>
          ) : null}
        </>
      ) : (
        <span
          ref={inlineValueRef}
          className="inline-flex max-w-full items-center gap-1"
        >
          {inlineRestingLabel}
        </span>
      )}
    </span>
  );
}

function InputButtonPicker({
  className,
  icon,
  label,
  swatch,
  value,
  ...props
}: Omit<InputButtonRootProps, 'children' | 'prefix' | 'value'> &
  InputButtonValueProps & {
    swatch?: string;
  }) {
  const hasValue = Boolean(value);
  const displayValue = value || label;

  return (
    <InputButtonRoot element="button" className={className} {...props}>
      {icon && <InputButtonIcon>{icon}</InputButtonIcon>}
      {swatch && <InputButtonSwatch color={swatch} />}
      {label && (
        <InputButtonLabel muted={!hasValue} transitionKey={displayValue}>
          {displayValue}
        </InputButtonLabel>
      )}
    </InputButtonRoot>
  );
}

function InputButtonSwitch({
  className,
  icon,
  label,
  onValueChange,
  value,
  ...props
}: Omit<
  InputButtonRootProps,
  'children' | 'onActivate' | 'onToggle' | 'prefix'
> &
  InputButtonBaseProps & {
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) {
  return (
    <InputButtonRoot
      className={className}
      aria-pressed={value}
      onActivate={() => onValueChange(!value)}
      {...props}
    >
      <InputButtonIcon>{icon}</InputButtonIcon>
      <InputButtonLabel>{label}</InputButtonLabel>
      <InputButtonValue variant="control">
        <Switch
          ariaLabel={label}
          checked={value}
          onCheckedChange={onValueChange}
        />
      </InputButtonValue>
    </InputButtonRoot>
  );
}

function InputButtonCheckbox({
  className,
  icon,
  label,
  onValueChange,
  value,
  ...props
}: Omit<
  InputButtonRootProps,
  'children' | 'onActivate' | 'onToggle' | 'prefix'
> &
  InputButtonBaseProps & {
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) {
  return (
    <InputButtonRoot
      className={className}
      aria-pressed={value}
      onActivate={() => onValueChange(!value)}
      {...props}
    >
      <InputButtonIcon>{icon}</InputButtonIcon>
      <InputButtonLabel>{label}</InputButtonLabel>
      <InputButtonValue variant="control">
        <Checkbox.Root
          checked={value}
          onCheckedChange={onValueChange}
          onClick={(event) => event.stopPropagation()}
          tabIndex={-1}
          aria-hidden
        >
          <Checkbox.Indicator />
        </Checkbox.Root>
      </InputButtonValue>
    </InputButtonRoot>
  );
}

function InputButtonIcon({ children }: { children?: ReactNode }) {
  if (!children) return null;

  return (
    <span className="-mx-0.5 inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground">
      {children}
    </span>
  );
}

function InputButtonLabel({
  children,
  muted = false,
  pointerEvents = true,
  transitionKey,
}: {
  children: ReactNode;
  muted?: boolean;
  pointerEvents?: boolean;
  transitionKey?: Key;
}) {
  return (
    <span
      className={clsx(
        'relative inline-flex shrink-0 truncate text-base transition-colors ease-out',
        !pointerEvents && 'pointer-events-none',
        muted && 'text-secondary',
      )}
    >
      {transitionKey === undefined ? (
        children
      ) : (
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={transitionKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={inputButtonMotionTransition}
          >
            {children}
          </m.span>
        </AnimatePresence>
      )}
    </span>
  );
}

function InputButtonInput({
  className,
  inputRef,
  prefix,
  ref,
  style,
  suffix,
  ...props
}: Omit<ComponentProps<'input'>, 'prefix'> & {
  inputRef?: ComponentProps<'input'>['ref'];
  prefix?: ReactNode;
  ref?: ComponentProps<'span'>['ref'];
  suffix?: ReactNode;
}) {
  const inputValue =
    typeof props.value === 'string' || typeof props.value === 'number'
      ? String(props.value)
      : '';
  const inputPlaceholder =
    typeof props.placeholder === 'string' ? props.placeholder : '';
  const inputSize = Math.min(
    Math.max(inputValue.length, inputPlaceholder.length, 1),
    inputButtonInputMaxSize,
  );
  const inputWidth = Math.min(inputSize + 1, inputButtonInputMaxSize);

  return (
    <span
      ref={ref}
      className={clsx(
        'pointer-events-auto flex max-w-full flex-1 items-center gap-1',
        className,
      )}
    >
      <InputButtonInputAddon>{prefix}</InputButtonInputAddon>
      <input
        ref={inputRef}
        {...props}
        className="h-full max-w-full min-w-4 bg-transparent outline-none placeholder:text-muted-foreground"
        size={inputSize}
        style={{ ...style, width: `${inputWidth}ch` }}
      />
      <InputButtonInputAddon>{suffix}</InputButtonInputAddon>
    </span>
  );
}

function InputButtonSwatch({ color }: { color?: string }) {
  if (!color) return null;

  return (
    <span
      className="-mx-0.5 size-4 shrink-0 rounded-full corner-shape-unset"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function InputButtonRemoveButton({
  'aria-label': ariaLabel,
  onRemove,
}: {
  'aria-label': string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="-mr-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary"
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Icon name="Trash" size={12} />
    </button>
  );
}

function InputButtonInputAddon({ children }: { children?: ReactNode }) {
  if (!children) return null;

  return (
    <span className="inline-flex shrink-0 items-center text-muted-foreground">
      {children}
    </span>
  );
}

function InputButtonValue({
  children,
  ref,
  variant = 'pill',
}: {
  children?: ReactNode;
  ref?: ComponentProps<'span'>['ref'];
  variant?: 'pill' | 'control';
}) {
  if (!children) return null;

  if (variant === 'control') {
    return (
      <span
        ref={ref}
        className="-mr-0.5 ml-0.5 inline-flex shrink-0 items-center"
      >
        {children}
      </span>
    );
  }

  return (
    <span className="flex h-5 max-w-16 items-center overflow-hidden rounded-full bg-white px-2 leading-5 font-medium text-secondary shadow-[0_0_2px_1px_rgba(0,0,0,0.04),0_1px_2px_-0.5px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.06),0_4px_8px_-2px_rgba(0,0,0,0.06)]">
      <span className="truncate">{children}</span>
    </span>
  );
}

const InputButton = Object.assign(
  function InputButton() {
    return null;
  },
  {
    Text: InputButtonText,
    Picker: InputButtonPicker,
    Switch: InputButtonSwitch,
    Checkbox: InputButtonCheckbox,
  },
);

export { InputButton };
