import { test } from "node:test";
import assert from "node:assert/strict";
import { PreviewCache } from "../src/renderer/preview-cache";
import type { PreviewImageStore } from "../src/renderer/preview-cache";

test("thumbnail work stays serial and queued cards are skipped after navigation", async () => {
  const started: string[] = [];
  let finish!: (image: string) => void;
  let began!: () => void;
  const firstStarted = new Promise<void>((resolve) => {
    began = resolve;
  });
  let visible = true;
  const cache = new PreviewCache<string>((id) => {
    started.push(id);
    began();
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const first = cache.request("first", "first", () => true);
  const abandoned = cache.request("second", "second", () => visible);
  await firstStarted;
  assert.deepEqual(started, ["first"]);
  visible = false;
  finish("first-image");
  assert.equal(await first, "first-image");
  assert.equal(await abandoned, undefined);
  assert.deepEqual(started, ["first"]);
  assert.equal(
    await cache.request("first", "first", () => true),
    "first-image",
  );
  assert.deepEqual(started, ["first"]);
});

test("persisted posters survive a fresh cache and scene revision changes miss the old image", async () => {
  const images = new Map<string, string>();
  const store: PreviewImageStore = {
    async read(key) {
      return images.get(key);
    },
    async write(key, image) {
      images.set(key, image);
    },
  };
  let renders = 0;
  const render = async (id: string) => `${id}-${++renders}`;
  const first = new PreviewCache(render, 64, store);
  assert.equal(
    await first.request("scene:revision-1", "scene", () => true),
    "scene-1",
  );
  const reloaded = new PreviewCache(render, 64, store);
  assert.equal(
    await reloaded.request("scene:revision-1", "scene", () => true),
    "scene-1",
  );
  assert.equal(renders, 1);
  assert.equal(
    await reloaded.request("scene:revision-2", "scene", () => true),
    "scene-2",
  );
  assert.equal(renders, 2);
});

test("unavailable persistent storage falls back to rendering and memory reuse", async () => {
  let renders = 0;
  const cache = new PreviewCache(async () => `image-${++renders}`, 64, {
    async read() {
      throw new Error("storage denied");
    },
    async write() {
      throw new Error("quota exceeded");
    },
  });
  assert.equal(await cache.request("scene", "scene", () => true), "image-1");
  assert.equal(await cache.request("scene", "scene", () => true), "image-1");
  assert.equal(renders, 1);
});

test("abandoned disk reads and renders cannot publish or persist a poster", async () => {
  let finishRead!: (image: string | undefined) => void;
  let finishRender!: (image: string) => void;
  let needed = true;
  let renders = 0,
    writes = 0;
  const cache = new PreviewCache(
    () => {
      renders++;
      return new Promise<string>((resolve) => {
        finishRender = resolve;
      });
    },
    64,
    {
      read() {
        return new Promise((resolve) => {
          finishRead = resolve;
        });
      },
      async write() {
        writes++;
      },
    },
  );
  const reading = cache.request("read", "read", () => needed);
  await Promise.resolve();
  await Promise.resolve();
  needed = false;
  finishRead("old image");
  assert.equal(await reading, undefined);
  assert.equal(renders, 0);
  needed = true;
  const rendering = cache.request("render", "render", () => needed);
  await Promise.resolve();
  await Promise.resolve();
  finishRead(undefined);
  await Promise.resolve();
  await Promise.resolve();
  needed = false;
  finishRender("new image");
  assert.equal(await rendering, undefined);
  assert.equal(writes, 0);
});

test("memory eviction retains recently reused posters", async () => {
  const renders: string[] = [];
  const cache = new PreviewCache(async (id: string) => {
    renders.push(id);
    return `${id}-image`;
  }, 2);
  const get = (id: string) => cache.request(id, id, () => true);
  await get("a");
  await get("b");
  await get("a");
  await get("c");
  await get("a");
  assert.deepEqual(renders, ["a", "b", "c"]);
  await get("b");
  assert.deepEqual(renders, ["a", "b", "c", "b"]);
});

test("a synchronous poster lookup reuses its image and refreshes eviction order", async () => {
  const renders: string[] = [];
  const cache = new PreviewCache(async (id: string) => {
    renders.push(id);
    return `${id}-image`;
  }, 2);
  assert.equal(cache.peek("missing"), undefined);
  assert.deepEqual(renders, []);
  await cache.request("a", "a", () => true);
  await cache.request("b", "b", () => true);
  assert.equal(cache.peek("a"), "a-image");
  await cache.request("c", "c", () => true);
  assert.equal(cache.peek("b"), undefined);
  assert.equal(cache.peek("a"), "a-image");
  assert.equal(await cache.request("a", "a", () => true), "a-image");
  assert.deepEqual(renders, ["a", "b", "c"]);
});

test("a seeded first frame is immediate and skips queued thumbnail work", async () => {
  const renders: string[] = [],
    reads: string[] = [],
    writes: string[] = [];
  let finish!: (image: string) => void;
  let began!: () => void;
  const firstStarted = new Promise<void>((resolve) => {
    began = resolve;
  });
  const cache = new PreviewCache<string>(
    (id) => {
      renders.push(id);
      began();
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    64,
    {
      async read(key) {
        reads.push(key);
        return undefined;
      },
      async write(key) {
        writes.push(key);
      },
    },
  );
  const first = cache.request("first", "first", () => true);
  const second = cache.request("second", "second", () => true);
  await firstStarted;
  cache.seed("second", "warmed-first-frame");
  assert.equal(cache.peek("second"), "warmed-first-frame");
  cache.seed("second", "replacement");
  assert.equal(cache.peek("second"), "warmed-first-frame");
  assert.deepEqual(writes, []);
  finish("first-poster");
  assert.equal(await first, "first-poster");
  assert.equal(await second, "warmed-first-frame");
  assert.deepEqual(renders, ["first"]);
  assert.deepEqual(reads, ["first"]);
  assert.deepEqual(writes, ["first"]);
});

test("a frame seeded during a disk read avoids a duplicate render", async () => {
  let finishRead!: (image: string | undefined) => void;
  let began!: () => void;
  let renders = 0,
    writes = 0;
  const reading = new Promise<void>((resolve) => {
    began = resolve;
  });
  const cache = new PreviewCache<string>(
    async () => {
      renders++;
      return "rendered-poster";
    },
    64,
    {
      read() {
        began();
        return new Promise((resolve) => {
          finishRead = resolve;
        });
      },
      async write() {
        writes++;
      },
    },
  );
  const poster = cache.request("scene", "scene", () => true);
  await reading;
  cache.seed("scene", "warmed-first-frame");
  finishRead(undefined);
  assert.equal(await poster, "warmed-first-frame");
  assert.equal(renders, 0);
  assert.equal(writes, 0);
});

test("a shared thumbnail survives one card leaving and errors do not poison the queue", async () => {
  let visible = true,
    calls = 0;
  const cache = new PreviewCache<string>(async (id, needed) => {
    calls++;
    assert.equal(needed(), true);
    if (id === "broken") throw new Error("broken source");
    return id + "-image";
  });
  const first = cache.request("shared", "shared", () => visible);
  const second = cache.request("shared", "shared", () => true);
  visible = false;
  assert.equal(await first, "shared-image");
  assert.equal(await second, "shared-image");
  assert.equal(calls, 1);
  await assert.rejects(
    cache.request("broken", "broken", () => true),
    /broken source/,
  );
  assert.equal(await cache.request("next", "next", () => true), "next-image");
});
