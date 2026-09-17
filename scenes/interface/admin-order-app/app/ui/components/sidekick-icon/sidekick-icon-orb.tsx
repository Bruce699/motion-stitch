import React from 'react';

import type { SidekickIconState } from './sidekick-icon';
import { SidekickBackgroundOrbsClip } from './sidekick-background-orbs';

const sidekickIdleFaceSrc = '/sidekick/face-black.webm';

const sidekickFaceSegments: Record<
  SidekickIconState,
  { start: number; end: number }
> = {
  idle: { start: 0, end: 5.1 },
  active: { start: 0, end: 5.1 },
  loading: { start: 5.45, end: 8.2 },
};

export function SidekickIconOrb({
  state = 'idle',
}: {
  state?: SidekickIconState;
}) {
  return (
    <span
      aria-hidden="true"
      data-state={state}
      className="sidekick-orb group relative isolate inline-block size-5 flex-none overflow-visible align-middle contain-[layout]"
    >
      <SidekickBackgroundOrbsClip />
      <SidekickFace
        play={state !== 'idle'}
        state={state}
        src={sidekickIdleFaceSrc}
      />
    </span>
  );
}

function SidekickFace({
  play,
  state,
  src,
}: {
  play: boolean;
  state: SidekickIconState;
  src: string;
}) {
  const segment = sidekickFaceSegments[state];

  return (
    <span
      className="pointer-events-none absolute inset-0 z-5 flex items-center justify-center mix-blend-overlay"
      aria-hidden="true"
    >
      <SegmentedFaceVideo play={play} src={src} segment={segment} />
    </span>
  );
}

function SegmentedFaceVideo({
  play,
  segment,
  src,
}: {
  play: boolean;
  segment: { start: number; end: number };
  src: string;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const seekToStart = () => {
      video.currentTime = segment.start;
      if (play) {
        void video.play();
      } else {
        video.pause();
      }
    };

    const loopSegment = () => {
      if (video.currentTime >= segment.end) {
        video.currentTime = segment.start;
        if (play) void video.play();
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      seekToStart();
    } else {
      video.addEventListener('loadedmetadata', seekToStart, { once: true });
    }

    video.addEventListener('timeupdate', loopSegment);

    if (play) {
      void video.play();
    } else {
      video.pause();
    }

    return () => {
      video.removeEventListener('loadedmetadata', seekToStart);
      video.removeEventListener('timeupdate', loopSegment);
    };
  }, [play, segment.end, segment.start, src]);

  return (
    <video
      ref={videoRef}
      className="mt-[3%] size-[272%] origin-center scale-[2.6] object-contain"
      src={src}
      autoPlay={play}
      muted
      playsInline
    />
  );
}
