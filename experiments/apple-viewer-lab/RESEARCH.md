# How Apple’s product viewers work

Investigation: 18 September 2026. Inspected the live iPhone 18 Pro and iPhone Duo pages, their running WebGL scenes, public JavaScript bundles, scene descriptions, geometry, textures, storage mechanisms, and interactions. The independent reconstruction is at **http://127.0.0.1:4318/**.

The central finding: Apple treats this as product photography with interactive transitions. The model, camera destinations, materials, and reflection environments are authored together. A generic orbit control and one HDR panorama will not reproduce that result.

## What is actually rendering

Both live viewers expose Three.js **r165** through a framework named **Lotus**. The running framework reported **10.7.1 on Pro** and **10.7.2 on Duo**. This is a WebGL renderer, not a WebGPU or browser-native `<model>` experience. The scene-description files have their own version metadata; those should not be confused with the running library version.

The downloadable `.lsd` files are JSON scene descriptions. They reference glTF geometry, binary vertex/index/animation buffers, texture files, material overrides, named states, camera positions, environment variants, and scripts. The page code ties these to the menus and scrolling behavior. This is a substantial authoring system on top of Three.js.

There is an important difference between the pages. On Pro, clicking **New Main camera** hid the 3D gallery (`display: none`) and displayed an MP4 in the same section. Its live source was `anim/viewer-aperture/large_2x.mp4`. The surrounding viewer UI can therefore blend between real-time 3D and prepared media. On Duo, the inspected Landscape state retained the canvas and its enclosing section contained no video elements. Do not generalize either observation to every shot on every Apple product page.

