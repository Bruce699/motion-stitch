import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import {
  ManagedSourceHost,
  sourceEnvironment,
  validatePackagedSource,
} from "../src/main/source-host";
import {
  SourceServerSchema,
  SceneSchema,
  type SourceServer,
  type SourceSpec,
} from "../src/core/schema";

const server: SourceServer = {
  executable: "node",
  args: ["server.mjs", "{port}"],
  cwd: "app",
  url: "http://127.0.0.1:{port}/fixture",
  export: "packaged",
};
const source: SourceSpec = {
  id: "app",
  kind: "web",
  width: 640,
  height: 480,
  sampling: "controlled",
  layers: [],
  server,
};
const seed = JSON.parse(
  await fs.readFile(new URL("./fixtures/scene.json", import.meta.url), "utf8"),
);
async function fixture(script: string) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-host-test-"));
  await fs.mkdir(path.join(directory, "app"));
  await fs.writeFile(path.join(directory, "app", "server.mjs"), script);
  return directory;
}
const normalServer = `import http from 'node:http'; import fs from 'node:fs/promises';
await fs.writeFile('runtime-cache.txt','runtime writes stay outside the snapshot');
http.createServer((req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({cwd:process.cwd(),port:process.env.PORT,arg:process.argv[2],args:process.argv.slice(3),secret:process.env.TILT_PRIVATE_TEST_SECRET,nodeOptions:process.env.NODE_OPTIONS}));}).listen(Number(process.env.PORT),'127.0.0.1');`;
function running(pid?: number) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function request(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { agent: false }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.once("end", () => resolve(body));
      response.once("error", reject);
    });
    request.once("error", reject);
  });
}

test("source declarations keep entry/url compatibility and require one input", () => {
  for (const declaration of [
    { entry: "source/index.html" },
    { url: "http://localhost:9000" },
    { server },
  ])
    assert.equal(
      SceneSchema.safeParse({
        ...seed,
        sources: [{ ...source, server: undefined, ...declaration }],
      }).success,
      true,
    );
  for (const declaration of [
    {},
    { entry: "source/index.html", server },
    { url: "http://localhost:9000", server },
  ])
    assert.equal(
      SceneSchema.safeParse({
        ...seed,
        sources: [{ ...source, server: undefined, ...declaration }],
      }).success,
      false,
    );
});

test("managed URLs require an ephemeral IPv4 loopback port and no credentials", () => {
  for (const url of [
    "https://example.com:{port}/",
    "http://example.com:{port}/",
    "http://127.0.0.1:7777/",
    "http://user:pass@127.0.0.1:{port}/",
    "http://127.0.0.1:12345/{port}",
    "http://127.0.0.1:{port}/#secret",
    "http://127.0.0.1:{port}/{port}",
  ])
    assert.equal(
      SourceServerSchema.safeParse({ ...server, url }).success,
      false,
      url,
    );
  assert.equal(SourceServerSchema.safeParse(server).success, true);
});

