#!/usr/bin/env python3
"""Original soundtracks for the Courtside ads, synthesized from scratch (no samples, no licensing).

Each track follows its video's cue sheet (cues.json written by render.mjs): drums enter with the
first scene, whooshes lead into every cut, taps get soft UI ticks, XP moments get a chime, the
alarm ad gets alarm beeps while the phone shakes, and the end card lands on an impact.

usage: python3 music.py <ad-name> <cues.json> <out.wav>
"""
import json
import sys
import wave

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 44100
RNG = np.random.default_rng(7)

# key roots (A4 = 440) and chord progressions as semitone offsets from the root
ROOTS = {"C": 261.63, "D": 293.66, "E": 329.63, "F": 349.23, "G": 392.00}
PROGS = {
    "bright": [[0, 4, 7, 11], [7, 11, 14, 17], [9, 12, 16, 19], [5, 9, 12, 16]],  # Imaj7 V vi IV
    "drive": [[9, 12, 16, 19], [5, 9, 12, 16], [0, 4, 7, 11], [7, 11, 14, 17]],  # vi IV I V
    "calm": [[0, 4, 7, 14], [9, 12, 16, 21], [5, 9, 12, 19], [7, 11, 14, 21]],  # I vi IV V, open voicings
    "hype": [[0, 3, 7, 10], [8, 12, 15, 19], [3, 7, 10, 14], [10, 14, 17, 21]],  # i VI III VII
}
STYLE = {
    "bright": dict(kick="four", hat=0.07, clap=True, pluck=0.34, pad=0.24, bass=0.12, kgain=0.5),
    "drive": dict(kick="four", hat=0.08, clap=True, pluck=0.32, pad=0.22, bass=0.13, kgain=0.52),
    "calm": dict(kick="half", hat=0.05, clap=False, pluck=0.36, pad=0.28, bass=0.10, kgain=0.42),
    "hype": dict(kick="four", hat=0.09, clap=True, pluck=0.3, pad=0.22, bass=0.14, kgain=0.56),
}


def hz(root, semis):
    return root * 2 ** (semis / 12)


def env(n, a=0.005, d=0.2, s=0.0, r=0.05, hold=None):
    """ADSR-ish envelope of n samples."""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if hold is None:
        e *= np.exp(-np.maximum(0, t - a) / max(d, 1e-4)) * (1 - s) + s
    else:
        rel = np.clip((t - hold) / max(r, 1e-4), 0, 1)
        e *= (1 - rel)
    return e


def lp(x, cutoff, order=2):
    sos = butter(order, min(cutoff, SR / 2 - 100) / (SR / 2), "low", output="sos")
    return sosfilt(sos, x)


def hp(x, cutoff, order=2):
    sos = butter(order, cutoff / (SR / 2), "high", output="sos")
    return sosfilt(sos, x)


def bp(x, lo, hi):
    sos = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos")
    return sosfilt(sos, x)


def add(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0:
        return
    sig = sig[: buf.shape[1] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * gain * l * 1.414
    buf[1, i:i + len(sig)] += sig * gain * r * 1.414


# ---------- instruments ----------

def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * env(n, 0.002, 0.28)
    s += lp(RNG.standard_normal(n), 4000) * env(n, 0.0005, 0.006) * 0.4
    return np.tanh(s * 1.6)


def clap():
    n = int(0.35 * SR)
    noise = bp(RNG.standard_normal(n), 900, 5200)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR)
        e[i:] += env(n - i, 0.001, 0.012 if k < 2 else 0.14) * (0.8 if k < 2 else 1)
    return noise * e * 0.9


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    return hp(RNG.standard_normal(n), 7000) * env(n, 0.001, 0.08 if open_ else 0.018) * 0.5


def pluck(freq, dur=0.32):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = 0.6 * np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t) + 0.08 * np.sin(2 * np.pi * freq * 3 * t)
    return lp(s, 3500) * env(n, 0.003, 0.11)


def pad(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            # band-limited-ish saw from a few harmonics
            for h in range(1, 7):
                s += np.sin(2 * np.pi * ff * h * t + RNG.uniform(0, 6.28)) / h
    s /= len(freqs) * 3 * 2.2
    s = lp(s, 1800)
    return s * env(n, 0.35, 1, hold=dur - 0.4, r=0.4)


def bass(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    return np.tanh(s * 1.4) * env(n, 0.01, 1, hold=dur - 0.06, r=0.05)


def whoosh(dur=0.7):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    noise = RNG.standard_normal(n)
    # sweep a band-pass upward by crossfading filtered copies
    out = np.zeros(n)
    for k, (lo, hi) in enumerate([(300, 1200), (800, 3000), (2000, 7000), (4000, 11000)]):
        w = np.clip(1 - np.abs(t * 3 - k), 0, 1)
        out += bp(noise, lo, hi) * w
    return out * (t ** 1.6) * (1 - np.clip((t - 0.93) / 0.07, 0, 1)) * 0.5


def impact():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 9)) / SR) * env(n, 0.002, 0.7)
    air = lp(RNG.standard_normal(n), 2500) * env(n, 0.002, 0.25) * 0.35
    return np.tanh((boom + air) * 1.3)


def tick():
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * t) * env(n, 0.0005, 0.012) * 0.5


def chime(root):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for k, semi in enumerate([24, 31]):
        f = hz(root, semi)
        i = int(k * 0.09 * SR)
        seg = (np.sin(2 * np.pi * f * t[: n - i]) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t[: n - i])) * env(n - i, 0.002, 0.35)
        s[i:] += seg
    return s * 0.35


