# Selected motion references

The five selected videos are copied into this checkout under `local/<id>/video.mp4`. These are the selected viewing versions: the Liquid Glass, iOS 7 and Airbnb motion edits, the complete Yosemite UI film, and the complete OpenAI brand film. Original downloads remain in Downloads. The larger research shortlist is not part of this collection.

The [animation audit](analysis/README.md) groups the films into 69 semantic content scenes. The frame index includes `semantic_scene_id` to connect a frame directly to that audit; its checked scene map supersedes the earlier coarse section notes.

Open [the local visual index](local/index.html) or [the agent index](local/index.md). Each reference has:

- `overview.jpg`: 16 evenly spaced frames for orientation.
- `sheets/sheet-NNN.jpg`: chronological contact sheets, 20 frames per page, sampled approximately once per second plus the last frame. Labels include the exact decoded frame number, reel time and original source time where available.
- `frames/`: individual 960-pixel-wide JPEGs for closer inspection. These are viewing proxies; the video keeps its original resolution.
- `frames.jsonl` and `frames.tsv`: searchable OCR, visual-section notes, tags, source timing and frame/sheet locations.
- `manifest.json`: resolution, frame rate, duration, SHA-256, sampling details and provenance.
- `edit-list.json`: source-to-reel cut mapping for edited films.

`local/` is intentionally Git-ignored: videos, captures and generated indexes stay out of Git. The selected catalog, curated notes and indexing script are kept as ordinary repository files. This local collection is not a Git backup of the media.

## Search and inspect

From the repository root:

```sh
# Curated reference descriptions and visual notes (normal Git-aware search).
rg -n -i 'glass|icon construction|typography' references/motion

# Search generated OCR and time-indexed annotations, including ignored files.
rg --no-ignore -n -i 'magnifier|OpenAI Sans|Safari' references/motion/local/frames.jsonl

# A match contains a local frame path, sheet path and row/column.
# Inspect those pixels, then open video.mp4 at reel_seconds for motion.
```

OCR is machine-generated and can miss small or moving text. `ocr` preserves the raw text; `ocr_search` applies only the explicit corrections in the catalog (currently `OpenAl` → `OpenAI`, the capital-I/lowercase-L confusion). Catalog tags describe the whole film; `visual_note` and `visual_tags` describe only their stated intervals. Note intervals are approximate visual sections, not frame-exact shot boundaries. Notes are visual observations, not measurements of the original implementation. One-second samples can miss brief transitions: use the video and exact frame numbers for finer analysis. A still image does not establish timing curves, rendering techniques or depth-of-field implementation.

## Rebuild

Requires Python 3 with Pillow, FFmpeg/FFprobe and Tesseract (`eng`).

```sh
python3 scripts/index-motion-references.py
```

The script uses an existing local video when the Downloads input has moved, verifies copies by SHA-256, caches frame extraction and OCR, and regenerates indexes/sheets when notes change. Edit `catalog.json` to select another source; edit `notes.json` for timestamped visual annotations. Annotation intervals are in edited-reel seconds, with exclusive end times.
