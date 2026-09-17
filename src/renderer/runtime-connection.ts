/** Recover a rotated local browser cookie without replaying an executed command. */
export function createRuntimeConnection(fetcher: typeof fetch = fetch) {
  let handshake: Promise<void> | null = null;
  let generation = 0;
  const recover = () => {
    if (!handshake) {
      handshake = (async () => {
        const response = await fetcher("/", {
          credentials: "same-origin",
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(5000),
        });
        await response.body?.cancel();
        if (!response.ok) throw new Error("Tilt runtime disconnected");
        generation++;
      })().finally(() => {
        handshake = null;
      });
    }
    return handshake;
  };
  return {
    recover,
    async request(init: RequestInit) {
      const before = generation;
      const response = await fetcher("/api", init);
      // This code is issued only by the server gate, before reading the command.
      if (response.status !== 401) return response;
      const result = await response
        .clone()
        .json()
        .catch(() => null);
      if (result?.code !== "UNAUTHORIZED") return response;
      if (generation === before) await recover();
      // One retry only. Network failures and command errors are never replayed.
      return fetcher("/api", init);
    },
  };
}

type EventStream = {
  addEventListener(type: string, listener: EventListener): void;
  close(): void;
};

/** EventSource stops reconnecting after HTTP 401, so reopen after the handshake. */
export function connectRuntimeEvents(options: {
  url: string;
  recover: () => Promise<void>;
  listeners: Record<string, EventListener>;
  create?: (url: string) => EventStream;
  retryDelayMs?: number;
}) {
  let stream: EventStream | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let attempts = 0;
  const create = options.create ?? ((url: string) => new EventSource(url));
  const retry = () => {
    stream?.close();
    if (stopped || timer !== undefined || attempts >= 3) return;
    attempts++;
    timer = setTimeout(
      async () => {
        try {
          await options.recover();
          timer = undefined;
          if (!stopped) open();
        } catch {
          timer = undefined;
          retry();
        }
      },
      (options.retryDelayMs ?? 1000) * attempts,
    );
  };
  const open = () => {
    const opened = create(options.url);
    stream = opened;
    opened.addEventListener("connected", () => {
      attempts = 0;
    });
    for (const [name, callback] of Object.entries(options.listeners))
      opened.addEventListener(name, callback);
    opened.addEventListener("error", () => {
      if (stream === opened) retry();
    });
  };
  open();
  return () => {
    stopped = true;
    clearTimeout(timer);
    stream?.close();
  };
}
