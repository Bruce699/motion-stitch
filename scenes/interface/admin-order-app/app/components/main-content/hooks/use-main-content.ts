import React from 'react';

export type MainContentConfig = {
  showBottomScrim: boolean;
  showTopScrim: boolean;
};

export type MainContentOptions = {
  showBottomScrim?: boolean;
  showTopScrim?: boolean;
};

const defaultMainContentConfig: MainContentConfig = {
  showBottomScrim: true,
  showTopScrim: true,
};

let mainContentConfig: MainContentConfig = defaultMainContentConfig;
const listeners = new Set<() => void>();

function setMainContentConfig(config: MainContentConfig) {
  mainContentConfig = config;
  listeners.forEach((listener) => listener());
}

export function useMainContentState() {
  const config = React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    () => mainContentConfig,
    () => mainContentConfig,
  );

  return { config };
}

export function useMainContent(options: MainContentOptions) {
  const config = React.useMemo(
    () => ({
      showBottomScrim: options.showBottomScrim ?? true,
      showTopScrim: options.showTopScrim ?? true,
    }),
    [options.showBottomScrim, options.showTopScrim],
  );

  React.useLayoutEffect(() => {
    setMainContentConfig(config);

    return () => {
      setMainContentConfig(defaultMainContentConfig);
    };
  }, [config]);
}
