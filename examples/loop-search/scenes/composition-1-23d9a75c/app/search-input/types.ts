import type { CSSProperties, RefObject } from 'react';
export type SearchEntry = { query: string; color: string };
export type RequestContext = { signal: AbortSignal };
export type SearchLabels = {
  search: string; placeholder: string; compactPlaceholder: string; recent: string;
  suggestions: string; clearHistory: string; close: string; clearSearch: string;
  color: string; image: string; chooseImage: string; imageHelp: string; quickColors: string; loading: string;
  error: string; retry: string; suggestionsError: string;
  removeRecent: (entry: SearchEntry) => string;
  editQuery: (query: string) => string; removeQuery: (query: string) => string;
  selectColor: (color: string) => string; removeColor: string;
};
export type SaveeSearchInputProps = {
  /** Tilt capture only; live preview leaves this undefined. */
  capture?: { state: string; query: string; suggestions: readonly SearchEntry[]; hoverRow: number; panel?: 'recent' | 'color' | 'image'; expanded?: boolean };
  /** Host-controlled applied filters. Update when navigation completes or on popstate. */
  value: SearchEntry;
  /** Animate out/in with the same motion used by scroll hiding; keeps the component mounted. */
  hidden?: boolean;
  /** Empty query and color means clear filters. Must reject when the action fails. */
  onSearch: (entry: SearchEntry, context: RequestContext) => void | Promise<void>;
  /** Optional navigation action for an explicitly selected suggestion or recent row. */
  onSelectResult?: (entry: SearchEntry, context: RequestContext) => void | Promise<void>;
  /** Optional live draft notification for host result previews; submitting remains explicit. */
  onQueryChange?: (query: string) => void;
  recentSearches?: readonly SearchEntry[];
  /** Called for explicit clear/remove. Host owns storage and remembers successful searches. */
  onRecentSearchesChange?: (entries: SearchEntry[]) => void;
  getSuggestions?: (query: string, context: RequestContext) => Promise<readonly SearchEntry[]>;
  /** Color mode is hidden unless this is supplied. */
  colors?: readonly string[];
  /** Optional host-owned shortcut swatches, below the palette. */
  quickColors?: readonly string[];
  /** Image mode is hidden unless this is supplied. Host owns upload, consent and validation. */
  onImageSearch?: (file: File, context: RequestContext) => void | Promise<void>;
  labels?: Partial<SearchLabels>;
  debounceMs?: number;
  /** Logical pixel widths; omitted states retain the Input defaults. */
  widths?: Partial<{ idle: number; expanded: number; filtered: number; loading: number }>;
  /** Off by default to avoid stealing Savee's existing keyboard shortcuts. */
  keyboardShortcut?: boolean;
  /** Optional explicit scrolling surface; omission leaves the input visible. */
  scrollContainer?: RefObject<HTMLElement | null>;
  className?: string;
  style?: CSSProperties & { [key: `--svsi-${string}`]: string | number };
};
