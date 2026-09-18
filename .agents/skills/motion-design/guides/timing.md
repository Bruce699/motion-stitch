# Timing

Use this guide for pace, easing and relationships between actions. Diagnose the visible problem before changing the curve: long duration, excessive travel, poor overlap, a weak endpoint and competing motion can all feel “floaty.”

Separate **travel**, **settling** and **reading time**. They can overlap or be absent. Total duration alone does not describe perceived speed. Judge displacement and change at the intended output size and frame rate.

## Choose a temporal shape

| Need | Candidate | Watch for |
|---|---|---|
| Immediate response with a calm arrival | Fast approach followed by deceleration | An unnecessarily long tail that feels unfinished |
| Travel should feel initiated and completed | Acceleration followed by deceleration | Delay before the viewer notices anything happening |
| Continuous survey or background movement | Near-steady movement through the relevant interval | Forced stops at every arbitrary segment boundary |
| A decisive change with residual softness | Cut or rapid change followed by a short settle | Treating an intentional discontinuity as a failed smooth move |
| Elasticity, impact or playful energy | Overshoot and recovery | Bounce without a meaningful target or material/expressive reason |
| Recognition or punctuation | Hold or near-hold | An empty pause when no information needs to register |

These are candidates, not a ranked list or fixed duration presets. A requested spring or elastic style is valid even if it was uncommon in the research.

## Coordinate timing

- Choose start and finish relationships explicitly. Two channels can share an arrival without sharing duration or curve.
- Use staggering to order attention. Use simultaneous changes when comparison or coordinated impact matters.
- Check continuity at joins that are intended to be continuous. Matching positions alone can still produce a visible speed or direction jump.
- Preserve sharp discontinuities when they serve a cut, snap or graphic punctuation. Do not smooth away the intended character.
- Retiming a group should preserve purposeful relationships, while leaving useful child timing editable.

For scale and camera movement, equal changes in a numeric parameter do not necessarily produce equal perceived screen motion. Inspect the projected result before attributing a problem to easing.

## Measure only when it resolves a question

Start with playback and frame stepping. If precision matters, track a stable screen-space feature at native frames: position, diameter or an identifiable edge. Separate discontinuities, occlusion, changing geometry and cropped intervals before fitting curves. Record what was measured and test sensitivity to the chosen start/end frames.

A fit describes the observed result. It does not recover the original authoring curve, spring, camera or parent transforms. Avoid transferring exact coefficients from an unrelated shot as a universal recipe.

## Verify the feel

Compare the relevant variants at delivery speed with the same content and endpoints. Change one suspected cause at a time where practical. Check the first visible response, main displacement, arrival and neighboring event. A pleasing graph is insufficient if the actual move still drags, snaps accidentally or loses its subject.
