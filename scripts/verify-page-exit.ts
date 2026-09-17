import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { SceneStore } from "../src/main/store";
import { SceneSchema } from "../src/core/schema";
import { ViewerExitCoordinator } from "../src/main/viewer-exit";
import { serve } from "../src/main/server";

async function until(check: () => boolean | Promise<boolean>) {
  const deadline = performance.now() + 5000;
  while (!(await check())) {
    if (performance.now() > deadline)
      throw new Error("Page-exit check timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-page-exit-"));
  const output = path.resolve(".tilt/checks/page-exit");
  app.setPath("userData", path.join(root, "electron"));
  app.dock?.hide();
  await app.whenReady();
  app.on("window-all-closed", () => {});
  const reports = [];
  try {
    for (const delayed of [false, true]) {
      const project = path.join(root, delayed ? "delayed" : "normal");
      const directory = path.join(project, "scenes/fixture");
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(
        path.join(directory, "scene.json"),
        JSON.stringify(
          SceneSchema.parse({
            version: 1,
            id: "fixture",
            name: "Fixture",
            duration: 1,
            size: { width: 64, height: 64 },
            background: "#000000",
            sources: [],
            parameters: {},
          }),
        ),
      );
      const store = new SceneStore(project);
      await store.open("fixture");
      store.watcher?.close();
      const before = store.journal.ledger.entries.length;
      const exit = new ViewerExitCoordinator();
      let release!: () => void;
      const wait = new Promise<void>((resolve) => {
        release = resolve;
      });
      let begins = 0,
        beginRejected = false,
        exits = 0;
      const service = await serve({
        ui: output,
        modules: output,
        scene: () => directory,
        token: "isolated-page-exit-check",
        command: async (command: any) => {
          if (command.type === "viewer_exit") {
            exits++;
            return exit.finish(
              command,
              async () => store,
              (actor) => store.finishGesture(actor),
            );
          }
          if (command.type === "edit_begin") {
            begins++;
            exit.assertOpen(command.viewId);
            if (delayed) await wait;
            try {
              exit.assertOpen(command.viewId);
            } catch (error) {
              beginRejected = true;
              throw error;
            }
            return store.begin("Blur", command.viewId, undefined, "gesture", [
              "scene.json",
            ]);
          }
          throw new Error("Unexpected fixture command");
        },
        onDisconnect: (id) => {
          void store.finishGesture(id);
        },
      });
      const window = new BrowserWindow({
        show: false,
        width: 320,
        height: 240,
      });
      try {
        await window.loadURL(service.origin);
        const viewId = await window.webContents.executeJavaScript(
          "window.exitHarness.start()",
        );
        await until(() => begins === 1 && (delayed || !!store.journal.group));
        await window.loadURL(service.origin + "/away.html");
        await until(() => store.scene.camera?.depthOfField?.blur === 0.83);
        release();
        if (delayed) await until(() => beginRejected);
        await until(() => !store.journal.group);
        assert.equal(store.scene.camera?.depthOfField?.focusPlane, 2.75);
        assert.equal(store.journal.ledger.entries.length, before + 1);
        assert.equal(exits, 1);
        assert.equal(exit.isClosed(viewId), true);
        reports.push({
          delayedBegin: delayed,
          finalBlur: 0.83,
          finalFocus: 2.75,
          historyCheckpoints: 1,
          exitRequests: exits,
          lateBeginRejected: beginRejected,
        });
      } finally {
        release();
        window.destroy();
        service.close();
        store.watcher?.close();
      }
    }
    await fs.writeFile(
      path.join(output, "report.json"),
      JSON.stringify(reports, null, 2),
    );
    console.log(JSON.stringify(reports, null, 2));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}
main().then(
  () => app.exit(0),
  (error) => {
    console.error(error);
    app.exit(1);
  },
);
