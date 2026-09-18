# How this audit is organized

This is an observational audit of the five selected films, not a universal animation rulebook. The authors use different approaches. A frequent pattern is a useful starting point, not a requirement or a quality score.

## Units

- **Semantic scene:** a sustained content idea, such as constructing an icon or demonstrating a material. It can contain several shots, cuts and camera angles.
- **Shot:** one continuous view between editorial cuts.
- **Transition:** the handoff between semantic scenes. Cuts inside a scene are recorded separately when they help explain its treatment.
- **Motion event:** a bounded action within a scene, such as a panel spreading, a circle enlarging or a camera settling.

All primary timestamps refer to the local selected reel. The frame index maps them back to the original source. One-second sheets orient the review; denser sequences support transition, easing and camera observations.

## Edited-source boundary

The Liquid Glass, iOS 7 and Airbnb reels were shortened during this task. Their newly joined boundaries are our edits, not evidence of the original filmmakers' transition choices. These joins are explicitly excluded from transition conclusions. Yosemite and OpenAI retain their complete source sequences.

The selected footage totals about 10 minutes 33 seconds. Findings about pacing apply to these selected sequences; removing presenters and live action changes a complete film's rhythm. OpenAI is primarily a brand/type film, while the Apple selections contain more product-interface demonstrations. Genre differences are part of the comparison, not defects to normalize away.

## Evidence and uncertainty

1. **Observed:** something visible in inspected frames or a temporal sequence, such as a shared circle, a changing perspective or a stationary composition.
2. **Measured:** a reported quantity derived from a specified, reproducible track, with its interval, units and error or fit comparison.
3. **Interpretation:** a plausible design purpose or mechanism. It is labeled as an interpretation, not attributed to the author as fact.

Motion measured in the image is screen-space motion. It can combine camera motion, object movement, projection and changing shape. It does not recover the original animation curve, camera rig, focal length, spring parameters or rendering technique.

Likewise, an oblique view is not automatically isometric. Perspective requires observable projection cues; orthographic or isometric classifications remain qualified unless the visible evidence distinguishes them. A fixed background alone does not prove a stationary camera.

## Ranking

The synthesis ranks recurring approaches by the number of films with explicit supporting observations, then by distinct semantic scenes within the inspected evidence, then by brand coverage. Alphabetical IDs break exact ties; those ordering differences have no creative significance. Multiple agents reporting the same scene do not create extra examples. Transition records and camera records tagged as continuous spatial handoffs contribute only their outgoing semantic scene to the synthesis ranking, while their full source/destination mapping remains in the evidence. Other camera windows can document approaches in more than one scene. The two measured Airbnb axes count as one supported scene, and Yosemite's two measured events also share one scene. Brand coverage is shown separately because three of the five films are Apple films.

Counts describe this reviewed collection, not the whole field of motion design. Specialist transition, camera, styling and easing reviews are targeted samples, not an exhaustive frame-by-frame census. Their sampling density differs, so small rank differences across lenses are not precise preferences. A principle's count is a lower bound on documented support, not proof that it is absent elsewhere. Plain cuts, static views and exceptions remain part of the audit, even when less visually conspicuous.

## Deliverables

- `scenes.md` / `scenes.json`: content grouping and within-scene choreography.
- `transitions.md` / `transitions.json`: handoff types, continuity and the role of ordinary cuts.
- `styling.md` / `styling.json`: device framing, surfaces, shadows, backgrounds, typography and material treatment.
- `camera.md` / `camera.json`: framing, camera/object ambiguity, projection and movement relationships.
- `easing.md` / `easing.json`: native-frame motion measurements and their limits.
- `principles.md` / `principles.json`: consolidated, ranked approaches with linked evidence and exceptions.

Reports and curated findings are ordinary repository documents. Extracted imagery, clips, plots and measurement intermediates live in `../local/analysis/`, which is Git-ignored.
