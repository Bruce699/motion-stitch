import { build } from "esbuild";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";

// Isolated Chromium verification. Never connects to the editor runtime.
// --source-root /path/to/frozen/checkout runs this identical harness against
// another implementation. --output /path retains result artifacts.
const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
};
const sourceRoot = path.resolve(argument("--source-root", process.cwd()));
const output = path.resolve(
  argument("--output", ".tilt/checks/runtime-refactor"),
);
const buildRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), "tilt-refactor-harness-"),
);
await fs.mkdir(output, { recursive: true });
await fs.mkdir(path.join(buildRoot, "react"), { recursive: true });
await build({
  entryPoints: ["tests/fixtures/runtime-refactor-react.tsx"],
  outfile: path.join(buildRoot, "react/index.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
await build({
  entryPoints: ["scripts/verify-runtime-refactor.ts"],
  outfile: path.join(buildRoot, "main.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron", "esbuild"],
  plugins: [
    {
      name: "implementation-under-test",
      setup(build) {
        build.onResolve(
          { filter: /^\.\.\/src\// },
          async ({ path: imported }) => {
            const base = path.resolve(sourceRoot, "scripts", imported);
            for (const suffix of [".ts", ".tsx", "/index.ts"]) {
              try {
                await fs.access(base + suffix);
                return { path: base + suffix };
              } catch {
                /* Try the next extension. */
              }
            }
            throw new Error(`Cannot resolve ${imported} in ${sourceRoot}`);
          },
        );
      },
    },
  ],
});
await fs.symlink(
  path.join(sourceRoot, "node_modules"),
  path.join(buildRoot, "node_modules"),
);
const child = spawn(electron, [path.join(buildRoot, "main.cjs")], {
  stdio: "inherit",
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "",
    TILT_REFACTOR_SOURCE_ROOT: sourceRoot,
    TILT_REFACTOR_BUILD_ROOT: buildRoot,
    TILT_REFACTOR_OUTPUT: output,
    TILT_REFACTOR_EXPECT_REUSE: process.argv.includes("--expect-source-reuse")
      ? "1"
      : "0",
  },
});
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});
await fs.rm(buildRoot, { recursive: true, force: true });
process.exitCode = code;
