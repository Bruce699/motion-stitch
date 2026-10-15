import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";

const output = path.resolve(".tilt/checks/preview-grid");
await fs.mkdir(output, { recursive: true });
await fs.writeFile(
  path.join(output, "index.html"),
  `<!doctype html>
<link rel="stylesheet" href="fixture.css">
<style>
*{box-sizing:border-box}body{margin:0;background:#fff;color:#222;font:14px sans-serif}
#root{width:1100px;height:660px;padding:20px}
.playground-preview{--dial-glass-bg:#fff;--preview-transport-height:56px;--preview-padding-top:12px;--preview-padding-bottom:12px;--preview-padding-x:12px;--preview-row-gap:16px;--preview-column-gap:20px}
.preview-transport{height:56px;flex:none;display:grid;place-items:center}
</style><div id="root"></div><script defer src="fixture.js"></script>`,
);
await build({
  entryPoints: ["tests/fixtures/preview-grid-renderer.tsx"],
  outfile: path.join(output, "fixture.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
});
await fs.writeFile(
  path.join(output, "check.cjs"),
  `
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const output=${JSON.stringify(output)};
app.setPath('userData',path.join(output,'electron'));
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.dock?.hide();
app.on('window-all-closed',()=>{});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 await app.whenReady();
 const reports={};
 const errors=[];
 for(const reduced of [false,true]){
  const win=new BrowserWindow({show:false,width:1100,height:700,webPreferences:{backgroundThrottling:false}});
  win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message)});
  try{
   console.log('Preview grid check',reduced?'reduced':'motion');
   await win.loadFile(path.join(output,'index.html'));
   if(reduced){
    win.webContents.debugger.attach('1.3');
    await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await win.reload();
    await new Promise(resolve=>win.webContents.once('did-finish-load',resolve));
   }
   reports[reduced?'reduced':'motion']=await win.webContents.executeJavaScript('window.previewGridHarness.'+(reduced?'reducedMotion':'run')+'()');
   if(!reduced){
    await win.webContents.executeJavaScript('window.previewGridHarness.render(1)');
    await wait(350);
    await fs.writeFile(path.join(output,'one-frame.png'),(await win.webContents.capturePage()).toPNG());
    await win.webContents.executeJavaScript('window.previewGridHarness.render(2)');
    await wait(85);
    await fs.writeFile(path.join(output,'adding-second.png'),(await win.webContents.capturePage()).toPNG());
    await wait(300);
    await win.webContents.executeJavaScript('window.previewGridHarness.render(3)');
    await wait(350);
    await fs.writeFile(path.join(output,'three-frames.png'),(await win.webContents.capturePage()).toPNG());
   }
  }catch(error){
   const last=await win.webContents.executeJavaScript('window.previewGridLastCheck');
   await fs.writeFile(path.join(output,'failed-check.json'),JSON.stringify(last,null,2));
   throw error;
  }finally{win.destroy()}
 }
 if(errors.length)throw new Error(errors.join('\\n'));
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify(reports,null,2));
 console.log(JSON.stringify({passed:true,counts:reports.motion.additions.map(x=>x.count),retainedCanvases:true,rapidRetarget:true,reducedMotion:reports.reduced.passed,report:path.join(output,'report.json')}));
})().then(()=>app.exit(0),error=>{console.error(error);app.exit(1)});
`,
);
const child = spawn(electron, [path.join(output, "check.cjs")], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.once("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.once("exit", (code) => process.exit(code ?? 1));
