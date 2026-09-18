# Transition audit of the five selected films

The strongest recurring approach is to keep something recognizable while changing what the viewer is learning: an icon, a circle, a wordmark, a device frame, or a material. This does **not** mean every scene morphs into the next. These films also use ordinary cuts, pauses, and empty space. Their more distinctive bridges usually connect two related ideas, rather than applying a generic transition effect.

## What was actually reviewed

- 40 candidate windows, each four seconds long, inspected as ordered frames at 6 fps.
- 12 fast boundaries additionally inspected over 0.8 seconds at 30 fps. These refinements changed classifications: Yosemite's gear→AirDrop is a circular aperture bridge; its file-tag→portrait is a continuous shared-circle transition. They would be easy to mistake for cuts at one frame per second.
- 42 selected events documented: **26 between semantic scenes and 16 inside a semantic scene**, reconciled to the final [scene map](scenes.json). Windows with no relevant handoff, overlapping windows, and extra internal cuts are not additional events. This is a purposive sample, not a complete shot census, random sample, or estimate of the films' overall transition percentages.
- A semantic scene is a coherent content argument. Airbnb's gem/paw/bed family and Apple's device-family examples can contain cuts while remaining one content scene; Airbnb's dedicated suitcase craft study is a preceding scene. A corner becoming a button in an interface can finish the same construction proof.
- The audit excludes all **16 manufactured edit joins**: 11 Liquid Glass, 4 iOS 7, 1 Airbnb. Their exact times are recorded in [transitions.json](transitions.json). The records here stay wholly inside retained original segments. Original-film transitions at removed sections are not inferred.
- Times are **edited-reel seconds**, with source times where available. At 6 fps, boundaries are approximate within 0.167 seconds; at 30 fps, within 0.034 seconds. A flowing bridge has a representative handoff time, not necessarily an edit frame. Audio was not analyzed; there are no claims about beat synchronization.

All descriptions concern visible output. They do not establish which renderer, original camera rig, easing equation, masks, or layer hierarchy produced it. “Same object” means a visually maintained identity, not a proven shared 3D asset.

## Recurring principles, ranked by breadth first

Counts below are occurrences in this **42-event sample**, not film-wide frequencies. The inter-scene column excludes internal proofs. Film breadth is shown before event count so a long repeated sequence cannot dominate. Three of the five films are Apple, so this remains three companies' work, not five independent design cultures. Principle tags overlap and must not be summed as exclusive categories.

| Observed approach | All audited events / films | Between content scenes / films | Practical interpretation |
|---|---:|---:|---|
| Keep a recognizable anchor | 21 / 5 | 14 / 5 | Establish what survives the change before moving everything else. |
| Link specification and application | 11 / 5 | 5 / 4 | Let the viewer see where the construction ends up in the actual product; many of these are internal scene resolutions. |
| Match a visible shape or graphic | 12 / 4 | 11 / 4 | Borrow a circle, arrow, wordmark, or material feature already present in the outgoing scene. |
| Use a plain cut | 13 / 4 | 4 / 2 | Similar staging or a clear topic change can carry the edit without a transform. |
| Retain a neutral field | 7 / 4 | 5 / 3 | A stable white field can make very different subjects feel connected. |
| Overlap the incoming and outgoing content | 10 / 3 | 7 / 3 | Introduce the new structure before the previous structure disappears. |
| Build motion before the handoff | 6 / 3 | 5 / 2 | A push, tilt, or acceleration prepares a change; the cut need not start from complete rest. |
| Transfer attention in a clear direction | 4 / 3 | 4 / 3 | A new surface enters as the old one leaves, making the handoff spatially legible. |

These are reusable options, not requirements. The observed exception is as useful as the pattern: the Apple device montage does **not** need a shared-object morph, and Airbnb's final dense montage does **not** gradually assemble its logo.

## A vocabulary of the approaches

