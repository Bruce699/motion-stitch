// Official Hugeicons CDN is loaded in index.html. Keep every editor glyph here.
const glyphs = {
  camera: "camera-01",
  play: "play",
  pause: "pause",
  back: "previous",
  next: "next",
  undo: "undo",
  unlink: "unlink-04",
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
  search: "search-01",
  grid: "grid-view",
  square: "square",
  sun: "sun-01",
  moon: "moon-02",
} as const;
export type IconName = keyof typeof glyphs;

// Closed paths from the MIT-licensed @hugeicons/core-free-icons 4.2.2.
// Preserve their geometry and fill the enclosed shapes for solid transport icons.
// Source and license: vendor/hugeicons/UPSTREAM.md and LICENSE.
const transportPaths = {
  play: [
    "M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z",
  ],
  pause: [
    "M4 7C4 5.58579 4 4.87868 4.43934 4.43934C4.87868 4 5.58579 4 7 4C8.41421 4 9.12132 4 9.56066 4.43934C10 4.87868 10 5.58579 10 7V17C10 18.4142 10 19.1213 9.56066 19.5607C9.12132 20 8.41421 20 7 20C5.58579 20 4.87868 20 4.43934 19.5607C4 19.1213 4 18.4142 4 17V7Z",
    "M14 7C14 5.58579 14 4.87868 14.4393 4.43934C14.8787 4 15.5858 4 17 4C18.4142 4 19.1213 4 19.5607 4.43934C20 4.87868 20 5.58579 20 7V17C20 18.4142 20 19.1213 19.5607 19.5607C19.1213 20 18.4142 20 17 20C15.5858 20 14.8787 20 14.4393 19.5607C14 19.1213 14 18.4142 14 17V7Z",
  ],
} as const;

type IconProps = { size?: number } & (
  | { name: IconName; variant?: "stroke" }
  | { name: keyof typeof transportPaths; variant: "solid" }
);

export function Icon({ name, size = 16, variant = "stroke" }: IconProps) {
  if (variant === "solid" && (name === "play" || name === "pause")) {
    return (
      <svg
        className="huge-icon"
        data-icon={name}
        data-icon-variant="solid"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ fontSize: size }}
        fill="currentColor"
        stroke="none"
        aria-hidden="true"
        focusable="false"
      >
        {transportPaths[name].map((path, index) => (
          <path key={index} d={path} />
        ))}
      </svg>
    );
  }
  return (
    <i
      className={`huge-icon hgi-stroke hgi-${glyphs[name]}`}
      data-icon={name}
      style={{ fontSize: size }}
      aria-hidden="true"
    />
  );
}
