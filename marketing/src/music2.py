#!/usr/bin/env python3
"""Warm, cinematic soundtrack + narrator mix for the Courtside ads (round 2).

Music is synthesized from scratch: FM electric piano, bell melody, finger snaps, shaker,
sub bass, string pad, reverse-cymbal swells into cuts and a soft hit on the end card.
The music ducks under the narrator (Kokoro TTS lines placed at their cue times).

usage: python3 music2.py <ad-name> <cues.json> <vo-dir> <out.wav>
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from music import SR, RNG, ROOTS, hz, env, lp, hp, bp, add, reverb, write_wav, tick  # noqa: E402

TEMPO = {"ad1-your-program": 100, "ad2-rise-and-grind": 108, "ad3-study-the-game": 88, "ad4-climb-the-ranks": 116, "ad5-all-in-one": 100}
PROGS = {
    "bright": [[0, 4, 7, 11, 14], [9, 12, 16, 19], [5, 9, 12, 16, 19], [7, 11, 14, 17]],   # Imaj9 vi7 IVmaj9 V7
    "drive": [[9, 12, 16, 19], [5, 9, 12, 16], [0, 4, 7, 11], [7, 11, 14, 19]],            # vi IV I V
    "calm": [[0, 4, 7, 14], [5, 9, 12, 16], [9, 12, 16, 19], [5, 9, 12, 14]],              # I IV vi IVadd2
    "hype": [[0, 3, 7, 10, 14], [8, 12, 15, 19], [5, 8, 12, 15], [7, 10, 14, 17]],          # i9 VI iv v
}


def epiano(freq, dur, vel=1.0):
    """Two-operator FM electric piano: bell-like attack that mellows out."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    index = 1.8 * np.exp(-t * 6) + 0.25
    mod = np.sin(2 * np.pi * freq * t)
    s = np.sin(2 * np.pi * freq * t + index * mod)
    s += 0.18 * np.sin(2 * np.pi * freq * 14 * t) * np.exp(-t * 40)  # tine
    s *= 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)  # gentle tremolo
    return s * env(n, 0.004, 0.9, s=0.15) * env(n, 0.001, 1, hold=dur - 0.12, r=0.12) * vel


def bell(freq, dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 3.0 * t) * np.exp(-t * 3) + 0.15 * np.sin(2 * np.pi * freq * 4.2 * t) * np.exp(-t * 6)
    return s * env(n, 0.002, 0.55)


def soft_kick():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 42 + 60 * np.exp(-t * 22)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.3)


def snap():
    n = int(0.16 * SR)
    noise = bp(RNG.standard_normal(n), 1800, 7000) * env(n, 0.0008, 0.035)
    t = np.arange(n) / SR
    click = np.sin(2 * np.pi * 3200 * t) * env(n, 0.0003, 0.004)
    return (noise + 0.4 * click) * 0.8


def shaker(acc=1.0):
    n = int(0.09 * SR)
    return hp(RNG.standard_normal(n), 6000) * env(n, 0.012, 0.03) * 0.35 * acc


def sub(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * env(n, 0.03, 1, hold=dur - 0.15, r=0.15)


def strings(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.08, 0.0, 0.07):
            ff = f * 2 ** (det / 12)
            vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t + RNG.uniform(0, 6))
            ph = 2 * np.pi * np.cumsum(ff * vib) / SR
            for h in range(1, 6):
                s += np.sin(h * ph) / h
    s /= len(freqs) * 3 * 2.0
    return lp(s, 1300) * env(n, 0.8, 1, hold=dur - 0.7, r=0.7)


def swell(dur=1.0):
    """Reverse-cymbal swell that peaks right on the cut."""
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    noise = hp(RNG.standard_normal(n), 3000)
    return noise * t ** 3 * (1 - np.clip((t - 0.97) / 0.03, 0, 1)) * 0.35


def warm_hit(root):
    n = int(2.8 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(34 + 40 * np.exp(-t * 7)) / SR) * env(n, 0.003, 0.9)
    s = boom * 0.9
    for semi in (12, 19, 24, 28, 31):
        s += 0.12 * bell(hz(root, semi), 2.8)
    return s


def load_vo(vo_dir, items, n):
    """Narration placed at cue times, high-passed and leveled. Returns (signal, ducking envelope)."""
    vo = np.zeros(n)
    for i, (at, _text) in enumerate(items):
        x, sr = sf.read(f"{vo_dir}/{i}.wav")
        if x.ndim > 1:
            x = x.mean(1)
        x = resample_poly(x, SR, sr)
        x = hp(x, 90)
        x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.12  # level each line to the same loudness
        i0 = int(at * SR)
        m = min(len(x), n - i0)
        vo[i0:i0 + m] += x[:m]
    # smoothed envelope → ducking gain (fast attack, slow release)
    a = np.abs(vo)
    envl = np.zeros(n)
    att, rel = np.exp(-1 / (0.015 * SR)), np.exp(-1 / (0.35 * SR))
    e = 0.0
    step = 64
    for j in range(0, n, step):
        v = a[j:j + step].max()
        e = v + (e - v) * (att ** step if v > e else rel ** step)
        envl[j:j + step] = e
    duck = 1 - 0.62 * np.clip(envl / 0.12, 0, 1)  # about -8.4 dB under the voice
    return vo, duck


