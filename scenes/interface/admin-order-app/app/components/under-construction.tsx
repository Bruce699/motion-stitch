export function UnderConstruction() {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-8 py-12 text-center">
      <div
        aria-hidden
        className="bg-sky-50/20 absolute inset-0 -z-10 mask-[linear-gradient(to_right,transparent,black_30%,black_70%,transparent),linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] mask-intersect"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(14_165_233/0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgb(14_165_233/0.045)_1px,transparent_1px)] bg-size-[24px_24px] bg-position-[16px_0]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(14_165_233/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(14_165_233/0.08)_1px,transparent_1px)] bg-size-[96px_96px] bg-position-[16px_0]" />
      </div>

      <div className="relative flex flex-col items-center">
        <div className="mb-6 flex size-24 items-center justify-center">
          <BlueprintShopifyLogo />
        </div>
        <p className="text-lg font-medium text-secondary">
          This page is under construction
        </p>
      </div>
    </div>
  );
}

function BlueprintShopifyLogo() {
  return (
    <svg
      aria-hidden
      className="size-20 text-[rgb(14_165_233)] drop-shadow-[0_1px_0_rgb(255_255_255/0.9)]"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M26.05 6.21C26.03 6.05 25.9 5.97 25.78 5.96C25.67 5.94 23.46 5.91 23.46 5.91C23.46 5.91 21.61 4.07 21.42 3.88C21.24 3.69 20.88 3.75 20.74 3.79C20.74 3.79 20.39 3.9 19.81 4.09C19.72 3.76 19.57 3.37 19.37 2.97C18.71 1.68 17.74 1 16.58 1H16.57C16.49 1 16.41 1 16.33 1.01C16.29 0.97 16.26 0.93 16.22 0.89C15.71 0.33 15.06 0.06 14.28 0.08C12.78 0.13 11.28 1.24 10.06 3.22C9.21 4.61 8.56 6.37 8.37 7.72C6.64 8.27 5.43 8.65 5.41 8.66C4.53 8.94 4.51 8.97 4.39 9.81C4.3 10.45 2.02 28.55 2.02 28.55L21.16 31.94L29.46 29.83C29.46 29.83 26.07 6.38 26.05 6.21ZM18.85 4.39C18.41 4.53 17.91 4.69 17.37 4.87C17.36 4.09 17.26 3 16.91 2.06C18.05 2.28 18.61 3.6 18.85 4.39ZM16.37 5.18C15.36 5.5 14.27 5.85 13.17 6.2C13.48 4.98 14.07 3.78 14.79 2.99C15.05 2.7 15.43 2.37 15.87 2.18C16.29 3.07 16.38 4.33 16.37 5.18ZM14.32 1.11C14.67 1.1 14.97 1.18 15.22 1.35C14.82 1.57 14.42 1.88 14.05 2.28C13.09 3.34 12.36 4.97 12.07 6.54C11.16 6.83 10.26 7.12 9.44 7.38C9.96 4.9 11.99 1.18 14.32 1.11Z"
        fill="rgb(240 249 255 / 0.65)"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M26.05 6.21C26.03 6.05 25.9 5.97 25.78 5.96C25.67 5.94 23.46 5.91 23.46 5.91C23.46 5.91 21.61 4.07 21.42 3.88C21.24 3.69 20.88 3.75 20.74 3.79C20.74 3.79 20.39 3.9 19.81 4.09C19.72 3.76 19.57 3.37 19.37 2.97C18.71 1.68 17.74 1 16.58 1H16.57C16.49 1 16.41 1 16.33 1.01C16.29 0.97 16.26 0.93 16.22 0.89C15.71 0.33 15.06 0.06 14.28 0.08C12.78 0.13 11.28 1.24 10.06 3.22C9.21 4.61 8.56 6.37 8.37 7.72C6.64 8.27 5.43 8.65 5.41 8.66C4.53 8.94 4.51 8.97 4.39 9.81C4.3 10.45 2.02 28.55 2.02 28.55L21.16 31.94L29.46 29.83C29.46 29.83 26.07 6.38 26.05 6.21ZM18.85 4.39C18.41 4.53 17.91 4.69 17.37 4.87C17.36 4.09 17.26 3 16.91 2.06C18.05 2.28 18.61 3.6 18.85 4.39ZM16.37 5.18C15.36 5.5 14.27 5.85 13.17 6.2C13.48 4.98 14.07 3.78 14.79 2.99C15.05 2.7 15.43 2.37 15.87 2.18C16.29 3.07 16.38 4.33 16.37 5.18ZM14.32 1.11C14.67 1.1 14.97 1.18 15.22 1.35C14.82 1.57 14.42 1.88 14.05 2.28C13.09 3.34 12.36 4.97 12.07 6.54C11.16 6.83 10.26 7.12 9.44 7.38C9.96 4.9 11.99 1.18 14.32 1.11Z"
        fill="url(#under-construction-shopify-hatch)"
        opacity="0.7"
      />
      <path
        d="M25.78 5.96C25.66 5.95 23.45 5.91 23.45 5.91C23.45 5.91 21.6 4.07 21.42 3.88C21.35 3.81 21.26 3.78 21.16 3.76V31.58C21.16 31.76 21.33 31.9 21.51 31.85L29.45 29.83C29.45 29.83 26.07 6.38 26.05 6.22C26.03 6.06 25.89 5.97 25.78 5.96Z"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M16.56 10.33L15.6 14.02C15.6 14.02 14.53 13.52 13.25 13.6C11.39 13.72 11.37 14.93 11.38 15.23C11.49 16.89 15.73 17.25 15.97 21.12C16.15 24.16 14.39 26.24 11.85 26.41C8.8 26.61 7.12 24.76 7.12 24.76L7.77 21.94C7.77 21.94 9.46 23.25 10.81 23.16C11.69 23.1 12.01 22.37 11.98 21.85C11.85 19.69 8.39 19.82 8.18 16.28C7.99 13.3 9.9 10.28 14.12 10C15.73 9.9 16.56 10.33 16.56 10.33Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        vectorEffect="non-scaling-stroke"
      />
      <defs>
        <pattern
          id="under-construction-shopify-hatch"
          width="2.4"
          height="2.4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-37.5)"
        >
          <path
            d="M0 1.2H2.4"
            stroke="currentColor"
            strokeWidth="0.4"
            opacity="0.15"
          />
        </pattern>
      </defs>
    </svg>
  );
}
