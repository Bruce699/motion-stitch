import { m } from 'motion/react';
import { ShimmerText } from '~/ui/components/shimmer-text/shimmer-text';
import { motionEasings } from '~/ui/tokens/motion';

export function SidekickToolCall({ text }: { text: string }) {
  return (
    <m.p
      key={text}
      initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration: 0.26,
        ease: motionEasings.ease,
      }}
      className="mb-2 max-w-[min(760px,84%)] overflow-hidden text-base leading-5 whitespace-nowrap"
    >
      <ShimmerText className="[--shimmer-text-color:var(--color-gray-700)]">
        {text}
      </ShimmerText>
    </m.p>
  );
}
