import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";

const output = path.resolve(".tilt/checks/page-exit");
await fs.mkdir(output, { recursive: true });
await fs.writeFile(
  path.join(output, "index.html"),
  '<!doctype html><script defer src="fixture.js"></script>',
);
await fs.writeFile(
  path.join(output, "away.html"),
  "<!doctype html><title>Closed fixture</title>",
);
await Promise.all([
  build({
    entryPoints: ["tests/fixtures/page-exit-renderer.ts"],
    outfile: path.join(output, "fixture.js"),
    bundle: true,
    platform: "browser",
    format: "iife",
  }),
  build({
    entryPoints: ["scripts/verify-page-exit.ts"],
    outfile: path.join(output, "main.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    external: ["electron"],
    target: "node22",
  }),
]);
const child = spawn(electron, [path.join(output, "main.cjs")], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.once("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.once("exit", (code) => process.exit(code ?? 1));
