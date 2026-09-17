import { Menu as BaseMenu } from '@base-ui/react/menu';
import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Icon } from '~/ui/components/icon/icon';

type MenuOption =
  | {
      type?: 'item';
      children?: ReactNode;
      id?: string;
      label?: ReactNode;
      sublabel?: ReactNode;
      onSelect?: () => void;
      disabled?: boolean;
      checked?: boolean;
      closeOnClick?: boolean;
      prefix?: ReactNode;
      suffix?: ReactNode;
      onSuffixSelect?: () => void;
    }
  | {
      type: 'heading';
      id?: string;
      children?: ReactNode;
      label?: ReactNode;
    }
  | {
      type: 'separator';
      id?: string;
    };

const menuPopupMaxHeight = 'min(var(--available-height),21rem)';

type MenuPositionerProps = Pick<
  ComponentProps<typeof BaseMenu.Positioner>,
  'align' | 'alignOffset' | 'side' | 'sideOffset'
>;

function Menu({
  align = 'start',
  alignOffset,
  options,
  popupClassName,
  side,
  sideOffset = 4,
  trigger,
  triggerLabel,
  ...props
}: Omit<ComponentProps<typeof BaseMenu.Root>, 'children'> & {
  trigger: ReactElement | ((content: ReactNode) => ReactElement);
  triggerLabel?: ReactNode;
  options: MenuOption[];
  popupClassName?: string;
} & MenuPositionerProps) {
  const customTrigger =
    typeof trigger === 'function' ? trigger(triggerLabel) : trigger;

  return (
    <BaseMenu.Root modal={false} {...props}>
      <BaseMenu.Trigger render={customTrigger} />
      <BaseMenu.Portal>
        <Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
        >
          <Popup className={popupClassName}>
            {options.map((option) =>
              option.type === 'separator' ? (
                <Separator key={option.id ?? 'separator'} />
              ) : option.type === 'heading' ? (
                <Heading key={option.id ?? getOptionHeading(option)}>
                  {option.children ?? option.label}
                </Heading>
              ) : (
                <Item
                  key={getOptionKey(option)}
                  disabled={option.disabled}
                  checked={option.checked}
                  closeOnClick={option.closeOnClick}
                  onClick={option.onSelect}
                  prefix={option.prefix}
                  sublabel={option.sublabel}
                  suffix={option.suffix}
                  onSuffixSelect={option.onSuffixSelect}
                >
                  {option.children ?? option.label}
                </Item>
              ),
            )}
          </Popup>
        </Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function getOptionHeading(option: Extract<MenuOption, { type: 'heading' }>) {
  return typeof option.label === 'string' ? option.label : 'heading';
}

function getOptionKey(option: Extract<MenuOption, { type?: 'item' }>) {
  if (option.id) return option.id;
  return typeof option.label === 'string' ? option.label : 'item';
}

function Positioner({
  className,
  ...props
}: ComponentProps<typeof BaseMenu.Positioner>) {
  return (
    <BaseMenu.Positioner
      className={clsx('z-10 outline-none select-none', className)}
      {...props}
    />
  );
}

function Popup({
  className,
  style,
  ...props
}: ComponentProps<typeof BaseMenu.Popup>) {
  return (
    <BaseMenu.Popup
      style={
        typeof style === 'function'
          ? (state) => ({ ...style(state), maxHeight: menuPopupMaxHeight })
          : { ...style, maxHeight: menuPopupMaxHeight }
      }
      className={clsx(
        'group relative min-w-[max(var(--anchor-width),120px)] origin-(--transform-origin) scroll-py-6 overflow-y-auto rounded-lg bg-background p-1 shadow-lg transition-[opacity,scale,translate,filter] ease-out outline-none',
        'data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0',
        'data-[side=bottom]:data-ending-style:-translate-y-2 data-[side=bottom]:data-starting-style:-translate-y-2',
        'data-[side=top]:data-ending-style:translate-y-2 data-[side=top]:data-starting-style:translate-y-2',
        'data-[side=right]:data-ending-style:-translate-x-2 data-[side=right]:data-starting-style:-translate-x-2',
        'data-[side=left]:data-ending-style:translate-x-2 data-[side=left]:data-starting-style:translate-x-2',
        className,
      )}
      {...props}
    />
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pt-2 pb-1 text-sm font-medium text-muted-foreground">
      {children}
    </div>
  );
}

function Item({
  checked = false,
  children,
  disabled,
  prefix,
  sublabel,
  suffix,
  onSuffixSelect,
  ...props
}: Omit<ComponentProps<typeof BaseMenu.Item>, 'children' | 'prefix'> & {
  checked?: boolean;
  children?: ReactNode;
  prefix?: ReactNode;
  sublabel?: ReactNode;
  suffix?: ReactNode;
  onSuffixSelect?: () => void;
}) {
  return (
    <BaseMenu.Item
      disabled={disabled}
      className={clsx(
        'flex min-h-control cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-base font-book outline-none select-none',
        'hover:bg-gray-50 data-highlighted:bg-gray-50',
        'dark:hover:bg-gray-800 dark:data-highlighted:bg-gray-800',
      )}
      {...props}
    >
      {prefix && (
        <span className="-ml-1 flex shrink-0 items-center justify-center text-muted-foreground">
          {prefix}
        </span>
      )}
      <span className="flex flex-1 flex-col">
        <span>{children}</span>
        {sublabel && (
          <span className="text-sm text-muted-foreground">{sublabel}</span>
        )}
      </span>
      {checked ? (
        <span className="ml-auto flex shrink-0 items-center text-muted-foreground">
          <Icon name="Check" size={14} strokeWidth={2} />
        </span>
      ) : suffix ? (
        onSuffixSelect ? (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSuffixSelect();
            }}
            className="ml-auto flex shrink-0 cursor-pointer items-center rounded text-muted-foreground transition-colors hover:bg-gray-200 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/12"
          >
            {suffix}
          </button>
        ) : (
          <span className="ml-auto flex shrink-0 items-center text-muted-foreground">
            {suffix}
          </span>
        )
      ) : null}
    </BaseMenu.Item>
  );
}

function Separator({
  className,
  ...props
}: ComponentProps<typeof BaseMenu.Separator>) {
  return (
    <BaseMenu.Separator
      className={clsx('mx-2 my-1 h-px bg-gray-200 dark:bg-white/10', className)}
      {...props}
    />
  );
}
export { Menu };
