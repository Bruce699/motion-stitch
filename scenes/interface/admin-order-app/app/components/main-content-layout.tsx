import React from 'react';
import { clsx } from 'clsx';

type MainContentLayoutVariant =
  | 'constrained'
  | 'constrainedWide'
  | 'fullWidth'
  | 'bleed';

const mainContentLayoutBaseClasses = 'flex';

const mainContentLayoutVariants: Record<MainContentLayoutVariant, string> = {
  constrained:
    'mx-auto w-fit shrink-0 flex-col gap-6 px-8 pt-4 pb-25 @5xl:flex-row @5xl:gap-12',
  constrainedWide:
    'mx-auto w-fit shrink-0 flex-col gap-6 px-8 pt-4 pb-25 @5xl:flex-row @5xl:gap-12',
  fullWidth:
    'w-full shrink-0 flex-col gap-6 pb-25 @6xl:flex-row @6xl:gap-12',
  bleed: 'w-full flex-1 flex-col',
};

const mainContentLayoutMainVariants: Record<MainContentLayoutVariant, string> =
  {
    constrained: 'w-180 shrink-0',
    constrainedWide: 'w-240 shrink-0',
    fullWidth: 'flex-1',
    bleed: 'flex flex-1 flex-col',
  };

const mainContentLayoutAsideVariants: Record<
  Exclude<MainContentLayoutVariant, 'bleed'>,
  string
> = {
  constrained: 'w-160 shrink-0 @5xl:w-70',
  constrainedWide: 'w-200 shrink-0 @5xl:w-70',
  fullWidth: '@6xl:w-70 @6xl:shrink-0',
};

export function MainContentLayout({
  children,
  aside,
  variant = 'constrained',
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  variant?: MainContentLayoutVariant;
}) {
  return (
    <div
      className={clsx(
        mainContentLayoutBaseClasses,
        mainContentLayoutVariants[variant],
      )}
    >
      <main className={mainContentLayoutMainVariants[variant]}>{children}</main>
      {aside && variant !== 'bleed' && (
        <aside className={mainContentLayoutAsideVariants[variant]}>
          {aside}
        </aside>
      )}
    </div>
  );
}
