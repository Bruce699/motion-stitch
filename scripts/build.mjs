import { build } from "esbuild";
import { build as vite } from "vite";
import fs from "node:fs/promises";
await Promise.all([
  build({
    entryPoints: ["src/main/main.ts", "src/main/agent.ts", "src/main/cli.ts"],
    outdir: "dist",
    outExtension: { ".js": ".cjs" },
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    external: ["electron", "esbuild"],
    sourcemap: true,
  }),
  build({
    entryPoints: ["src/main/preload.ts"],
    outfile: "dist/preload.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
    external: ["electron"],
  }),
  vite({ base: "./", build: { outDir: "dist/ui", emptyOutDir: true } }),
]);
await build({ entryPoints: ["src/renderer/review.ts"], outfile: "dist/review-ui/review.js", bundle: true, platform: "browser", format: "esm", target: "es2022" });
await fs.mkdir("dist/review-ui", { recursive: true });
await fs.writeFile("dist/review-ui/index.html", '<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><script type="module" src="/review.js"></script>');
