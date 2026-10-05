type Entry<T> = {
  input: T;
  consumers: Set<() => boolean>;
  promise: Promise<string | undefined>;
};

export type PreviewImageStore = {
  read(key: string): Promise<string | undefined>;
  write(key: string, image: string): Promise<void>;
};

/** Serializes temporary renderers and skips work after all its cards leave. */
export class PreviewCache<T> {
  private images = new Map<string, string>();
  private pending = new Map<string, Entry<T>>();
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private render: (
      input: T,
      needed: () => boolean,
    ) => Promise<string | undefined>,
    private limit = 64,
    private store?: PreviewImageStore,
  ) {}
  /** Reuse an already loaded poster during the first render without scheduling work. */
  peek(key: string): string | undefined {
    const image = this.images.get(key);
    if (image) this.remember(key, image);
    return image;
  }
  /** Publish a prepared frame immediately without replacing or persisting a poster. */
  seed(key: string, image: string) {
    if (image && !this.images.has(key)) this.remember(key, image);
  }
  request(key: string, input: T, valid: () => boolean) {
    const cached = this.peek(key);
    if (cached) return Promise.resolve(cached);
    const existing = this.pending.get(key);
    if (existing) {
      existing.consumers.add(valid);
      return existing.promise;
    }
    const consumers = new Set([valid]);
    const needed = () => [...consumers].some((isCurrent) => isCurrent());
    const promise = this.queue
      .catch(() => {})
      .then(async () => {
        if (!needed()) return;
        const queuedImage = this.peek(key);
        if (queuedImage) return queuedImage;
        let stored: string | undefined;
        try {
          stored = await this.store?.read(key);
        } catch {
          // Storage denial, corruption or quota errors must never block rendering.
        }
        if (!needed()) return;
        const loadedImage = this.peek(key);
        if (loadedImage) return loadedImage;
        if (stored) {
          this.remember(key, stored);
          return stored;
        }
        const image = await this.render(input, needed);
        if (!image || !needed()) return;
        this.remember(key, image);
        try {
          await this.store?.write(key, image);
        } catch {
          // A valid thumbnail remains available even when disk caching fails.
        }
        return image;
      });
    this.queue = promise;
    const entry = { input, consumers, promise };
    this.pending.set(key, entry);
    const finish = () => {
      if (this.pending.get(key) === entry) this.pending.delete(key);
    };
    void promise.then(finish, finish);
    return promise;
  }

  private remember(key: string, image: string) {
    this.images.delete(key);
    this.images.set(key, image);
    if (this.images.size > this.limit)
      this.images.delete(this.images.keys().next().value!);
  }
}
