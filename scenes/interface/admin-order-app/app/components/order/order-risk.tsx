import { AnimatePresence } from 'motion/react';
import type { OrderRisk as OrderRiskData } from '~/data/orders';
import { clsx } from 'clsx';

const riskLevels = ['Low', 'Medium', 'High'] as const;

const activeRiskBarClasses: Record<(typeof riskLevels)[number], string> = {
  Low: 'after:bg-[radial-gradient(50%_50%_at_50%_50%,#57CD4C_0%,#4AC93E_100%)] after:shadow-[0_0_3px_1px_rgba(117,214,108,0.25),inset_0_1px_1px_0_rgba(0,0,0,0.07),0_0_0_1px_rgba(255,255,255,0.80)]',
  Medium:
    'after:bg-[radial-gradient(50%_50%_at_50%_50%,#FFD84D_0%,#F4C431_100%)] after:shadow-[0_0_3px_1px_rgba(244,196,49,0.25),inset_0_1px_1px_0_rgba(0,0,0,0.07),0_0_0_1px_rgba(255,255,255,0.80)]',
  High: 'after:bg-[radial-gradient(50%_50%_at_50%_50%,#FF6B5F_0%,#F04438_100%)] after:shadow-[0_0_3px_1px_rgba(240,68,56,0.25),inset_0_1px_1px_0_rgba(0,0,0,0.07),0_0_0_1px_rgba(255,255,255,0.80)]',
};

export function OrderRisk({ risk }: { risk: OrderRiskData }) {
  return (
    <>
      <AnimatePresence mode="wait" initial={false}></AnimatePresence>
      <div className="grid grid-cols-3 gap-2">
        {riskLevels.map((level) => {
          const active = level === risk.level;
          return (
            <div key={level} className="mt-2 flex flex-col gap-1.5">
              <div
                className={clsx(
                  'relative h-1.5 rounded-full bg-gray-200 after:absolute after:inset-0 after:rounded-full after:opacity-0 after:transition-opacity after:ease-out',
                  active && 'after:opacity-100',
                  activeRiskBarClasses[level],
                )}
              />
              <span
                className={clsx(
                  'text-center text-sm transition-[color,font-weight] ease-out',
                  active
                    ? 'font-medium text-primary'
                    : 'font-normal text-secondary',
                )}
              >
                {level}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