def alarm_beeps():
    n = int(1.3 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for k in range(4):
        i = int(k * 0.3 * SR)
        m = int(0.2 * SR)
        s[i:i + m] += np.sign(np.sin(2 * np.pi * 988 * t[:m])) * env(m, 0.003, 1, hold=0.17, r=0.03)
    return lp(s, 5000) * 0.18


def shimmer(root, dur=2.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for semi in (24, 28, 31, 35):
        s += np.sin(2 * np.pi * hz(root, semi) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.5 * t + semi))
    return s * env(n, 0.6, 1, hold=dur - 0.6, r=0.6) * 0.05


def reverb(x, mix=0.22):
    out = np.zeros_like(x)
    for d, g in [(1557, 0.78), (1617, 0.77), (1491, 0.79), (1422, 0.8)]:
        a = np.zeros(d + 1); a[0] = 1; a[-1] = -g
        out += lfilter([1.0], a, x)
    out /= 4
    for d, g in [(225, 0.5), (556, 0.5)]:
        b = np.zeros(d + 1); b[0] = -g; b[-1] = 1
        a = np.zeros(d + 1); a[0] = 1; a[-1] = -g
        out = lfilter(b, a, out)
    return x * (1 - mix) + lp(out, 6000) * mix


# ---------- arrangement ----------

def compose(name, cues, cfg):
    dur = cues["duration"] + 0.4
    n = int(dur * SR)
    drums = np.zeros((2, n)); music = np.zeros((2, n)); fx = np.zeros((2, n)); low = np.zeros((2, n))
    root = ROOTS[cfg["key"]]
    prog = PROGS[cfg["mood"]]
    style = STYLE[cfg["mood"]]
    beat = 60 / cfg["bpm"]
    bar = beat * 4
    first, end = cues["scenes"][0], cues["end"]

    K, C = kick(), clap()
    t, b = 0.0, 0
    while t < dur:
        chord = prog[b % len(prog)]
        in_body = first - 0.05 <= t < end
        # pad + bass every bar
        add(music, pad([hz(root / 2, s) for s in chord], bar + 0.4), t, style["pad"])
        if in_body:
            for q in (0, 2):
                add(low, bass(hz(root / 4, chord[0]), beat * 1.95), t + q * beat, style["bass"])
        # pluck arpeggio in 16ths (sparser in the intro)
        pattern = [0, 2, 1, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2]
        for k in range(16):
            tt = t + k * beat / 4
            if tt >= dur:
                break
            if t < first and k % 2:
                continue  # half-time arpeggio in the intro
            if tt >= end + bar:
                continue
            note = chord[pattern[k]] + (12 if k % 8 >= 4 else 0)
            add(music, pluck(hz(root, note)), tt, style["pluck"] * (0.75 if k % 4 else 1), pan=0.35 * np.sin(k))
        # drums in the body
        if in_body:
            for q in range(4):
                tq = t + q * beat
                if tq >= end:
                    break
                if style["kick"] == "four" or q in (0, 2) and (style["kick"] != "half" or q == 0):
                    add(drums, K, tq, style["kgain"])
                if style["clap"] and q in (1, 3):
                    add(drums, C, tq, 0.3, pan=0.05)
                add(drums, hat(), tq + beat / 2, style["hat"], pan=0.25)
                if cfg["mood"] in ("drive", "hype"):
                    add(drums, hat(), tq + beat / 4, style["hat"] * 0.45, pan=-0.25)
                    add(drums, hat(), tq + 3 * beat / 4, style["hat"] * 0.45, pan=-0.25)
        t += bar
        b += 1

    # sidechain duck music/bass under kicks
    duck = np.ones(n)
    kicks = np.arange(first, end, beat if style["kick"] == "four" else beat * 2)
    for kt in kicks:
        i = int(kt * SR); m = min(int(0.22 * SR), n - i)
        if m > 0:
            duck[i:i + m] = np.minimum(duck[i:i + m], 0.72 + 0.28 * (np.arange(m) / m) ** 0.7)
    music *= duck; low *= duck

    # effects on cues
    add(fx, shimmer(root), 0.0, 1.0)
    for s in cues["scenes"][1:]:
        w = whoosh(0.6)
        add(fx, w, s - 0.55, 0.35, pan=0.2)
    add(fx, whoosh(1.4), end - 1.35, 0.4)
    add(fx, impact(), end, 0.7)
    for tp in cues["taps"]:
        add(fx, tick(), tp, 0.5, pan=-0.1)
    for ch in cues["chips"]:
        add(fx, chime(root), ch, 0.55, pan=0.15)
    for a, z in cues["rings"]:
        tt = a
        while tt < z:
            add(fx, alarm_beeps(), tt, 1.0)
            tt += 1.5

    # lift the intro (pads and arpeggio only) so it isn't much quieter than the body
    lift = np.ones(n)
    i0, i1 = int((first - 0.6) * SR), int((first + 0.2) * SR)
    lift[:i0] = 2.1
    lift[i0:i1] = np.linspace(2.1, 1.0, i1 - i0)
    music *= lift
    mix = drums + low + reverb(music, 0.25) + reverb(fx, 0.18)
    # fade out the tail
    fade = np.ones(n)
    fs = int((end + 2.0) * SR)
    if fs < n:
        fade[fs:] = np.linspace(1, 0, n - fs) ** 2
    mix *= fade
    mix /= np.percentile(np.abs(mix), 99.9) + 1e-9
    mix = np.tanh(mix * 0.8) / np.tanh(0.8)
    return (mix * 0.85).T


def write_wav(path, stereo):
    data = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == "__main__":
    name, cues_path, out = sys.argv[1:4]
    cfg = json.load(open(__file__.rsplit("/", 1)[0] + "/music.json"))[name]
    cues = json.load(open(cues_path))
    write_wav(out, compose(name, cues, cfg))
    print("wrote", out)
