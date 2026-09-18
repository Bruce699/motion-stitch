# Independent Apple viewer reconstruction

Open **http://127.0.0.1:4318/**. Use **Inspect** for wireframe, lighting, resolution, and motion measurements. Select iPhone Duo for coordinated folding poses and the hinge slider.

The viewer is entirely new code. Apple contributes only model/texture assets and the embedded Duo animation. No Apple runtime, scene script, camera path, or shader is imported. Source URLs and hashes are in `asset-manifest.json`; the full investigation is in [RESEARCH.md](RESEARCH.md).

From this repository:

```sh
node experiments/apple-viewer-lab/dev.mjs
node --test experiments/apple-viewer-lab/motion.test.mjs
node experiments/apple-viewer-lab/build.mjs
```

The running server binds to localhost. To regenerate the local assets:

```sh
python3 experiments/apple-viewer-lab/research-download.py
python3 experiments/apple-viewer-lab/prepare-assets.py
```

The downloader archives only publicly referenced Apple files under `.tilt/apple-viewer-research/`. Preparation copies the model and texture subset into ignored `public/assets/`, strips unsupported proprietary material extensions, and assigns supplied screen plates. It records each source and hash. Native ASTC uses Three’s KTX2 file handler; devices without ASTC use AVIF. Add `?textures=avif` to exercise that branch explicitly.

`main.js` owns the renderer, original studio rigs, material blending, interaction, and absolute hinge sampling. `motion.mjs` owns our shot definitions and timing math. `motion.test.mjs` checks behavioral invariants. `evidence/` contains local rendered and measurement evidence. Downloaded assets, screenshots, and builds are excluded from Git.

This is a local research demo, not an Apple viewer distribution or an exact rendering match. Its custom material approximations and two studio environments intentionally expose the core technique in a small implementation. Measurements are local and warmed; no physical mobile device or cold network performance is claimed.
