import React from 'react';
import {
  SidekickIcon,
  type SidekickIconState,
} from '~/ui/components/sidekick-icon/sidekick-icon';
import { SidekickSendButton } from './sidekick-send-button';
import { Icon } from '~/ui/components/icon/icon';
import { SidebarIcon } from '~/icons/sidekick/sidebar';
import clsx from 'clsx';

function preventSendButtonFocusSteal(
  event: React.PointerEvent<HTMLButtonElement>,
) {
  if (event.pointerType === 'touch') return;
  event.preventDefault();
}

export function SidekickField({
  className,
  inputRef,
  isFocused,
  isLoading = false,
  sidekickState,
  showActions,
  showBorder = false,
  showSidebarButton = true,
  value = '',
  onFocus,
  onBlur,
  onChange,
  onOpenSidekickPanel,
  onStopLoading,
  onSubmit,
  placeholder = 'Ask anything...',
}: {
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isFocused: boolean;
  isLoading?: boolean;
  sidekickState?: SidekickIconState;
  showActions: boolean;
  showBorder?: boolean;
  showSidebarButton?: boolean;
  value?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onChange?: (value: string) => void;
  onOpenSidekickPanel?: () => void;
  onStopLoading?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  return (
    <form
      className={clsx(
        'flex items-center gap-3',
        showBorder && 'border-t border-border',
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (isLoading) {
          onStopLoading?.();
        } else {
          onSubmit?.();
        }
      }}
    >
      <span className="shrink-0">
        <SidekickIcon
          state={sidekickState ?? (isFocused ? 'active' : 'idle')}
        />
      </span>
      <input
        ref={inputRef}
        type="text"
        aria-label="Ask Sidekick"
        placeholder={placeholder}
        className="ms-1 min-w-0 flex-1 bg-transparent text-primary outline-none focus:outline-none"
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(event) => {
          onChange?.(event.target.value);
        }}
      />

      <div
        className={clsx(
          'flex shrink-0 items-center gap-2 transition-opacity ease-out',
          showActions ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!showActions}
      >
        <button
          type="button"
          onPointerDown={preventSendButtonFocusSteal}
          aria-label="Attach"
          className="flex h-[24px] w-[24px] items-center justify-center"
        >
          <Icon name="Plus" />
        </button>
        <SidekickSendButton
          state={
            isLoading ? 'loading' : value.trim().length > 0 ? 'filled' : 'empty'
          }
          onClick={(event) => {
            if (!isLoading) return;

            event.preventDefault();
            onStopLoading?.();
          }}
          onPointerDown={preventSendButtonFocusSteal}
        />
      </div>
      {showSidebarButton ? (
        <button
          type="button"
          onPointerDown={preventSendButtonFocusSteal}
          onClick={onOpenSidekickPanel}
          aria-label="Open Sidekick sidebar"
          className="shrink-0 border-s border-gray-400 ps-3 pe-1"
        >
          <SidebarIcon />
        </button>
      ) : null}
    </form>
  );
}
