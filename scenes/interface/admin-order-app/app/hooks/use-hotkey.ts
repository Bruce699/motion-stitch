import { useHotkeys, type Options } from 'react-hotkeys-hook';

export function useHotkey(
  key: string,
  callback: () => void,
  optionsOrDeps?: Partial<Options> | unknown[],
  dependencies?: unknown[],
) {
  const isOptions =
    typeof optionsOrDeps === 'object' &&
    optionsOrDeps !== null &&
    !Array.isArray(optionsOrDeps);
  const options = isOptions ? (optionsOrDeps as Partial<Options>) : undefined;
  const deps = isOptions
    ? (dependencies ?? [])
    : ((optionsOrDeps as unknown[]) ?? []);

  return useHotkeys(
    key,
    callback,
    {
      enabled: options?.enabled ?? true,
      enableOnFormTags: options?.enableOnFormTags ?? true,
      preventDefault: options?.preventDefault ?? true,
      ...options,
    },
    deps,
  );
}
