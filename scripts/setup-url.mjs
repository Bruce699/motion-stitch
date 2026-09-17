import { spawn } from "node:child_process";
import { portless, proxyEnvironment } from "./local-url.mjs";

// Portless installs the loopback proxy as an OS service. Its own installer
// requests administrator approval for the standard HTTPS port and local CA.
// Registered names are mapped to loopback in /etc/hosts, not public DNS.
const action = process.argv.includes("--remove") ? "uninstall" : "install";
const args =
  action === "install"
    ? [
        "--https",
        "--port",
        proxyEnvironment.PORTLESS_PORT,
        "--tld",
        proxyEnvironment.PORTLESS_TLD,
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
