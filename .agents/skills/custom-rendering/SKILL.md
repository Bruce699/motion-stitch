---
name: custom-rendering
description: Author bespoke Tilt shaders, geometry, cameras and composition while preserving source fidelity.
---

# Compose without a preset catalogue

- Use `context.THREE` and `context.surfaces[id]`. Do not instantiate a second Three renderer or import a competing Three version into the scene.
- Allocate geometry, materials, uniforms and reusable objects once in the factory. Sampling updates their values. Avoid DOM reads, allocations, shader compilation and source recapture in camera-only frames.
- Use `context.camera`; keep scene units and camera math in scene code. Match source plane aspect to its declared viewport. Inspector controls should manipulate meaningful authored parameters.
- Browser textures carry sRGB color. Respect linear shader math and include Three's output color-space conversion. Preserve premultiplied/straight-alpha assumptions explicitly if adding intermediate passes. Verify exported colors against the real UI.
- The renderer is WebGL2. Custom ShaderMaterial, geometry and mesh composition are available now. A custom multi-pass compositor requires an explicit engine extension with lifecycle and export parity; do not secretly render a second canvas over the preview.
- A captured browser page is a surface. Individual DOM semantics and paint dependencies do not automatically become mesh layers. Keep fidelity first; introduce an explicit surface/group adapter where needed.
- Use the same `sample` path for preview, paused capture and export. No low-quality export fallback. Quality presets, if introduced, must be explicit and recorded in the frozen job.
- Dispose private resources in the optional `dispose()`. The engine traverses world geometry/materials and its source textures on teardown, but scene-owned render targets, subscriptions, workers and detached resources are yours to release.
- Test repeated reloads, backward sampling and at least one export. Inspect shader errors instead of accepting a blank or black material as a successful frame.

Future native sources should implement source readiness, absolute-time sampling, surfaces, metadata and disposal; the editor's language or framework should not dictate the source's rendering technology.
