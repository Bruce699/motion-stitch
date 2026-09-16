# Dial Kit subset for Tilt

Source: [joshpuckett/dialkit](https://github.com/joshpuckett/dialkit), package 2.0.1, commit `4ae7f55b38c27a9fce8319c17aff1f2d5a7ab01a`, inspected 16 September 2026. MIT, Copyright (c) 2026 Josh Puckett. The original notice is retained in `LICENSE`.

This is a local source fork, not a `dialkit` package dependency. The underlying `motion` package remains a dependency for the fork's spring-based sliders and dropdown transitions. Tilt uses the React controls for its editor; imported app content remains framework-independent.

## Selected source

- `src/components/{Slider,SegmentedControl,Toggle,SelectControl,DialPad,ColorControl,TextControl}.tsx` → `components/`.
- `numeric.ts` also includes the small `snapToDecile` helper from upstream `shortcut-utils.ts`, avoiding that module's store dependency.
- Shared `numeric.ts`, `control-keyboard.ts`, `dropdown-keyboard.ts`, `dropdown-position.ts`, `dial-pad.ts`, `dial-pad-control.ts`, `color.ts`, `color-control.ts`, `text-autosize.ts`, `icons.ts` → this directory.
- `theme.css` contains the root tokens and control/timeline rules selected from `src/styles/theme.css`. The remote Google Fonts import, global floating root/panel behavior, presets, versions and shortcut styles are omitted.
- `Timeline.tsx` adapts the geometry and interaction approach in `src/components/DialTimeline.tsx`: overview, adaptive ticks, zoom around an anchor, horizontal scroll, playhead flag and lanes. Its React state/markup was rewritten as a controlled Tilt component.

## Deliberate adaptations

- No DialStore, TimelineStore, localStorage, preset/version system, or second playback clock. `parameters.tsx` binds controls to validated file edits. All control writes share a queue. Drags and text focus sessions close one history group; history shortcuts wait for queued writes.
- Slider, pad, color and text expose interaction start/end hooks. React 19 refs are explicitly initialized. Slider external updates stop old fill animation; reduced-motion preferences disable spring settling. Keyboard numeric entry rejects non-finite/partial numbers.
- Segmented controls accept an accessible label and remeasure on resize. Existing keyboard, focus, portal positioning, pad axis locking and color parsing helpers are retained.
- Tilt colors persist as opaque six-digit sRGB hex. The color picker retains its perceptual plane and hue control but omits alpha and output format modes. Other pasted color formats are normalized to the scene contract. Color popovers allow the editor's undo shortcut to bubble.
- The timeline receives `time`, `duration`, `fps`, cue tracks and seek callbacks. It has no animation value store. Clip bars and diamonds are read-only cue metadata; dragging them seeks. Editable timing would need a shared authored timing contract before adding resize handles.
- Shell layout, responsive rules, XYZ fields and scene settings live outside this folder in Tilt. The fork is scoped under `.dialkit-root`. Light/dark themes and local font loading do not affect scene pixels.

Geist Mono is bundled at `../../fonts/geist-mono-latin.woff2`, sourced from `@fontsource-variable/geist-mono@5.3.0` (`files/geist-mono-latin-wght-normal.woff2`). Its SIL Open Font License is preserved beside it as `OFL.txt`; no network font request is required.

Files are formatted with Tilt's Prettier configuration.

When updating, diff against this exact upstream commit. Preserve the file/history and single-clock boundaries, review upstream accessibility fixes, and test the real controls in a temporary project before changing a user's scene.
