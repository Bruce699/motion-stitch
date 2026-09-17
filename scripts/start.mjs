import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";
import {
  project,
  portless,
  proxyEnvironment,
  viewerURL,
} from "./local-url.mjs";

process.chdir(project);
const args = process.argv.slice(2);
const direct = args.includes("--direct");
const browser = args.includes("--browser");
const sessionPath = path.join(project, ".tilt/session.json");
let existing;
try {
  const session = JSON.parse(await fs.readFile(sessionPath, "utf8"));
  process.kill(session.pid, 0);
  const response = await fetch(session.origin + "/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ type: "state" }),
    signal: AbortSignal.timeout(3000),
  });
  if (response.ok) existing = session;
} catch {}

if (existing) {
  if (!direct && existing.publicOrigin !== viewerURL) {
    console.error(
      "Tilt is already running at a different address. Run npm run cli -- stop, then npm start.",
    );
    process.exit(1);
  }
  if (!browser) {
    const response = await fetch(existing.origin + "/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${existing.token}`,
      },
      body: JSON.stringify({ type: "desktop" }),
    });
    if (!response.ok)
      throw new Error("Could not open the existing Tilt viewer");
  }
  console.log(`Tilt is running at ${existing.publicOrigin || existing.origin}`);
  process.exit(0);
}

await import("./build.mjs");
const runtimeArgs = [
  electron,
  "dist/main.cjs",
  "--project",
  project,
  ...args.filter((arg) => arg !== "--direct"),
];
const env = {
  ...(direct ? process.env : proxyEnvironment),
  ELECTRON_RUN_AS_NODE: "",
};
if (direct) {
  delete env.PORTLESS_URL;
  delete env.PORT;
}
const child = spawn(
  direct ? runtimeArgs[0] : process.execPath,
  direct ? runtimeArgs.slice(1) : [portless, "--name", "tilt", ...runtimeArgs],
  { stdio: "inherit", env },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => process.exit(code ?? 1));
