// Official Hugeicons CDN is loaded in index.html. Keep every editor glyph here.
const glyphs = {
  play: "play",
  pause: "pause",
  back: "previous",
  next: "next",
  undo: "undo",
  redo: "redo",
  settings: "settings-01",
  close: "cancel-01",
  chevron: "arrow-down-01",
  plus: "add-01",
  minus: "minus-sign",
  home: "home-01",
  arrowLeft: "arrow-left-01",
  sidebarLeft: "layout-align-left",
  sidebarRight: "layout-align-right",
  expand: "arrow-up-01",
  folder: "folder-01",
  share: "share-03",
  warning: "alert-02",
} as const;
export type IconName = keyof typeof glyphs;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <i
      className={`huge-icon hgi-stroke hgi-${glyphs[name]}`}
      data-icon={name}
      style={{ fontSize: size }}
      aria-hidden="true"
    />
  );
}
