import React from 'react';
import type {
  Map as MapLibreMapInstance,
  Marker as MapLibreMarkerInstance,
  StyleSpecification,
} from 'maplibre-gl';
import { clsx } from 'clsx';
import 'maplibre-gl/dist/maplibre-gl.css';

export type MapPosition = [number, number];
type MapMarkerPlacement = 'coordinate' | 'overlay';
type MapLibreMarkerConstructor = typeof import('maplibre-gl').Marker;
type MapCamera = {
  latitude: number;
  longitude: number;
  offset: MapPosition;
  zoom: number;
};

const defaultMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f7f1df' },
    },
    {
      id: 'landcover-natural',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: [
        'match',
        ['get', 'class'],
        ['wood', 'grass', 'scrub', 'farmland', 'meadow'],
        true,
        false,
      ],
      paint: { 'fill-color': '#f7f1df' },
    },
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: { 'fill-color': '#f7f1df' },
    },
    {
      id: 'aeroway-area',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'aeroway',
      filter: ['match', ['get', 'class'], ['runway', 'taxiway'], true, false],
      paint: { 'fill-color': '#cfb2db', 'fill-opacity': 0.6 },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': '#a2daf2' },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: { 'line-color': '#a2daf2', 'line-width': 1.5 },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-color': '#f7f1df',
        'fill-outline-color': '#eadfc9',
        'fill-opacity': 0.75,
      },
    },
    {
      id: 'road-local',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: [
        'match',
        ['get', 'class'],
        ['minor', 'service', 'track', 'path'],
        true,
        false,
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffffff',
        'line-width': [
          'interpolate',
          ['exponential', 1.4],
          ['zoom'],
          11,
          0.5,
          16,
          5,
        ],
      },
    },
    {
      id: 'road-arterial-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: [
        'match',
        ['get', 'class'],
        ['primary', 'secondary', 'tertiary', 'trunk'],
        true,
        false,
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#f1dfb0',
        'line-width': [
          'interpolate',
          ['exponential', 1.4],
          ['zoom'],
          8,
          1.5,
          16,
          9,
        ],
      },
    },
    {
      id: 'road-arterial',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: [
        'match',
        ['get', 'class'],
        ['primary', 'secondary', 'tertiary', 'trunk'],
        true,
        false,
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffefc5',
        'line-width': [
          'interpolate',
          ['exponential', 1.4],
          ['zoom'],
          8,
          1,
          16,
          7,
        ],
      },
    },
    {
      id: 'road-motorway-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'motorway'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#f3be30',
        'line-width': [
          'interpolate',
          ['exponential', 1.4],
          ['zoom'],
          6,
          2.5,
          16,
          11,
        ],
      },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'motorway'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffdb79',
        'line-width': [
          'interpolate',
          ['exponential', 1.4],
          ['zoom'],
          6,
          1.5,
          16,
          8,
        ],
      },
    },
  ],
};

const mapAnimationEasing = (time: number) => 1 - (1 - time) ** 3;
const mapPositionDurationMs = 800;
const mapMarkerFadeDurationMs = 300;

function createCoordinateMarker({
  Marker,
  latitude,
  longitude,
  markerClassName,
  markerSizeClassName,
  visible = true,
}: {
  Marker: MapLibreMarkerConstructor;
  latitude: number;
  longitude: number;
  markerClassName?: string;
  markerSizeClassName: string;
  visible?: boolean;
}) {
  const markerElement = document.createElement('div');
  const markerImage = document.createElement('img');

  markerElement.className = 'pointer-events-none will-change-[opacity]';
  markerElement.style.opacity = visible ? '1' : '0';
  markerImage.src = '/images/map/pin.svg';
  markerImage.alt = '';
  markerImage.setAttribute('aria-hidden', 'true');
  markerImage.className = clsx(
    'scale-100',
    markerSizeClassName,
    markerClassName,
  );
  markerElement.append(markerImage);

  return new Marker({
    anchor: 'center',
    element: markerElement,
  }).setLngLat([longitude, latitude]);
}

