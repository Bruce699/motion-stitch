import React from 'react';
import { m, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Image } from '~/ui/components/image/image';

const viewBoxWidth = 1024;
const viewBoxHeight = 768;

const magneticRadius = 360;
const magneticStrength = 8;
const magneticSpring = {
  stiffness: 160,
  damping: 24,
  mass: 0.7,
};

const penSlot = {
  x: 710,
  y: -100,
  width: 376,
  height: 538,
  rotate: 12,
  initialX: 160,
  initialY: -120,
};

function getMagneticOffset(
  pointer: number,
  crossPointer: number,
  center: number,
  crossCenter: number,
) {
  const delta = center - pointer;
  const crossDelta = crossCenter - crossPointer;
  const distance = Math.hypot(delta, crossDelta);

  if (distance <= 0 || distance >= magneticRadius) {
    return 0;
  }

  const force = (1 - distance / magneticRadius) ** 2 * magneticStrength;
  return (delta / distance) * force;
}

function BlogPostsEmptyStatePenSlot({
  pointerX,
  pointerY,
}: {
  pointerX: ReturnType<typeof useMotionValue<number>>;
  pointerY: ReturnType<typeof useMotionValue<number>>;
}) {
  const centerX = penSlot.x + penSlot.width / 2;
  const centerY = penSlot.y + penSlot.height / 2;
  const introX = useMotionValue(penSlot.initialX);
  const introY = useMotionValue(penSlot.initialY);
  const opacity = useMotionValue(0);
  const magneticX = useTransform(() =>
    getMagneticOffset(pointerX.get(), pointerY.get(), centerX, centerY),
  );
  const magneticY = useTransform(() =>
    getMagneticOffset(pointerY.get(), pointerX.get(), centerY, centerX),
  );
  const x = useTransform(() => introX.get() + magneticX.get());
  const y = useTransform(() => introY.get() + magneticY.get());
  const springX = useSpring(x, magneticSpring);
  const springY = useSpring(y, magneticSpring);
  const springOpacity = useSpring(opacity, magneticSpring);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      introX.set(0);
      introY.set(0);
      opacity.set(1);
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [introX, introY, opacity]);

  return (
    <m.g
      style={{
        x: springX,
        y: springY,
        opacity: springOpacity,
      }}
    >
      <g transform={`rotate(${penSlot.rotate} ${centerX} ${centerY})`}>
        <foreignObject
          x={penSlot.x}
          y={penSlot.y}
          width={penSlot.width}
          height={penSlot.height}
        >
          <Image
            src="/images/blog-posts/object-1.png"
            alt=""
            size="full"
            className="h-full"
            decoding="async"
          />
        </foreignObject>
      </g>
    </m.g>
  );
}

export function BlogPostsEmptyStateVisual() {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const svgBoundsRef = React.useRef<DOMRectReadOnly | null>(null);
  const pointerX = useMotionValue(-10000);
  const pointerY = useMotionValue(-10000);

  React.useEffect(() => {
    function updateSvgBounds() {
      svgBoundsRef.current = svgRef.current?.getBoundingClientRect() ?? null;
    }

    function syncPointer(event: PointerEvent) {
      const bounds = svgBoundsRef.current;

      if (!bounds) return;

      const x = ((event.clientX - bounds.left) / bounds.width) * viewBoxWidth;
      const y = ((event.clientY - bounds.top) / bounds.height) * viewBoxHeight;

      pointerX.set(x);
      pointerY.set(y);
    }

    function resetPointer() {
      pointerX.set(-10000);
      pointerY.set(-10000);
    }

    updateSvgBounds();
    window.addEventListener('pointermove', syncPointer);
    window.addEventListener('pointerleave', resetPointer);
    window.addEventListener('blur', resetPointer);
    window.addEventListener('resize', updateSvgBounds);
    window.addEventListener('scroll', updateSvgBounds, true);

    return () => {
      window.removeEventListener('pointermove', syncPointer);
      window.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('blur', resetPointer);
      window.removeEventListener('resize', updateSvgBounds);
      window.removeEventListener('scroll', updateSvgBounds, true);
    };
  }, [pointerX, pointerY]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-1 overflow-visible"
    >
      <svg
        ref={svgRef}
        className="absolute top-0 right-0 aspect-1024/768 w-[clamp(960px,100%,1280px)] max-w-none"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      >
        <BlogPostsEmptyStatePenSlot pointerX={pointerX} pointerY={pointerY} />
      </svg>
    </div>
  );
}
