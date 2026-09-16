# Working in Tilt

Read the thesis in README.md. Keep the product a small, malleable container for authored scenes. Prefer a general capability or a documented workflow over a preset effect catalogue.

- Scene work: read `.agents/skills/scene-authoring/SKILL.md`.
- Importing/adapting UI: read `.agents/skills/import-web-ui/SKILL.md`.
- Cameras, shaders, 3D and surfaces: read `.agents/skills/custom-rendering/SKILL.md`.
- `scene.json` and source files are authority. Never persist creative state only in a React component, localStorage, or an agent conversation.
- The editor, CLI and MCP must use the same validated commands. Revision/hash conflicts must fail explicitly. Do not overwrite an external edit silently.
- One clock; `sample(time)` is absolute and repeatable. Async work must finish before capture. Never advance a scene while it is preparing.
- Keep the last successful frame on normal reload. Release textures, geometries, materials, browser hosts, subscriptions and listeners after replacement.
- Do not reconstruct production UI as lookalike graphics unless specifically requested. Use the real app with fixtures and a binding adapter.
- Only claim deterministic/frozen export for dependencies you actually control. External live URLs are preview inputs, not sealed builds.
- Keep output files out of Git. Do not commit `.tilt`, credentials, captures, videos, caches or `node_modules`.
- New effects usually belong in the scene. Promote helpers into core only after multiple concrete scenes need them.
- UI copy must serve an action or necessary state. Do not add decorative explanatory text.
- Validate with typecheck, targeted behavioral tests, and rendered evidence. A successful build alone is not visual proof.

The initial scene is a small vanilla fixture. It proves source capture, absolute time, a custom shader and persistence; it does not prove every framework or arbitrary production app works without an adapter.
