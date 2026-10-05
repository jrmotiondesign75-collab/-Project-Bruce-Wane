#!/usr/bin/env python3
"""Synthesize narration lines with Kokoro (Apache-2.0) and report each line's length.
usage: python3 tts.py <voice> <speed> <outdir>"""
import json, os, sys
import soundfile as sf
from kokoro_onnx import Kokoro
here = os.path.dirname(os.path.abspath(__file__))
voice, speed, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
k = Kokoro(os.environ.get("KOKORO_MODEL", os.path.join(here, "kokoro-v1.0.onnx")), os.environ.get("KOKORO_VOICES", os.path.join(here, "voices-v1.0.bin")))
lines = json.load(open(os.path.join(here, "narration.json")))
report = {}
for ad, items in lines.items():
    os.makedirs(f"{out}/{ad}", exist_ok=True)
    report[ad] = []
    for i, (at, text) in enumerate(items):
        samples, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
        sf.write(f"{out}/{ad}/{i}.wav", samples, sr)
        nxt = items[i + 1][0] if i + 1 < len(items) else None
        dur = len(samples) / sr
        report[ad].append([at, round(dur, 2), None if nxt is None else round(nxt - at - dur, 2), text])
json.dump(report, open(f"{out}/report.json", "w"), indent=1)
for ad, r in report.items():
    print(ad)
    for at, dur, gap, text in r:
        flag = "  <-- overlaps next" if gap is not None and gap < 0.15 else ""
        print(f"  {at:5.1f}s  {dur:4.2f}s  gap {gap}  {text}{flag}")
