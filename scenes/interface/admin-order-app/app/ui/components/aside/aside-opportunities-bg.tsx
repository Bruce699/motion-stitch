import { memo, type CSSProperties } from 'react';

export const AsideOpportunitiesBg = memo(function AsideOpportunitiesBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative -z-1 h-40 w-full mask-[radial-gradient(90%_85%_at_44%_0%,black_0%,transparent_50%)] text-ai"
      data-slot="aside-opportunities-bg"
    >
      <span className="absolute inset-0 bg-current" style={baseDotsMaskStyle} />
      <span
        className="absolute inset-0 bg-current opacity-0 transition-opacity ease-out group-hover:opacity-60"
        style={hoverDotsMaskStyle}
      />
    </div>
  );
});

const dots = createDots();
const dotMaskSize = '720px 160px';
const baseDotsMaskStyle = createDotMaskStyle(dots);
const hoverDotsMaskStyle = createDotMaskStyle(
  dots.map((dot, index) => ({ ...dot, opacity: getHoverOpacity(index) })),
);

function createDotMaskStyle(maskDots: readonly Dot[]): CSSProperties {
  const maskImage = `url("${createDotsMask(maskDots)}")`;

  return {
    WebkitMaskImage: maskImage,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: dotMaskSize,
    maskImage,
    maskRepeat: 'no-repeat',
    maskSize: dotMaskSize,
  };
}

function createDotsMask(maskDots: readonly Dot[]) {
  const circles = maskDots
    .map(
      (dot) =>
        `<circle cx="${dot.x}" cy="${dot.y}" r="1" fill="black" opacity="${dot.opacity}"/>`,
    )
    .join('');

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="160" viewBox="0 0 720 160">${circles}</svg>`,
  )}`;
}

function getHoverOpacity(index: number) {
  if (index % 3 === 0) return 0.3;
  if (index % 4 === 0) return 0.2;

  return 0.15;
}

function getStableOpacity(value: number) {
  return Number(value.toFixed(4));
}

type Dot = {
  opacity: number;
  x: number;
  y: number;
};

function createDots(): Dot[] {
  const generatedDots: Dot[] = [];

  for (let y = 0; y <= 76; y += 4) {
    for (let x = 0; x <= 720; x += 4) {
      const cluster = getClusterIntensity(x, y);
      const noise = seededNoise(x, y);
      const baseline = 0.035 + seededNoise(x + 11, y + 19) * 0.055;
      const intensity = Math.max(baseline, cluster * (0.32 + noise * 0.92));

      if (intensity < 0.055 && seededNoise(x + 41, y + 73) < 0.55) continue;

      generatedDots.push({
        x,
        y,
        opacity: getStableOpacity(Math.min(0.09, intensity * 0.12)),
      });
    }
  }

  return generatedDots;
}

function getClusterIntensity(x: number, y: number) {
  const topCenter = gaussian(x, y, 180, 0, 92, 18);
  const falloff = gaussian(x, y, 180, 0, 210, 56);

  return Math.min(1, topCenter + falloff * 0.62);
}

function gaussian(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
) {
  const dx = (x - centerX) / radiusX;
  const dy = (y - centerY) / radiusY;

  return Math.exp(-(dx * dx + dy * dy));
}

function seededNoise(x: number, y: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;

  return value - Math.floor(value);
}
