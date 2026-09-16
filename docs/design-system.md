# Editor design system

Tilt uses the user-supplied Codex style kit. The portable stylesheet is vendored unchanged at `src/renderer/design-system/codex.css`, imported before `src/renderer/style.css`. Keep the editor's identity and purpose: a canvas, timeline and parameters. Scene content is authored independently of the editor theme.

## Source and fidelity

The supplied archive was `codex-style-kit.zip`, inspected on 16 September 2026. Its manifest identifies installed Codex desktop **26.908.70816, build 9275**. The kit contains extracted component recipes and reconstructed default light/dark theme values; it is not official brand guidance or a live account appearance snapshot.

The unchanged portable stylesheet has SHA-256 `af4b37e7bda54b27ffc89d61ed524a5371296676850784765870013204d2dd61`. Do not also import the kit's evidence-only `codex-source-tokens.css` or `codex-default-themes.css`. The complete extraction lives locally under ignored `.tilt/design-reference/`; this document and the portable stylesheet are the durable implementation reference.

Exact reused values include the system font stack; 430-weight, 14px/21px body type; 13px/18px button type; semantic colors; neutral primary buttons; 28px toolbar controls; and supported superellipse radii. The 32×20px switch with a 16px thumb follows the source recipe, adapted to Tilt's existing native checkbox. Timecode uses the supplied mono family at 12px.

Tilt-specific composition includes the 275px parameter panel, timeline, slider treatment and compact input sizes. Existing Tilt transport/settings icons are retained at 16px or 18px: they are not claimed as extracted Codex icons. The kit's seven sidebar icons have no matching role in this editor. Native window vibrancy and pixel identity with the Codex application are not claimed.

## Rules for changes

- Use existing `--color-*` roles, `--radius-*`, `--shadow-*` and font tokens. Do not create another palette, hardcode purple accents, or use Inter as the default UI font.
- Prefer `cx-button` with an explicit size and variant. Primary actions use the neutral solid fill; ordinary actions use ghost or secondary styles. Preserve keyboard focus and disabled behavior.
- Popovers use the kit's elevated surface, fine ring, shadow and corner recipe. Keep positioning inside the viewport and preserve Escape, outside-click dismissal and focus return.
- Parameter controls remain data-driven through `scene.json.parameters` and `parameters.tsx`. A shader's controls should use that vocabulary, not a private component or stylesheet. See `docs/parameters.md`.
- Use 4px-based spacing, 12–14px editor type, restrained weights and tonal separation. Avoid redundant cards and explanatory copy. Creative cue colors still come from the scene, mixed with theme tokens for legibility.
- Do not apply global active-scale animations. Respect reduced motion for switches, buttons and loading indicators. Inspection gestures and authored motion remain separate from shell animation preferences.
- Keep the vendored stylesheet byte-identical. Local compatibility fixes belong in `style.css`; its round-corner fallback intentionally has enough specificity to override explicit theme selectors.

The default is dark. An embedding host or a reviewer can request `?theme=light` or `?theme=dark` in the viewer URL. This only changes editor presentation; it does not write the scene or change render output. No application-wide appearance setting is added yet.

At widths below 640px, parameters move below the timeline into their own scrolling region. At desktop widths they remain on the right. The canvas measures its actual CSS padding when fitting, and ruler labels adapt to available width and scene duration.

## Verification

Checked real browser rendering in both themes, including a 390px-wide view, long title drafts, settings focus/dismissal, and popover viewport boundaries. Computed styles confirmed body 14px/430/21px, 28px buttons/compact controls, a 20px supported popover radius and the source theme colors. The browser supports superellipse; the unsupported-browser fallback was reviewed in code, not rendered in an older browser.

An isolated local project exposed toggle, color, choice, XYZ, numeric-only and slider controls. The toggle and keyboard slider edits saved and undid through Tilt's history. Reduced-motion emulation produced zero-duration switch transitions. Typecheck, the production build and all 20 existing behavioral tests passed. The authored scene and the primary viewer's inspection were preserved.

The isolated viewer also exercised 2D panning, wheel zoom and playback. Fresh runtime context confirmed nonzero pan, zoom 1.241 and advancing presented time. This redesign did not change the rendering engine or scene choreography; the full video-export checks in `docs/verification.md` describe the preceding runtime revision.
