import { m } from 'motion/react';
import { motionEasings } from '~/ui/tokens/motion';


export function NavigationGroupHeader({
  title,
  isNavOpen,
}: {
  title: string;
  isNavOpen: boolean;
}) {
  return (
    <m.div
      aria-hidden
      className="pointer-events-none relative flex h-8 shrink-0 items-end justify-start px-5.5 pb-1 text-sm font-medium text-muted-foreground"
      variants={{
        hidden: {
          opacity: 0,
          filter: 'blur(2px)',
          x: -60,
        },
        visible: {
          opacity: 1,
          filter: 'blur(0px)',
          x: 0,
        },
      }}
      transition={{ duration: 0.4, ease: motionEasings.ease }}
    >
      <m.hr
        initial={false}
        animate={{
          opacity: isNavOpen ? 0 : 1,
          filter: isNavOpen ? 'blur(4px)' : 'blur(0px)',
        }}
        transition={{
          duration: 0.2,
          ease: motionEasings.ease,
          delay: isNavOpen ? 0 : 0.275,
        }}
        className="absolute inset-x-5.5 top-1/2 h-px -translate-y-1/2 border-t border-border"
      />

      <m.span
        className="block whitespace-nowrap"
        initial={false}
        animate={{
          opacity: isNavOpen ? 1 : 0,
          filter: isNavOpen ? 'blur(0px)' : 'blur(2px)',
        }}
        transition={{ duration: 0.2, ease: motionEasings.ease }}
      >
        {title}
      </m.span>
    </m.div>
  );
}
