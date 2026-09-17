import { build } from "esbuild";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import electron from "electron";

// Install optional fixture dependencies outside the repository:
// npm install --prefix /tmp/tilt-frameworks --no-save vue svelte
// node scripts/verify-framework-sources.mjs --dependencies /tmp/tilt-frameworks
const argument = process.argv.indexOf("--dependencies");
if (argument < 0)
  throw new Error(
    "Pass --dependencies with a temporary directory containing installed vue and svelte packages",
  );
const dependencies = path.resolve(process.argv[argument + 1]);
const require = createRequire(path.join(dependencies, "package.json"));
const { compile } = require("svelte/compiler");
const root = await fs.mkdtemp(
  path.join(os.tmpdir(), "tilt-framework-source-check-"),
);
const output = path.resolve(".tilt/checks/framework-sources");
await fs.mkdir(output, { recursive: true });
const css =
  "body{margin:0;font:16px sans-serif}main{width:320px;height:240px;background:#eceef3}.card{position:absolute;top:24px;width:200px;height:140px;padding:12px;box-sizing:border-box;background:#304fd0;color:white;border-radius:12px}.card p{margin-top:18px;opacity:.7}";
for (const name of ["vue", "svelte"]) {
  await fs.mkdir(path.join(root, name), { recursive: true });
  await fs.writeFile(
    path.join(root, name, "index.html"),
    '<!doctype html><link rel="stylesheet" href="/theme.css"><div id="root"></div><script src="/index.js"></script>',
  );
  await fs.writeFile(path.join(root, name, "theme.css"), css);
}
await fs.writeFile(
  path.join(root, "vue/entry.js"),
  `import {createApp,h,ref,nextTick} from 'vue';const time=ref(0);createApp({render(){return h('main',{},[h('div',{class:'card','data-tilt-id':'card',style:{left:(20+Math.round(time.value*20))+'px'}},[h('strong',{},'Framework source'),h('p',{},'Frame '+Math.round(time.value*60))])])}}).mount('#root');window.tiltSource={ready:()=>nextTick(),sample:async({time:value})=>{time.value=value;await nextTick();return {revision:value}}};`,
);
await fs.writeFile(
  path.join(root, "svelte/clock.js"),
  "import {writable} from 'svelte/store';export const time=writable(0);",
);
const component = compile(
  `<script>import {time} from './clock.js';</script><main><div class="card" data-tilt-id="card" style:left={(20+Math.round($time*20))+'px'}><strong>Framework source</strong><p>Frame {Math.round($time*60)}</p></div></main>`,
  { filename: "Fixture.svelte", generate: "client", dev: false },
);
await fs.writeFile(path.join(root, "svelte/Fixture.js"), component.js.code);
await fs.writeFile(
  path.join(root, "svelte/entry.js"),
  "import {mount,tick} from 'svelte';import Fixture from './Fixture.js';import {time} from './clock.js';mount(Fixture,{target:document.querySelector('#root')});window.tiltSource={ready:()=>tick(),sample:async({time:value})=>{time.set(value);await tick();return {revision:value}}};",
);
await Promise.all(
  ["vue", "svelte"].map((name) =>
    build({
      entryPoints: [path.join(root, name, "entry.js")],
      outfile: path.join(root, name, "index.js"),
      bundle: true,
      platform: "browser",
      format: "iife",
      conditions: ["browser"],
      nodePaths: [path.join(dependencies, "node_modules")],
      define: { "process.env.NODE_ENV": '"production"' },
    }),
  ),
);
await fs.writeFile(
  path.join(root, "versions.json"),
  JSON.stringify({
    vue: require("vue/package.json").version,
    svelte: require("svelte/package.json").version,
  }),
);
await build({
  entryPoints: ["scripts/verify-framework-sources.ts"],
  outfile: path.join(root, "main.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron"],
});
const child = spawn(electron, [path.join(root, "main.cjs")], {
  stdio: "inherit",
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "",
    TILT_FRAMEWORK_ROOT: root,
    TILT_FRAMEWORK_OUTPUT: output,
  },
});
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});
await fs.rm(root, { recursive: true, force: true });
process.exitCode = code;
