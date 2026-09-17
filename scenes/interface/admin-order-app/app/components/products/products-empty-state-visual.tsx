import { useEffect, useRef, type RefObject } from 'react';
import { m, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useLoadedImages } from '~/hooks/use-loaded-images';
import { Image } from '~/ui';

const viewBoxWidth = 1024;
const viewBoxHeight = 768;

const filterBounds = {
  x: '-40%',
  y: '-40%',
  width: '180%',
  height: '180%',
};

const objectLighting = {
  maskRadius: 3,
  blur: 0,
  surfaceScale: 7,
  specularConstant: 0.25,
  specularExponent: 48,
  color: 'rgba(255,255,255,0.42)',
  z: 200,
};

const glassTableLighting = {
  ...objectLighting,
  specularConstant: 0.4,
  specularExponent: 40,
  color: 'rgba(255,255,255,0.42)',
};

const magneticRadius = 360;
const magneticStrength = 8;
const magneticSpring = {
  stiffness: 160,
  damping: 24,
  mass: 0.7,
};

type ProductEmptyStateObjectConfig = {
  id: string;
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate?: number;
  initialX: number;
  initialY: number;
  introDelay: number;
};

const productEmptyStateObjects: ProductEmptyStateObjectConfig[] = [
  {
    id: 'cube',
    href: '/images/products/object-1.png',
    x: 720,
    y: -48,
    width: 160,
    height: 160,
    initialX: 0,
    initialY: -96,
    introDelay: 0,
  },
  {
    id: 'glass-table',
    href: '/images/products/object-4.png',
    x: 620,
    y: 160,
    width: 170,
    height: 170,
    rotate: 8,
    initialX: 60,
    initialY: 30,
    introDelay: 60,
  },
  {
    id: 'orange-chair',
    href: '/images/products/object-3.png',
    x: 880,
    y: 82,
    width: 240,
    height: 240,
    initialX: 96,
    initialY: -10,
    introDelay: 120,
  },
  {
    id: 'blue-vase',
    href: '/images/products/object-2.png',
    x: 860,
    y: 340,
    width: 120,
    height: 180,
    rotate: 16,
    initialX: 220,
    initialY: 80,
    introDelay: 160,
  },
  {
    id: 'green-chair',
    href: '/images/products/object-5.png',
    x: 620,
    y: 420,
    width: 132,
    height: 132,
    rotate: -12,
    initialX: 80,
    initialY: 260,
    introDelay: 200,
  },
];

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

function ProductEmptyStateObject({
  object,
  pointerX,
  pointerY,
  imagesLoaded,
  onImageLoad,
}: {
  object: (typeof productEmptyStateObjects)[number];
  pointerX: ReturnType<typeof useMotionValue<number>>;
  pointerY: ReturnType<typeof useMotionValue<number>>;
  imagesLoaded: boolean;
  onImageLoad: (src: string) => void;
}) {
  const centerX = object.x + object.width / 2;
  const centerY = object.y + object.height / 2;
  const introX = useMotionValue(object.initialX);
  const introY = useMotionValue(object.initialY);
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

  useEffect(() => {
    if (!imagesLoaded) return;

    const timeout = window.setTimeout(() => {
      introX.set(0);
      introY.set(0);
      opacity.set(1);
    }, object.introDelay);

    return () => window.clearTimeout(timeout);
  }, [imagesLoaded, introX, introY, object.introDelay, opacity]);

  return (
    <m.g
      style={{
        x: springX,
        y: springY,
        opacity: springOpacity,
      }}
    >
      <g
        transform={
          object.rotate !== undefined
            ? `rotate(${object.rotate} ${centerX} ${centerY})`
            : undefined
        }
        filter={
          object.id === 'glass-table'
            ? 'url(#products-empty-state-glass-object-shadow)'
            : 'url(#products-empty-state-object-shadow)'
        }
      >
        <foreignObject
          x={object.x}
          y={object.y}
          width={object.width}
          height={object.height}
        >
          <Image
            src={object.href}
            alt=""
            size="full"
            className="h-full"
            decoding="async"
            onLoad={() => onImageLoad(object.href)}
          />
        </foreignObject>
      </g>
    </m.g>
  );
}

