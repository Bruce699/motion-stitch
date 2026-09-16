// Official Hugeicons CDN is loaded in index.html. Keep every editor glyph here.
const glyphs = {
  play: "play",
  pause: "pause",
  back: "previous",
  next: "next",
  undo: "undo-02",
  redo: "redo-02",
  settings: "sliders-horizontal",
  close: "cancel-01",
  chevron: "arrow-down-01",
  plus: "add-01",
  minus: "minus-sign",
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
