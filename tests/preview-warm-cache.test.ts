import { test } from "node:test";
import assert from "node:assert/strict";
import { WarmPreviewCache } from "../src/renderer/preview-warm-cache";

type Preview = { id: string };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("ready values transfer once and survive later cache clearing", async () => {
  const disposed: string[] = [];
  const cache = new WarmPreviewCache<Preview>((value) =>
    disposed.push(value.id),
  );
  let prepared = 0;
  const create = async () => ({ id: `preview-${++prepared}` });
  await Promise.all([
    cache.warm("clip:rev1", create),
    cache.warm("clip:rev1", create),
  ]);
  const value = await cache.take("clip:rev1");
  assert.equal(value?.id, "preview-1");
  assert.equal(await cache.take("clip:rev1"), undefined);
  cache.clear();
  assert.equal(prepared, 1);
  assert.deepEqual(disposed, []);
});

test("a pending take claims preparation exclusively and adopts its validity", async () => {
  const prepared = deferred<Preview>();
  let speculative = true;
  const disposed: string[] = [];
  const cache = new WarmPreviewCache<Preview>((value) =>
    disposed.push(value.id),
  );
  const warming = cache.warm(
    "clip",
    () => prepared.promise,
    () => speculative,
  );
  await flush();
  const claim = cache.take("clip");
  speculative = false;
  assert.equal(await cache.take("clip"), undefined);
  prepared.resolve({ id: "clip" });
  await warming;
  assert.deepEqual(await claim, { id: "clip" });
  assert.deepEqual(disposed, []);
});

test("clearing a pending claim disposes its late result exactly once", async () => {
  const prepared = deferred<Preview>();
  const disposed: string[] = [];
  const cache = new WarmPreviewCache<Preview>((value) =>
    disposed.push(value.id),
  );
  const warming = cache.warm("clip", () => prepared.promise);
  await flush();
  const claim = cache.take("clip");
  cache.clear();
  prepared.resolve({ id: "clip" });
  await warming;
  assert.equal(await claim, undefined);
  cache.clear();
  assert.deepEqual(disposed, ["clip"]);
});

test("abandoned consumers and active claims cannot retain stale resources", async () => {
  const disposed: string[] = [];
  const cache = new WarmPreviewCache<Preview>((value) =>
    disposed.push(value.id),
  );
  for (const claimed of [false, true]) {
    const prepared = deferred<Preview>();
    let needed = true;
    const warming = cache.warm(
      "clip",
      () => prepared.promise,
      () => needed,
    );
    await flush();
    const take = claimed ? cache.take("clip", () => needed) : undefined;
    needed = false;
    prepared.resolve({ id: claimed ? "claimed" : "speculative" });
    await warming;
    assert.equal(await take, undefined);
    assert.equal(await cache.take("clip"), undefined);
  }
  assert.deepEqual(disposed, ["speculative", "claimed"]);
});

test("capacity counts canceled prepares until they actually finish", async () => {
  const first = deferred<Preview>();
  const second = deferred<Preview>();
  const disposed: string[] = [];
  const started: string[] = [];
  const cache = new WarmPreviewCache<Preview>(
    (value) => disposed.push(value.id),
    2,
  );
  const a = cache.warm("a", () => {
    started.push("a");
    return first.promise;
  });
  const b = cache.warm("b", () => {
    started.push("b");
    return second.promise;
  });
  await flush();
  cache.clear();
  await cache.warm("c", async () => {
    started.push("c");
    return { id: "c" };
  });
  cache.put("returned", { id: "returned" });
  assert.deepEqual(started, ["a", "b"]);
  assert.deepEqual(disposed, ["returned"]);
  first.resolve({ id: "a" });
  await a;
  await cache.warm("c", async () => {
    started.push("c");
    return { id: "c" };
  });
  assert.deepEqual(started, ["a", "b", "c"]);
  second.resolve({ id: "b" });
  await b;
  assert.equal((await cache.take("c"))?.id, "c");
  assert.deepEqual(disposed, ["returned", "a", "b"]);
});

test("returned engines reuse ownership and evict the least recently used idle slot", async () => {
  const disposed: string[] = [];
  const cache = new WarmPreviewCache<Preview>(
    (value) => disposed.push(value.id),
    2,
  );
  const a = { id: "a" };
  cache.put("a", a);
  cache.put("b", { id: "b" });
  await cache.warm("a", async () => {
    throw new Error("must reuse");
  });
  cache.put("c", { id: "c" });
  assert.deepEqual(disposed, ["b"]);
  assert.equal(await cache.take("a"), a);
  cache.put("a", a);
  assert.equal(await cache.take("a"), a);
  cache.clear();
  assert.deepEqual(disposed, ["b", "c"]);
});

test("a claimed pending slot cannot be evicted by an incoming returned engine", async () => {
  const prepared = deferred<Preview>();
  const disposed: string[] = [];
  const cache = new WarmPreviewCache<Preview>(
    (value) => disposed.push(value.id),
    1,
  );
  const warming = cache.warm("a", () => prepared.promise);
  const take = cache.take("a");
  await flush();
  cache.put("b", { id: "b" });
  assert.deepEqual(disposed, ["b"]);
  prepared.resolve({ id: "a" });
  await warming;
  assert.equal((await take)?.id, "a");
});

test("failed preparation is evicted and a foreground claim receives a miss", async () => {
  const cache = new WarmPreviewCache<Preview>(() => {});
  const warming = cache.warm("a", async () => {
    throw new Error("prepare failed");
  });
  const take = cache.take("a");
  await assert.rejects(warming, /prepare failed/);
  assert.equal(await take, undefined);
  await cache.warm("a", async () => ({ id: "retry" }));
  assert.equal((await cache.take("a"))?.id, "retry");
});

test("revision keys do not reuse another revision's prepared engine", async () => {
  const disposed: string[] = [];
  const cache = new WarmPreviewCache<Preview>((value) =>
    disposed.push(value.id),
  );
  cache.put("project/clip:rev1", { id: "old" });
  assert.equal(await cache.take("project/clip:rev2"), undefined);
  cache.clear();
  assert.deepEqual(disposed, ["old"]);
});
