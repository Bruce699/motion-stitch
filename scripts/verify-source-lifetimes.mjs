import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";
import assert from "node:assert/strict";

// Isolated real Chromium benchmark. Does not touch active scenes or the runtime.
// node scripts/verify-source-lifetimes.mjs [--baseline /absolute/snapshot]
const at = process.argv.indexOf("--baseline");
const baseline = at < 0 ? undefined : process.argv[at + 1];
const output = path.resolve(".tilt/checks/source-lifetimes");
await fs.mkdir(output, { recursive: true });
const labels = baseline ? ["baseline", "current"] : ["current"];
for (const label of labels) {
  const outfile = path.join(output, `${label}.cjs`);
  await build({
    entryPoints: ["scripts/verify-source-lifetimes.ts"],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    external: ["electron", "esbuild"],
    plugins:
      label === "baseline"
        ? [
            {
              name: "baseline-session",
              setup(build) {
                build.onResolve(
                  { filter: /src\/main\/scene-session$/ },
                  () => ({
                    path: path.join(
                      path.resolve(baseline),
                      "src/main/scene-session.ts",
                    ),
                  }),
                );
              },
            },
          ]
        : [],
  });
  await new Promise((resolve, reject) => {
    const child = spawn(
      electron,
      [outfile, label, path.join(output, `${label}.json`)],
      {
        stdio: "inherit",
        env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${label} benchmark exited ${code}`)),
    );
  });
}
if (baseline) {
  const before = JSON.parse(
    await fs.readFile(path.join(output, "baseline.json"), "utf8"),
  );
  const after = JSON.parse(
    await fs.readFile(path.join(output, "current.json"), "utf8"),
  );
  assert.deepEqual(
    after.sourceDigests,
    before.sourceDigests,
    "Before/after source pixels must be identical",
  );
  if (
    after.choreography.browserLaunches !== 0 ||
    after.choreography.captures !== 0
  )
    throw new Error("Choreography edits must reuse existing browser surfaces");
  if (after.sourceEdit.browserLaunches !== 1 || after.sourceEdit.captures !== 1)
    throw new Error("Only the changed source may restart and recapture");
  const comparison = {
    before,
    after,
    warmSpeedup: before.choreography.medianMs / after.choreography.medianMs,
  };
  await fs.writeFile(
    path.join(output, "comparison.json"),
    JSON.stringify(comparison, null, 2),
  );
  console.log(
    `Warm edit-to-frame median: ${before.choreography.medianMs.toFixed(1)} → ${after.choreography.medianMs.toFixed(1)} ms (${comparison.warmSpeedup.toFixed(1)}×)`,
  );
}