test("managed process uses isolated writable inputs, explicit argv, and cleaned environment", async () => {
  const directory = await fixture(normalServer);
  const host = new ManagedSourceHost(
    { ...server, args: [...server.args, "literal $(touch bad) ; `echo bad`"] },
    directory,
  );
  try {
    const url = await host.start(3000);
    const state = JSON.parse(await request(url));
    assert.notEqual(state.cwd, path.join(directory, "app"));
    assert.equal(state.port, new URL(url).port);
    assert.equal(state.arg, state.port);
    assert.deepEqual(state.args, ["literal $(touch bad) ; `echo bad`"]);
    assert.equal(state.secret, undefined);
    assert.equal(state.nodeOptions, undefined);
    await assert.rejects(
      fs.access(path.join(directory, "app", "runtime-cache.txt")),
    );
    assert.equal(running(host.pid), true);
    await host.dispose();
    assert.equal(running(host.pid), false);
    await assert.rejects(fs.access(state.cwd));
    await assert.rejects(request(url));
    await host.dispose();
  } finally {
    await host.dispose();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("managed source does not inherit secrets or interpreter injection from the parent", () => {
  const environment = sourceEnvironment(1234, {
    PATH: "/usr/bin",
    HOME: "/private",
    NODE_OPTIONS: "--require secret.js",
    TILT_PRIVATE_TEST_SECRET: "private",
    OPENAI_API_KEY: "private",
  });
  assert.equal(environment.PATH, "/usr/bin");
  for (const key of [
    "HOME",
    "NODE_OPTIONS",
    "TILT_PRIVATE_TEST_SECRET",
    "OPENAI_API_KEY",
  ])
    assert.equal(environment[key], undefined);
});

test("startup failure and readiness timeout terminate the managed process", async () => {
  for (const [script, expected] of [
    ["process.exit(23)", /code 23/],
    ["setInterval(()=>{},1000)", /timed out/],
  ] as const) {
    const directory = await fixture(script);
    const host = new ManagedSourceHost(server, directory);
    try {
      await assert.rejects(host.start(200), expected);
      assert.equal(running(host.pid), false);
    } finally {
      await host.dispose();
      await fs.rm(directory, { recursive: true, force: true });
    }
  }
});

test("disposing during preparation prevents a late process from starting", async () => {
  const directory = await fixture(normalServer);
  const host = new ManagedSourceHost(server, directory);
  try {
    const starting = host.start(3000);
    const rejected = assert.rejects(starting, /disposed/);
    await host.dispose();
    await rejected;
    assert.equal(running(host.pid), false);
    await assert.rejects(host.start(), /only be started once/);
  } finally {
    await host.dispose();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("a launcher cannot leave its child server alive after disposal", async () => {
  const directory = await fixture(`import {spawn} from 'node:child_process';
spawn(process.execPath,['-e',${JSON.stringify("require('node:http').createServer((q,r)=>r.end('ready')).listen(Number(process.env.PORT),'127.0.0.1'); process.on('SIGTERM',()=>{});")}],{stdio:'ignore'});setInterval(()=>{},1000);`);
  const host = new ManagedSourceHost(server, directory);
  try {
    const url = await host.start(3000);
    await host.dispose();
    await assert.rejects(request(url));
  } finally {
    await host.dispose();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("packaged exports require visible self-contained local JavaScript inputs", async () => {
  const directory = await fixture(normalServer);
  try {
    await validatePackagedSource(source, directory);
    for (const patch of [
      { export: undefined },
      { executable: "npm" },
      { args: ["-e", "console.log('live')"] },
      { args: ["../elsewhere.mjs"] },
    ])
      await assert.rejects(
        validatePackagedSource(
          { ...source, server: { ...server, ...patch } },
          directory,
        ),
      );
    await assert.rejects(
      validatePackagedSource(
        { ...source, server: undefined, url: "http://localhost:9999" },
        directory,
      ),
      /live URL/,
    );
    for (const name of ["node_modules", ".next"]) {
      await fs.mkdir(path.join(directory, "app", name));
      await assert.rejects(
        validatePackagedSource(source, directory),
        /excluded from scene snapshots/,
      );
      await fs.rm(path.join(directory, "app", name), { recursive: true });
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("managed cwd/executable traversal and input symlinks are rejected", async () => {
  const directory = await fixture(normalServer);
  try {
    for (const patch of [
      { cwd: "../outside" },
      { cwd: "/tmp" },
      { executable: "../node" },
      { executable: "/usr/bin/node" },
    ]) {
      const host = new ManagedSourceHost({ ...server, ...patch }, directory);
      await assert.rejects(host.start());
    }
    await fs.symlink(os.tmpdir(), path.join(directory, "app", "outside"));
    const host = new ManagedSourceHost(server, directory);
    await assert.rejects(host.start(), /symlinks/);
    await assert.rejects(validatePackagedSource(source, directory), /symlinks/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
