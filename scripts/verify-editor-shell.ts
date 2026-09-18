import { app, BrowserWindow, nativeTheme } from "electron";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
const [directory] = process.argv.slice(2);
const root = path.join(directory, "Dashboard project"),
  second = path.join(directory, "Launch film");
app.setPath("userData", path.join(directory, "viewer"));
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.dock?.hide();
app.on("window-all-closed", () => {});
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(fn: () => Promise<any>, label: string, timeout = 30000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    const result = await fn();
    if (result) return result;
    await delay(100);
  }
  throw new Error("Timed out: " + label);
}
const read = async (file: string) =>
  JSON.parse(await fs.readFile(file, "utf8"));
let win: BrowserWindow, host: ReturnType<typeof spawn>, session: any;
const command = async (body: object, target = session) => {
  const response = await fetch(target.origin + "/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${target.token}`,
    },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(result));
  return result;
};
const js = (code: string) => win.webContents.executeJavaScript(code);
const click = async (label: string) => {
  assert.ok(
    await js(
      `(()=>{const b=document.querySelector('button[aria-label=${JSON.stringify(label)}]');if(!b)return false;b.click();return true;})()`,
    ),
    label,
  );
  await delay(200);
};
const screenshot = async (name: string) =>
  fs.writeFile(
    path.join(directory, name + ".png"),
    (await win.webContents.capturePage()).toPNG(),
  );
const measure = () =>
  js(
    `(()=>{const r=s=>{const e=document.querySelector(s),b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,color:getComputedStyle(e).backgroundColor}};return {left:r('#compositions'),viewer:r('.workspace'),timeline:r('.timeline'),right:r('#inspector'),browser:r('.project-browser'),camera:r('.composition-inspector'),header:r('.titlebar')}})()`,
  );
const toggleBounds = () =>
  js(
    `(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height}};return {left:r('button[aria-controls="compositions"]'),right:r('button[aria-controls="inspector"]')}})()`,
  );
