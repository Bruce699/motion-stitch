import React from 'react';
import { m } from 'motion/react';
import { motionEasings } from '~/ui/tokens/motion';

const sendArrowTransition = {
  duration: 0.38,
  ease: motionEasings.ease,
} as const;

/** ~1px upward in CSS px when the SVG renders at 24×24 (1 unit in viewBox space). */
const ARROW_HOVER_LIFT_Y = -1;

const sendArrowHoverTransition = {
  duration: 0.15,
  ease: motionEasings.ease,
} as const;

export function SendButtonIcon() {
  const [hovered, setHovered] = React.useState(false);
  const pendingIntroRef = React.useRef(true);

  const y = hovered ? ARROW_HOVER_LIFT_Y : 0;

  const transition =
    pendingIntroRef.current && !hovered
      ? sendArrowTransition
      : sendArrowHoverTransition;

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <path
        d="M0 12C0 5.37 5.37 0 12 0C18.63 0 24 5.37 24 12C24 18.63 18.63 24 12 24C5.37 24 0 18.63 0 12Z"
        fill="#000"
      />
      <m.g
        initial={{ y: 6 }}
        animate={{ y }}
        transition={transition}
        onAnimationComplete={() => {
          if (pendingIntroRef.current && !hovered) {
            pendingIntroRef.current = false;
          }
        }}
      >
        <path
          d="M8.63 11.1L12 7.5M12 7.5L15.38 11.1M12 7.5V16.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </m.g>
    </svg>
  );
}
