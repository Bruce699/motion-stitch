type Entry<T> = {
  alive: boolean;
  users: number;
  value?: T;
  ready: Promise<T | undefined>;
  serial: Promise<unknown>;
};

/** A bounded, revision-scoped set of renderers with independent work queues. */
export class PreviewPool<T> {
  private entries = new Map<string, Entry<T>>();
  private waiters = new Set<() => void>();
  private pinned?: string;
  private generation = 0;

  constructor(
    private create: (
      key: string,
      valid: () => boolean,
    ) => Promise<T | undefined>,
    private dispose: (value: T) => void,
    private limit = 3,
  ) {
    if (limit < 2) throw new Error("Preview pool requires at least two slots");
  }

  pin(key: string) {
    this.pinned = key;
    this.wake();
  }

  async run<R>(
    key: string,
    valid: () => boolean,
    operation: (value: T, valid: () => boolean) => Promise<R>,
  ): Promise<R | undefined> {
    const generation = this.generation;
    const requested = () => generation === this.generation && valid();
    const entry = await this.acquire(key, requested);
    if (!entry) return;
    const current = () => entry.alive && requested();
    const task = entry.serial
      .catch(() => {})
      .then(async () => {
        if (!requested()) return;
        const value = await entry.ready;
        if (!value || !current()) return;
        return operation(value, current);
      });
    entry.serial = task;
    try {
      return await task;
    } finally {
      entry.users--;
      if (!entry.alive) this.release(entry);
      this.wake();
    }
  }

  clear() {
    this.generation++;
    this.pinned = undefined;
    for (const entry of this.entries.values()) {
      entry.alive = false;
      this.release(entry);
    }
    this.entries.clear();
    this.wake();
  }

  private async acquire(key: string, valid: () => boolean) {
    while (valid()) {
      const existing = this.entries.get(key);
      if (existing) {
        existing.users++;
        this.entries.delete(key);
        this.entries.set(key, existing);
        return existing;
      }
      if (this.entries.size >= this.limit) {
        const oldest = [...this.entries].find(
          ([id, entry]) => id !== this.pinned && entry.users === 0,
        );
        if (!oldest) {
          await new Promise<void>((resolve) => this.waiters.add(resolve));
          continue;
        }
        this.entries.delete(oldest[0]);
        oldest[1].alive = false;
        this.release(oldest[1]);
      }
      const entry: Entry<T> = {
        alive: true,
        users: 1,
        ready: Promise.resolve(undefined),
        serial: Promise.resolve(),
      };
      this.entries.set(key, entry);
      entry.ready = this.create(key, () => entry.alive).then(
        (value) => {
          entry.value = value;
          if (!entry.alive) this.release(entry);
          return value;
        },
        (error) => {
          if (this.entries.get(key) === entry) this.entries.delete(key);
          entry.alive = false;
          throw error;
        },
      );
      // A request can become obsolete before its queue awaits preparation.
      void entry.ready.catch(() => {});
      return entry;
    }
  }

  private release(entry: Entry<T>) {
    if (entry.users || !entry.value) return;
    this.dispose(entry.value);
    entry.value = undefined;
  }

  private wake() {
    for (const resolve of this.waiters) resolve();
    this.waiters.clear();
  }
}
