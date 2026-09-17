import { Autocomplete } from '@base-ui/react/autocomplete';
import { ScrollArea } from '@base-ui/react/scroll-area';
import React from 'react';
import type { SearchGroup, SearchItem } from '~/data/search-data';
import { SearchResultItem } from './search-result-item';
import { SearchResultsGroup } from './search-results-group';

export type VisibleSearchGroup = SearchGroup & {
  showMoreItem: SearchItem | null;
  totalItemCount: number;
};

function scrollHighlightedResultIntoView(viewport: HTMLElement | null) {
  const highlightedResult = viewport?.querySelector('[data-highlighted]');

  if (!highlightedResult) return;

  highlightedResult.scrollIntoView({ block: 'nearest' });
}

export function SearchResults({
  askSidekickItem,
  groups,
  highlightedItem,
  items,
  onSelect,
  query,
  resultCount,
  shouldScrollHighlightedResultIntoView,
}: {
  askSidekickItem: SearchItem;
  groups: VisibleSearchGroup[];
  highlightedItem: SearchItem | undefined;
  items?: SearchItem[];
  onSelect: (item: SearchItem) => void;
  query: string;
  resultCount: number;
  shouldScrollHighlightedResultIntoView: boolean;
}) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const flatItems = items ?? null;

  React.useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) return;

    viewport.scrollTop = 0;
  }, [flatItems, groups]);

  React.useEffect(() => {
    if (
      !shouldScrollHighlightedResultIntoView ||
      !highlightedItem ||
      resultCount === 0
    ) {
      return;
    }

    const viewport = viewportRef.current;

    if (!viewport) return;

    const frame = requestAnimationFrame(() => {
      scrollHighlightedResultIntoView(viewport);
    });

    return () => cancelAnimationFrame(frame);
  }, [highlightedItem, resultCount, shouldScrollHighlightedResultIntoView]);

  if (resultCount === 0) {
    return (
      <div className="flex flex-auto overflow-hidden px-2.5 pt-2 pb-2.5">
        <Autocomplete.List className="w-full outline-none">
          <SearchResultItem
            index={0}
            item={askSidekickItem}
            onSelect={onSelect}
            query={query}
            variant="sidekick"
          />
        </Autocomplete.List>
      </div>
    );
  }

  let itemStartIndex = 0;

  return (
    <ScrollArea.Root className="relative isolate flex-auto overflow-hidden">
      <ScrollArea.Viewport
        ref={viewportRef}
        className="h-full overscroll-contain p-2.5"
      >
        <ScrollArea.Content>
          <Autocomplete.List className="outline-none">
            {flatItems
              ? flatItems.map((item, itemIndex) => (
                  <SearchResultItem
                    key={item.id}
                    index={itemIndex}
                    item={item}
                    onSelect={onSelect}
                    query={query}
                  />
                ))
              : groups.map((group) => {
                  const section = (
                    <SearchResultsGroup
                      key={group.id}
                      group={group}
                      itemStartIndex={itemStartIndex}
                      onSelect={onSelect}
                      query={query}
                    />
                  );

                  itemStartIndex += group.items.length;
                  if (group.showMoreItem) itemStartIndex += 1;

                  return section;
                })}
          </Autocomplete.List>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className="z-20 m-1 flex w-1 justify-center rounded-full opacity-0 transition-opacity data-hovering:opacity-100 data-scrolling:opacity-100"
        orientation="vertical"
      >
        <ScrollArea.Thumb className="w-full rounded-full bg-black/20" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
