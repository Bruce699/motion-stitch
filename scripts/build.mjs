import { build } from "esbuild";
import { build as vite } from "vite";
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
