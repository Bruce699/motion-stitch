import React from 'react';

export function MediaStopIcon({
  size = 18,
  title,
  width,
  height,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width || size}
      height={height || size}
      viewBox="0 0 18 18"
      fill="none"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <rect
        x="4"
        y="4"
        width="10"
        height="10"
        rx="2"
        fill="currentColor"
      />
    </svg>
  );
}