1. **Keep the object; change its context.** Airbnb's bed illustration survives into the listing editor (36.0–36.83), Yosemite's Finder icon gains its Dock surroundings (20.33–21.17), and the iOS 7 Photos icon lands in the home screen (98.67–100.5). The viewer has one thing to follow while the meaning expands. This is particularly effective at the end of a construction study.

2. **Use an interface detail to enter the next chapter.** Airbnb accelerates into the back arrow, then cuts to that arrow on a yellow construction grid (21.4–22.17). Yosemite zooms toward a purple file-tag dot; a face grows inside it as the Messages interface appears (42.33–43.5). The first is a match cut; the second visibly overlaps and transforms. Both are more specific than a generic zoom transition.

3. **Turn an existing opening into a passage.** Yosemite enlarges the o in Go into an aperture that reveals Finder (19.67–20.5). Later, it briefly enters the gear's circular center to reveal AirDrop (34.6–35.17). OpenAI changes a black dot into a circular sky-image aperture (76.17–78.0). Geometry, rather than arbitrary masking, motivates the transition.

4. **Return to a small recurring motif between big subjects.** OpenAI repeatedly reduces the composition to a centered black dot, then develops typography, wordmark, Blossom, color, or photography from that simple starting point. The 64.433 boundary is a scale-prepared switch from Blossom to dot, not a fully observed vector morph. The repetition becomes chapter punctuation and provides short periods of visual quiet.

5. **Make colors travel into their use.** Airbnb's palette columns resolve toward pale colored avatars (41.33–42.5); those avatars then move into Messages rows (42.67–43.5). The colors remain recognizable through the transformation. It communicates the purpose of tokens through continuity, rather than cutting from a palette slide to an unrelated app screenshot.

6. **Reveal the next world before deleting the old world.** Airbnb's surface swatches arrive over Messages before ocean footage replaces the background (43.83–44.67). OpenAI's brand applications stack over a still-visible layout grid (97.33–98.83). This is a shared-time overlap: the viewer briefly sees the relationship between source and result.

7. **Use the incoming subject as the wipe.** Airbnb's color swatches rise over the bottom of the listing editor (37.67–38.67). The swatches are the next content, not a decorative intermediary. Yosemite similarly travels from Messages toward a dark Today panel (46.5–47.67), then returns from that panel to desktop windows (50.5–52.0).

8. **Start the exit before the cut.** Airbnb's UI collage moves upward before it cuts to moving 3D panels (53.7–54.33). Liquid Glass's customized phones begin tilting before the close view of glass icon construction (129.33–130.17). Movement precedes the replacement; however, these frames do not establish velocity matching or a shared camera path. Treat the connection as perceived momentum, not a measured match.

9. **Let a real interaction carry the story.** In iOS 7, the phone frame stays fixed while home-screen icons expand away and the compose interface fills the display (114.33–115.33). A familiar app-launch behavior becomes the editorial transition. The stable device frame is the anchor; a new cinematic camera move would add little to that particular handoff.

10. **Use a white reset when the next idea deserves a clean start.** iOS 7 fades Music details away and lets Mail build on an almost-empty white field (77.5–79.83). Typography annotations clear before the faint icon grid appears (83.33–85.5). The pause is visible structure, not missing animation.

11. **Cut between examples when their common treatment already connects them.** Airbnb replaces the suitcase with a gem and the gem with a paw while retaining centered presentation on white. The suitcase→gem cut starts the wider dimensional family chapter; the gem→paw cut is internal to that chapter. Liquid Glass directly cuts Mac→Watch→TV within its material/device chapter. The material, scale of presentation, or stage is enough to keep the sequence coherent. Cuts alone do not establish that the film changes semantic scenes.

12. **Change density decisively at the ending.** Airbnb's colorful dimensional panels cut to a small black symbol on white at approximately 56.633. Yosemite's settled laptop cuts to the sparse OS X end card at approximately 57.1. OpenAI's final logo and typed wordmark similarly live on an uncluttered stage. The hold matters at least as much as the cut.

