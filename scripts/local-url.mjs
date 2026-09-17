import path from "node:path";
import { fileURLToPath } from "node:url";

export const project = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
export const portless = path.join(project, "node_modules/portless/dist/cli.js");
export const proxyEnvironment = {
  ...process.env,
  PORTLESS_HTTPS: "1",
  PORTLESS_PORT: process.env.PORTLESS_PORT || "443",
  PORTLESS_TLD: "video",
  PORTLESS_SYNC_HOSTS: "1",
  PORTLESS_LAN: "0",
  PORTLESS_WILDCARD: "0",
};
export const viewerURL = `https://tilt.video${proxyEnvironment.PORTLESS_PORT === "443" ? "" : ":" + proxyEnvironment.PORTLESS_PORT}`;
