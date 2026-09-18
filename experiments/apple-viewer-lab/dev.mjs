import { createServer } from "vite";
const server = await createServer({
  root: import.meta.dirname,
  server: { host: "127.0.0.1", port: 4318, strictPort: true },
  cacheDir: "../../.tilt/apple-viewer-vite",
});
await server.listen();
server.printUrls();
