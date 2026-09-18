# Easing measured from the selected films

## What was actually measured

Six screen-space coordinate tracks across three films, representing five visual events: two OpenAI circle settles, two Yosemite control motions, and the two axes of one Airbnb chip move. This is a deliberately selected, measurable sample, **not an exhaustive motion census** and not six independent scenes. No measurement was made on iOS 7 or Liquid Glass in this pass.

Every frame in each interval was decoded at the video's native rate, at its original pixel resolution. Black/color segmentation tracked the circles; normalized template correlation tracked the unchanged Architecture label and icon. Bounding boxes were visually checked at the start, end, quarter points, and surrounding frames. The attached plots show both raw pixels over time and normalized progress; CSVs preserve every decoded sample.

**The strong recurring observation is a quick approach followed by a slower settle.** It appears in all three measured films, but not in every coordinate. Airbnb's chip drops with an S-shaped acceleration/deceleration, then continues sliding sideways on a longer tail. OpenAI combines an abrupt scale change with gentle residual growth. These are different timing strategies, not one universal easing preset.

## Measurements

Times below refer to the local selected reel. All chosen intervals are before Airbnb's local removal splice at 46.733s; OpenAI and Yosemite are uncut viewing versions. Thus source and reel time coincide for every measurement here.

| Event / measured property | Fit interval / frames inclusive | Duration | Progress at halfway | Best fixed candidate / normalized RMSE | Fitted cubic Bezier RMSE |
|---|---|---:|---:|---|---:|
| OpenAI introduction: circle diameter settles 324 → 360px | 6.367–7.000s / 191–210 | 633ms | 88.9% | Quintic ease-out / 5.73% | 1.47% |
| OpenAI palette: circle diameter settles 746 → 800px | 65.733–66.133s / 1972–1984 | 400ms | 81.5% | Cubic ease-out / 4.32% | 0.61% |
| Yosemite: red control appears, threshold baseline → 266.5px | 0.033–0.601s / 1–18 | 567ms | 87.5% | Cubic ease-out / 3.90% | 0.51% |
| Yosemite: red control enlarges 267 → 743.5px | 1.068–2.436s / 32–73 | 1368ms | 94.1% | Quintic ease-out / 7.03% | 1.42% |
| Airbnb: Architecture label moves down 245 → 338px | 14.833–15.200s / 445–456 | 367ms | 43.5% | Cubic ease-in-out / 3.57% | 0.48% |
| Airbnb: same label moves right 85 → 215px | 15.000–15.867s / 450–476 | 867ms | 80.0% | Quadratic ease-out / 4.96% | 0.44% |

RMSE is root-mean-square deviation from the measured normalized trajectory, expressed as a percentage of total displacement. It is **not a probability or a claim that this was the author's curve**. Fixed candidates were linear, smoothstep, sine-in-out, cubic-in-out, quadratic-out, cubic-out, and quintic-out. A fitted four-control-value cubic Bezier was also tested; its lower error partly reflects greater flexibility. All candidate errors and fitted values are in [easing.json](easing.json).

### OpenAI: an abrupt change can have a soft finish

At frames 190→191, the circle's diameter changes from 34px to 324px, then takes another 633ms to reach 360px. About 89% of the total diameter change happens within one 33ms frame interval. The palette circle repeats the pattern: frames 1971→1972 change 152px to 746px, followed by 400ms to reach 800px; about 92% of total growth is in that first interval.

This is a visible one-frame discontinuity. The encoded footage cannot distinguish a cut from an extremely fast/sub-frame scale move. Fitting one smooth ease across the entire jump would obscure the observation. The measured curves therefore describe **only the visible post-jump settling tail**.

- [Introduction raw/normalized plot](../local/analysis/easing/openai-intro-circle.png) · [validated frames](../local/analysis/easing/openai-intro-circle-validation.jpg) · [CSV](../local/analysis/easing/openai-intro-circle.csv)
- [Palette raw/normalized plot](../local/analysis/easing/openai-palette-circle.png) · [validated frames](../local/analysis/easing/openai-palette-circle-validation.jpg) · [CSV](../local/analysis/easing/openai-palette-circle.csv)

Confidence: high for the sampled discontinuity, center stability, and direction of the settling tail; moderate for the precise tail curve. Intro diameter changes are small enough that 1–2px edge quantization matters. Extending the interval one frame backward includes the discontinuity and changes the best curve; that is a different motion regime, not noise to smooth away.

### Yosemite: the main change finishes before all motion stops

The opening red control reaches roughly 90% of its visible size change about 303ms into the selected 567ms interval. The later zoom reaches 90% of its size change about 536ms into a 1368ms interval. It continues resolving gently while the internal close symbol is being constructed.

The zoom has a short acceleration phase before a much longer deceleration. A generic quintic-out is only a rough shorthand: its error is 7.03%, versus 1.42% for the flexible fitted curve. Preserve the observed acceleration-then-tail behavior rather than adopting a named preset because it won a small candidate contest.

**Onset caveat:** appearance frame 1 has no detected red feature; its zero is an inferred invisible/threshold baseline, not a measured physical diameter of zero. Frame 2 is the first measured feature, about 25px across. CSVs explicitly flag nondetection. The additional frame-2-to-18 fit excludes the inferred baseline: cubic ease-out remains the best fixed candidate, with a fitted Bezier RMSE of 0.21%. The slowing-arrival conclusion survives. Initial opacity, threshold crossing, and scale cannot be fully separated here.

