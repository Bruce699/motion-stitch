# Animation reference audit

Start with [the 49 ranked principles](principles.md) or [the searchable visual audit](../local/analysis/index.html). The findings describe the five selected reference films; they are options and recurring approaches, not mandatory rules for every scene.

| Lens | Report | Searchable observations |
|---|---|---|
| Semantic scenes and choreography | [Scenes](scenes.md) | [Scene map](scenes.json) |
| Transitions and continuity | [Transitions](transitions.md) | [Transition events](transitions.json) |
| UI styling and staging | [Styling](styling.md) | [Styling evidence](styling.json) |
| Camera and projection | [Camera](camera.md) | [Camera evidence](camera.json) |
| Easing and measured timing | [Easing](easing.md) | [Measurements](easing.json) |

[Method and proof boundaries](methodology.md) explain semantic scenes, exclusions, uncertainty and ranking. [The original contact-sheet library](../local/index.html) provides the wider visual context.

Every timecode refers to the locally selected reel. The catalog and frame indexes map edited sequences back to their source videos. Extracted evidence, plots and clips are local Git-ignored files under `../local/analysis/`.

```sh
rg -n -i 'match|hold|bezel|perspective|ease' references/motion/analysis
```

When applying a finding, open its timed evidence first. A still establishes appearance; a sequence establishes change; a measured track establishes only the stated screen-space quantity.

The [verification record](../local/analysis/verification.json) checks counts, deduplication, source evidence, links, scene coverage and recut-join exclusions. The HTML viewer's local files and links were checked directly; browser rendering remains unverified because the browser tool blocked its local file URL. The written findings also received an independent specialist consistency review.
