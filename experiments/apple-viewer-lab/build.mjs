import { build } from "vite";
import { copyFile } from "node:fs/promises";
await copyFile(
  new URL("./RESEARCH.md", import.meta.url),
  new URL("./public/RESEARCH.md", import.meta.url),
);
await build({
  root: import.meta.dirname,
  cacheDir: "../../.tilt/apple-viewer-vite",
  build: { outDir: "dist", emptyOutDir: true },
});
