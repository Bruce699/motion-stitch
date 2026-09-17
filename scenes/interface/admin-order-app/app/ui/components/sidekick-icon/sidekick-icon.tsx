import { useFeatureFlags } from '~/feature-flags';
import { SidekickIconClassic } from './sidekick-icon-classic';
import { SidekickIconOrb } from './sidekick-icon-orb';
import {
  SidekickIcon as SidekickIconShader,
  type SidekickIconTheme,
} from './sidekick-icon-shader';

export type SidekickIconState = 'idle' | 'active' | 'loading';
export type SidekickIconVariant = 'orb' | 'shader' | 'classic';

export function SidekickIcon({
  state = 'idle',
  theme,
  variant,
}: {
  state?: SidekickIconState;
  theme?: SidekickIconTheme;
  variant?: SidekickIconVariant;
}) {
  const selectedVariant = useFeatureFlags(
    (store) => store.flags.sidekickIconVariant,
  );
  const iconVariant = variant ?? selectedVariant;

  if (iconVariant === 'classic') {
    return <SidekickIconClassic />;
  }

  if (iconVariant === 'shader') {
    return <SidekickIconShader state={state} theme={theme} />;
  }

  return <SidekickIconOrb state={state} />;
}
