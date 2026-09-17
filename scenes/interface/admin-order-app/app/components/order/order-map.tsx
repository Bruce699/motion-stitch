import { Map, type MapPosition } from '~/ui';
import { clsx } from 'clsx';

export function OrderMap({ center }: { center: MapPosition }) {
  return (
    <div
      className={clsx(
        'pointer-events-none absolute -z-1 overflow-hidden',
        'top-0 right-0 size-120',
        'translate-x-1/2 -translate-y-1/2',
        'mask-[radial-gradient(ellipse_17rem_12rem_at_60%_48%,black_0%,black_42%,--alpha(black/70%)_60%,transparent_84%)]',
      )}
      aria-hidden
    >
      <Map
        center={center}
        mapLayerClassName="translate-y-10"
        markerSizeClassName="size-20"
      />
    </div>
  );
}
