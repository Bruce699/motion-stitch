import { app, BrowserWindow, nativeImage } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const out = path.resolve(".tilt/checks/depth-of-field");
async function main() {
  app.setPath("userData", path.join(out, "electron"));
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  app.dock?.hide();
  await app.whenReady();
  const win = new BrowserWindow({
    show: false,
    width: 960,
    height: 600,
    webPreferences: { backgroundThrottling: false },
  });
  const errors: string[] = [];
  win.webContents.on("console-message", (event) => {
    if (event.level === "error") errors.push(event.message);
  });
  try {
    await win.loadFile(path.join(out, "index.html"));
    const result = await win.webContents.executeJavaScript(
      "window.runDepthOfFieldChecks()",
    );
    for (const [name, data] of Object.entries(result.shots))
      await fs.writeFile(
        path.join(out, `${name}.png`),
        nativeImage.createFromDataURL(data as string).toPNG(),
      );
    const raw = (key: string) =>
      nativeImage.createFromDataURL(result.shots[key]).toBitmap();
    const diff = (a: string, b: string, region = [0, 0, 960, 600]) => {
      const aa = raw(a),
        bb = raw(b);
      let sum = 0;
      const [x, y, w, h] = region;
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++)
          for (let c = 0; c < 3; c++)
            sum += Math.abs(
              aa[(yy * 960 + xx) * 4 + c] - bb[(yy * 960 + xx) * 4 + c],
            );
      return sum / (w * h * 3);
    };
    const metrics = {
      focusedBack: diff("off", "focus-back", [150, 155, 200, 190]),
      defocusedFront: diff("off", "focus-back", [590, 155, 200, 190]),
      focusedFront: diff("off", "focus-front", [590, 155, 200, 190]),
      defocusedBack: diff("off", "focus-front", [150, 155, 200, 190]),
      transparentHole: diff("off", "focus-front", [662, 380, 44, 44]),
    };
    assert.ok(metrics.focusedBack < 1, JSON.stringify(metrics));
    assert.ok(metrics.focusedFront < 1, JSON.stringify(metrics));
    assert.ok(
      metrics.defocusedBack > 5 && metrics.defocusedFront > 5,
      JSON.stringify(metrics),
    );
    assert.ok(
      metrics.transparentHole > 20,
      "Transparent holes must use the underlying custom shader's depth",
    );
    for (const pair of [
      ["off", "zero-blur"],
      ["focus-front", "backward"],
      ["source-on", "source-off"],
      ["off", "disabled-again"],
    ])
      assert.equal(diff(...(pair as [string, string])), 0, pair.join(" vs "));
    assert.equal(
      result.released.textures,
      result.baseline.textures,
      "Turning off releases all effect textures",
    );
    assert.equal(
      result.released.geometries,
      result.baseline.geometries + 1,
      "Only the newly visited 2D source plane may remain",
    );
    assert.equal(
      result.transfers,
      1,
      "Camera effects must reuse the source texture",
    );
    assert.equal(result.glError, 0);
    assert.ok(
      result.surfaceMetrics.compositeError < 1,
      JSON.stringify(result.surfaceMetrics),
    );
    assert.ok(
      result.surfaceMetrics.transparentError < 1,
      JSON.stringify(result.surfaceMetrics),
    );
    assert.ok(
      result.surfaceMetrics.spillPixels > 1000,
      JSON.stringify(result.surfaceMetrics),
    );
    assert.ok(
      result.surfaceMetrics.tiltedError < 1,
      JSON.stringify(result.surfaceMetrics),
    );
    assert.equal(result.surfaceMetrics.reused, true);
    assert.equal(result.surfaceMetrics.backward, true);
    assert.equal(result.surfaceMetrics.updated, true);
    assert.equal(result.surfaceMetrics.remaining.textures, 2);
    assert.deepEqual(errors, []);
    const report = { ...result, shots: Object.keys(result.shots), metrics };
    await fs.writeFile(
      path.join(out, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(error, errors);
    process.exitCode = 1;
  } finally {
    win.destroy();
    app.exit(process.exitCode || 0);
  }
}
void main();
