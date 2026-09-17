import path from "node:path";
import { fileURLToPath } from "node:url";

export const project = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
export const portless = path.join(project, "node_modules/portless/dist/cli.js");
export const proxyEnvironment = {
  ...process.env,
  PORTLESS_HTTPS: "0",
  PORTLESS_PORT: process.env.PORTLESS_PORT || "80",
  PORTLESS_TLD: "localhost",
  PORTLESS_LAN: "0",
  PORTLESS_WILDCARD: "0",
};
export const viewerURL = `http://tilt.localhost${proxyEnvironment.PORTLESS_PORT === "80" ? "" : ":" + proxyEnvironment.PORTLESS_PORT}`;
