import type { Command } from "../core/schema";
import type { ViewRequest } from "../core/context";

const worker = new URLSearchParams(location.search).has("render");
export const viewId = crypto.randomUUID();
export const savedView = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("tilt-view") || "null");
  } catch {
    return null;
  }
})();
const changes = new Set<() => void>();
const requests = new Set<(request: ViewRequest) => void>();
export async function call<T = any>(command: Command): Promise<T> {
  if (worker) return window.tilt.invoke<T>(command);
  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...command, viewId }),
    credentials: "same-origin",
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Tilt runtime disconnected");
  return result;
}
export const onChange = (callback: () => void) => {
  changes.add(callback);
  return () => {
    changes.delete(callback);
  };
};
export const onRequest = (callback: (request: ViewRequest) => void) => {
  requests.add(callback);
  return () => {
    requests.delete(callback);
  };
};
if (!worker) {
  const events = new EventSource("/events?viewId=" + viewId);
  events.addEventListener("connected", () => {
    for (const callback of changes) callback();
  });
  events.addEventListener("change", () => {
    for (const callback of changes) callback();
  });
  events.addEventListener("request", (event) => {
    const request = JSON.parse((event as MessageEvent).data);
    for (const callback of requests) callback(request);
  });
  window.addEventListener("pagehide", () => events.close());
}
