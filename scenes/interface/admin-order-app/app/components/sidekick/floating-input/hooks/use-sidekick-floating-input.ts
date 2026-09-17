import React from 'react';

export type SidekickFloatingInputConfig = {
  chatThreadId?: string;
  inputOnly: boolean;
};

export type SidekickFloatingInputOptions = {
  chatThreadId?: string;
  inputOnly?: boolean;
};

const defaultSidekickFloatingInputConfig: SidekickFloatingInputConfig = {
  chatThreadId: undefined,
  inputOnly: false,
};

let sidekickFloatingInputConfig: SidekickFloatingInputConfig =
  defaultSidekickFloatingInputConfig;
const listeners = new Set<() => void>();

function setSidekickFloatingInputConfig(config: SidekickFloatingInputConfig) {
  sidekickFloatingInputConfig = config;
  listeners.forEach((listener) => listener());
}

export function useSidekickFloatingInputState() {
  const config = React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    () => sidekickFloatingInputConfig,
    () => sidekickFloatingInputConfig,
  );

  return { config };
}

export function useSidekickFloatingInput(
  options: SidekickFloatingInputOptions,
) {
  const config = React.useMemo(
    () => ({
      chatThreadId: options.chatThreadId,
      inputOnly: options.inputOnly ?? false,
    }),
    [options.chatThreadId, options.inputOnly],
  );

  React.useLayoutEffect(() => {
    setSidekickFloatingInputConfig(config);

    return () => {
      setSidekickFloatingInputConfig(defaultSidekickFloatingInputConfig);
    };
  }, [config]);
}
