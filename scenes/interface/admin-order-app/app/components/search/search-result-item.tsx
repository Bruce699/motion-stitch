import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';
import type { SearchItem } from '~/data/search-data';
import { Badge } from '~/ui/components/badge/badge';
import { SidekickIcon } from '~/ui/components/sidekick-icon/sidekick-icon';
import { SearchThumbnail } from './search-thumbnail';

type SearchResultItemVariant = 'default' | 'show-more' | 'sidekick';

function HighlightMatch({ query, text }: { query: string; text: string }) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return <>{text}</>;

  const matchIndex = text.toLowerCase().indexOf(normalizedQuery);

  if (matchIndex === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, matchIndex)}
      <span className="font-semibold">
        {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </span>
      {text.slice(matchIndex + normalizedQuery.length)}
    </>
  );
}

function searchResultItemClassName(variant: SearchResultItemVariant) {
  return clsx(
    'group/search-result flex w-full items-center gap-3 rounded-2xl px-2.5 text-left transition-colors outline-none',
    'hover:bg-gray-100 data-highlighted:bg-gray-100',
    variant === 'show-more'
      ? 'h-10 cursor-pointer text-muted-foreground hover:text-primary data-highlighted:text-primary'
      : 'py-2',
  );
}

function SearchResultLeading({
  item,
  variant,
}: {
  item: SearchItem;
  variant: SearchResultItemVariant;
}) {
  if (variant === 'show-more') return null;

  if (variant === 'sidekick') {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <SidekickIcon state="active" />
      </span>
    );
  }

  return <SearchThumbnail item={item} />;
}

function SearchResultTitle({
  item,
  query,
  variant,
}: {
  item: SearchItem;
  query: string;
  variant: SearchResultItemVariant;
}) {
  if (variant === 'sidekick') return query.trim();

  if (variant !== 'default') return item.title;

  return <HighlightMatch query={query} text={item.title} />;
}

function SearchResultSubtitle({
  item,
  variant,
}: {
  item: SearchItem;
  variant: SearchResultItemVariant;
}) {
  if (variant === 'show-more') return null;

  const subtitles = (
    variant === 'sidekick' ? ['Ask Sidekick'] : item.subtitle
  ).filter(Boolean);

  if (subtitles.length === 0) return null;

  return (
    <span className="flex truncate text-secondary">
      {subtitles.map((subtitle, subtitleIndex) => (
        <span key={`${item.id}-${subtitleIndex}`} className="truncate">
          {subtitleIndex > 0 && <span className="pr-2 pl-1">&middot;</span>}
          {subtitle}
        </span>
      ))}
    </span>
  );
}

export function SearchResultItem({
  index,
  item,
  onSelect,
  query,
  variant = 'default',
}: {
  index?: number;
  item: SearchItem;
  onSelect: (item: SearchItem) => void;
  query: string;
  variant?: SearchResultItemVariant;
}) {
  return (
    <Autocomplete.Item
      index={index}
      value={item}
      onClick={() => onSelect(item)}
      className={searchResultItemClassName(variant)}
    >
      <SearchResultLeading item={item} variant={variant} />
      <span className="flex flex-1 flex-col overflow-hidden">
        <span className="flex items-center gap-2">
          <span
            className={clsx(
              'font-base truncate',
              variant === 'show-more' ? 'text-inherit' : 'text-primary',
            )}
          >
            <SearchResultTitle item={item} query={query} variant={variant} />
          </span>
          {item.status && variant === 'default' ? (
            <Badge variant={item.statusVariant}>{item.status}</Badge>
          ) : null}
        </span>
        <SearchResultSubtitle item={item} variant={variant} />
      </span>
    </Autocomplete.Item>
  );
}