async function checkViewerToggle() {
  const layout = await js(
    `(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};return {toggle:r('.viewer-mode-toggle'),viewer:r('.workspace'),timeline:r('.timeline'),inHeader:!!document.querySelector('.titlebar [aria-label="Canvas view"]')}})()`,
  );
  assert.equal(layout.inHeader, false);
  assert.ok(
    Math.abs(
      layout.toggle.x +
        layout.toggle.width / 2 -
        layout.viewer.x -
        layout.viewer.width / 2,
    ) < 1,
  );
  assert.equal(Math.round(layout.viewer.bottom - layout.toggle.bottom), 16);
  assert.ok(layout.toggle.bottom < layout.timeline.y);
}
const pointerClick = async (point: { x: number; y: number }) => {
  win.webContents.sendInputEvent({
    type: "mouseDown",
    button: "left",
    clickCount: 1,
    ...point,
  });
  win.webContents.sendInputEvent({
    type: "mouseUp",
    button: "left",
    clickCount: 1,
    ...point,
  });
  await delay(200);
};
async function main() {
  await app.whenReady();
  nativeTheme.themeSource = "dark";
  const log = await fs.open(path.join(directory, "runtime.log"), "a");
  host = spawn(
    process.execPath,
    [path.join(directory, "runtime/main.cjs"), "--project", root, "--browser"],
    {
      stdio: ["ignore", log.fd, log.fd],
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "",
        PORTLESS_URL: "",
        PORT: "",
      },
    },
  );
  await log.close();
  session = await wait(async () => {
    try {
      const s = await read(path.join(root, ".tilt/session.json"));
      return s.pid === host.pid && s;
    } catch {
      return false;
    }
  }, "runtime");
  win = new BrowserWindow({
    show: false,
    width: 1440,
    height: 960,
    webPreferences: { backgroundThrottling: false },
  });
  const errors: string[] = [];
  win.webContents.on("console-message", (e) => {
    if (e.level === "error" && !/net::ERR|Hugeicons/.test(e.message))
      errors.push(e.message);
  });
  await win.loadURL(session.origin);
  await wait(async () => {
    const c = await command({ type: "context" });
    return c.active?.ready && !c.active?.error;
  }, "first frame");
  await command({ type: "seek", time: 2 });
  await checkViewerToggle();
  await js(
    `[...document.querySelectorAll('.viewer-mode-toggle button')].find(b=>b.textContent==='2D').click()`,
  );
  await wait(
    async () =>
      (await command({ type: "context", fresh: true })).active?.mode ===
      "source",
    "floating toggle switches to 2D",
  );
  await screenshot("viewer-2d-dark");
  await js(
    `[...document.querySelectorAll('.viewer-mode-toggle button')].find(b=>b.textContent==='Camera').click()`,
  );
  await wait(
    async () =>
      (await command({ type: "context", fresh: true })).active?.mode ===
      "camera",
    "floating toggle switches to Camera",
  );
  await js("window.originalCanvas=document.querySelector('canvas')");
  const original = await fs.readFile(
    path.join(root, "scenes/dashboard/scene.json"),
    "utf8",
  );
  const full = await measure();
  assert.equal(full.header.width, 1440);
  assert.equal(full.right.y, full.header.y + full.header.height);
  const fixedToggles = await toggleBounds();
  for (const side of ["left", "right"] as const) {
    const b = fixedToggles[side];
    const point = {
      x: Math.round(b.x + b.width / 2),
      y: Math.round(b.y + b.height / 2),
    };
    for (let press = 0; press < 4; press++) {
      await pointerClick(point);
      await checkViewerToggle();
      assert.equal((await measure())[side].width === 0, press % 2 === 0);
      assert.deepEqual(
        await toggleBounds(),
        fixedToggles,
        "sidebar toggles stay at exactly the same coordinates",
      );
    }
  }
  assert.equal(full.timeline.x, full.left.x);
  assert.ok(full.timeline.width > full.viewer.width);
  assert.equal(full.browser.color, full.header.color);
  assert.equal(full.camera.color, full.header.color);
  await js("document.fonts.ready");
  await screenshot("editor-dark");
  await click("Hide compositions");
  assert.equal((await measure()).left.width, 0);
  await click("Hide inspector");
  assert.equal((await measure()).right.width, 0);
  await click("Collapse timeline");
  await checkViewerToggle();
  assert.equal(Math.round((await measure()).timeline.height), 48);
  assert.equal(
    await js("document.querySelectorAll('.dialkit-timeline-clip').length"),
    0,
  );
  assert.equal(
    await js(
      "document.querySelector('button[aria-label=\"Go to start\"]')===null",
    ),
    true,
  );
  assert.equal(
    await js("document.querySelector('canvas')===window.originalCanvas"),
    true,
  );
  await screenshot("collapsed-dark");
  await click("Play");
  await delay(300);
  await click("Pause");
  const time = await command({ type: "context", fresh: true });
  assert.ok(time.active.requestedTime > 2);
  await click("Expand timeline");
  await click("Show inspector");
  await click("Show compositions");
  const restored = await measure();
  assert.ok(Math.abs(full.left.width - restored.left.width) < 2);
  assert.ok(Math.abs(full.right.width - restored.right.width) < 2);
  assert.ok(Math.abs(full.timeline.height - restored.timeline.height) < 2);
  await click("Home");
  await wait(
    () => js("document.querySelectorAll('.home-project').length===1"),
    "project Home",
  );
  await screenshot("home-dark");
  const created = await command({ type: "project_create", path: second });
  assert.notEqual(created.origin, session.origin);
  const secondSession = await read(path.join(second, ".tilt/session.json"));
  assert.equal(
    (await command({ type: "state" }, secondSession)).scene.name,
    "Composition 1",
  );
  await win.reload();
  await wait(
    () => js("document.querySelectorAll('.home-project').length===2"),
    "persisted projects",
  );
  await js(
    "[...document.querySelectorAll('.home-project')].find(b=>b.textContent.includes('Launch film')).click()",
  );
  await wait(
    async () => new URL(win.webContents.getURL()).origin === created.origin,
    "open second project",
  );
  await wait(
    () => js("document.querySelector('button[aria-label=\"Home\"]')!==null"),
    "second editor",
  );
  await wait(async () => {
    const c = await command({ type: "context" }, secondSession);
    return c.active?.ready && !c.active?.error;
  }, "second project frame");
  await click("Home");
  await wait(
    () => js("document.querySelectorAll('.home-project').length===2"),
    "shared project library",
  );
  await js(
    "[...document.querySelectorAll('.home-project')].find(b=>b.textContent.includes('Dashboard project')).click()",
  );
  await wait(
    async () => new URL(win.webContents.getURL()).origin === session.origin,
    "return to first project",
  );
  await wait(
    () => js("document.querySelector('.project-browser')!==null"),
    "first editor returns",
  );
  assert.equal(
    await fs.readFile(path.join(root, "scenes/dashboard/scene.json"), "utf8"),
    original,
  );
  await click("Hide inspector");
  await win.reload();
  await wait(
    () =>
      js(
        "document.querySelector('button[aria-label=\"Show inspector\"]')!==null",
      ),
    "collapsed layout survives reload",
  );
  await click("Show inspector");
  nativeTheme.themeSource = "light";
  await delay(250);
  const light = await measure();
  assert.equal(light.browser.color, light.header.color);
  assert.equal(light.camera.color, light.header.color);
  await screenshot("editor-light");
  // Fail a real scene in the isolated project after a successful frame.
  const entryPath = path.join(root, "scenes/dashboard/scene.ts");
  const entry = await fs.readFile(entryPath, "utf8");
  const diagnostic = `SyntaxError: Unexpected token 'T', "The deploy"... is not valid JSON\n${"Long response details <script>must stay text</script>\n".repeat(30)}`;
  await fs.writeFile(
    entryPath,
    `export default function(){throw new Error(${JSON.stringify(diagnostic)})}`,
  );
  const hasWarning = () =>
    js(`!!document.querySelector('button[aria-label="Show error"]')`);
  await wait(hasWarning, "compact error indicator");
  await wait(
    () => js(`document.querySelector('.preparing')===null`),
    "failed preparation does not leave a loading veil over the last frame",
  );
  assert.equal(
    await js(
      `document.querySelector('.error-toast')===null && document.querySelector('.error-popover')===null`,
    ),
    true,
  );
  await screenshot("error-collapsed-light");
  await click("Show error");
  assert.equal(
    await js(`document.querySelector('.error-heading h2').textContent`),
    "Couldn’t read the response",
  );
  assert.equal(
    await js(`document.activeElement.classList.contains('error-popover')`),
    true,
  );
  await screenshot("error-open-light");
  await js(`document.querySelector('.error-details summary').focus()`);
  win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Space" });
  win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Space" });
  await delay(100);
  assert.equal(
    await js(`document.querySelector('.error-details').open`),
    true,
    "Space opens details instead of playing",
  );
  assert.equal(
    await js(`document.querySelector('.error-details pre').textContent`),
    `Error: ${diagnostic}`,
  );
  assert.equal(
    await js(`document.querySelector('.error-details script')===null`),
    true,
  );
  await screenshot("error-details-light");
  nativeTheme.themeSource = "dark";
  await delay(150);
  await screenshot("error-details-dark");
  win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Escape" });
  win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Escape" });
  await delay(150);
  assert.equal(
    await js(
      `document.querySelector('.error-popover')===null && document.activeElement.getAttribute('aria-label')==='Show error'`,
    ),
    true,
  );
  await click("Show error");
  await pointerClick({ x: 700, y: 400 });
  assert.equal(
    await js(`document.querySelector('.error-popover')===null`),
    true,
  );
  assert.ok(await hasWarning(), "closing does not acknowledge the error");
  await click("Show error");
  win.setSize(760, 600);
  await delay(200);
  const popup = await js(
    `(()=>{const b=document.querySelector('.error-popover').getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:innerWidth,height:innerHeight}})()`,
  );
  assert.ok(
    popup.left >= 8 &&
      popup.right <= popup.width - 8 &&
      popup.top >= 8 &&
      popup.bottom <= popup.height - 8,
    "popup stays inside a small viewport",
  );
  await screenshot("error-narrow-dark");
  await js(
    `[...document.querySelectorAll('.error-actions button')].find(b=>b.textContent==='Retry').click()`,
  );
  await wait(hasWarning, "failed retry stays discoverable");
  await click("Show error");
  await js(
    `[...document.querySelectorAll('.error-actions button')].find(b=>b.textContent==='Dismiss').click()`,
  );
  await wait(async () => !(await hasWarning()), "dismiss acknowledges error");
  await fs.writeFile(entryPath, entry);
  await wait(async () => {
    const c = await command({ type: "context" });
    return c.active?.ready && !c.active?.error;
  }, "recovered scene");
  assert.equal(await hasWarning(), false);
  win.setSize(1440, 960);
  nativeTheme.themeSource = "light";
  await click("Home");
  await wait(
    () => js("document.querySelectorAll('.home-project').length===2"),
    "light Home",
  );
  await screenshot("home-light");
  await command({ type: "shutdown" }, secondSession);
  assert.deepEqual(errors, []);
  const report = {
    status: "passed",
    full,
    restored,
    light,
    checks: [
      "panels share surface tokens in both themes",
      "timeline extends under composition browser",
      "sidebars and timeline collapse and restore sizes",
      "full-width toolbar and stationary toggles under repeated physical clicks",
      "error popover, full diagnostics, keyboard, outside dismissal and viewport collision",
      "failed retry, explicit dismissal and successful scene recovery",
      "one mounted canvas and clock",
      "compact playback works",
      "layout survives reload",
      "real project creation and switching in both directions",
      "project library survives reload",
      "scene files unchanged",
    ],
    errors,
  };
  await fs.writeFile(
    path.join(directory, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
}
main().then(
  () => finish(0),
  (e) => {
    console.error(e);
    void finish(1);
  },
);
async function finish(code: number) {
  for (const folder of [root, second]) {
    try {
      await command(
        { type: "shutdown" },
        await read(path.join(folder, ".tilt/session.json")),
      );
    } catch {}
  }
  win?.destroy();
  host?.kill();
  app.exit(code);
}
process.on("exit", () => host?.kill());
