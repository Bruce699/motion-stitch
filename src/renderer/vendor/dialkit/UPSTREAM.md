# Dial Kit subset for Tilt

Source: [joshpuckett/dialkit](https://github.com/joshpuckett/dialkit), package 2.0.1, commit `4ae7f55b38c27a9fce8319c17aff1f2d5a7ab01a`, inspected 16 September 2026. MIT, Copyright (c) 2026 Josh Puckett. The original notice is retained in `LICENSE`.

This is a local source fork, not a `dialkit` package dependency. The underlying `motion` package remains a dependency for the fork's spring-based sliders and dropdown transitions. Tilt uses the React controls for its editor; imported app content remains framework-independent.

## Selected source

- `src/components/{Slider,SegmentedControl,Toggle,SelectControl,DialPad,ColorControl,TextControl}.tsx` → `components/`.
- `numeric.ts` also includes the small `snapToDecile` helper from upstream `shortcut-utils.ts`, avoiding that module's store dependency.
- Shared `numeric.ts`, `control-keyboard.ts`, `dropdown-keyboard.ts`, `dropdown-position.ts`, `dial-pad.ts`, `dial-pad-control.ts`, `color.ts`, `color-control.ts`, `text-autosize.ts` → this directory.
- `theme.css` contains the root tokens and control/timeline rules selected from `src/styles/theme.css`. The remote Google Fonts import, global floating root/panel behavior, presets, versions and shortcut styles are omitted.
- `Timeline.tsx` adapts the geometry and interaction approach in `src/components/DialTimeline.tsx`: adaptive ticks, zoom around an anchor, playhead and lanes. Tilt consolidates transport into the ruler row and omits the upstream overview, duplicate time flag and zoom buttons. Pinch/wheel events share an immediately updated view anchor; horizontal trackpad scrolling pans. Its React state/markup was rewritten as a controlled Tilt component.

## Deliberate adaptations

- Timeline inspection reports its visible range, zoom and expanded groups to the shared viewer context. Reload restores that per-tab observation; it never changes authored timing.

- Timeline groups are collapsed by default, with accessible expand/select buttons and indented child rows. Tilt's `parentId` contract drives the hierarchy; group timing edits retime the subtree through the runtime. Child gestures clamp to their parent. Selection exposes shared controls and a named duration in the inspector. Expansion is temporary UI state; creative timing remains file-backed.
- Child bars inherit their root group's hue with a cumulative 22% tint per level (capped at 55%): black in dark mode, white in light mode. This is presentation only; drag commits retain the original authored track colors.

- No DialStore, TimelineStore, localStorage, preset/version system, or second playback clock. `parameters.tsx` binds controls to validated file edits. All control writes share a queue. Drags and text focus sessions close one history group; history shortcuts wait for queued writes.
- Slider, pad, color and text expose interaction start/end hooks. React 19 refs are explicitly initialized. Slider external updates stop old fill animation; reduced-motion preferences disable spring settling. Keyboard numeric entry rejects non-finite/partial numbers.
- Slider supports explicit discrete steps: tick marks, clicks and drag fill use the declared stops instead of magnetic deciles. Orthographic Rotation and Elevation use 5° steps without changing existing saved angles until an edit.
- Original Dial Kit icon paths were removed. Dropdown chevrons and timeline disclosure buttons use Tilt's shared Hugeicons CDN component.
- Segmented controls accept an accessible label and remeasure on resize. Existing keyboard, focus, portal positioning, pad axis locking and color parsing helpers are retained.
- Select menus size to their longest option independently of the trigger. Intrinsic width is measured before the first paint and tracked while open; menus remain inside the visual viewport, with ellipsis only for labels wider than the available screen.
- Scene settings reuse the same color control, including grouped gesture history. Nested pickers remain inside their owning dialog for focus and outside-click dismissal, while the browser top layer avoids clipping.
- Tilt colors persist as opaque six-digit sRGB hex. The color picker retains its perceptual plane and hue control but omits alpha and output format modes. Other pasted color formats are normalized to the scene contract. Color popovers allow the editor's undo shortcut to bubble.
- The timeline receives `time`, `duration`, `fps`, cue tracks and seek callbacks. It has no animation value store. Clip pointer capture, move/edge drag modes and selection follow upstream TimelineClip. Tilt snaps edits to frames and commits through `set_track` once per gesture; Escape cancels. Contextual controls live in the right inspector instead of an upstream popover. `tracks[].parameterKeys` binds the existing scene parameter vocabulary; scene code owns executable timing.
- Shell layout, responsive rules, XYZ fields and scene settings live outside this folder in Tilt. The fork is scoped under `.dialkit-root`. Light/dark themes and local font loading do not affect scene pixels.

Geist Mono is bundled at `../../fonts/geist-mono-latin.woff2`, sourced from `@fontsource-variable/geist-mono@5.3.0` (`files/geist-mono-latin-wght-normal.woff2`). Its SIL Open Font License is preserved beside it as `OFL.txt`; no network font request is required.

Files are formatted with Tilt's Prettier configuration.

When updating, diff against this exact upstream commit. Preserve the file/history and single-clock boundaries, review upstream accessibility fixes, and test the real controls in a temporary project before changing a user's scene.

- Composition clips reuse TimelineClip selection and edge handles, but commit through `trim_clip`; they never retime child choreography. Camera and clip inspectors reuse the same control components.

- Timeline collapse hides track rows while preserving its zoom, selection and shared playhead. The compact ruler keeps playback, time, duration and an expand action; shell panel sizing remains outside the fork.
