#!/usr/bin/env python3
"""Build a local, searchable contact-sheet library of selected motion films."""
import concurrent.futures
import csv
from fractions import Fraction
import hashlib
import html
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
LIBRARY = ROOT / 'references/motion'
LOCAL = LIBRARY / 'local'
VERSION = 1


def run(args):
    return subprocess.check_output(args, stderr=subprocess.PIPE, text=True)


def sha256(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def timecode(seconds):
    millis = round(seconds * 1000)
    return f'{millis // 60000:02}:{millis // 1000 % 60:02}.{millis % 1000:03}'


def font(size):
    for path in ['/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def save_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def source_position(frame, fps, edit):
    if edit:
        for segment in edit['segments']:
            if segment['output_start_frame'] <= frame < segment['output_end_frame_exclusive']:
                source_frame = segment['source_start_frame'] + frame - segment['output_start_frame']
                return source_frame / fps, segment['label']
        raise ValueError(f'Frame {frame} is outside the edit list')
    return frame / fps, 'Complete original film'


def ocr_frame(row):
    frame = LOCAL / row['frame_path']
    cache = frame.parent.parent / 'ocr' / (frame.stem + '.json')
    if cache.exists():
        return json.loads(cache.read_text())
    env = {**os.environ, 'OMP_THREAD_LIMIT': '1'}
    raw = subprocess.check_output(['tesseract', str(frame), 'stdout', '-l', 'eng', '--psm', '11', 'tsv'], stderr=subprocess.PIPE, text=True, env=env)
    words = [x['text'].strip() for x in csv.DictReader(io.StringIO(raw), delimiter='\t') if x.get('text', '').strip() and float(x['conf']) >= 45]
    result = {'text': ' '.join(words), 'engine': 'tesseract eng psm11', 'minimum_word_confidence': 45}
    save_json(cache, result)
    return result


def sheet(title, rows, destination, subtitle):
    columns, tile_w, tile_h, header = 4, 384, 280, 64
    image = Image.new('RGB', (columns * tile_w, header + math.ceil(len(rows) / columns) * tile_h), '#ececea')
    draw = ImageDraw.Draw(image)
    draw.text((16, 9), title, fill='#171717', font=font(22))
    draw.text((16, 38), subtitle, fill='#505050', font=font(14))
    for index, row in enumerate(rows):
        x, y = index % columns * tile_w, header + index // columns * tile_h
        with Image.open(LOCAL / row['frame_path']) as frame:
            thumb = ImageOps.contain(frame.convert('RGB'), (tile_w - 12, 228))
            image.paste(thumb, (x + (tile_w - thumb.width) // 2, y + (228 - thumb.height) // 2))
        draw.text((x + 8, y + 234), f"{row['timecode']}  frame {row['frame_number']:06}", fill='#171717', font=font(15))
        draw.text((x + 8, y + 255), f"Source {row['source_timecode']}", fill='#606060', font=font(12))
    image.save(destination, quality=92)


def build_reference(item, notes):
    folder = LOCAL / item['id']
    for name in ['frames', 'sheets', 'ocr']:
        (folder / name).mkdir(parents=True, exist_ok=True)
    video = folder / 'video.mp4'
    original = Path(item['input']).expanduser()
    if original.exists():
        digest = sha256(original)
        if not video.exists() or sha256(video) != digest:
            shutil.copy2(original, video)
        assert sha256(video) == digest, f'Copy mismatch: {item["id"]}'
    else:
        if not video.exists():
            raise FileNotFoundError(original)
        digest = sha256(video)
    probe = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(video)]))
    stream = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    fps = float(Fraction(stream['avg_frame_rate']))
    total = int(stream['nb_frames'])
    step = round(fps)
    indices = list(range(0, total, step))
    if indices[-1] != total - 1:
        indices.append(total - 1)
    signature = {'version': VERSION, 'sha256': digest, 'step_frames': step, 'last_frame': total - 1, 'width': 960}
    cache = folder / 'sampling.json'
    cached = json.loads(cache.read_text()) if cache.exists() else None
    if cached != signature or len(list((folder / 'frames').glob('*.jpg'))) != len(indices):
        for path in [*(folder / 'frames').glob('*.jpg'), *(folder / 'ocr').glob('*.json')]:
            path.unlink()
        run(['ffmpeg', '-v', 'error', '-threads', '2', '-i', str(video), '-vf', f"select='not(mod(n,{step}))+eq(n,{total-1})',scale=960:-2", '-fps_mode', 'vfr', '-q:v', '2', '-threads', '2', str(folder / 'frames/frame-%05d.jpg')])
        save_json(cache, signature)
    files = sorted((folder / 'frames').glob('*.jpg'))
    assert len(files) == len(indices), f'Frame count mismatch: {item["id"]}'
    edit = None
    if item.get('edit_list'):
        original_edit = Path(item['edit_list']).expanduser()
        local_edit = folder / 'edit-list.json'
        if original_edit.exists():
            shutil.copy2(original_edit, local_edit)
        edit = json.loads(local_edit.read_text())
        assert int(edit['output_frames']) == total
    rows = []
    for index, (frame, path) in enumerate(zip(indices, files)):
        seconds = frame / fps
        source_seconds, section = source_position(frame, fps, edit)
        annotation = next((n for n in notes.get(item['id'], []) if n['start'] <= seconds < n['end']), {})
        rows.append({'reference': item['id'], 'title': item['title'], 'reel_seconds': round(seconds, 6), 'timecode': timecode(seconds), 'frame_number': frame, 'source_seconds': round(source_seconds, 6), 'source_timecode': timecode(source_seconds), 'section': section, 'visual_note': annotation.get('note', ''), 'visual_tags': annotation.get('tags', []), 'reference_tags': item['tags'], 'frame_path': path.relative_to(LOCAL).as_posix(), 'sheet_path': f"{item['id']}/sheets/sheet-{index // 20 + 1:03}.jpg", 'sheet_row': index % 20 // 4 + 1, 'sheet_column': index % 4 + 1})
        rows[-1]['semantic_scene_id'] = annotation.get('scene_id')
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for row, result in zip(rows, pool.map(ocr_frame, rows)):
            row['ocr'] = result['text']
            row['ocr_search'] = result['text']
            for mistaken, corrected in item.get('ocr_replacements', {}).items():
                row['ocr_search'] = re.sub(r'\b' + re.escape(mistaken) + r'\b', corrected, row['ocr_search'])
    for path in (folder / 'sheets').glob('sheet-*.jpg'):
        path.unlink()
    for start in range(0, len(rows), 20):
        page = rows[start:start + 20]
        sheet(item['title'], page, LOCAL / page[0]['sheet_path'], f"Reel {page[0]['timecode']}–{page[-1]['timecode']} · one-second samples · row-major order")
    overview_rows = [rows[round(i * (len(rows) - 1) / 15)] for i in range(16)]
    sheet(item['title'], overview_rows, folder / 'overview.jpg', 'Overview · 16 evenly spaced samples · timestamps refer to this reel')
    manifest = {**item, 'sha256': digest, 'bytes': video.stat().st_size, 'width': stream['width'], 'height': stream['height'], 'frame_rate': stream['avg_frame_rate'], 'frame_count': total, 'duration_seconds': total / fps, 'sample_count': len(rows), 'sheet_count': math.ceil(len(rows) / 20), 'sample_step_frames': step, 'sample_interval_seconds': step / fps, 'last_frame_included': True, 'ocr': 'Tesseract English; sparse text; word confidence >=45; uncorrected', 'video': f"{item['id']}/video.mp4", 'overview': f"{item['id']}/overview.jpg"}
    save_json(folder / 'manifest.json', manifest)
    write_rows(folder, rows)
    print(f"{item['id']}: {len(rows)} indexed frames, {manifest['sheet_count']} sheets", flush=True)
    return manifest, rows


def write_rows(folder, rows):
    (folder / 'frames.jsonl').write_text(''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in rows))
    with (folder / 'frames.tsv').open('w', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), delimiter='\t')
        writer.writeheader()
        writer.writerows({k: ', '.join(v) if isinstance(v, list) else v for k, v in row.items()} for row in rows)


def main():
    catalog = json.loads((LIBRARY / 'catalog.json').read_text())
    notes = json.loads((LIBRARY / 'notes.json').read_text())
    LOCAL.mkdir(parents=True, exist_ok=True)
    manifests, all_rows = [], []
    for item in catalog:
        manifest, rows = build_reference(item, notes)
        manifests.append(manifest)
        all_rows.extend(rows)
    write_rows(LOCAL, all_rows)
    save_json(LOCAL / 'index.json', manifests)
    md = ['# Selected motion references', '', 'All timestamps are in the local reel. Source timestamps map back to the original film.', '', '| Reference | Duration | Resolution | Frames indexed | Contact sheets |', '|---|---:|---|---:|---:|']
    sections = []
    for item in manifests:
        label = html.escape(item['title'])
        ident = item['id']
        md.append(f"| [{item['title']}]({ident}/overview.jpg) | {timecode(item['duration_seconds'])} | {item['width']}×{item['height']} | {item['sample_count']} | {item['sheet_count']} |")
        sheets = ''.join(f'<a href="{ident}/sheets/sheet-{n:03}.jpg"><img loading="lazy" src="{ident}/sheets/sheet-{n:03}.jpg" alt="{label} contact sheet {n}"></a>' for n in range(1, item['sheet_count'] + 1))
        section_notes = ''.join(f'<li><a href="{ident}/video.mp4#t={n["start"]}">{timecode(n["start"])}</a> {html.escape(n["note"])}</li>' for n in notes.get(ident, []))
        sections.append(f'<section id="{ident}"><h2>{label}</h2><p>{item["width"]} × {item["height"]} · {timecode(item["duration_seconds"])} · {html.escape(item["version"])}</p><p><a href="{ident}/video.mp4">Video</a> · <a href="{ident}/frames.tsv">Searchable frame index</a> · <a href="{html.escape(item["source_url"])}">Source</a></p><a href="{ident}/overview.jpg"><img src="{ident}/overview.jpg" alt="{label} overview"></a><ul>{section_notes}</ul><details><summary>All {item["sheet_count"]} contact sheets</summary>{sheets}</details></section>')
    md.extend(['', 'Search `frames.jsonl` or `frames.tsv` for OCR, interval-specific visual notes and film-level tags. Frame paths are relative to this directory.', '', '## Files', ''])
    for item in manifests:
        md.append(f"- **{item['title']}**: [{item['id']}/video.mp4]({item['id']}/video.mp4), [{item['id']}/frames.tsv]({item['id']}/frames.tsv)")
        for note in notes.get(item['id'], []):
            md.append(f"  - {timecode(note['start'])}–{timecode(note['end'])}: {note['note']} Tags: {', '.join(note['tags'])}")
    (LOCAL / 'index.md').write_text('\n'.join(md) + '\n')
    navigation = ' · '.join(f'<a href="#{m["id"]}">{html.escape(m["company"] + " / " + m["id"].replace("apple-", ""))}</a>' for m in manifests)
    if (LOCAL / 'analysis/index.html').is_file():
        navigation = '<a href="analysis/index.html">Animation principles</a> · ' + navigation
    page = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Selected motion references</title><style>body{font:16px/1.5 system-ui;background:#f5f5f3;color:#222;max-width:1180px;margin:40px auto;padding:0 20px}a{color:#2457a6}h1{font-size:28px}h2{margin-top:52px}img{display:block;width:100%;height:auto;margin:20px 0}p,li{max-width:85ch}summary{cursor:pointer;font-weight:600}section{border-top:1px solid #ddd;margin-top:32px}</style><h1>Selected motion references</h1><nav>' + navigation + '</nav><p>One-second samples with exact frame numbers and reel/source timestamps. Open a sheet for full size; inspect the video for motion between samples.</p>' + ''.join(sections) + '</html>'
    (LOCAL / 'index.html').write_text(page)
    for row in all_rows:
        assert (LOCAL / row['frame_path']).is_file()
        assert (LOCAL / row['sheet_path']).is_file()
    save_json(LOCAL / 'verification.json', {'references': len(manifests), 'frames_indexed': len(all_rows), 'contact_sheets': sum(m['sheet_count'] for m in manifests), 'overviews': len(manifests), 'all_frame_and_sheet_paths_exist': True, 'copied_video_hashes_verified': True, 'last_decoded_frame_included': True})
    print(f"Done: {len(manifests)} references, {len(all_rows)} frames; {LOCAL / 'index.html'}")


if __name__ == '__main__':
    main()
