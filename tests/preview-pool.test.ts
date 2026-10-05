import { test } from "node:test";
import assert from "node:assert/strict";
import { PreviewPool } from "../src/renderer/preview-pool";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const always = () => true;
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("a warmed clip switches and scrubs backward without preparing again", async () => {
  const prepared: string[] = [],
    disposed: string[] = [];
  const pool = new PreviewPool(
    async (id) => {
      prepared.push(id);
      return { id, time: -1 };
    },
    ({ id }) => disposed.push(id),
  );
  await pool.run("a", always, async (clip) => {
    clip.time = 4;
  });
  pool.pin("a");
  await pool.run("b", always, async (clip) => {
    clip.time = 0;
  });
  const warmed = await pool.run("b", always, async (clip) => clip.time);
  assert.equal(warmed, 0);
  pool.pin("b");
  await pool.run("a", always, async (clip) => {
    assert.equal(clip.time, 4);
    clip.time = 3;
  });
  assert.deepEqual(prepared, ["a", "b"]);
  assert.deepEqual(disposed, []);
  pool.clear();
  assert.deepEqual(disposed.sort(), ["a", "b"]);
});

test("an adjacent clip preparing cannot block the current engine's frames", async () => {
  const next = deferred<{ id: string }>();
  const pool = new PreviewPool(
    (id) => (id === "b" ? next.promise : Promise.resolve({ id })),
    () => {},
  );
  await pool.run("a", always, async () => {});
  pool.pin("a");
  const warming = pool.run("b", always, async () => {});
  let presented = false;
  await pool.run("a", always, async () => {
    presented = true;
  });
  assert.equal(presented, true);
  next.resolve({ id: "b" });
  await warming;
  pool.clear();
});

test("pool capacity includes pending renderers and never evicts the displayed clip", async () => {
  const next = deferred<{ id: string }>();
  const prepared: string[] = [],
    disposed: string[] = [];
  const pool = new PreviewPool(
    async (id) => {
      prepared.push(id);
      return id === "b" ? next.promise : { id };
    },
    ({ id }) => disposed.push(id),
    2,
  );
  await pool.run("a", always, async () => {});
  pool.pin("a");
  const warming = pool.run("b", always, async () => {});
  const extra = pool.run("c", always, async () => {});
  await flush();
  assert.deepEqual(prepared, ["a", "b"]);
  next.resolve({ id: "b" });
  await Promise.all([warming, extra]);
  assert.deepEqual(prepared, ["a", "b", "c"]);
  assert.deepEqual(disposed, ["b"]);
  await pool.run("a", always, async () => {});
  assert.equal(prepared.filter((id) => id === "a").length, 1);
  pool.clear();
});

test("revision invalidation disposes stale preparation and abandons queued requests", async () => {
  const old = deferred<{ id: string }>();
  const prepared: string[] = [],
    disposed: string[] = [],
    sampled: string[] = [];
  const pool = new PreviewPool(
    async (id) => {
      prepared.push(id);
      return id === "old" ? old.promise : { id };
    },
    ({ id }) => disposed.push(id),
    2,
  );
  await pool.run("shown", always, async () => {});
  pool.pin("shown");
  const loading = pool.run("old", always, async ({ id }) => {
    sampled.push(id);
  });
  const queued = pool.run("queued", always, async ({ id }) => {
    sampled.push(id);
  });
  await flush();
  pool.clear();
  old.resolve({ id: "old" });
  await Promise.all([loading, queued]);
  assert.equal(sampled.length, 0);
  assert.deepEqual(prepared, ["shown", "old"]);
  assert.deepEqual(disposed.sort(), ["old", "shown"]);
  await pool.run("shown", always, async ({ id }) => {
    sampled.push(id);
  });
  assert.deepEqual(sampled, ["shown"]);
  assert.equal(prepared.filter((id) => id === "shown").length, 2);
  pool.clear();
});

test("same-engine samples are exclusive and obsolete seeks cannot present", async () => {
  const release = deferred<void>();
  let request = 1;
  const presented: number[] = [];
  const pool = new PreviewPool(
    async () => ({}),
    () => {},
  );
  const first = pool.run(
    "a",
    () => request === 1,
    async (_, valid) => {
      await release.promise;
      if (valid()) presented.push(1);
    },
  );
  await flush();
  request = 2;
  const second = pool.run(
    "a",
    () => request === 2,
    async (_, valid) => {
      if (valid()) presented.push(2);
    },
  );
  await flush();
  assert.deepEqual(presented, []);
  release.resolve();
  await Promise.all([first, second]);
  assert.deepEqual(presented, [2]);
  pool.clear();
});

test("failed preparation releases its slot and can be retried", async () => {
  let attempts = 0;
  const pool = new PreviewPool(
    async () => {
      if (++attempts === 1) throw new Error("capture failed");
      return { ready: true };
    },
    () => {},
  );
  await assert.rejects(
    pool.run("a", always, async () => {}),
    /capture failed/,
  );
  assert.equal(await pool.run("a", always, async (value) => value.ready), true);
  assert.equal(attempts, 2);
  pool.clear();
});
