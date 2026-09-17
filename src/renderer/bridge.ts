import type { Command } from "../core/schema";
import type { ViewRequest } from "../core/context";
import { decodeFrame, FRAME_CONTENT_TYPE } from "../core/frame-wire";
import {
  createRuntimeConnection,
  connectRuntimeEvents,
} from "./runtime-connection";
import { createPageExitPersistence, type PageExitProvider } from "./page-exit";

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
const connection = createRuntimeConnection();
let closeEvents = () => {};
const pageExit = createPageExitPersistence({
  viewId,
  // A keepalive mutation is never replayed, including after ambiguous failure.
  send: (init) => fetch("/api", init),
  close: () => closeEvents(),
});
export const registerPageExit = (provider: PageExitProvider) =>
  pageExit.register(provider);
export async function call<T = any>(command: Command): Promise<T> {
  if (worker) return window.tilt.invoke<T>(command);
  const response = await connection.request({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(command.type === "frame" && command.includeContext
        ? { Accept: FRAME_CONTENT_TYPE }
        : {}),
    },
    body: JSON.stringify({ ...command, viewId }),
    credentials: "same-origin",
  });
  if (
    response.ok &&
    response.headers.get("content-type")?.split(";")[0] === FRAME_CONTENT_TYPE
  )
    return decodeFrame(await response.arrayBuffer()) as T;
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
  const changed = () => {
    for (const callback of changes) callback();
  };
  closeEvents = connectRuntimeEvents({
    url: "/events?viewId=" + viewId,
    recover: connection.recover,
    listeners: {
      connected: changed,
      change: changed,
      request: (event) => {
        const request = JSON.parse((event as MessageEvent).data);
        for (const callback of requests) callback(request);
      },
    },
  });
  window.addEventListener("pagehide", () => {
    void pageExit.finish().catch(() => {});
  });
  // A back/forward-cache restore cannot reuse the terminal viewer identity.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });
}
