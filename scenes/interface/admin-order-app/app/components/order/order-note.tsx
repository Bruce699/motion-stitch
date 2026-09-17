import { clsx } from 'clsx';

export function OrderNote({ note }: { note: string }) {
  return (
    <div
      data-tilt-id="note"
      className={clsx(
        'relative isolate flex flex-col gap-1.5',
        'before:absolute before:-inset-y-3 before:left-0 before:w-px before:bg-red-200/50 before:mask-[linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]',
      )}
    >
      <p className="px-1.5 font-script font-bold text-muted-foreground">
        Note from customer
      </p>
      <p className="relative max-w-90 leading-5.5 before:absolute before:-inset-x-4 before:inset-y-0 before:-z-1 before:bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_21px,--alpha(var(--color-gray-300)/90%)_22px)] before:mask-[linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]">
        <span className="leading-5[-webkit-box-decoration-break:clone] bg-[#FFE552]/32 box-decoration-clone px-1.5 py-1">
          {note}
        </span>
      </p>
    </div>
  );
}