function Map({
  center,
  mapStyle = defaultMapStyle,
  zoom = 12,
  className,
  mapLayerClassName,
  marker = true,
  markerClassName,
  markerPlacement = 'coordinate',
  markerSizeClassName = 'size-16',
  ...props
}: {
  center: MapPosition;
  mapStyle?: StyleSpecification;
  mapLayerClassName?: string;
  marker?: boolean;
  markerClassName?: string;
  markerPlacement?: MapMarkerPlacement;
  markerSizeClassName?: string;
  zoom?: number;
} & Omit<React.ComponentProps<'div'>, 'children' | 'className'> & {
    className?: string;
  }) {
  const [latitude, longitude] = center;
  const mapRef = React.useRef<HTMLDivElement>(null);
  const overlayMarkerRef = React.useRef<HTMLImageElement>(null);
  const mapInstanceRef = React.useRef<MapLibreMapInstance | null>(null);
  const markerConstructorRef = React.useRef<MapLibreMarkerConstructor | null>(
    null,
  );
  const markerInstanceRef = React.useRef<MapLibreMarkerInstance | null>(null);
  const outgoingMarkerRef = React.useRef<MapLibreMarkerInstance | null>(null);
  const markerPositionRef = React.useRef({ latitude, longitude });
  const markerFadeTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const overlayMarkerOffsetRef = React.useRef<MapPosition>([0, 0]);
  const cameraRef = React.useRef<MapCamera>({
    latitude,
    longitude,
    offset: overlayMarkerOffsetRef.current,
    zoom,
  });
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    cameraRef.current = {
      latitude,
      longitude,
      offset: overlayMarkerOffsetRef.current,
      zoom,
    };
  }, [latitude, longitude, zoom]);

  React.useEffect(() => {
    const element = mapRef.current;
    const overlayMarkerElement = overlayMarkerRef.current;
    const syncOverlayMarkerOffset = (nextOffset: MapPosition) => {
      const currentOffset = overlayMarkerOffsetRef.current;

      if (
        currentOffset[0] === nextOffset[0] &&
        currentOffset[1] === nextOffset[1]
      ) {
        return;
      }

      overlayMarkerOffsetRef.current = nextOffset;
      cameraRef.current = {
        ...cameraRef.current,
        offset: nextOffset,
      };

      mapInstanceRef.current?.easeTo({
        center: [cameraRef.current.longitude, cameraRef.current.latitude],
        duration: 0,
        offset: nextOffset,
        zoom: cameraRef.current.zoom,
      });
    };

    if (
      !element ||
      !overlayMarkerElement ||
      !marker ||
      markerPlacement !== 'overlay'
    ) {
      syncOverlayMarkerOffset([0, 0]);
      return;
    }

    const updateOverlayMarkerOffset = () => {
      const elementRect = element.getBoundingClientRect();
      const markerRect = overlayMarkerElement.getBoundingClientRect();
      const nextOffset: MapPosition = [
        Math.round(
          markerRect.left +
            markerRect.width / 2 -
            (elementRect.left + elementRect.width / 2),
        ),
        Math.round(
          markerRect.top +
            markerRect.height / 2 -
            (elementRect.top + elementRect.height / 2),
        ),
      ];

      syncOverlayMarkerOffset(nextOffset);
    };

    updateOverlayMarkerOffset();

    const resizeObserver = new ResizeObserver(updateOverlayMarkerOffset);
    resizeObserver.observe(element);
    resizeObserver.observe(overlayMarkerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [marker, markerPlacement, markerClassName, markerSizeClassName]);

  React.useEffect(() => {
    const element = mapRef.current;

    if (!element) return;

    let isMounted = true;

    import('maplibre-gl')
      .then(({ Map: MapLibreMap, Marker }) => {
        if (!isMounted) return;
        const camera = cameraRef.current;

        const map = new MapLibreMap({
          attributionControl: false,
          center: [camera.longitude, camera.latitude],
          container: element,
          interactive: false,
          style: mapStyle,
          zoom: camera.zoom,
        });

        map.easeTo({
          center: [camera.longitude, camera.latitude],
          duration: 0,
          offset: camera.offset,
          zoom: camera.zoom,
        });

        mapInstanceRef.current = map;
        markerConstructorRef.current = Marker;
        markerPositionRef.current = {
          latitude: camera.latitude,
          longitude: camera.longitude,
        };

        if (marker && markerPlacement === 'coordinate') {
          markerInstanceRef.current = createCoordinateMarker({
            Marker,
            latitude: camera.latitude,
            longitude: camera.longitude,
            markerClassName,
            markerSizeClassName,
          }).addTo(map);
        }
      })
      .catch((mapError: unknown) => {
        if (!isMounted) return;
        setError(
          mapError instanceof Error ? mapError.message : 'Map failed to load',
        );
      });

    return () => {
      isMounted = false;
      if (markerFadeTimeoutRef.current) {
        clearTimeout(markerFadeTimeoutRef.current);
      }
      markerFadeTimeoutRef.current = null;
      outgoingMarkerRef.current?.remove();
      outgoingMarkerRef.current = null;
      markerInstanceRef.current?.remove();
      markerInstanceRef.current = null;
      markerConstructorRef.current = null;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [mapStyle, marker, markerClassName, markerPlacement, markerSizeClassName]);

  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const markerInstance = markerInstanceRef.current;
    const Marker = markerConstructorRef.current;
    const previousMarkerPosition = markerPositionRef.current;
    const coordinatesChanged =
      previousMarkerPosition.latitude !== latitude ||
      previousMarkerPosition.longitude !== longitude;
    const cleanupMarkerFade = () => {
      if (markerFadeTimeoutRef.current) {
        clearTimeout(markerFadeTimeoutRef.current);
      }
      markerFadeTimeoutRef.current = null;
      outgoingMarkerRef.current?.remove();
      outgoingMarkerRef.current = null;
    };

    if (!map) return;

    cleanupMarkerFade();

    if (
      marker &&
      markerPlacement === 'coordinate' &&
      Marker &&
      coordinatesChanged
    ) {
      const previousMarker = markerInstance;
      const nextMarker = createCoordinateMarker({
        Marker,
        latitude,
        longitude,
        markerClassName,
        markerSizeClassName,
        visible: false,
      }).addTo(map);

      markerInstanceRef.current = nextMarker;
      outgoingMarkerRef.current = previousMarker;
      previousMarker?.getElement().animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: mapMarkerFadeDurationMs,
        easing: 'ease-out',
        fill: 'forwards',
      });
      const nextMarkerElement = nextMarker.getElement();
      nextMarkerElement.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: mapMarkerFadeDurationMs,
        easing: 'ease-out',
        fill: 'forwards',
      });
      nextMarkerElement.style.opacity = '1';

      markerFadeTimeoutRef.current = setTimeout(() => {
        previousMarker?.remove();
        outgoingMarkerRef.current = null;
        markerFadeTimeoutRef.current = null;
      }, mapMarkerFadeDurationMs);
    } else {
      markerInstance?.setLngLat([longitude, latitude]);
    }

    markerPositionRef.current = { latitude, longitude };

    map.easeTo({
      center: [longitude, latitude],
      duration: mapPositionDurationMs,
      easing: mapAnimationEasing,
      essential: true,
      offset: overlayMarkerOffsetRef.current,
      zoom,
    });

    return cleanupMarkerFade;
  }, [
    latitude,
    longitude,
    marker,
    markerClassName,
    markerPlacement,
    markerSizeClassName,
    zoom,
  ]);

  return (
    <div
      className={clsx(
        'relative size-full overflow-hidden bg-gray-100',
        className,
      )}
      {...props}
    >
      <div ref={mapRef} className={clsx('size-full', mapLayerClassName)} />
      {marker && markerPlacement === 'overlay' ? (
        <img
          ref={overlayMarkerRef}
          src="/images/map/pin.svg"
          alt=""
          aria-hidden
          className={clsx(
            'pointer-events-none absolute transition-[opacity,scale] ease-out will-change-[opacity,transform]',
            markerSizeClassName,
            markerClassName ??
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'scale-100 opacity-100',
          )}
        />
      ) : null}
      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-gray-100 text-sm text-muted-foreground">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export { Map, defaultMapStyle };
