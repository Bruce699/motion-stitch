import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  ParameterSchema,
  parameterReader,
  parseParameterArgument,
  withParameterValue,
} from "../src/core/parameters";
import { SceneStore } from "../src/main/store";
import { values } from "../src/core/schema";

const declarations = {
  origin: {
    type: "pad",
    label: "Origin",
    value: { x: 0, y: 0 },
    x: { min: -1, max: 1, step: 0.01 },
    y: { min: -1, max: 1, step: 0.01 },
  },
  caption: { type: "text", label: "Caption", value: "Tilt" },
  strength: { label: "Strength", value: 0.5, min: 0, max: 1, step: 0.01 },
  tint: { type: "color", label: "Tint", value: "#c8b9e8", group: "Shader" },
  enabled: { type: "boolean", label: "Enabled", value: true, group: "Shader" },
  pattern: {
    type: "select",
    control: "segmented",
    label: "Pattern",
    value: "soft",
    options: [
      { label: "Soft", value: "soft" },
      { label: "Bands", value: "bands" },
    ],
  },
  position: {
    type: "vector3",
    label: "Position",
    value: [0, 0, 0],
    min: -10,
    max: 10,
    step: 0.1,
  },
};
test("parameter contracts preserve legacy numbers and reject invalid typed edits", () => {
  const parsed = Object.fromEntries(
    Object.entries(declarations).map(([key, p]) => [
      key,
      ParameterSchema.parse(p),
    ]),
  );
  const reader = parameterReader(parsed);
  assert.equal(reader.number("strength"), 0.5);
  assert.deepEqual(reader.pad("origin"), { x: 0, y: 0 });
  assert.equal(reader.text("caption"), "Tilt");
  assert.equal(reader.color("tint"), "#c8b9e8");
  assert.equal(reader.boolean("enabled"), true);
  assert.equal(reader.select("pattern"), "soft");
  assert.deepEqual(reader.vector3("position"), [0, 0, 0]);
  assert.throws(() => reader.number("tint"), /tint.*number/);
  assert.throws(() => reader.number("missing"), /missing/);
  for (const [key, value] of [
    ["origin", { x: 2, y: 0 }],
    ["origin", { x: 0 }],
    ["origin", { x: 0, y: 0, z: 0 }],
    ["caption", 3],
    ["caption", "a".repeat(4001)],
    ["strength", 2],
    ["strength", "0.5"],
    ["tint", "red"],
    ["enabled", "false"],
    ["pattern", "missing"],
    ["position", [0, 0]],
    ["position", [11, 0, 0]],
  ])
    assert.throws(() => withParameterValue(parsed[String(key)], value));
  assert.equal(
    ParameterSchema.safeParse({
      ...declarations.pattern,
      options: [
        { label: "A", value: "soft" },
        { label: "B", value: "soft" },
      ],
    }).success,
    false,
  );
  for (const declaration of [
    { ...declarations.origin, x: { min: 1, max: -1 } },
    { ...declarations.origin, y: { min: -1, max: 1, default: 2 } },
    { ...declarations.origin, x: { min: -1, max: 1, step: 0 } },
    {
      ...declarations.pattern,
      options: Array.from({ length: 6 }, (_, i) => ({
        label: String(i),
        value: i ? String(i) : "soft",
      })),
    },
  ])
    assert.equal(ParameterSchema.safeParse(declaration).success, false);
  for (const [input, expected] of [
    ["false", false],
    ["#c8b9e8", "#c8b9e8"],
    ["bands", "bands"],
    ["[1,2,3]", [1, 2, 3]],
    ["0.25", 0.25],
  ])
    assert.deepEqual(parseParameterArgument(String(input)), expected);
});

test("all control values persist, undo, redo and reopen without type coercion", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-controls-"));
  const directory = path.join(root, "scenes", "interface");
  const seed = JSON.parse(
    await fs.readFile(
      new URL("../scenes/interface/scene.json", import.meta.url),
      "utf8",
    ),
  );
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, "scene.json"),
    JSON.stringify({ ...seed, parameters: declarations }),
  );
  const store = new SceneStore(root);
  let reopened: SceneStore | undefined;
  try {
    await store.open("interface");
    store.watcher?.close();
    const initial = values(store.scene);
    const edit = await store.begin(
      "Shader controls",
      "editor",
      store.revision,
      "gesture",
      ["scene.json"],
    );
    for (const [key, value] of Object.entries({
      origin: { x: 0.3, y: -0.7 },
      caption: "Hello world",
      strength: 0.8,
      tint: "#112233",
      enabled: false,
      pattern: "bands",
      position: [1, 2, 3],
    }))
      await store.edit(
        (s) => {
          s.parameters[key] = withParameterValue(s.parameters[key], value);
        },
        undefined,
        "editor",
      );
    await store.apply(edit.id);
    const updated = values(store.scene);
    assert.deepEqual(updated, {
      origin: { x: 0.3, y: -0.7 },
      caption: "Hello world",
      strength: 0.8,
      tint: "#112233",
      enabled: false,
      pattern: "bands",
      position: [1, 2, 3],
    });
    assert.equal(store.journal.ledger.entries.length, 2);
    const revision = store.revision;
    await assert.rejects(
      store.edit((s) => {
        s.parameters.enabled = withParameterValue(
          s.parameters.enabled,
          "false",
        );
      }),
    );
    assert.equal(store.revision, revision);
    await store.history("undo");
    assert.deepEqual(values(store.scene), initial);
    await store.history("redo");
    assert.deepEqual(values(store.scene), updated);
    reopened = new SceneStore(root);
    await reopened.open("interface");
    reopened.watcher?.close();
    assert.deepEqual(values(reopened.scene), updated);
    const disk = JSON.parse(
      await fs.readFile(path.join(directory, "scene.json"), "utf8"),
    );
    assert.equal(disk.parameters.enabled.value, false);
    assert.deepEqual(disk.parameters.position.value, [1, 2, 3]);
  } finally {
    store.watcher?.close();
    reopened?.watcher?.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
