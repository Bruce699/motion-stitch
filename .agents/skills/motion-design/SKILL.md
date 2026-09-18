---
name: motion-design
description: "Design, refine, or critique authored motion for interfaces, product films, graphic sequences, and spatial compositions. Use for choreography, pacing, easing, scene transitions, camera direction, or requests such as cinematic, restrained, energetic, exploded UI, isometric presentation, and construction guides. Route from the desired outcome or explicitly requested technique to the relevant guide."
---

# Motion design

Make motion serve the intended experience: understanding, comparison, anticipation, surprise, atmosphere, or appreciation of form. Choose the approach from the brief and the actual content. These guides offer decisions and alternatives; they do not prescribe a house style or a standard shot sequence.

## Establish the task

Read the request, current composition and relevant source assets. Preserve explicit creative choices and approved behavior. An audit stays read-only; an implementation request includes making and inspecting the result.

Identify the subject, intended outcome, required endpoint and constraints. For a small refinement, infer these from the existing work. For an open brief, choose a coherent direction and explain it briefly. Ask only when missing information would materially change the result; do not require a creative questionnaire.

A **content scene** sustains one idea or subject and may contain multiple shots. A **shot** is one continuous view between cuts. Decide whether the problem is inside a scene or in the handoff between scenes before editing it.

This skill does not need to load for unrelated infrastructure fixes, static copy changes or mechanical edits with no motion-design decision.

## Load the relevant guide

Start with the smallest useful set. Do not read every guide or apply every approach by default. A requested technique is a valid starting point; use its purpose to refine it rather than replacing the user's direction.

| Request or decision | Guide |
|---|---|
| Explain a feature, reveal craft, compare variants, build a sequence, establish an ending | [Scene structure](guides/scene-structure.md) |
| Assemble, explode, stagger, coordinate elements, choose what leads or stays anchored | [Choreography](guides/choreography.md) |
| More deliberate, snappier, softer, less floaty, better easing, better rhythm | [Timing](guides/timing.md) |
| Cinematic framing, macro, orbit, isometric, perspective, camera/object relationship | [Framing and space](guides/framing-and-space.md) |
| Connect scenes, match elements, improve a cut, preserve flow | [Transitions](guides/transitions.md) |
| Bezels, frameless UI, rulers, construction lines, backgrounds, shadows, materials, focus | [Visual treatment](guides/visual-treatment.md) |

Broad adjectives such as “cinematic” do not select an effect. Translate them into choices about framing, rhythm, light, scale or attention using the surrounding brief. They do not automatically require an orbit, blur, slow motion or 3D.

## Make a small set of connected decisions

For each affected scene, establish:

- **Outcome:** what the viewer should understand, notice or feel.
- **Attention:** what leads, and what remains stable enough to orient the viewer.
- **Change:** what moves or transforms, and which relationships must stay recognizable.
- **Arrival:** whether the result holds, keeps moving or passes directly into another event.
- **Handoff:** what the next scene inherits, or why a reset is useful.

Keep this lightweight. A one-line scene note can be enough; do not turn it into mandatory on-screen copy or a production document for every small edit.

Use one coherent set of choices within a piece. Contrast, repetition and deliberate stillness are available tools. New approaches outside the guides are welcome when they fit the brief. Do not vary every property merely to avoid repetition, or repeat an approach merely because it worked in another project.

## Implement and inspect

Use the host application's authoring contracts. For Tilt, read [the Tilt adapter](adapters/tilt.md); it routes to the existing execution skills without redefining their APIs.

Inspect playback at delivery speed, plus the important entry, maximum-change and arrival frames. For transitions, play the outgoing and incoming scenes together. For close-ups, inspect detail at intended output size. Use frame stepping to diagnose a problem, not as the only proof that timing works.

Check whether the intended subject remains findable, the important relationship survives, the result has enough time to register, and neighboring motion supports the handoff. Readability is required at reading beats, not in every expressive frame. Remove or retime competing motion when it weakens the chosen purpose.

Report what changed and what was actually verified. Keep observations separate from implementation guesses: footage does not reveal an original camera rig or production easing curve. The guides contain creative hypotheses to test, not measured laws or recovered presets.
