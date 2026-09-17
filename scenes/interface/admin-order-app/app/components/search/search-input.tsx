import { Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import React from 'react';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { motionEasings, motionDurations } from '~/ui/tokens/motion';

export function SearchInput({
  activeFilter,
  inputRef,
  onActiveFilterClear,
  onKeyDown,
  onQueryChange,
  query,
}: {
  activeFilter: { label: string } | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onActiveFilterClear: () => void;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onQueryChange: (query: string) => void;
  query: string;
}) {
  const handleKeyDownCapture = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && activeFilter && query.length === 0) {
        event.preventDefault();
        onActiveFilterClear();
        return;
      }

      onKeyDown(event);
    },
    [activeFilter, onActiveFilterClear, onKeyDown, query],
  );

  return (
    <Autocomplete.InputGroup
      className={clsx(
        'relative flex h-14 shrink-0 items-center gap-2 pr-3 pl-4',
        'before:absolute before:inset-x-0 before:bottom-0 before:h-px before:rounded before:bg-border before:transition-opacity before:ease-out',
        query ? 'before:opacity-100' : 'before:opacity-0',
      )}
    >
      <span className="text-muted-foreground">
        <Icon name="Search" />
      </span>

      <div className="relative flex h-6 flex-1 gap-2">
        <AnimatePresence>
          {activeFilter && (
            <m.div
              className="inline-flex shrink-0"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(2px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(2px)' }}
              transition={{
                duration: motionDurations.fast,
                ease: motionEasings.easeOut,
              }}
            >
              <Button
                type="button"
                aria-label={`Clear ${activeFilter.label} filter`}
                variant="secondary"
                size="sm"
                onClick={onActiveFilterClear}
                suffix={
                  <span className="text-muted-foreground">
                    <Icon name="Xmark" size={12} />
                  </span>
                }
              >
                {activeFilter.label}
              </Button>
            </m.div>
          )}
        </AnimatePresence>
        <Autocomplete.Input
          ref={inputRef}
          onKeyDownCapture={handleKeyDownCapture}
          placeholder={activeFilter ? undefined : 'Search'}
          className="h-full w-full bg-transparent text-lg text-primary outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex size-7.5 flex-center">
        <AnimatePresence>
          {query && (
            <m.div
              initial={{
                opacity: 0,
                scale: 0.95,
                filter: 'blur(2px)',
              }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                scale: 0.95,
                filter: 'blur(2px)',
              }}
              transition={{
                duration: motionDurations.fast,
                ease: motionEasings.easeOut,
              }}
            >
              <Button
                type="button"
                aria-label="Clear search"
                variant="plain"
                size="icon"
                onClick={() => onQueryChange('')}
              >
                <span className="text-muted-foreground">
                  <Icon name="Xmark" size={14} />
                </span>
              </Button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </Autocomplete.InputGroup>
  );
}
