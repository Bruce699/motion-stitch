import "./build.mjs";
import { spawn } from "node:child_process";
import electron from "electron";
const child = spawn(electron, ["dist/main.cjs", "--project", process.cwd()], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.on("exit", (code) => process.exit(code ?? 0));
