import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const out = path.resolve(".tilt/checks/camera-sampling");
async function main() {
  app.setPath("userData", path.join(out, "electron"));
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  app.dock?.hide();
  await app.whenReady();
  const win = new BrowserWindow({
    show: false,
    width: 480,
    height: 300,
    webPreferences: { backgroundThrottling: false },
  });
  const errors: string[] = [];
  win.webContents.on("console-message", (event) => {
    if (event.level === "error") errors.push(event.message);
  });
  try {
    await win.loadFile(path.join(out, "index.html"));
    const result = await win.webContents.executeJavaScript(
      "window.runCameraSamplingChecks()",
    );
    assert.deepEqual(errors, []);
    assert.equal(result.passed, true);
    await fs.writeFile(
      path.join(out, "report.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error, errors);
    process.exitCode = 1;
  } finally {
    win.destroy();
    app.exit(process.exitCode || 0);
  }
}
void main();
