import { spawn } from "node:child_process";
import { portless, proxyEnvironment } from "./local-url.mjs";

// Portless installs the loopback proxy as an OS service. Its own installer
// requests administrator approval for the standard web port; no CA is installed.
const action = process.argv.includes("--remove") ? "uninstall" : "install";
const args =
  action === "install"
    ? [
        "--no-tls",
        "--port",
        proxyEnvironment.PORTLESS_PORT,
        "--tld",
        "localhost",
      ]
    : [];
const child = spawn(process.execPath, [portless, "service", action, ...args], {
  stdio: "inherit",
  env: proxyEnvironment,
});
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => process.exit(code ?? 1));
