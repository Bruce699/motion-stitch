import { app, nativeImage } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { WebSource } from "../src/main/source";
import { SceneSchema } from "../src/core/schema";
async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-layers-"));
  app.setPath("userData", path.join(root, "electron"));
  app.dock?.hide();
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  await app.whenReady();
  app.on("window-all-closed", () => {});
  let source: WebSource | undefined;
  try {
    await fs.writeFile(
      path.join(root, "index.html"),
      `<!doctype html><style>body{margin:0;background:white}main{width:320px;height:240px;overflow:hidden}.nav{position:absolute;left:20px;top:20px;width:120px;height:180px;border-radius:18px;background:#3268ce;box-shadow:4px 3px 7px #0005}.chip{position:absolute;left:15px;top:30px;width:70px;height:30px;background:#e75a44;border-radius:8px}.hidden{visibility:hidden;position:absolute;width:40px;height:40px;background:lime;top:90px} .off{display:none} .other{position:absolute;left:180px;top:50px;width:100px;height:100px;background:#ddd;overflow:hidden}.overflow{width:160px;height:50px;background:#835cab;position:absolute;left:40px;top:20px}</style><main><div class="nav"><div class="chip"></div><div class="hidden">hidden</div></div><div class="other"><div class="overflow"></div></div></main><script>window.tiltSource={sample({time}){document.querySelector('.chip').style.left=(15+time*5)+'px';return {revision:time};}};</script>`,
    );
    const seed = JSON.parse(
      await fs.readFile(
        path.join(process.cwd(), "tests/fixtures/scene.json"),
        "utf8",
      ),
    );
    const spec = SceneSchema.parse({
      ...seed,
      sources: [
        {
          id: "ui",
          kind: "web",
          entry: "index.html",
          width: 320,
          height: 240,
          sampling: "controlled",
          layers: [
            { id: "nav", selector: ".nav", padding: 16 },
            { id: "chip", selector: ".chip" },
            { id: "overflow", selector: ".overflow" },
            { id: "optional", selector: ".missing", optional: true },
          ],
        },
      ],
    }).sources[0];
    source = new WebSource(spec, "", "", root);
    await source.ready();
    let captures = 0;
    const capture = source.window.webContents.debugger.sendCommand.bind(
      source.window.webContents.debugger,
    );
    source.window.webContents.debugger.sendCommand = (...args: any[]) => {
      if (args[0] === "Page.captureScreenshot") captures++;
      return capture(...(args as Parameters<typeof capture>));
    };
    const frame = await source.sample(0, {});
    const layout = frame.layers![0];
    assert.equal(layout.regions.find((r) => r.id === "chip")!.parentId, "nav");
    assert.equal(
      layout.regions.find((r) => r.id === "optional")!.visible,
      false,
    );
    const raw = (data: string, w: number, h: number) =>
      nativeImage
        .createFromDataURL(data)
        .resize({ width: w, height: h })
        .toBitmap();
    const original = raw(frame.images.ui, 320, 240),
      base = raw(frame.images["ui/base"], 320, 240);
    const pixel = (buffer: Buffer, x: number, y: number, width: number) => [
      ...buffer.subarray((y * width + x) * 4, (y * width + x) * 4 + 4),
    ];
    assert.notDeepEqual(
      pixel(original, 40, 30, 320),
      pixel(base, 40, 30, 320),
      "Base must remove the extracted navigation",
    );
    const nav = layout.regions.find((r) => r.id === "nav")!;
    const navPixels = raw(
      frame.images[nav.texture],
      nav.crop.width,
      nav.crop.height,
    );
    assert.equal(navPixels[3], 0, "Layer padding must be transparent");
    const composite = Buffer.from(base);
    for (const region of layout.regions) {
      if (!region.visible) continue;
      const pixels = raw(
        frame.images[region.texture],
        region.crop.width,
        region.crop.height,
      );
      for (let y = 0; y < region.crop.height; y++)
        for (let x = 0; x < region.crop.width; x++) {
          const from = (y * region.crop.width + x) * 4,
            to = ((y + region.crop.y) * 320 + x + region.crop.x) * 4;
          const alpha = pixels[from + 3] / 255;
          for (let c = 0; c < 3; c++)
            composite[to + c] = Math.round(
              // Electron toBitmap returns premultiplied channels.
              pixels[from + c] + composite[to + c] * (1 - alpha),
            );
        }
    }
    let error = 0,
      bad = 0;
    for (let i = 0; i < original.length; i += 4) {
      let max = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(original[i + c] - composite[i + c]);
        error += d;
        max = Math.max(max, d);
      }
      if (max > 8) bad++;
    }
    const mean = error / (320 * 240 * 3),
      badFraction = bad / (320 * 240);
    assert.ok(
      mean < 1 && badFraction < 0.015,
      `Reconstruction differs: mean ${mean}, bad fraction ${badFraction}`,
    );
    const count = captures;
    assert.equal(await source.sample(0, {}), frame);
    assert.equal(
      captures,
      count,
      "Unchanged source revision must skip capture passes",
    );
    await source.window.webContents.executeJavaScript(
      "history.replaceState({}, '', '#cached-route')",
    );
    assert.equal(
      (await source.sample(0, {})).routes![0].route,
      "/index.html#cached-route",
    );
    assert.equal(
      captures,
      count,
      "Route context must update without recapturing unchanged pixels",
    );
    const later = await source.sample(2, {});
    assert.equal(
      later.layers![0].regions.find((r) => r.id === "chip")!.bounds.x,
      45,
    );
    const backwards = await source.sample(0, {});
    assert.ok(
      backwards.images.ui === frame.images.ui,
      "Backward sample should reproduce pixels",
    );
    assert.equal(
      await source.window.webContents.executeJavaScript(
        `[...document.querySelectorAll('*')].flatMap(el => el.getAttributeNames()).filter(n => n.startsWith('data-tilt-capture')).length`,
      ),
      0,
    );
    assert.equal(
      await source.window.webContents.executeJavaScript(
        `getComputedStyle(document.querySelector('.hidden')).visibility`,
      ),
      "hidden",
    );
    // Fail in the middle of an isolation pass, then prove CSS and markers were restored.
    let calls = 0;
    source.window.webContents.debugger.sendCommand = (...args: any[]) => {
      if (args[0] === "Page.captureScreenshot" && ++calls === 2)
        throw new Error("Injected capture failure");
      return capture(...(args as Parameters<typeof capture>));
    };
    await assert.rejects(source.sample(3, {}), /Injected/);
    assert.equal(
      await source.window.webContents.executeJavaScript(
        `getComputedStyle(document.querySelector('.nav')).visibility`,
      ),
      "visible",
    );
    assert.equal(
      await source.window.webContents.executeJavaScript(
        `document.querySelector('.nav').getAttributeNames().filter(n=>n.startsWith('data-tilt-capture')).length`,
      ),
      0,
    );
    source.window.webContents.debugger.sendCommand = capture;
    await source.sample(3, {});
    await source.window.webContents.executeJavaScript(
      `const optional = document.createElement('div'); optional.className = 'missing'; optional.style.cssText = 'position:absolute;left:210px;top:180px;width:40px;height:30px;background:purple'; document.body.append(optional);`,
    );
    const mounted = await source.sample(4, {});
    assert.equal(
      mounted.layers![0].regions.find((r) => r.id === "optional")!.visible,
      true,
    );
    assert.ok(mounted.images["ui/optional"]);
    await source.window.webContents.executeJavaScript(
      `document.querySelector('.missing').remove()`,
    );
    assert.equal(
      (await source.sample(5, {})).layers![0].regions.find(
        (r) => r.id === "optional",
      )!.visible,
      false,
    );
    const originalLayers = spec.layers;
    for (const [layers, message] of [
      [
        [{ id: "ambiguous", selector: "div", padding: 8, optional: false }],
        /exactly one element/,
      ],
      [
        [{ id: "invalid", selector: "[", padding: 8, optional: false }],
        /invalid selector/,
      ],
      [
        [
          { id: "chip", selector: ".chip", padding: 8, optional: false },
          { id: "nav", selector: ".nav", padding: 8, optional: false },
        ],
        /before child/,
      ],
    ] as [typeof spec.layers, RegExp][]) {
      spec.layers = layers;
      await assert.rejects(source.sample(6, {}), message);
    }
    spec.layers = originalLayers;
    source.dispose();
    for (const density of [2, 4]) {
      source = new WebSource(spec, "", "", root, density);
      await source.ready();
      const dense = await source.sample(0, {});
      const viewport = await source.window.webContents.executeJavaScript(
        "({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})",
      );
      assert.deepEqual(viewport, { width: 320, height: 240, dpr: density });
      assert.deepEqual(
        dense.layers![0].regions,
        layout.regions,
        "Density must not change CSS bounds or layer alignment",
      );
      const dimensions = (data: string) => {
        const png = Buffer.from(data.split(",")[1], "base64");
        return [png.readUInt32BE(16), png.readUInt32BE(20)];
      };
      assert.deepEqual(dimensions(dense.images.ui), [
        320 * density,
        240 * density,
      ]);
      for (const region of dense.layers![0].regions.filter((r) => r.visible))
        assert.deepEqual(dimensions(dense.images[region.texture]), [
          region.crop.width * density,
          region.crop.height * density,
        ]);
      await source.sample(2, {});
      assert.equal((await source.sample(0, {})).images.ui, dense.images.ui);
      source.dispose();
    }
    const reactDirectory = path.join(process.cwd(), ".tilt", "checks", "react");
    const reactSpec = SceneSchema.parse({
      ...seed,
      sources: [
        {
          id: "react",
          kind: "web",
          entry: "index.html",
          width: 320,
          height: 240,
          sampling: "controlled",
          layers: [
            { id: "navigation", selector: '[data-layer="navigation"]' },
            { id: "action", selector: '[data-layer="action"]' },
          ],
        },
      ],
    }).sources[0];
    source = new WebSource(reactSpec, "", "", reactDirectory, 3);
    await source.ready();
    const reactZero = await source.sample(0, {});
    const reactTwo = await source.sample(2, {});
    assert.equal(reactTwo.layers![0].regions[1].parentId, "navigation");
    assert.ok(
      reactZero.images["react/action"] !== reactTwo.images["react/action"],
    );
    assert.equal(
      (await source.sample(0, {})).images["react/action"],
      reactZero.images["react/action"],
    );
    console.log(
      JSON.stringify({
        layers: layout.regions.length,
        capturePasses: count,
        meanReconstructionError: mean,
        badPixelFraction: badFraction,
        cached: true,
        nested: true,
        backwards: true,
        restoredAfterFailure: true,
        optionalRemount: true,
        selectorErrors: true,
        cachedRoute: true,
        reactTSX: true,
        density:
          "1×, 2×, 4× vanilla; 3× React; CSS bounds unchanged; exact PNG sizes",
      }),
    );
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    source?.dispose();
    await fs.rm(root, { recursive: true, force: true });
    app.exit(process.exitCode || 0);
  }
}
void main();
