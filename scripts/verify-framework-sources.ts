import { app, BrowserWindow, nativeImage } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { WebSource } from "../src/main/source";
import type { CapturedFrame } from "../src/core/layers";

const root = process.env.TILT_FRAMEWORK_ROOT!,
  output = process.env.TILT_FRAMEWORK_OUTPUT!;
const hash = (frame: CapturedFrame) =>
  createHash("sha256")
    .update(nativeImage.createFromDataURL(frame.images.app).toBitmap())
    .digest("hex");
async function main() {
  app.setPath("userData", path.join(root, "electron"));
  app.dock?.hide();
  await app.whenReady();
  app.on("window-all-closed", () => {});
  const results = [];
  let source: WebSource | undefined;
  try {
    for (const framework of ["vue", "svelte"]) {
      source = new WebSource(
        {
          id: "app",
          kind: "web",
          entry: framework + "/index.html",
          width: 320,
          height: 240,
          sampling: "controlled",
          layers: [
            {
              id: "card",
              selector: '[data-tilt-id="card"]',
              padding: 0,
              optional: false,
            },
          ],
        },
        "",
        "",
        root,
        2,
      );
      await source.ready();
      const a = await source.sample(0.25, {}),
        b = await source.sample(1.25, {}),
        c = await source.sample(0.25, {});
      assert.notEqual(
        hash(a),
        hash(b),
        framework + " must update the mounted app at requested absolute time",
      );
      assert.equal(
        hash(a),
        hash(c),
        framework + " must reproduce backward seek pixels exactly",
      );
      assert.equal(
        a.layers?.[0].regions.length,
        1,
        framework + " must expose requested semantic layer",
      );
      assert.equal(a.layers?.[0].regions[0].bounds.x, 25);
      assert.equal(b.layers?.[0].regions[0].bounds.x, 45);
      assert.equal(
        await source.window.webContents.executeJavaScript(
          'document.querySelector("p").textContent',
        ),
        "Frame 15",
      );
      assert.equal(
        nativeImage.createFromDataURL(a.images.app).getSize().width,
        640,
        "Density2 capture must retain expected width",
      );
      await fs.writeFile(
        path.join(output, framework + ".png"),
        Buffer.from(a.images.app.split(",")[1], "base64"),
      );
      results.push({
        framework,
        initial: hash(a),
        changed: hash(b),
        backward: hash(c),
        layerBounds: a.layers![0].regions[0].bounds,
      });
      source.dispose();
      source = undefined;
      assert.equal(
        BrowserWindow.getAllWindows().length,
        0,
        "Framework disposal must release its browser",
      );
    }
    assert.equal(
      results[0].initial,
      results[1].initial,
      "Equivalent Vue/Svelte content must render identical pixels",
    );
    const report = {
      measuredAt: new Date().toISOString(),
      versions: JSON.parse(
        await fs.readFile(path.join(root, "versions.json"), "utf8"),
      ),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      proof:
        "Real bundled production Vue and compiler-generated Svelte apps, mounted in isolated Chromium; framework commit awaited by adapter; density2 whole/layer capture and backward seek hashes verified. These fixtures do not establish every plugin, SSR, live backend or framework version.",
      results,
    };
    await fs.writeFile(
      path.join(output, "results.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    source?.dispose();
    app.exit(Number(process.exitCode) || 0);
  }
}
void main();
