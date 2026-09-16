import fs from "node:fs/promises";
import path from "node:path";
import { Jobs } from "./jobs";
import { alive } from "./files";
export const project = path.resolve(process.env.TILT_PROJECT || process.cwd());
export async function request(command: Record<string, unknown>) {
  let session;
  try {
    session = JSON.parse(
      await fs.readFile(path.join(project, ".tilt", "session.json"), "utf8"),
    );
  } catch {}
  if (!session || !alive(session.pid)) {
    if (["jobs", "cancel", "resume"].includes(String(command.type))) {
      const electronRoot = path.join(project, "node_modules", "electron");
      const version = JSON.parse(
        await fs.readFile(path.join(electronRoot, "package.json"), "utf8"),
      ).version;
      const binary = path.join(
        electronRoot,
        "dist",
        process.platform === "darwin"
          ? "Electron.app/Contents/MacOS/Electron"
          : process.platform === "win32"
            ? "electron.exe"
            : "electron",
      );
      const jobs = new Jobs(
        project,
        path.join(project, "dist"),
        binary,
        version,
      );
      if (command.type === "jobs") return jobs.list();
      if (command.type === "cancel") return jobs.cancel(String(command.id));
      return jobs.resume(String(command.id));
    }
    throw new Error("Start Tilt in this project first (npm start).");
  }
  const response = await fetch(session.origin + "/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(180000),
  });
  const result = (await response.json()) as any;
  if (!response.ok || result?.error)
    throw new Error(result.error || response.statusText);
  return result;
}
