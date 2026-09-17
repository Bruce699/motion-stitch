import React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { AnimatePresence, m } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  getDefaultSearchGroups,
  SEARCH_GROUPS,
  searchItems,
  type SearchGroup,
  type SearchGroupId,
  type SearchItem,
} from '~/data/search-data';
import { useLayoutStore } from '~/stores/use-layout-store';
import { useSearchStore } from '~/stores/use-search-store';
import { Dialog } from '~/ui/components/dialog/dialog';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import { SearchFilters } from './search-filters';
import { SearchFooter } from './search-footer';
import { SearchInput } from './search-input';
import { SearchResults, type VisibleSearchGroup } from './search-results';

const askSidekickSearchItemId = 'ask-sidekick-search-result';
const showMoreSearchItemIdPrefix = 'show-more-';
const maxCollapsedItemsPerGroup = 5;
const maxShrinkToContentResultCount = 6;
const searchLayoutTransition = {
  duration: motionDurations.fast,
  ease: motionEasings.easeOut,
};
const searchFooterEnterDelay = 0.2;

function getShowMoreSearchItemId(groupId: SearchGroupId) {
  return `${showMoreSearchItemIdPrefix}${groupId}`;
}

function isShowMoreSearchItem(item: SearchItem) {
  return item.id.startsWith(showMoreSearchItemIdPrefix);
}

function getVisibleSearchGroups({
  activeGroupId,
  groups,
}: {
  activeGroupId: SearchGroupId | null;
  groups: SearchGroup[];
}): VisibleSearchGroup[] {
  const visibleGroups = activeGroupId
    ? groups.filter((group) => group.id === activeGroupId)
    : groups;

  return visibleGroups.map((group) => {
    const hasCollapsedItems =
      !activeGroupId && group.items.length > maxCollapsedItemsPerGroup;

    return {
      ...group,
      totalItemCount: group.items.length,
      showMoreItem: hasCollapsedItems
        ? ({
            id: getShowMoreSearchItemId(group.id),
            group: group.id,
            title: `Show ${group.items.length - maxCollapsedItemsPerGroup} more`,
            subtitle: ['', ''],
            href: '',
            icon: 'Plus',
          } satisfies SearchItem)
        : null,
      items: activeGroupId
        ? group.items
        : group.items.slice(0, maxCollapsedItemsPerGroup),
    };
  });
}

function getSearchResultItems(groups: VisibleSearchGroup[]) {
  return groups.flatMap((group) =>
    group.showMoreItem ? [...group.items, group.showMoreItem] : group.items,
  );
}

