// All controls share one sequence, including the end of the previous gesture.
// History shortcuts wait for it before moving the file journal.
let pending: Promise<unknown> = Promise.resolve();
export function queueControlEdit<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.catch(() => undefined);
  return result;
}
export const flushControlEdits = () => pending;
