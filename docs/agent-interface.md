# Agent interface

Tilt keeps authored scenes in ordinary files and exposes live workspace operations through one runtime. The editor, CLI and optional MCP adapter use that runtime. The public agent vocabulary is declared in src/core/commands.ts; it supplies runtime validation, MCP tool definitions and capability discovery.

## Start here

Run these from the project:

```sh
npm run cli -- capabilities
npm run cli -- skills
npm run cli -- skill motion-design
npm run cli -- views
npm run cli -- context --fresh --view <viewer-id>
npm run cli -- state --fresh --scene <scene-id>
```

The CLI also accepts TILT_PROJECT, TILT_VIEW and TILT_SCENE. An explicit viewer pins an operation to that tab. When both scene and viewer are supplied for a viewer operation, they must agree. Without a viewer, a matching active viewer is preferred; an ambiguous scene match fails rather than selecting another tab.

Files remain the normal way to author code, UI and assets. The CLI is useful for discovery, exact context, coordinated changes, playback and verification. No MCP configuration is required for coding agents with filesystem and shell access.

## Skills and guidance across connections

`.agents/skills/` is the maintained source for Tilt's skills. The build packages those exact files, selected authoring contracts and core type definitions into `dist/guidance.json`. The connected runtime serves the catalogue and content; remote clients never substitute guidance from their own checkout. Responses contain a bundle version and per-document SHA-256 hashes, so content parity can be checked.

```sh
npm run cli -- skills
npm run cli -- skill motion-design
npm run cli -- skill motion-design guides/timing.md
npm run cli -- guide docs/camera.md
```

`skills` lists descriptions, entrypoints, available files and contract paths without loading every guide. `skill` is a convenient path shortcut; `guide` reads any document listed in the catalogue. All use the read-only `guidance` command over the normal authenticated `/api` connection. MCP exposes the same command as `tilt_guidance` and the catalogue as `tilt://guidance`. The tool description, MCP initialization instructions, CLI help and capabilities response all identify this discovery step. Document responses return resolved `links` that can be passed back as `path`; they are logical IDs, not paths on the agent's computer or scene-relative file paths.

Start with workspace-context, then motion-design for creative motion work, and load only relevant supporting guides. The skill provides creative decisions; the other skills supply execution contracts. Examples written as `npm run cli -- ...` mean the connected Tilt CLI. External projects without Tilt's package scripts use `node /path/to/tilt/dist/cli.cjs ...`, from the project folder or with `TILT_PROJECT` set. New projects created by Tilt receive an `AGENTS.md` bootstrap with the installed CLI path. Opening an existing project never overwrites its instructions; it can use the connection's discovery entrypoints, or its owner can add the bootstrap to existing agent instructions.

Local filesystem agents can read these same files directly. After changing guidance source, rebuild and start the updated runtime so CLI/MCP serve the new version. `AGENTS.md` and scene-authoring route filesystem agents to motion-design. Agents are not guaranteed to discover arbitrary CLI features automatically: a host must expose the tool description or give the agent the bootstrap instruction. Matching guidance, operations and review evidence removes avoidable access differences; it does not guarantee identical output quality across agents or models.

## Three kinds of state

- Scene files contain saved duration, tracks, parameters, camera, sources, code and assets. state returns the validated document and its revision.
- Viewer observations contain selection, timeline range, playhead intent, displayed frame/revision, inspection, readiness and errors. Each tab has a distinct viewer ID.
- The workspace records pending edits and render jobs separately. An edit has an owner, base revision and declared paths. jobs reports durable render work.

.tilt/context.json is a runtime-written observation, updated atomically. .tilt/views/<id>.json holds each viewer's full observation. Agents may read these files directly; editing them does not control Tilt.

The context snapshot contains:

- workspaceId: identity of this local workspace, retained across runtime restarts.
- runtimeId and cursor: identify a runtime instance and its latest meaningful context/scene change.
- observedAt: when the snapshot was assembled. This does not mean a viewer just acknowledged it.
- activeViewId: the workspace's active viewer; active is the selected viewer when a view filter is supplied.
- scenes: observed scene revisions, duration, frame rate, errors and pending-edit ownership.
- views: viewer connection, focus, visibility and interaction information.
- active: full selected-view context, including duration, fps, timeline.start/end/zoom/expandedTrackIds and selectedTracks with names, timing, targets and parameter bindings.
- requestedTime versus presentedTime and documentRevision versus displayedRevision: intent and actual presented result remain distinct.
- sourceStatus and renderMetrics, when available, describe source preparation and frame processing. Render submission timing is not physical display/GPU completion.

Viewer updatedAt is the freshness boundary. After seven seconds without a heartbeat the viewer is reported disconnected. A file snapshot can remain on disk after a crash. context --fresh requests an acknowledgement from a connected viewer and adds acknowledgedAt and acknowledgedViewId. It fails if the viewer cannot respond.

Source inspection does not rewrite viewer observations: inspecting a browser source is not evidence of what a particular canvas displayed.

## Read, watch and verify

```sh
npm run cli -- context
npm run cli -- context --fresh --view <viewer-id>
npm run cli -- watch --view <viewer-id>
npm run cli -- watch --view <viewer-id> --count 1
npm run cli -- wait-for-change <cursor> --timeout 10000
```

watch emits newline-delimited JSON over an authenticated event stream. It sends a complete snapshot on connection, then changes, and reconnects after a dropped connection. Connection events explicitly mark disconnection. Watching never registers a viewer, changes active focus or steals a tab's event connection.

Identical viewer heartbeats refresh timestamps without waking context watchers. Changes to an observed scene, including opening/applying an edit, also advance the cursor. Cursors are workspace-wide; a filtered watcher may be woken by another viewer's changes and should inspect its selected snapshot. wait-for-change is bounded to 30 seconds and returns changed:false on timeout. A cursor from an earlier runtime returns immediately.

