# Connect external agents to a Tilt account

Status: deferred product vision. One consolidated issue; not required to use the current local skills and authoring workflow. Recorded locally because this checkout has no configured Git remote; not yet posted to an issue tracker.

## Intended experience

- The person uses their existing agent in a desktop app or terminal alongside Tilt's web app.
- They tell that agent, “Open Tilt.”
- Tilt's public website provides a discoverable agent-facing page with the supported setup and authoring instructions.
- The agent installs or invokes the Tilt CLI; an optional plugin makes the same connection convenient.
- Browser-based login lets the person confirm their account and returns the authenticated connection to the CLI or agent host.
- The connection belongs to the account. The person does not separately attach a browser tab, project folder or runtime session.
- Once connected, the agent can discover permitted projects and where the person is currently working.
- Tilt never embeds an agent, model SDK, chat box or agent conversation sidebar. The person brings their own agent.

## Capabilities to deliver

- Account authentication, credential renewal, logout and revocation, with access bounded to the person's permissions.
- Account-wide project discovery and live presence: online/offline state, active project/view, multiple open views, current selection, playhead, presented frame and relevant pending changes.
- Explicit freshness and ambiguity handling. Internal view/project IDs route operations; they are not user-facing connection steps.
- Resolve and pin the intended target for an edit so switching tabs cannot silently redirect work. Preserve revision checks, edit ownership and undo.
- One documented agent workflow and command vocabulary. CLI and any connection adapters use the same operations, guidance and results.
- Progressive skill discovery: a short initial entrypoint, searchable descriptions, exact skill content and linked guides loaded only when relevant.
- Hosted project content and execution: source/assets, dependencies, builds, composition sampling and rendering, with persistent project state.
- A familiar file-oriented authoring environment where useful, without requiring the person to manage a local checkout. Choose the hosted execution implementation when this work begins; Just Bash is not a committed dependency.
- Accessible visual feedback: rendered frames, native-detail crops, motion previews and export artifacts that an external agent can actually inspect.
- Project isolation and coordinated edits when the person or another agent is working concurrently.

## Acceptance criteria

- A fresh supported external agent can follow the public entrypoint, authenticate through the browser and reach the correct account without manual session IDs or token copying.
- It can discover the relevant skill, understand the current project, make a guarded edit and inspect the rendered result without access to the person's filesystem.
- Multiple tabs and offline/stale presence produce explicit, predictable targeting behavior.
- The same authoring task uses the same guidance and operation semantics locally and when hosted. Compare completed tasks and visual review, not only successful API calls.
- Plugin-specific conveniences do not introduce a separate workflow or duplicate maintained instructions.
- No agent UI or agent reasoning loop is added to Tilt itself.

## Current foundation

- [Motion-design skill](../../.agents/skills/motion-design/SKILL.md) and six selectively loaded guides are active.
- [Agent interface](../agent-interface.md) exposes the shared guidance catalogue through CLI, MCP and the runtime API, with content hashes and linked document paths.
- The repository's agent instructions route creative work to the skill; new Tilt projects receive an agent bootstrap without overwriting instructions when an existing project is opened.
- Current local/explicit-endpoint discovery is implemented and tested. Hosted accounts, browser login and the account-level service remain future work.

This issue records the destination. It does not require building the deferred infrastructure before using or improving the current local authoring experience.
