import { app, nativeImage } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { WebSource } from "../src/main/source";
import { SourceStatusSchema } from "../src/core/source-status";
import { SceneSchema, type SourceSpec } from "../src/core/schema";
import { SceneSession } from "../src/main/scene-session";
import { sourceFingerprint } from "../src/main/source-fingerprint";

async function main() {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "tilt-host-browser-"),
  );
  app.setPath("userData", path.join(directory, "electron"));
  app.dock?.hide();
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  await app.whenReady();
  app.on("window-all-closed", () => {});
  const hosts: WebSource[] = [];
  const create = (patch: Partial<SourceSpec>) => {
    const source = new WebSource(
      {
        id: "ui",
        kind: "web",
        width: 128,
        height: 128,
        sampling: "controlled",
        layers: [],
        ...patch,
      },
      "",
      "",
      directory,
    );
    hosts.push(source);
    return source;
  };
  try {
    await fs.mkdir(path.join(directory, "server"));
    const html = `<!doctype html><style>body{margin:0;background:white}#target{width:128px;height:128px}</style><div id="target"></div>
<script>setTimeout(()=>{window.tiltSource={async ready(){await new Promise(r=>setTimeout(r,30));document.querySelector('#target').textContent='Mounted';},async sample({time}){document.querySelector('#target').style.background=time<1?'rgb(255,0,0)':'rgb(0,0,255)';return {revision:time<1?'red':'blue'};}}},75)</script>`;
    await fs.writeFile(
      path.join(directory, "server", "server.mjs"),
      `import http from 'node:http';http.createServer((q,r)=>{r.setHeader('content-type','text/html');r.end(${JSON.stringify(html)})}).listen(Number(process.env.PORT),'127.0.0.1');`,
    );
    const source = create({
      server: {
        executable: "node",
        args: ["server.mjs"],
        cwd: "server",
        url: "http://127.0.0.1:{port}/fixture",
        export: "packaged",
      },
    });
    await source.ready();
    assert.deepEqual(source.diagnostics.adapter, { ready: true, sample: true });
    assert.equal(
      await source.window.webContents.executeJavaScript(
        "document.querySelector('#target').textContent",
      ),
      "Mounted",
    );
    const raw = (frame: Awaited<ReturnType<WebSource["sample"]>>) =>
      nativeImage.createFromDataURL(frame.images.ui).toBitmap();
    const red = await source.sample(0, {});
    const first = source.diagnostics;
    assert.equal(first.captures, 1);
    assert.ok(first.capturedBytes > 0);
    assert.ok(first.timings.captureMs! > 0);
    const blue = await source.sample(2, {});
    assert.notDeepEqual(raw(red), raw(blue));
    const returned = await source.sample(0, {});
    assert.deepEqual(
      raw(red),
      raw(returned),
      "Absolute backward sample must reproduce pixels",
    );
    const cached = await source.sample(0.5, {});
    assert.equal(cached.images.ui, returned.images.ui);
    assert.equal(source.diagnostics.reused, true);
    assert.equal(source.diagnostics.captures, 0);
    assert.equal(source.diagnostics.preparedTime, 0.5);
    SourceStatusSchema.parse(source.diagnostics);
    const clone = source.diagnostics;
    clone.timings.totalMs = -1;
    assert.notEqual(source.diagnostics.timings.totalMs, -1);
    await source.dispose();
    assert.equal(source.window.isDestroyed(), true);

    await fs.writeFile(
      path.join(directory, "static.html"),
      '<!doctype html><body style="background:lime">Static',
    );
    const staticSource = create({ entry: "static.html", sampling: "static" });
    await staticSource.ready();
    await staticSource.sample(0, {});
    await staticSource.sample(9, {});
    assert.equal(staticSource.diagnostics.preparedTime, 9);
    assert.equal(staticSource.diagnostics.captures, 0);
    assert.equal(staticSource.diagnostics.reused, true);

    const missing = create({ entry: "static.html", readyTimeoutMs: 100 });
    await assert.rejects(missing.ready(), /adapter readiness.*timed out/);
    assert.equal(missing.window.isDestroyed(), true);
    assert.equal(missing.diagnostics.phase, "failed");

    await fs.writeFile(
      path.join(directory, "hung.html"),
      "<!doctype html><script>window.tiltSource={sample:()=>new Promise(()=>{})}</script>",
    );
    const hung = create({ entry: "hung.html", sampleTimeoutMs: 100 });
    await hung.ready();
    await assert.rejects(hung.sample(3, {}), /sample adapter.*timed out/);
    assert.equal(hung.window.isDestroyed(), true);
    assert.equal(hung.diagnostics.phase, "failed");
    assert.equal(hung.diagnostics.requestedTime, 3);
    assert.equal(hung.diagnostics.preparedTime, undefined);
    await fs.mkdir(path.join(directory, "pages"));
    await fs.writeFile(
      path.join(directory, "pages", "retry.html"),
      "<!doctype html><style>body{background:red}</style><script>window.tiltSource={sample:({time})=>time===3?new Promise(()=>{}):({revision:time})}</script>",
    );
    const document = SceneSchema.parse({
      version: 1,
      id: "recovery",
      name: "Recovery",
      entry: "scene.ts",
      duration: 5,
      size: { width: 128, height: 128 },
      background: "#000000",
      parameters: {},
      sources: [
        {
          id: "ui",
          kind: "web",
          entry: "pages/retry.html",
          width: 128,
          height: 128,
          sampling: "controlled",
          sampleTimeoutMs: 100,
        },
      ],
    });
    const session = new SceneSession(
      {
        root: directory,
        id: "recovery",
        scene: document,
        revision: "unchanged",
        codeRevision: 0,
        error: null,
        previewDirectory: async () => directory,
      },
      "",
      {
        compile: async () => path.join(directory, "compiled.js"),
        fingerprint: sourceFingerprint,
        createSource: (...args) => {
          const source = new WebSource(...args);
          hosts.push(source);
          return source;
        },
      },
    );
    try {
      const beforeFailure = await session.frame(0);
      await assert.rejects(session.frame(3), /sample adapter.*timed out/);
      assert.equal(session.diagnostics.sources[0].phase, "failed");
      const recovered = await session.frame(0);
      assert.equal(session.diagnostics.sourceCreations, 2);
      assert.equal(session.diagnostics.sources[0].phase, "ready");
      assert.deepEqual(raw(recovered), raw(beforeFailure));
    } finally {
      await session.dispose();
    }

    const retryCapture = create({
      entry: "static.html",
      sampling: "controlled",
    });
    await fs.writeFile(
      path.join(directory, "static.html"),
      '<!doctype html><body style="background:lime"><script>window.tiltSource={sample:({time})=>({revision:time})}</script>',
    );
    await retryCapture.ready();
    const send = retryCapture.window.webContents.debugger.sendCommand.bind(
      retryCapture.window.webContents.debugger,
    );
    let failCapture = true;
    retryCapture.window.webContents.debugger.sendCommand = (
      ...args: Parameters<typeof send>
    ) => {
      if (failCapture && args[0] === "Page.captureScreenshot") {
        failCapture = false;
        return Promise.reject(new Error("Transient capture error"));
      }
      return send(...args);
    };
    await assert.rejects(retryCapture.sample(0, {}), /Transient capture error/);
    assert.equal(retryCapture.window.isDestroyed(), false);
    await retryCapture.sample(0, {});
    assert.equal(retryCapture.diagnostics.phase, "ready");
    console.log(
      JSON.stringify(
        {
          result: "passed",
          checks: [
            "managed Electron Node runtime",
            "delayed mount",
            "readiness completion",
            "backward pixel equality",
            "stable revision reuse",
            "static reuse time",
            "status schema",
            "readiness timeout cleanup",
            "sample timeout cleanup",
            "session replacement after adapter failure",
            "transient capture retry preserves browser",
          ],
          firstFrame: first,
        },
        null,
        2,
      ),
    );
  } finally {
    await Promise.all(hosts.map((source) => source.dispose()));
    await fs.rm(directory, { recursive: true, force: true });
  }
}
main().then(
  () => app.exit(0),
  (error) => {
    console.error(error);
    app.exit(1);
  },
);
