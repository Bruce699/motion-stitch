import { animate, spring as createSpring, type MotionValue } from 'motion';
export type Spring = { stiffness: number; damping: number; mass: number };
export const tune = (spring: Spring, speed: number): Spring => ({ ...spring, stiffness: spring.stiffness * speed * speed, damping: spring.damping * speed });
export const BAR = { stiffness: 96.04, damping: 19.6 * .65, mass: 1 };
export const RISE = { stiffness: 158.76, damping: 11.34, mass: 1 };
export const PANEL = tune({ ...BAR, damping: BAR.damping * 1.1 }, 1.22);
export const PANEL_RISE = tune({ ...RISE, damping: RISE.damping * 1.12 }, 1.22);
// Omitting an explicit velocity preserves Motion's current velocity on interruption.
export const retargetValue = (value: MotionValue<number>, target: number, spring: Spring, options: { velocity?: number; onComplete?: () => void } = {}) => animate(value, target, { type: 'spring', ...spring, ...options });

export const PANEL_RETURN = tune(PANEL, 1.6);
export const PANEL_FALL = tune(PANEL_RISE, 1.6);
export const PANEL_SHRINK = tune({ stiffness: 400, damping: 28, mass: .8 }, 1.25);
export const CLOSE = tune({ stiffness: 320, damping: 36, mass: 1 }, 2);
function settlingTime(settings: Spring, from: number, to: number) {
  const generator = createSpring({ ...settings, keyframes: [from, to] });
  for (let ms = 0; ms <= 10000; ms += 10) if (generator.next(ms).done) return ms / 1000;
  return 10;
}
export const WHEEL_INTRO_DURATION = 3 * Math.max(settlingTime(BAR, 66, 360), settlingTime(RISE, 112, 0));