```sh
npm run cli -- seek 3 --view <viewer-id>
npm run cli -- select-track <track-id> --view <viewer-id>
npm run cli -- view source --view <viewer-id>
npm run cli -- wait-for-frame <revision> --view <viewer-id>
npm run cli -- capture 3 --view <viewer-id>
```

seek and capture await the selected viewer. wait-for-frame observes presentation without moving the playhead; it rejects a superseding revision or timeout. Capture returns a PNG path plus contextPath, viewer/workspace identity and the paired displayed state. Inspect the PNG before judging appearance.

Opening a scene targets a viewer and waits for its first frame:

```sh
npm run cli -- open <scene-id> --view <viewer-id>
```

Selection, expanded timeline groups and the visible timeline range are inspection state. Reload restores them for that tab; they are not saved as authored animation or exported.

After a local runtime restart, open viewers can refresh their session cookie and reconnect. An API command is retried once only when the server explicitly rejects it before execution. Ambiguous network failures and command errors are never replayed. Event-stream recovery uses three bounded attempts per outage; a prolonged outage may require reloading the tab.

## Review without a viewer

Use `review` / `tilt_review` to inspect authored output without selecting or moving a browser tab. One request returns ordered frames, semantic detail crops and sampled camera/source context; `compareTo` produces matched before/after evidence. Optional motion previews run asynchronously. MCP responses contain actual image blocks. See [native visual review](agent-review.md) for the contract, examples and proof boundaries.

```sh
npm run cli -- review '{"times":[0,2,5],"focus":["ui/payment"]}' --scene <scene-id>
npm run cli -- review-status <review-id>
```

## Coordinated editing

Codex CLI/MCP calls use CODEX_THREAD_ID as their default actor identity. Other clients should set a stable TILT_ACTOR for each agent, or pass --actor consistently. The fallback CLI identity is based on its parent process; set an explicit identity for work spanning terminal sessions. These labels prevent accidental ownership conflicts; they are not an authentication boundary against trusted code impersonating an actor.

```sh
npm run cli -- state --fresh --scene <scene-id>
npm run cli -- begin "Adjust card motion" <revision> --scene <scene-id> --paths '["scene.ts","scene.json"]'
# Edit the declared scene files normally and validate them.
npm run cli -- apply <edit-id> --scene <scene-id>
npm run cli -- wait-for-frame <returned-revision> --view <viewer-id>
```

Begin requires the starting revision for agent edits. Keep the returned ID and actor. Apply/discard checks ownership; file API writes also check the owner and declared path before touching disk. Groups survive restarts. No automatic adoption/discard of another agent's group occurs.

For small edits:

```sh
npm run cli -- set depth 1.2 --scene <scene-id> --revision <revision>
npm run cli -- set-camera '{"rotation":30}' --scene <scene-id> --revision <revision>
npm run cli -- set-track <track-id> '{"start":1,"end":3}' --scene <scene-id> --revision <revision>
npm run cli -- set-setting duration 8 --scene <scene-id> --revision <revision>
```

Single-field commands merge into the current document and preserve unrelated fields. Supply revision to reject a stale decision. Scene replacement always requires it. Group retiming uses the same rules as the editor.

read returns content and a hash. write requires that hash for replacement, or --hash new for create-only:

```sh
npm run cli -- read scene.ts --scene <scene-id>
npm run cli -- write scene.ts /absolute/path/to/edited.ts --hash <hash> --scene <scene-id>
```

Raw filesystem writes remain supported. The runtime serializes its own writes but cannot lock out arbitrary external programs or reliably attribute their intent. Coordinate shared-file work explicitly or use separate working copies. Undeclared-file changes fail apply/discard. A revision guard is not a substitute for isolating competing writers to the same raw file.

## MCP

Run dist/agent.cjs with TILT_PROJECT set to the project directory. Public commands share their schemas with the runtime; this includes guidance, context, viewer targeting, camera/track edits, edit groups, history, captures and rendering. Tools accept actorId, sceneId and viewId where applicable. Read-only resources are available at tilt://context, tilt://capabilities and tilt://guidance. Capabilities and guidance resources come from the connected runtime. tilt_wait_for_change provides bounded waiting without requiring host support for resource subscriptions.

## Remote connection boundary

TILT_URL selects a compatible workspace API endpoint. TILT_TOKEN must be injected at runtime from the correctly scoped secret store. Tokens are never accepted in URL credentials/query parameters or printed in context. Use HTTPS; plain HTTP is allowed only for loopback testing. Requests refuse redirects so credentials cannot move to another endpoint.

Remote mode does not read the local session/context files or fall back to local jobs if the endpoint fails. TILT_VIEW/TILT_SCENE and normal commands retain their meaning. Files can be read/written through the same guarded file commands. The editor's animation clock remains independent of CLI process launches.

This is a tested client connection boundary, not a deployed hosted product. The current server remains loopback-only. Hosted login, per-user permissions, repository synchronization, remote artifact downloads and native rendering adapters are deferred. Capture/render paths currently refer to the runtime's filesystem; external hosting needs an artifact delivery layer. WebMCP is also deferred.

## Verification

```sh
npm run typecheck
npm test
npm run build
node scripts/verify-agent-interface.mjs
```

The native integration uses an isolated fixture and two real editor windows. It verifies targeted playback, timeline/selection context, reload restoration, ownership/conflicts, displayed-revision acknowledgement, PNG context, explicit endpoint access, streaming, actual MCP/CLI calls, independent scene opening and runtime restart recovery without reloading either viewer. Artifacts are written under .tilt/checks/agent-interface and stay out of Git.
