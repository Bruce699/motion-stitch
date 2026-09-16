---
name: import-web-ui
description: Adapt a real web app from any framework into Tilt's browser-source contract.
---

# Bring in real UI

1. Find the real component or page, its styles, fonts, images, and data. Reuse them. Do not visually redraw it into canvas, SVG, or substitute React components just to get a texture.
2. For exploration use a locally running dev-server URL in `sources`. For export make a production build with deterministic fixtures, copy the build into `source/` inside the scene, and use `entry: "source/index.html"`. Tilt serves that directory on its own origin, so root-relative asset paths work. SSR/auth/backend-only screens need a local fixture route or a static render bundle; a URL alone does not freeze them.
3. Set a fixed logical viewport width and height. Read `docs/resolution.md`: layout size is separate from `scene.size` (up to 4K) and `scene.capture.density` (Auto or 1–8×). Use the shared density path; do not enlarge the viewport, CSS-scale the UI or create another capture host for sharpness. Choose an explicit density for extreme authored close-ups, and check the effective limit. Canvas/WebGL adapters must honor devicePixelRatio. Bundle fonts and assets locally. Wait for fonts, image decoding and app data before declaring readiness. Do not bring real customer/private data into a fixture unnecessarily.
4. Use `sampling: "static"` only for a genuinely static surface. For motion, install this small adapter on the source page:

```js
window.tiltSource = {
  async ready() {
    /* framework mounted, fixture data and media loaded */
  },
  async sample({ time, parameters }) {
    // Set state from time, commit framework changes, seek required media.
    // React: flush controlled state; Svelte: await tick(); Vue: await nextTick().
    return { revision: time }; // Or a stable key if the pixels did not change.
  },
};
```

5. Tilt waits for the adapter, then pauses/samples document Web Animations to the shared clock and waits for two paint opportunities. Framework subscriptions, canvas, WebGL and videos still need your adapter. For video, set `currentTime` and await `seeked`/decoded-frame readiness; merely assigning time is insufficient.
6. Add stable `data-tilt-id` attributes for important subjects. `npm run cli -- inspect` returns bounds and text. Read `context --fresh` for the currently presented route and selected IDs. These IDs are semantic handles. Declare a selector in `sources[].layers` when a subject should become an independent 3D layer.
7. Start with a faithful whole surface. For separate depth, follow `../ui-layers/SKILL.md`: declare DOM regions and use `createLayeredSource` so capture/alignment remain shared. Preserve clipping, blur, alpha and backdrop dependencies within a group. Never flatten then pretend hidden pixels still exist.
8. Check backward seeking, fonts, thin borders, clips and final export. Document external dependencies or unsupported features. A successful vanilla fixture is not universal framework validation.

Browser sources have no Node or editor command bridge, a temporary browser session, no popup allowance and no device permissions. Do not disable these safeguards to work around an import problem. Trusted scene code can remain expressive without giving the imported page arbitrary file access.
