import assert from "node:assert/strict";
import test from "node:test";
import {
  createRenderActivity,
  type RenderActivity,
} from "../src/renderer/activity";

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function fixture(send?: (activity: RenderActivity) => Promise<unknown>) {
  const sent: RenderActivity[] = [];
  const state = { hidden: false, playing: true };
  let visibility = () => {};
  const heartbeats = new Set<() => void>();
  const reporter = createRenderActivity(
    send ??
      (async (activity) => {
        sent.push(activity);
      }),
    {
      hidden: () => state.hidden,
      playing: () => state.playing,
      onVisibilityChange(listener) {
        visibility = listener;
        return () => {
          visibility = () => {};
        };
      },
      every(listener, milliseconds) {
        assert.equal(milliseconds, 1000);
        heartbeats.add(listener);
        return () => {
          heartbeats.delete(listener);
        };
      },
    },
  );
  return { reporter, sent, state, heartbeats, visibility: () => visibility() };
}

test("hidden viewer releases and stops renewing priority; visible playback restores it", async () => {
  const f = fixture();
  await settle();
  assert.deepEqual(f.sent, ["play"]);
  for (const beat of f.heartbeats) beat();
  await settle();
  assert.deepEqual(f.sent, ["play", "play"]);
  f.state.hidden = true;
  f.visibility();
  await settle();
  assert.equal(f.sent.at(-1), "idle");
  assert.equal(f.heartbeats.size, 0);
  const count = f.sent.length;
  f.reporter.scrub();
  f.reporter.endScrub();
  await settle();
  assert.equal(f.sent.length, count, "Hidden gestures cannot renew a lease");
  f.state.hidden = false;
  f.visibility();
  await settle();
  assert.equal(f.sent.at(-1), "play");
  assert.equal(f.heartbeats.size, 1);
  const queuedHeartbeat = [...f.heartbeats][0];
  f.reporter.dispose();
  await settle();
  assert.equal(f.sent.at(-1), "idle");
  assert.equal(f.heartbeats.size, 0);
  queuedHeartbeat();
  await settle();
  assert.equal(
    f.sent.at(-1),
    "idle",
    "An already queued heartbeat stays disposed",
  );
});

test("returning to a paused viewer stays idle and an old scrub does not resume", async () => {
  const f = fixture();
  await settle();
  f.reporter.scrub();
  await settle();
  assert.equal(f.sent.at(-1), "scrub");
  f.state.hidden = true;
  f.visibility();
  f.state.playing = false;
  f.reporter.playbackChanged();
  await settle();
  f.state.hidden = false;
  f.visibility();
  await settle();
  assert.equal(f.sent.at(-1), "idle");
  assert.equal(f.heartbeats.size, 0);
  f.reporter.dispose();
});

test("a slow play request cannot overwrite a newer hidden idle release", async () => {
  const delivered: RenderActivity[] = [];
  let finish!: () => void;
  const f = fixture(async (activity) => {
    if (activity === "play")
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
    delivered.push(activity);
  });
  f.reporter.scrub();
  f.state.hidden = true;
  f.visibility();
  assert.deepEqual(delivered, []);
  finish();
  await settle();
  assert.deepEqual(delivered, ["play", "idle"]);
  f.reporter.dispose();
});

test("an activity request failure recovers on the next heartbeat", async () => {
  let requests = 0;
  const delivered: RenderActivity[] = [];
  const f = fixture(async (activity) => {
    if (++requests === 1) throw new Error("Disconnected");
    delivered.push(activity);
  });
  await settle();
  for (const beat of f.heartbeats) beat();
  await settle();
  assert.deepEqual(delivered, ["play"]);
  f.reporter.dispose();
});
