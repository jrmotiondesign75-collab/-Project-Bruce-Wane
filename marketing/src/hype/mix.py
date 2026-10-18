#!/usr/bin/env python3
"""Audio for a hype edit: the song clip, plus light sound design locked to the cuts
(an air whoosh into every soft transition, a low thump under every slam or flash), faded out over the end card.

usage: python3 mix.py <song.mp3> <edit.clip.json> <cues.json> <out.wav>
"""
import json
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
RNG = np.random.default_rng(7)


def load(src, start, dur):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", src, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def whoosh(length=0.42):
    """Band-passed noise that swells into the cut and sweeps upward, peaking right on it."""
    n = int(length * SR)
    t = np.linspace(0, 1, n)
    noise = RNG.standard_normal(n)
    out = np.zeros(n)
    for k, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4500), (3000, 8000)]):  # rising sweep in four bands
        band = sosfilt(butter(2, [lo, hi], "bandpass", fs=SR, output="sos"), noise)
        w = np.exp(-((t - (0.35 + 0.17 * k)) / 0.16) ** 2)
        out += band * w
    env = np.where(t < 0.62, (t / 0.62) ** 2, np.exp(-(t - 0.62) * 9))
    return out * env / (np.abs(out * env).max() + 1e-9)


def thump(length=0.5):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def place(dst, clip, at, gain, pan=0.0):
    i = int(at * SR)
    if i >= len(dst):
        return
    if i < 0:
        clip, i = clip[-i:], 0
    m = min(len(clip), len(dst) - i)
    dst[i:i + m, 0] += clip[:m] * gain * (1 - pan)
    dst[i:i + m, 1] += clip[:m] * gain * (1 + pan)


if __name__ == "__main__":
    song, clip_path, cues_path, out = sys.argv[1:5]
    clip, cues = json.load(open(clip_path)), json.load(open(cues_path))
    dur = clip["duration"]
    mus = load(song, clip["start"], dur)
    n = len(mus)
    # short fade in, then a fade over the back half of the end card so the logo lands clean
    env = np.ones(n)
    fi = int(0.015 * SR); env[:fi] = np.linspace(0, 1, fi)
    fo_start = int((cues["end"] + (dur - cues["end"]) * 0.45) * SR)
    env[fo_start:] = np.linspace(1, 0, n - fo_start) ** 1.6
    mus *= env[:, None]
    ref = np.sqrt(np.mean(mus[: int(cues["end"] * SR)] ** 2))
    fx = np.zeros_like(mus)
    w = whoosh()
    for k, t in enumerate(cues["whoosh"]):
        place(fx, w, t - 0.62 * len(w) / SR, 1.0, pan=0.35 * (1 if k % 2 else -1))
    th = thump()
    for t in cues["impact"]:
        place(fx, th, t, 1.6)
    fx *= ref * 0.55 / (np.sqrt(np.mean(w ** 2)) + 1e-9) * 0.25  # sits well under the track
    mix = mus + fx
    mix /= max(1.0, np.abs(mix).max() / 0.98)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", out], input=mix.astype(np.float32).tobytes(), check=True)
    print("wrote", out, f"{n / SR:.2f}s", len(cues["whoosh"]), "whooshes", len(cues["impact"]), "impacts")
