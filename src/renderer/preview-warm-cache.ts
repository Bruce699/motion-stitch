type Entry<T> = {
  key: string;
  alive: boolean;
  claimed: boolean;
  ownerNeeded?: () => boolean;
  consumers: Set<() => boolean>;
  value?: T;
  ready: Promise<T | undefined>;
};

/**
 * Owns only idle preview resources. A take exclusively claims pending or ready
 * work; a successful transfer removes all cache ownership of that resource.
 * Pending prepares (including canceled ones still unwinding) count toward the
 * limit. Speculative warming is skipped while every slot is pending or claimed.
 */
export class WarmPreviewCache<T> {
  private entries = new Map<string, Entry<T>>();
  private pending = new Set<Entry<T>>();

  constructor(
    private dispose: (value: T) => void,
    private limit = 2,
  ) {
    if (!Number.isInteger(limit) || limit < 1)
      throw new Error("Warm preview cache requires a positive capacity");
  }

  /** Share a speculative preparation without sharing ownership of its value. */
  warm(
    key: string,
    create: (needed: () => boolean) => Promise<T | undefined>,
    needed: () => boolean = () => true,
  ): Promise<void> {
    this.sweep();
    if (!needed()) return Promise.resolve();
    const existing = this.entries.get(key);
    if (existing) {
      existing.consumers.add(needed);
      this.touch(existing);
      return existing.ready.then(() => {});
    }
    if (!this.makeRoom()) return Promise.resolve();
    const entry: Entry<T> = {
      key,
      alive: true,
      claimed: false,
      consumers: new Set([needed]),
      ready: Promise.resolve(undefined),
    };
    this.entries.set(key, entry);
    this.pending.add(entry);
    entry.ready = Promise.resolve()
      .then(async () => {
        if (!this.needed(entry)) return undefined;
        const value = await create(() => this.needed(entry));
        if (value === undefined) return undefined;
        entry.value = value;
        if (!this.needed(entry)) {
          this.drop(entry);
          return undefined;
        }
        return value;
      })
      .catch((error) => {
        this.drop(entry);
        throw error;
      })
      .finally(() => {
        this.pending.delete(entry);
        if (!this.needed(entry) || entry.value === undefined) this.drop(entry);
      });
    // A foreground take may be the only observer by the time preparation fails.
    void entry.ready.catch(() => {});
    return entry.ready.then(() => {});
  }

  /**
   * Transfer at most once. Failed/canceled preparation is a cache miss, allowing
   * the active owner to prepare normally. clear() can cancel a pending claim,
   * but never disposes a resource after this promise has transferred it.
   */
  async take(
    key: string,
    needed: () => boolean = () => true,
  ): Promise<T | undefined> {
    this.sweep();
    const entry = this.entries.get(key);
    if (!entry || entry.claimed || !needed()) return undefined;
    entry.claimed = true;
    entry.ownerNeeded = needed;
    try {
      await entry.ready;
    } catch {
      return undefined;
    }
    if (!this.needed(entry) || entry.value === undefined) {
      this.drop(entry);
      return undefined;
    }
    const value = entry.value;
    entry.value = undefined;
    entry.alive = false;
    if (this.entries.get(key) === entry) this.entries.delete(key);
    return value;
  }

  /** Return an exclusively owned, ready resource; this call consumes ownership. */
  put(key: string, value: T): void {
    this.sweep();
    const existing = this.entries.get(key);
    if (existing?.value === value) {
      this.touch(existing);
      return;
    }
    if (existing) {
      if (existing.claimed || this.pending.has(existing)) {
        this.dispose(value);
        return;
      }
      this.drop(existing);
    }
    if (!this.makeRoom()) {
      this.dispose(value);
      return;
    }
    this.entries.set(key, {
      key,
      value,
      alive: true,
      claimed: false,
      consumers: new Set([() => true]),
      ready: Promise.resolve(value),
    });
  }

  /** Invalidate idle resources and pending claims; active transferred values survive. */
  clear(): void {
    for (const entry of this.entries.values()) this.drop(entry);
  }

  private needed(entry: Entry<T>) {
    return (
      entry.alive &&
      (entry.claimed
        ? !!entry.ownerNeeded?.()
        : [...entry.consumers].some((needed) => needed()))
    );
  }

  private sweep() {
    for (const entry of this.entries.values()) {
      if (!this.needed(entry)) this.drop(entry);
    }
  }

  private touch(entry: Entry<T>) {
    if (this.entries.get(entry.key) !== entry) return;
    this.entries.delete(entry.key);
    this.entries.set(entry.key, entry);
  }

  private makeRoom(): boolean {
    const size = new Set([...this.entries.values(), ...this.pending]).size;
    if (size < this.limit) return true;
    const idle = [...this.entries.values()].find(
      (entry) => !entry.claimed && !this.pending.has(entry),
    );
    if (!idle) return false;
    this.drop(idle);
    return true;
  }

  private drop(entry: Entry<T>) {
    entry.alive = false;
    if (this.entries.get(entry.key) === entry) this.entries.delete(entry.key);
    if (entry.value !== undefined) {
      const value = entry.value;
      entry.value = undefined;
      this.dispose(value);
    }
  }
}
