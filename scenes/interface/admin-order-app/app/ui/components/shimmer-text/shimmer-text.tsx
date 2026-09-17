import type { ComponentProps, ReactNode } from 'react';
import { clsx } from 'clsx';

function ShimmerText({
  children,
  className,
  ...props
}: Omit<ComponentProps<'span'>, 'children'> & {
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        'inline-block animate-[shimmer-text_1.5s_linear_infinite] bg-(--shimmer-text-color) bg-[linear-gradient(135deg,var(--shimmer-text-color)_0%,var(--color-gray-300)_48%,var(--color-gray-300)_52%,var(--shimmer-text-color)_100%)] bg-size-[200%_100%] bg-clip-text bg-no-repeat text-transparent [--shimmer-text-color:var(--color-gray-500)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      <style>{`
        @keyframes shimmer-text {
          0% {
            background-position: 200% 0;
          }

          75%, 100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      {children}
    </span>
  );
}

export { ShimmerText };
