---
name: workspace-context
description: Read the current Tilt view and coordinate file edits with any external agent.
---

# Work with the person and the files

1. Read `.tilt/context.json` and the active scene folder. For a specific tab, read `.tilt/views/<viewId>.json`. Check timestamps, connected state, scene ID, requested/presented time, mode, inspection, selection and displayed/document revision. A stale observation is not the current screen.
2. Use `npm run cli -- context --fresh --view <id>` when exact current context matters. This asks that viewer to acknowledge. Captures also acknowledge the presented frame and save paired PNG/JSON files. Inspect actual pixels before claiming a visual result.
3. Files are creative authority. Write scene JSON, TypeScript/JavaScript, source builds and assets normally. The agent is not required to use MCP or a file-writing CLI. Never write runtime observation files as a control mechanism.
4. For coordinated writes: get the revision from `state --scene <id>`, then `begin "Edit description" <revision> --scene <id>`. Save the returned ID. The old complete scene stays displayed while files are changing. Validate, then `apply <id> --scene <id>`. An unfinished group remains open across restart. Do not adopt or discard someone else's group silently.
5. Use `command` with `{type:"edit_begin",label,revision,paths:[...]}` when the exact write set is known. Apply and discard refuse changes outside that set. This detects unexpected files, not a competing writer's intent inside a shared file. Coordinate overlapping work explicitly.
6. Undo/redo includes code, document and binary assets. Do not separately revert files in Git while assuming Tilt history remains unchanged; it will observe that as another file edit. History is local and not a substitute for a Git backup.
7. Source IDs and `data-tilt-id` selections are semantic context. A whole browser surface is not a set of independent DOM layers. Follow the import and rendering skills when depth or isolation is needed.
8. Pan/zoom/orbit describe how the person is inspecting the canvas. Preserve the view while editing. Change the authored camera only when the creative request calls for it. `view source` and `view camera` switch inspection mode; `seek`, `capture`, `play` and `pause` target the active viewer unless `--view` is supplied.

The local runtime can run with `npm start -- --browser`, and the printed URL works in Codex or a normal browser. `desktop` opens the optional native window. Closing either viewer does not stop the runtime or render queue. `stop` stops the runtime; detached exports continue. If no viewer is connected, read files and use scene commands, or open the URL before requesting transport/capture.
