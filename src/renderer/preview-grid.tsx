import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const previewTransition = {
  type: "tween" as const,
  duration: 0.3,
  ease: [0.5, 0, 0, 1] as [number, number, number, number],
};

export function PreviewGrid({
  ids,
  aspect,
  children,
  empty,
}: {
  ids: readonly string[];
  aspect: number;
  children: (id: string) => ReactNode;
  empty?: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const selectionKey = ids.join(":");
  const transition = reducedMotion ? { duration: 0 } : previewTransition;

  return (
    <div
      className={`preview-grid count-${ids.length}`}
      style={{ "--preview-aspect": aspect } as CSSProperties}
    >
      {ids.map((id) => (
        <motion.div
          className="preview-cell"
          key={id}
          layout={!reducedMotion}
          // The preview clock renders continuously; only selection changes
          // need layout measurement. Stable keys keep the renderers alive.
          layoutDependency={selectionKey}
          transition={{ layout: transition }}
        >
          <motion.div
            className="preview-picture"
            data-preview-root={id}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              ...transition,
              opacity: { duration: transition.duration, ease: "linear" },
            }}
          >
            {children(id)}
          </motion.div>
        </motion.div>
      ))}
      {!ids.length && empty}
    </div>
  );
}
