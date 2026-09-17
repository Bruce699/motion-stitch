# Hosting real web apps

Tilt captures the output of an isolated Chromium page. An imported app keeps its own framework, CSS, fonts, canvas and WebGL. The compositor receives surfaces and layout, not framework components. A framework need not be registered with Tilt.

Each source declares exactly one input:

- `entry`: a local static build. Its directory is served on a separate origin with root-relative assets and SPA fallback.
- `url`: an existing HTTP(S) development or live server, for preview. Tilt does not own that process and cannot freeze it for export.
- `server`: a scene-owned runnable server bundle. Tilt starts it on an allocated loopback port and owns its lifetime.

```json
{
  "id": "app",
  "kind": "web",
  "width": 1440,
  "height": 900,
  "sampling": "controlled",
  "server": {
    "executable": "node",
    "args": ["server.mjs", "--port", "{port}"],
    "cwd": "source-server",
    "url": "http://127.0.0.1:{port}/fixture",
    "export": "packaged"
  },
  "readyTimeoutMs": 30000,
  "sampleTimeoutMs": 15000
}
```

`cwd` names a directory inside the scene. `node` uses Tilt's own runtime in Node mode. Other explicit command names or executables inside `cwd` can be used for managed preview. Arguments are an array passed directly to the process; there is no shell interpolation. `{port}` is replaced in arguments and the URL; `PORT` and `HOST=127.0.0.1` are also provided. The readiness URL must respond with HTTP 2xx. Redirects are not followed during readiness checks.

Tilt launches from a temporary writable copy of the immutable source snapshot, so framework caches cannot change authored files or frozen export inputs. It terminates the process group and deletes that copy on disposal or startup failure. On the current macOS runtime this also terminates child processes created by a launcher. Imported pages still have no Node/editor bridge, persistent browser session, popups or device permissions. The declared server is trusted executable scene code, not a sandbox for untrusted server programs.

The process receives a small runtime environment, not the editor's credentials, shell configuration or `NODE_OPTIONS`. Tilt does not install dependencies or inject secrets. Bundle the server and its dependencies into visible local files. Scene snapshots currently exclude hidden paths and `node_modules`; a raw `.next` folder or development dependency tree is not a packaged server input. For those development setups, use `url` until an agent produces a self-contained fixture bundle.

## Readiness and absolute time

For a controlled source, Tilt waits for `window.tiltSource.sample` to be registered, including delayed framework mounting. It then awaits optional `ready()`, fonts and image decoding. Every stage has a bounded timeout. The adapter must await framework commits and media decoding itself:

```js
window.tiltSource = {
  async ready() {
    await mounted;
    await fixtureData;
  },
  async sample({ time, parameters }) {
    await setStateAndCommit(time, parameters);
    return { revision: contentRevision };
  }
};
```

`revision` may stay the same only when pixels, layer layout, visibility and membership are unchanged. If it changes, Tilt samples Web Animations to the shared absolute time, waits for paint and captures the page. Static sources reuse the complete first capture. The adapter is responsible for timers, videos, canvas and WebGL animation; browser rendering alone cannot make those repeatable.

Source diagnostics identify lifecycle phase, adapter registration, requested/prepared time, cache reuse, capture count/bytes, and stage timings. A timeout retires the source so late asynchronous work cannot alter a subsequent frame. Settled capture/selector errors restore layer state and allow the same source to retry. The session can create a clean replacement after failure. The last successfully presented editor frame remains available through the engine's normal replacement behavior.

## Export boundary

`server.export: "packaged"` is an explicit declaration that the server is a self-contained local fixture. Export requires `executable: "node"`, with a relative `.js`, `.mjs` or `.cjs` file as the first argument. Package validation rejects paths outside the scene, symlinks and inputs excluded from snapshots. The server is started from the frozen scene and disposed after rendering.

That declaration does not prove arbitrary executable code is deterministic. The author still must remove live backend/auth dependencies, bundle fonts and media, fix fixture data and control time/randomness. Tilt freezes its local source/runtime inputs, not the operating system, network or every behavior of a server program. Use a repeatable adapter and verify backward seeks plus the exported output.

Run `npx tsx --test tests/source-host.test.ts` for host lifecycle/path/export contract tests and `node scripts/verify-source-hosting.mjs` for isolated Electron mount, sample, pixel reuse and timeout cleanup checks. Neither command connects to the shared editor runtime.