export function SearchDialog() {
  const navigate = useNavigate();
  const isSearchOpen = useSearchStore((state) => state.isSearchOpen);
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const openSearch = useSearchStore((state) => state.openSearch);
  const openSidekickPanel = useLayoutStore((state) => state.openSidekickPanel);
  const [query, setQuery] = React.useState('');
  const [activeGroup, setActiveGroup] = React.useState<SearchGroupId | null>(
    null,
  );
  const [highlightedItem, setHighlightedItem] = React.useState<
    SearchItem | undefined
  >();
  const [highlightedItemReason, setHighlightedItemReason] =
    React.useState<Autocomplete.Root.HighlightEventReason>('none');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const groups = React.useMemo(() => getDefaultSearchGroups(), []);
  const activeGroupId = activeGroup;
  const activeFilter =
    SEARCH_GROUPS.find((group) => group.id === activeGroupId) ?? null;
  const hasQuery = Boolean(query.trim());
  const showGroupedResults = !activeGroupId && !hasQuery;
  const visibleGroups = React.useMemo(
    () =>
      showGroupedResults
        ? getVisibleSearchGroups({
            activeGroupId: null,
            groups,
          })
        : [],
    [groups, showGroupedResults],
  );
  const flatItems = React.useMemo(() => {
    if (hasQuery) {
      const items = searchItems(query);

      return activeGroupId
        ? items.filter((item) => item.group === activeGroupId)
        : items;
    }

    if (!activeGroupId) return [];

    return groups.find((group) => group.id === activeGroupId)?.items ?? [];
  }, [activeGroupId, groups, hasQuery, query]);
  const visibleItems = React.useMemo(
    () =>
      showGroupedResults ? getSearchResultItems(visibleGroups) : flatItems,
    [flatItems, showGroupedResults, visibleGroups],
  );
  const resultCount = visibleItems.length;
  const shouldResultsShrinkToContent =
    resultCount <= maxShrinkToContentResultCount;
  const askSidekickItem = React.useMemo<SearchItem>(() => {
    const trimmedQuery = query.trim();

    return {
      id: askSidekickSearchItemId,
      group: 'navigation',
      title: 'Ask Sidekick',
      subtitle: [
        trimmedQuery
          ? `Ask about "${trimmedQuery}"`
          : 'Ask a question about your store',
        'Sidekick',
      ],
      href: '',
      icon: 'Search',
    };
  }, [query]);
  const autocompleteItems = React.useMemo(
    () => (resultCount === 0 ? [askSidekickItem] : visibleItems),
    [askSidekickItem, resultCount, visibleItems],
  );

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        openSearch();
      } else {
        closeSearch();
      }
    },
    [closeSearch, openSearch],
  );

  const resetSearch = React.useCallback(() => {
    setQuery('');
    setActiveGroup(null);
  }, []);

  const handleOpenChangeComplete = React.useCallback(
    (open: boolean) => {
      if (!open) resetSearch();
    },
    [resetSearch],
  );

  const focusSearchInput = React.useCallback(() => {
    requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true }),
    );
  }, []);

  const handleItemHighlighted = React.useCallback(
    (
      item: SearchItem | undefined,
      eventDetails: Autocomplete.Root.HighlightEventDetails,
    ) => {
      setHighlightedItem(item);
      setHighlightedItemReason(eventDetails.reason);
    },
    [],
  );

  const handleActiveGroupChange = React.useCallback(
    (groupId: SearchGroupId) => {
      setActiveGroup(groupId);
      focusSearchInput();
    },
    [focusSearchInput],
  );

  const handleActiveGroupClear = React.useCallback(() => {
    setActiveGroup(null);
    focusSearchInput();
  }, [focusSearchInput]);

  const handleSelect = React.useCallback(
    (item: SearchItem) => {
      if (isShowMoreSearchItem(item)) {
        handleActiveGroupChange(item.group);
        return;
      }

      closeSearch();

      if (item.id === askSidekickSearchItemId) {
        openSidekickPanel();
        return;
      }

      navigate(item.href);
    },
    [closeSearch, handleActiveGroupChange, navigate, openSidekickPanel],
  );

  const handleInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        event.key !== 'Enter' ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.ctrlKey
      ) {
        return;
      }

      const item = highlightedItem ?? autocompleteItems[0];

      if (!item) return;

      event.preventDefault();
      event.stopPropagation();
      handleSelect(item);
    },
    [autocompleteItems, handleSelect, highlightedItem],
  );

  const handleQueryChange = React.useCallback((value: string) => {
    setQuery(value);
  }, []);

  return (
    <Dialog
      open={isSearchOpen}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <Dialog.Content
        aria-label="Search"
        className="relative flex max-h-120 w-160 flex-col overflow-hidden"
        initialFocus={inputRef}
        style={{ height: shouldResultsShrinkToContent ? 'auto' : '30rem' }}
        type="dialog"
      >
        <Autocomplete.Root<SearchItem>
          items={autocompleteItems}
          value={query}
          onValueChange={handleQueryChange}
          itemToStringValue={(item) => item.title}
          mode="none"
          inline
          open={isSearchOpen}
          autoHighlight="always"
          onItemHighlighted={handleItemHighlighted}
          openOnInputClick
        >
          <SearchInput
            activeFilter={activeFilter}
            inputRef={inputRef}
            onActiveFilterClear={handleActiveGroupClear}
            onKeyDown={handleInputKeyDown}
            query={query}
            onQueryChange={handleQueryChange}
          />

          <AnimatePresence initial={false}>
            {!activeGroupId && !hasQuery && (
              <m.div
                initial={{ opacity: 0, filter: 'blur(2px)', height: 0 }}
                animate={{
                  opacity: 1,
                  filter: 'blur(0px)',
                  height: 'auto',
                }}
                exit={{ opacity: 0, filter: 'blur(2px)', height: 0 }}
                transition={searchLayoutTransition}
              >
                <SearchFilters
                  groups={groups}
                  onActiveGroupChange={handleActiveGroupChange}
                />
              </m.div>
            )}
          </AnimatePresence>

          <m.div
            initial={false}
            animate={{ flexGrow: shouldResultsShrinkToContent ? 0 : 1 }}
            style={{ flexBasis: shouldResultsShrinkToContent ? 'auto' : 0 }}
            className="flex min-h-0 flex-col overflow-hidden"
            transition={searchLayoutTransition}
          >
            <SearchResults
              items={showGroupedResults ? undefined : flatItems}
              groups={visibleGroups}
              askSidekickItem={askSidekickItem}
              highlightedItem={highlightedItem}
              onSelect={handleSelect}
              query={query}
              resultCount={resultCount}
              shouldScrollHighlightedResultIntoView={
                highlightedItemReason === 'keyboard'
              }
            />
          </m.div>

          <m.div
            initial={{ opacity: 0, filter: 'blur(2px)', y: '100%' }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(2px)', y: '100%' }}
            transition={{
              ...searchLayoutTransition,
              delay: searchFooterEnterDelay,
            }}
          >
            <SearchFooter query={query} />
          </m.div>
        </Autocomplete.Root>
      </Dialog.Content>
    </Dialog>
  );
}
