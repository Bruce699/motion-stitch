import { Shortcut } from '~/ui/components/shortcut/shortcut';
import { clsx } from 'clsx';
import { useHotkey } from '~/hooks/use-hotkey';
import { useLayoutStore } from '~/stores/use-layout-store';
import { useSearchStore } from '~/stores/use-search-store';

export function SearchFooter({ query }: { query: string }) {
  const trimmedQuery = query.trim();
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const openSidekickPanel = useLayoutStore((state) => state.openSidekickPanel);

  useHotkey(
    'meta+enter',
    () => {
      closeSearch();
      openSidekickPanel();
    },
    { enabled: Boolean(trimmedQuery) },
    [closeSearch, openSidekickPanel, trimmedQuery],
  );

  return (
    <div className="flex justify-between border-t border-border px-4 text-sm text-secondary">
      <div
        className={clsx(
          'flex h-11 items-center gap-4',
          !trimmedQuery && 'opacity-50',
        )}
      >
        <span className="flex items-center gap-2">
          <span>Ask Sidekick</span>
          <Shortcut
            keys={[
              { type: 'modifier', name: 'command' },
              { type: 'action', name: 'enter' },
            ]}
          />
        </span>
        <span className="flex items-center gap-2">
          <span>Search in App Store</span>
          <Shortcut
            keys={[
              { type: 'modifier', name: 'command' },
              { type: 'modifier', name: 'shift' },
              { type: 'action', name: 'enter' },
            ]}
          />
        </span>
      </div>
      <span className="flex items-center gap-2">
        <span>Open</span>
        <Shortcut keys={[{ type: 'action', name: 'enter' }]} />
      </span>
    </div>
  );
}
