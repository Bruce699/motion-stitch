import { m } from 'motion/react';
import React from 'react';
import { motionEasings } from '~/ui/tokens/motion';

const wordDelaySeconds = 0.032;
const wordAnimationDurationSeconds = 0.2;

function splitWords(content: string) {
  return content.trim().split(/\s+/).filter(Boolean);
}

export function getSidekickWordRevealDurationMs(content: string) {
  return splitWords(content).length * wordDelaySeconds * 1000 + 220;
}

export function SidekickWordReveal({ content }: { content: string }) {
  const words = React.useMemo(() => splitWords(content), [content]);

  return (
    <>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <m.span
            initial={{ opacity: 0, y: 3, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: index * wordDelaySeconds,
              duration: wordAnimationDurationSeconds,
              ease: motionEasings.easeOut,
            }}
            className="inline-block"
          >
            {word}
          </m.span>{' '}
        </React.Fragment>
      ))}
    </>
  );
}