Sources: [Pro page](https://www.apple.com/iphone-18-pro/), [Duo page](https://www.apple.com/iphone-duo/), [Pro runtime](https://www.apple.com/v/iphone-18-pro/a/built/scripts/vendors~lotus-lib.built.js), [Duo runtime](https://www.apple.com/v/iphone-duo/a/built/scripts/vendors~lotus-lib.built.js).

## Why loading feels fast

**They begin before you need the viewer.** Both inspected HTML documents set a 10-second load trigger and a 60-second timeout. The page code also starts loading on an early scroll rather than waiting for a drag. A preview image covers the loading phase; unsupported or failed enhancement can fall back to prepared content. Perceived instant availability is not the same as zero download or initialization time.

**There are separate asset packages.** The loader selects `_ktx` when ASTC texture support is available and `_avif` otherwise. It also selects large, medium, or small scene packages. In the inspected selection code, touch capability and `outerWidth <= 884` distinguish small from medium, while non-touch uses large. That is an asset-quality choice, separate from the page’s CSS layout breakpoints and the camera’s preferred angles.

**The textures can stay compressed on the GPU.** The inspected `.ktx` files are KTX2 containers containing native ASTC 6×6 blocks (`vkFormat` 165/166), not simply ordinary images renamed KTX. This reduces texture memory and bandwidth compared with uncompressed RGBA. An AVIF may download compactly, but normally becomes an uncompressed texture after decoding. KTX2 is a container; it does not automatically mean Basis Universal transcoding. Our native-ASTC route uses Three’s texture handler, not a false Basis declaration.

**The runtime and scene data compress well over HTTP.** In the existing Pro browser session, the Lotus vendor script was 1,602,895 decoded bytes and 460,488 encoded bytes. The captured static-scene requests totaled approximately 7.15 MB encoded. This was an already-open session, not a controlled cold-load measurement.

**Work is prepared and reused.** The runtime stabilizes material shader features with placeholder maps, prepares environment textures, and queues additional environment work. Shader compilation, uploads, and environment generation can all cost time at initialization. This architecture reduces work during the drag itself; it does not eliminate startup cost.

Sources: [Duo page code](https://www.apple.com/v/iphone-duo/a/built/scripts/overview/main.built.js), [Pro page code](https://www.apple.com/v/iphone-18-pro/a/built/scripts/overview/main.built.js), scene roots below. Local source pointers: formatted Duo main lines 9810–9845, 28755–28785, and 29504–29558; Duo runtime lines 28640–28745.

## Why motion stays fluid

The actual phone geometry is modest for modern GPUs:

| Downloaded phone asset | Pro | Duo |
|---|---:|---:|
| Triangle count | 62,862 | 67,494 |
| Meshes | 41 | 62 |
| Material definitions | 34 | 36 |
| Images in base glTF | 31 | 33 |
| Main binary buffer | 2,958,332 bytes | 3,890,544 bytes |
| Embedded animation | None | 2 clips, 27-joint skin |

These counts cover the phone asset, not every draw pass or auxiliary scene. Duo also has a separate wallpaper scene and several environment scenes. The main phone buffers are ordinary glTF data; there is no Draco or meshopt extension in these inspected models.

The live Pro renderer had shadow mapping disabled. Reflections use prepared, filtered environment maps rather than computing a physically complete studio lighting simulation for every pixel. The inspected PMREM cube-face limit was 256. PMREM means prefiltered environment lighting: multiple blur levels provide appropriate reflections for surfaces with different roughness. [Three.js PMREM documentation](https://threejs.org/docs/pages/PMREMGenerator.html)

Lotus’s loop distinguishes per-frame bookkeeping from drawing. Its `shouldDrawFrame` flag gates scene rendering, while the update emitter continues. Camera motion requests more draws until its rounded position stops changing. This is a demand-driven drawing strategy, not evidence that the entire application stops all animation-frame callbacks.

Duo’s page explicitly caps device pixel ratio at 2. Pro’s inspected `dprTest` returned the device pixel ratio unless a query override was supplied; I did not find the same cap there. Neither observation establishes an automatic frame-rate-driven quality scaler.

There is no basis to promise “always 60 FPS on every device.” Resolution, GPU, thermal state, page work, first-use compilation, and browsers still matter. The architecture keeps the recurring workload controlled, and the media fallback means not every impressive shot is a real-time rendering benchmark.

## How the camera snaps

Apple’s camera operates in spherical coordinates around the product: horizontal angle, vertical angle, and distance. Drag updates an intended angle, with separate mobile sensitivity and vertical limits. Near the limits it uses resistance rather than letting the product turn arbitrarily upside down.

On release it uses pointer velocity to predict the intended destination, searches the authored angle list, and eases toward the nearest candidate. The controller handles the full-turn seam so that crossing from 359° to 1° does not cause a long reverse spin. Camera state also drives interpolation weights used elsewhere in the scene.

The live Pro angle list contained twelve named views: front/back; left/right; four three-quarter views; front/back top; and front/back bottom. Most horizontal views are spaced about 45° apart, with deliberately adjusted side elevations. These are photographic choices, not CSS breakpoints.

The authored configuration exposes drag/snap interpolation, damping, throw, angle thresholds, and limits. For example, the inspected configurations used `lerpSnap: 0.095`; the drag settings differ between products. Those coefficients belong to Apple’s controller and should not be copied blindly into a different timing model.

Our reconstruction uses its own angle list, bounded velocity prediction, shortest-angle selection, and time-based exponential damping. It recomputes the transition from the current pose, so a new drag or shot selection can interrupt and reverse it. Duo shots coordinate camera angle, hinge progress, product roll, and screen image.

Evidence: live `Lotus.instance().scene.interactiveCameraScript.positions`, the referenced camera-state `.lsd` files, and the formatted Duo runtime’s InteractiveCamera implementation around lines 27800–28025.

## Why it looks photographic

**Geometry is spent on silhouettes and reflections.** Rounded edges, camera rings, the ports, and other visible mechanical boundaries need accurate geometry and normals. A smooth silhouette and a clean moving highlight can matter more than a huge texture. The inspection tools expose the actual triangle counts; high visual quality does not imply millions of polygons.

**Surface maps describe different physical jobs.** The glTF data contains base color, metalness/roughness, normals, occlusion, clearcoat, and specular information. Roughness controls the width of reflections. Normal maps add surface detail without adding corresponding geometry. Occlusion preserves contact depth around small recesses. Many inspected maps are only 128, 256, or 512 pixels; tiny maps also encode constants. Larger screen images carry detail where it is needed. Duo’s downloaded graph includes screen imagery up to 2048 × 1441 and 1398 × 2034.

**The studio moves with the chosen shot.** The `EnvironmentInterpolation` implementation loads small glTF scenes containing luminous cards, applies state-specific transforms, generates filtered environment textures, and caches them. During motion its crossfade path blends up to four weighted environments. The bright and dark bands on the product are therefore carefully placed for the named views instead of being accidental reflections from a generic HDR photograph.

This is the most useful design lesson: author the camera and lighting together. A highlight can describe the bevel beautifully from the front and destroy the side view. Apple solves that with per-view art direction and smooth blending between views.

**Some material behavior is proprietary.** The exported models include custom coat and specular-edge data, and the framework supports additional shader chunks and layered environments. A stock glTF loader is not the complete Apple look. Our demo uses supported physical materials with documented compatibility changes and our own two-studio shader blend. It does not reproduce every proprietary shader or lens reflection treatment, and is not a pixel-identical copy.

Evidence: glTF materials; KTX2 headers; `EnvironmentInterpolation` in the runtime; environment glTFs and their variant `.lsd` files. The reconstruction’s independent studio and material logic are in `main.js`.

## What is in the downloaded packages

| Referenced large scene graph | Files | Decoded file bytes |
|---|---:|---:|
| Pro, ASTC/KTX2 | 107 | 13,231,248 |
| Pro, AVIF | 107 | 10,516,546 |
| Duo, ASTC/KTX2 | 109 | 16,569,329 |
| Duo, AVIF | 109 | 14,107,404 |

These are recursive downloads of the referenced scene graphs, including auxiliary data and variants. They are not the exact network transfer or GPU memory required to show one view. The demo copies only the base phone model, its maps, and four Duo screen plates. Its local asset totals are about 4.18 MB for Pro ASTC and 6.60 MB for Duo ASTC; AVIF alternatives are also present. Only one format is requested for a model.

Inspected scene roots:

- [Pro ASTC scene](https://www.apple.com/v/iphone-18-pro/a/static/scenes/iPhone18Pro_US_L_ktx.lsd)
- [Pro AVIF scene](https://www.apple.com/v/iphone-18-pro/a/static/scenes/iPhone18Pro_US_L_avif.lsd)
- [Duo ASTC scene](https://www.apple.com/v/iphone-duo/a/static/scenes/iPhoneDuo_US_L_ktx.lsd)
- [Duo AVIF scene](https://www.apple.com/v/iphone-duo/a/static/scenes/iPhoneDuo_US_L_avif.lsd)

`asset-manifest.json` records the demo assets’ source URLs, sizes, and SHA-256 hashes, plus original/prepared glTF hashes. The inspection archive lives in `.tilt/apple-viewer-research/` at the repository root, outside Git. Public JavaScript was downloaded and formatted for inspection; this does not recover the original TypeScript source, comments, or internal authoring project. None of Apple’s JavaScript, `.lsd` scenes, or shader source is served by the reconstruction.

Storage inspection was limited to mechanisms and key names, not personal values. The inspected Apple origin returned no Cache Storage entries, service-worker registrations, or IndexedDB databases. Local-storage keys were primarily generic site/analytics data; I found no evidence there of a persisted 3D scene. This does not mean HTTP caching is absent.

Fresh HEAD requests for the Duo scene root and Pro geometry buffer returned `Cache-Control: max-age=600` and `Vary: Accept-Encoding`. Those two responses support ordinary HTTP caching; they do not justify assuming a year-long immutable cache policy for every asset.

## The earlier work and Luis Bizarro

Luis’s own portfolio says the first launch of the team’s real-time tooling was the Vision Pro product-tour modal, followed by viewers for iPhone 15/15 Pro, iPhone 16/16 Pro, and MacBook Pro. That supports the 2023 product generation as the early period, though his page does not give an exact first-publication date. It confirms his contribution without implying that he alone built the whole system. [Luis Bizarro’s portfolio](https://bizar.ro/)

Felix Herbst published the detailed investigations that closely match your recollection:

- **9 September 2024:** Three r165, glTF export compatibility, KTX declarations, material maps, and the large scene configuration. [Original thread](https://twitter.com/hybridherbst/status/1833281592351166901) · [Readable version](https://threadreaderapp.com/thread/1833281592351166901.html)
- **13 September 2025:** canonical camera angles, CAD-derived geometry, textured small details, lens reflection probes, and lighting authored per view. His 2025 viewer also switched from its interactive mode to media for feature entries. [Original thread](https://twitter.com/hybridherbst/status/1966996773672808578) · [Readable version](https://threadreaderapp.com/thread/1966996773672808578.html)

I located a Luis X post reference but could not retrieve its primary content, so I have not used it as evidence. The portfolio is the stronger verified source for his role.

## What we built and verified

The demo is a new Three.js r185 application. It reuses Apple’s model geometry, UVs, texture assets, and the Duo’s embedded skeletal animation data. All viewer code, interaction, pose definitions, lighting rigs, environment blending, fitting, scheduling, and UI were written independently. The Duo animation is sampled at an absolute clip time; Apple’s controller is not executed.

Included controls: both products; six shots per product; interruptible drag and snapping; continuous hinge adjustment; wireframe; studio-lighting comparison; render resolution; and an in-browser frame-cadence measurement. Native ASTC and forced AVIF paths both rendered. The demo made no external requests after its assets were prepared.

On this **Apple M2 Max**, Chrome, at **2864 × 1480 rendered pixels**, two six-second warmed motion samples produced:

| Demo sample | Frames | Median interval | 95th percentile interval | Intervals over 25 ms | 95th percentile CPU submission |
|---|---:|---:|---:|---:|---:|
| Pro | 721 | 8.3 ms | 9.1 ms | 0 | 2.4 ms |
| Duo | 721 | 8.3 ms | 9.0 ms | 0 | 2.6 ms |

That is approximately a 120 Hz request-animation-frame cadence on this machine. These are local warmed samples, not a guarantee for low-end phones, not a cold CDN benchmark, and not GPU timer-query measurements. Raw samples and screenshots are in `evidence/`. The demo reports 41 phone draw calls for Pro and 62 for Duo, then stops scheduling frames when settled.

A repeat against the production build recorded 714 frames for each product, 8.3 ms median and 9.2 ms p95. Pro had zero intervals over 25 ms; Duo had one. CPU submission p95 was 2.9 ms and 3.5 ms respectively. That variation is another reason to avoid an absolute “never drops a frame” claim. Production idle verification observed an unchanged draw count across a 1.5-second interval, no external resource requests, and no console warnings or errors in that fresh test tab.

Verification also covered 390-pixel responsive layout, shortest-path seam crossing, velocity-directed snap selection, interruption/reversal, 30/60/120 Hz damping equivalence, long-frame clamping, and the production build. The repository typecheck passed; the independent JavaScript motion tests are separate. There was no physical iPhone performance test.

For a production version, the next valuable work is per-shot light-rig refinement and device profiling. A bigger model or a heavier rendering engine would not be my first move.