- [Appearance plot](../local/analysis/easing/yosemite-red-appearance.png) · [validated frames](../local/analysis/easing/yosemite-red-appearance-validation.jpg) · [CSV](../local/analysis/easing/yosemite-red-appearance.csv)
- [Zoom plot](../local/analysis/easing/yosemite-red-zoom.png) · [validated frames](../local/analysis/easing/yosemite-red-zoom-validation.jpg) · [CSV](../local/analysis/easing/yosemite-red-zoom.csv)

Confidence: high for the later visible diameter trajectory; moderate for appearance onset. The measurement is apparent screen diameter, which could reflect object scale, camera movement, or both. It does not identify the underlying camera easing or focal length.

### Airbnb: different axes can finish at different times

The Architecture chip initially moves mostly down, then bends toward the right as other chips disappear and a construction grid appears. Its vertical move starts around 14.833s and is finished by 15.200s. Horizontal movement starts around 15.000s and continues until about 15.867s. The onset difference is about 167ms; the sideways settling lasts about 667ms beyond the downward settling.

The vertical coordinate is an S-shaped move; the horizontal coordinate has a short acceleration and a long deceleration. A single straight interpolation from start to finish would miss both the path and the staged attention. This is a useful example of **coordinated channels, rather than identical channels**.

The template is the stable text/icon interior, not the changing pill outline or surrounding grid. Correlation across the inspected interval ranges from approximately 0.77–1.00; the lower scores coincide with the fastest horizontal movement. Bounding-box overlays remain attached to the intended label. The values are integer-pixel template positions, so they do not support subpixel certainty.

- [Vertical plot](../local/analysis/easing/airbnb-chip-y.png) · [validated frames](../local/analysis/easing/airbnb-chip-y-validation.jpg) · [CSV](../local/analysis/easing/airbnb-chip-y.csv)
- [Horizontal plot](../local/analysis/easing/airbnb-chip-x.png) · [validated frames](../local/analysis/easing/airbnb-chip-x-validation.jpg) · [CSV](../local/analysis/easing/airbnb-chip-x.csv)

Confidence: high for the split timing and curved screen path; moderate for exact curve coefficients. This does not prove whether the author used separate axis keyframes, a spatial path, a parent transform, or a camera rig.

## Principles supported by this sample

1. **Treat arrival as a phase, not a single endpoint.** The main displacement can be over while a slower residual move keeps the composition alive. Supported by OpenAI, Yosemite, and Airbnb; five of six coordinate tracks have at least 80% of their displacement complete by halfway through their selected intervals. This is a sample finding, not a whole-library frequency claim.
2. **Separate the decisive change from the finish.** A snap or very fast change can establish the next scale, with only the last fraction eased. OpenAI demonstrates this twice. “Everything must interpolate smoothly” would miss its taste.
3. **Coordinate timing across properties without forcing the same easing onto each property.** Airbnb's x/y example supports different starts, durations, and profiles within one coherent motion. Yosemite's continuing zoom and developing internal glyph show overlapping processes, though only the diameter was numerically measured.
4. **Use the full motion interval when judging pace.** A 1.37-second move can do 90% of its travel in its first 0.54 seconds. Total duration alone does not describe perceived speed.
5. **Treat curve names as approximations.** Exact fixed-curve winners change when boundaries shift by one frame. The more stable observation is the shape of the timing: S-shaped transfer, asymmetric acceleration/long settle, or discontinuity followed by a settle.
6. **Do not infer spring physics from a pleasant settle.** These tracks show no clear meaningful overshoot in the measured coordinate. Tiny 0.5–2px endpoint fluctuations are at the level of raster/threshold noise. This sample gives no basis for recovering damping, stiffness, or spring mass, or for declaring that other scenes never use springs.

## Sensitivity and rejected measurements

Every fit was repeated with start and end shifted by ±1 frame, plus an explicit start+1/end-unchanged case. All variants, including new Bezier coefficients, are recorded in JSON. Exact named winners are unstable in several cases; broad slowing-arrival versus S-shape conclusions remain useful. The Bezier coefficients are descriptive screen-space approximations and should not be promoted as recovered production settings.

Rejected or narrowed examples:

- OpenAI's entire small-to-large circle event was rejected as a continuous-easing fit because the first-frame jump dominates it. Only its subsequent tail was fitted.
- Yosemite's later red-control center, after it leaves the frame around 2.8s, was rejected. A connected-component centroid then drifts because the circle is cropped; it is not the actual center.
- Airbnb's rotating suitcase sticker/gem/paw sequence around 30–33s was rejected for quantitative easing. Rotation, changing silhouettes, occlusion, and perspective make a simple box trajectory an ambiguous proxy.
- Airbnb's rounded-corner construction around 17.7–19s was not reduced to a translation curve: a changing shape parameter, viewport scaling, and a fixed corner can produce different screen-space landmarks.

## Reproduce and extend

Generated files and scripts are under `references/motion/local/analysis/easing/` and remain Git-ignored. Only this report and `easing.json` are authored audit records. This pass used an isolated Python environment with OpenCV, NumPy, SciPy, Pillow, and Matplotlib, plus system FFprobe. No Tilt runtime dependencies or behavior changed.

```sh
python3 -m venv /tmp/tilt-easing-env
/tmp/tilt-easing-env/bin/pip install numpy scipy opencv-python-headless pillow matplotlib
/tmp/tilt-easing-env/bin/python references/motion/local/analysis/easing/measure.py
/tmp/tilt-easing-env/bin/python references/motion/local/analysis/easing/fit_curves.py
```

`build_inspection.py` generates dense exploratory contact sheets. `measure.py` defines exact frame ranges and tracking methods. `fit_curves.py` creates per-track CSVs, raw/normalized plots, validation sheets, and `fit-results.json`. The authored JSON adds scope, limitations, and interpretation to those generated results. It should be reviewed if tracking parameters or intervals change.
