import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const [project] = process.argv.slice(2);
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const read = async (p: string) => JSON.parse(await fs.readFile(p, "utf8"));
const wait = async (fn: () => Promise<any>, label: string) => {
  const end = Date.now() + 60000;
  while (Date.now() < end) {
    const r = await fn();
    if (r) return r;
    await delay(100);
  }
  throw new Error("Timed out: " + label);
};
app.setPath("userData", path.join(project, "viewer"));
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.dock?.hide();
app.on("window-all-closed", () => {});
let host: ReturnType<typeof spawn> | undefined,
  win: BrowserWindow | undefined,
  session: any;
const command = async (body: object) => {
  const r = await fetch(session.origin + "/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(result));
  return result;
};
async function main() {
  await app.whenReady();
  const log = await fs.open(path.join(project, "runtime.log"), "a");
  host = spawn(
    process.execPath,
    [path.join(project, "runtime/main.cjs"), "--project", project, "--browser"],
    {
      stdio: ["ignore", log.fd, log.fd],
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
    },
  );
  session = await wait(async () => {
    try {
      const s = await read(path.join(project, ".tilt/session.json"));
      return s.pid === host!.pid && s;
    } catch {
      return false;
    }
  }, "runtime");
  const errors: string[] = [];
  win = new BrowserWindow({
    show: false,
    width: 1200,
    height: 900,
    webPreferences: { backgroundThrottling: false },
  });
  win.webContents.on("console-message", (e) => {
    if (e.level === "error") errors.push(e.message);
  });
  await win.loadURL(session.origin);
  await wait(async () => {
    const c = await command({ type: "context" });
    return c.active?.ready && !c.active.error && c.active;
  }, "editor");
  // Observe completed main-canvas draws without introducing a production debug API.
  await win.webContents.executeJavaScript(`{
 const P=WebGL2RenderingContext.prototype,bind=P.bindFramebuffer,clear=P.clear;
 const targets=new WeakMap();window.__draws=[];
 P.bindFramebuffer=function(target,fb){if(target===this.FRAMEBUFFER||target===this.DRAW_FRAMEBUFFER)targets.set(this,fb);return bind.call(this,target,fb);};
 P.clear=function(mask){if(!targets.get(this)&&(mask&this.COLOR_BUFFER_BIT))window.__draws.push(performance.now());return clear.call(this,mask);};
 void 0;
 }`);
  const reports = [];
  for (const enabled of [false, true]) {
    await command({ type: "set_camera", patch: { depthOfField: { enabled } } });
    await command({ type: "seek", time: 4 });
    for (let trial = 0; trial < 3; trial++) {
      const rect = await win.webContents.executeJavaScript(
        `(()=>{const r=document.querySelector('[aria-label="Timeline ruler"]').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()`,
      );
      win.webContents.sendInputEvent({
        type: "mouseDown",
        x: Math.round(rect.x + 2),
        y: Math.round(rect.y + rect.height / 2),
        button: "left",
        clickCount: 1,
      });
      const report = await win.webContents.executeJavaScript(`(async()=>{
    const el=document.querySelector('[aria-label="Timeline ruler"]'),r=el.getBoundingClientRect();window.__draws=[];
    const start=performance.now();let inputs=0,end=start;
    await new Promise(resolve=>{function tick(now){end=now;const elapsed=(now-start)/1000;if(elapsed>=5){resolve();return;}const p=(elapsed%2)/2;const ratio=p<.5?p*1.8:(1-p)*1.8;
     el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:r.left+ratio*r.width,clientY:r.top+r.height/2,pointerId:1,pointerType:'mouse',buttons:1}));inputs++;requestAnimationFrame(tick);}
     requestAnimationFrame(tick);});
    const frames=window.__draws.filter(t=>t<=end);const gaps=frames.slice(1).map((t,i)=>t-frames[i]).sort((a,b)=>a-b);
    return {inputs,frames:frames.length,seconds:(end-start)/1000,fps:frames.length/((end-start)/1000),gapP95:gaps[Math.floor(gaps.length*.95)],gapMax:gaps.at(-1),canvas:[document.querySelector('.canvas-frame canvas').width,document.querySelector('.canvas-frame canvas').height],playhead:el.getAttribute('aria-valuenow')};
   })()`);
      win.webContents.sendInputEvent({
        type: "mouseUp",
        x: Math.round(rect.x + rect.width * 0.85),
        y: Math.round(rect.y + rect.height / 2),
        button: "left",
        clickCount: 1,
      });
      await delay(200);
      const result = await command({ type: "context", fresh: true });
      const context = {
        active: result.active ?? result.context ?? result.view ?? result,
      };
      reports.push({
        enabled,
        trial,
        ...report,
        presentedTime: context.active?.presentedTime,
        requestedTime: context.active?.requestedTime,
        error: context.active?.error,
      });
      console.log(JSON.stringify(reports.at(-1)));
      assert.ok(
        report.frames >= report.inputs * 0.95,
        "Scrubbing should render at least 95% of requested frames at the host's refresh rate",
      );
      assert.ok(
        Math.abs(context.active.presentedTime - context.active.requestedTime) <
          0.001,
      );
    }
  }
  await command({ type: "seek", time: 4.236333188 });
  await fs.writeFile(
    path.join(project, "editor.png"),
    (await win.webContents.capturePage()).toPNG(),
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    path.join(project, "report.json"),
    JSON.stringify(
      {
        reports,
        errors,
        electron: process.versions.electron,
        measuredAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  win.destroy();
  await command({ type: "shutdown" });
  await log.close();
}
main().then(
  () => app.exit(0),
  (e) => {
    console.error(e);
    win?.destroy();
    host?.kill("SIGTERM");
    app.exit(1);
  },
);