def compose(name, cues, cfg, vo_dir, narration):
    dur = cues["duration"] + 0.4
    n = int(dur * SR)
    bpm = TEMPO[name]
    beat = 60 / bpm
    bar = beat * 4
    root = ROOTS[cfg["key"]]
    prog = PROGS[cfg["mood"]]
    first, end = cues["scenes"][0], cues["end"]
    keys = np.zeros((2, n)); perc = np.zeros((2, n)); low = np.zeros((2, n)); pad = np.zeros((2, n)); fx = np.zeros((2, n))

    K = soft_kick()
    motif = [4, 2, 0, 1, 2, 4, 3, 1]  # chord-tone indexes for the bell line
    t, b = 0.0, 0
    while t < dur:
        chord = prog[b % len(prog)]
        body = first - 0.05 <= t < end
        add(pad, strings([hz(root / 2, s) for s in chord[:4]], bar + 0.8), t, 0.22 if body else 0.5)
        # electric piano groove: 1, 2&, 4 (just held chords in the intro)
        hits = [(0, 1.0, beat * 1.4), (1.5, 0.7, beat * 0.9), (3, 0.8, beat * 0.9)] if body else [(0, 1.6, beat * 2), (2, 1.3, beat * 2)]
        for pos, vel, ln in hits:
            for k, s in enumerate(chord):
                add(keys, epiano(hz(root, s), ln, vel), t + pos * beat + k * 0.006, 0.07, pan=-0.3 + 0.15 * k)
        if body:
            add(low, sub(hz(root / 4, chord[0]), bar * 0.95), t, 0.32)
            for q in range(4):
                tq = t + q * beat
                if tq >= end:
                    break
                if q in (0, 2) or (cfg["mood"] in ("drive", "hype") and q == 3):
                    add(perc, K, tq, 0.55 if q == 0 else 0.42)
                if q in (1, 3):
                    add(perc, snap(), tq, 0.5, pan=0.12)
                for e in range(4):
                    add(perc, shaker(1.0 if e == 2 else 0.55), tq + e * beat / 4, 0.55, pan=0.3)
            # bell line on 8ths, every other bar, so it answers the narrator instead of fighting it
            if b % 2 == 1:
                for e, mi in enumerate(motif):
                    s = chord[min(mi, len(chord) - 1)] + 12
                    add(keys, bell(hz(root, s)), t + e * beat / 2, 0.05, pan=0.25 * np.sin(e))
        if not body and t < first:
            for e, mi in enumerate(motif):
                s = chord[min(mi, len(chord) - 1)] + 12
                add(keys, bell(hz(root, s)), t + e * beat / 2, 0.07, pan=0.25 * np.sin(e))
        t += bar
        b += 1

    # light kick ducking on the music beds
    kd = np.ones(n)
    for kt in np.arange(first, end, beat * 2):
        i = int(kt * SR); m = min(int(0.2 * SR), n - i)
        if m > 0:
            kd[i:i + m] = np.minimum(kd[i:i + m], 0.8 + 0.2 * (np.arange(m) / m))

    for s in cues["scenes"][1:]:
        add(fx, swell(0.9), s - 0.9, 0.22)
    add(fx, swell(1.6), end - 1.6, 0.3)
    add(fx, warm_hit(root), end, 0.55)
    for tp in cues["taps"]:
        add(fx, tick(), tp, 0.35)
    for ch in cues["chips"]:
        add(fx, bell(hz(root, 31), 1.2), ch, 0.12, pan=0.2)
        add(fx, bell(hz(root, 36), 1.2), ch + 0.08, 0.1, pan=-0.2)
    for a, z in cues["rings"]:
        tt = a
        while tt < z:
            m = int(0.18 * SR)
            beep = np.sign(np.sin(2 * np.pi * 988 * np.arange(m) / SR)) * env(m, 0.003, 1, hold=0.15, r=0.03)
            for k in range(4):
                add(fx, lp(beep, 4500), tt + k * 0.28, 0.06)
            tt += 1.5

    vo, duck = load_vo(vo_dir, narration, n)
    lift = np.ones(n)  # the intro has no drums, so give its keys and strings more level
    i0, i1 = int((first - 0.5) * SR), int((first + 0.2) * SR)
    lift[:i0] = 2.0
    lift[i0:i1] = np.linspace(2.0, 1.0, i1 - i0)
    music = (reverb(keys, 0.3) * lift + reverb(pad, 0.35) * lift + low + perc) * kd + reverb(fx, 0.2)
    music *= duck
    fade = np.ones(n)
    fs = int((end + 2.1) * SR)
    if fs < n:
        fade[fs:] = np.linspace(1, 0, n - fs) ** 2
    music *= fade
    music /= np.percentile(np.abs(music), 99.9) + 1e-9
    music = np.tanh(music * 0.8) / np.tanh(0.8) * 0.5
    voice = np.stack([vo, vo]) * 3.2
    mix = music + voice
    return (mix / (np.max(np.abs(mix)) + 1e-9) * 0.9).T


if __name__ == "__main__":
    name, cues_path, vo_dir, out = sys.argv[1:5]
    here = os.path.dirname(os.path.abspath(__file__))
    cfg = json.load(open(f"{here}/music.json"))[name]
    narration = json.load(open(f"{here}/narration.json"))[name]
    write_wav(out, compose(name, json.load(open(cues_path)), cfg, f"{vo_dir}/{name}", narration))
    print("wrote", out)
