export const motionDurations = {
  fast: 0.1,
  base: 0.15,
  slow: 0.25,
  slower: 0.4,
} as const;

export const motionEasings = {
  ease: [0.2, 0.8, 0, 1],
  easeOut: [0.2, 0.8, 0, 1],
  easeIn: [1, 0, 0.6, 1],
} as const;
