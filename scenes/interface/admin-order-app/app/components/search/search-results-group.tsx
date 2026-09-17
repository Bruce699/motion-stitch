import { Autocomplete } from '@base-ui/react/autocomplete';
import type { SearchItem } from '~/data/search-data';
import { SearchResultItem } from './search-result-item';
import type { VisibleSearchGroup } from './search-results';

export function SearchResultsGroup({
  group,
  itemStartIndex,
  onSelect,
  query,
}: {
  group: VisibleSearchGroup;
  itemStartIndex: number;
  onSelect: (item: SearchItem) => void;
  query: string;
}) {
  const remainingItemCount = group.totalItemCount - group.items.length;

  return (
    <Autocomplete.Group>
      <Autocomplete.GroupLabel className="px-3 pt-2 pb-1.5 text-sm font-medium text-muted-foreground">
        {group.label}
      </Autocomplete.GroupLabel>
      <div className="flex flex-col gap-0.5">
        {group.items.map((item, itemIndex) => (
          <SearchResultItem
            key={item.id}
            index={itemStartIndex + itemIndex}
            item={item}
            onSelect={onSelect}
            query={query}
          />
        ))}
        {remainingItemCount > 0 && group.showMoreItem ? (
          <SearchResultItem
            index={itemStartIndex + group.items.length}
            item={group.showMoreItem}
            onSelect={onSelect}
            query={query}
            variant="show-more"
          />
        ) : null}
      </div>
    </Autocomplete.Group>
  );
}