function ProductsEmptyStateObjectFilter({
  id,
  lighting,
  pointLightRef,
}: {
  id: string;
  lighting: typeof objectLighting;
  pointLightRef: RefObject<SVGFEPointLightElement | null>;
}) {
  return (
    <filter
      id={id}
      x={filterBounds.x}
      y={filterBounds.y}
      width={filterBounds.width}
      height={filterBounds.height}
      colorInterpolationFilters="sRGB"
    >
      <feMorphology
        in="SourceAlpha"
        operator="dilate"
        radius={lighting.maskRadius}
        result="lightingMask"
      />
      <feGaussianBlur
        in="lightingMask"
        stdDeviation={lighting.blur}
        result="lightingBlur"
      />
      <feSpecularLighting
        in="lightingBlur"
        surfaceScale={lighting.surfaceScale}
        specularConstant={lighting.specularConstant}
        specularExponent={lighting.specularExponent}
        lightingColor={lighting.color}
        result="lighting"
      >
        <fePointLight
          ref={pointLightRef}
          x={viewBoxWidth / 2}
          y={viewBoxHeight / 2}
          z={lighting.z}
        />
      </feSpecularLighting>
      <feComposite
        in="lighting"
        in2="lightingMask"
        operator="in"
        result="lightingLayer"
      />
      <feComposite
        in="SourceGraphic"
        in2="lightingLayer"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litGraphic"
      />
    </filter>
  );
}

export function ProductsEmptyStateVisual() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgBoundsRef = useRef<DOMRectReadOnly | null>(null);
  const pointLightRef = useRef<SVGFEPointLightElement | null>(null);
  const glassPointLightRef = useRef<SVGFEPointLightElement | null>(null);
  const pointerX = useMotionValue(-10000);
  const pointerY = useMotionValue(-10000);
  const { allImagesLoaded, handleImageLoad } = useLoadedImages(
    productEmptyStateObjects.map((object) => object.href),
  );

  useEffect(() => {
    function updateSvgBounds() {
      svgBoundsRef.current = svgRef.current?.getBoundingClientRect() ?? null;
    }

    function syncLight(event: PointerEvent) {
      const bounds = svgBoundsRef.current;
      const pointLight = pointLightRef.current;
      const glassPointLight = glassPointLightRef.current;

      if (!bounds || !pointLight || !glassPointLight) return;

      const x = ((event.clientX - bounds.left) / bounds.width) * viewBoxWidth;
      const y = ((event.clientY - bounds.top) / bounds.height) * viewBoxHeight;

      pointLight.setAttribute('x', Math.round(x).toString());
      pointLight.setAttribute('y', Math.round(y).toString());
      glassPointLight.setAttribute('x', Math.round(x).toString());
      glassPointLight.setAttribute('y', Math.round(y).toString());
      pointerX.set(x);
      pointerY.set(y);
    }

    function resetPointer() {
      pointerX.set(-10000);
      pointerY.set(-10000);
    }

    updateSvgBounds();
    window.addEventListener('pointermove', syncLight);
    window.addEventListener('pointerleave', resetPointer);
    window.addEventListener('blur', resetPointer);
    window.addEventListener('resize', updateSvgBounds);
    window.addEventListener('scroll', updateSvgBounds, true);

    return () => {
      window.removeEventListener('pointermove', syncLight);
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
        <defs>
          <ProductsEmptyStateObjectFilter
            id="products-empty-state-object-shadow"
            lighting={objectLighting}
            pointLightRef={pointLightRef}
          />
          <ProductsEmptyStateObjectFilter
            id="products-empty-state-glass-object-shadow"
            lighting={glassTableLighting}
            pointLightRef={glassPointLightRef}
          />
        </defs>

        {productEmptyStateObjects.map((object) => (
          <ProductEmptyStateObject
            key={object.id}
            object={object}
            pointerX={pointerX}
            pointerY={pointerY}
            imagesLoaded={allImagesLoaded}
            onImageLoad={handleImageLoad}
          />
        ))}
      </svg>
    </div>
  );
}