13. **Connect camera scale to explanatory scale.** Pulling back from an icon into the interface changes the viewer's question from “how is this built?” to “where does this live?” Conversely, pushing into a tiny arrow or file tag selects the next subject. This is visible screen-space behavior; the source could be a 3D camera, a 2D transform, or a composite.

14. **Do not confuse continuity with continuous motion.** OpenAI often holds its dot between developments; iOS 7 deliberately clears the frame; Yosemite holds the laptop before the final cut. The common principle is a legible handoff, not perpetual camera travel or a rule against stopping.

## Different tastes remain visible

**Airbnb:** Strong links between foundational decisions and actual components. Its arrows, radius studies, colored avatars, and object detail levels frequently point to where those decisions are used. It is comfortable mixing elegant explanatory bridges with abrupt cuts between delightful material examples. The latter stay inside a larger content argument.

**Yosemite:** A tour through the interface with inventive local connections. Small details become entrances to the next subject: the o, the gear opening, the purple tag. The travel across menu, Dock, and windows supplies a sense of a connected environment. It still ends with a simple cut.

**OpenAI:** A consistent centered grammar. The dot is a repeated neutral starting state, not merely one clever transition. Typography, logo, palette, photography, and layout feel related because the film revisits that grammar. Its final applications accumulate over the system rather than requiring a completely fresh set.

**iOS 7:** Whitespace, readable construction, and product behavior. Type and icon chapters can start by clearing down to white. Product transitions can happen inside an unmoving phone. The useful restraint here is allowing the actual UI state change to do the work.

**Liquid Glass:** Physical material continuity and spatial assembly, with straightforward cuts between platform examples. The title-to-slider passage links appearance to interaction; icon parts return to their usable scale. Because this viewing reel has eleven manufactured joins, it is especially important not to learn an original transition language from those joins.

## Counts and event lookup

| Film | Between content scenes | Within a content scene | Ambiguous | Total |
|---|---:|---:|---:|---:|
| Airbnb | 7 | 7 | 0 | 14 |
| Yosemite | 7 | 1 | 0 | 8 |
| OpenAI | 7 | 2 | 0 | 9 |
| iOS 7 | 4 | 0 | 0 | 4 |
| Liquid Glass | 1 | 6 | 0 | 7 |
| **Total** | **26** | **16** | **0** | **42** |

Exclusive primary mechanisms among the **26 between-scene events**: 4 direct cuts; 4 anchor continuations; 3 matched cuts; 3 directional replacements; 4 scale bridges; 3 recurring-motif resets; 2 overlap reveals; 2 white resets; 1 UI-state bridge. These counts describe the audit, not each film's predominant technique. The limited Liquid Glass and iOS 7 inter-scene sample should not be compared as a frequency estimate against the more densely sampled shorter films.

Scope reconciliation retained every observation and fine timing. TR-05 and TR-06 now cross AB-04→AB-05 and AB-05→AB-06; TR-34 crosses I7-08→I7-09. TR-08, TR-14, and TR-42 are internal to AB-06, AB-11, and LG-14. TR-07 and TR-17 remain internal even though they sit near approximate map edges: TR-06 and TR-16 already account for those chapter handoffs. Each JSON event now records its semantic scene IDs. Map edges allow approximately ±1 second, while reviewed transition windows retain their finer precision.

[transitions.json](transitions.json) is the searchable authority for individual events, exact audit windows, semantic scope, confidence, source timing, principle tags, counts, and evidence paths. Every event links to reviewed fine contact sheets under `references/motion/local/analysis/transitions/`. Generated media is ignored by Git; this report and JSON remain reviewable text.

Useful searches from the repository root:

```sh
rg -n 'aperture-bridge|chapter-punctuation|quiet-ending' references/motion/analysis/transitions.json
rg -n 'between_semantic_scenes|within_semantic_scene|artificial_splices' references/motion/analysis/transitions.json
```

For a new scene, the useful questions are: What is the current content argument? What changes next? What can remain recognizable? Is there a real relationship worth showing, or is a cut clearer? Is the next view allowed to settle? Those questions fit all five films without forcing them into the same visual style.
