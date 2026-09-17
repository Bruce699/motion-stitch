export type MeasuredGifBlob = {
  bend?: number;
  count?: number;
  height?: number;
  rotation?: number;
  width?: number;
  x?: number;
  y?: number;
};

export type MeasuredGifFrame = {
  frame?: number;
  t?: number;
  blobs?: MeasuredGifBlob[];
};

export const MEASURED_GIF_TIMELINES: Record<
  string,
  {
    duration?: number;
    frames?: MeasuredGifFrame[];
  }
> = {};
