"""Beat tracker: spectral-flux onsets -> tempo (autocorrelation) -> beat phase (DP) -> bars.
usage: python3 beats.py song.mp3 out.json"""
import json, subprocess, sys
import numpy as np
from scipy.signal import stft, find_peaks
src, out = sys.argv[1:3]
SR = 22050
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
hop = 256
f, t, Z = stft(x, SR, nperseg=1024, noverlap=1024 - hop)
S = np.log1p(100 * np.abs(Z))
flux = np.maximum(0, np.diff(S, axis=1)).sum(0)
low = np.maximum(0, np.diff(S[f < 150], axis=1)).sum(0)  # kick band
fr = SR / hop
env = flux - np.convolve(flux, np.ones(int(fr)) / int(fr), "same"); env = np.maximum(env, 0); env /= env.max()
# tempo: autocorrelation weighted toward 70-160 bpm
ac = np.correlate(env, env, "full")[len(env) - 1:]
lags = np.arange(len(ac)); bpm = 60 * fr / np.maximum(lags, 1)
w = np.exp(-0.5 * (np.log2(bpm / 110) / 0.8) ** 2) * (bpm > 60) * (bpm < 190)
lag = np.argmax(ac * w)
# refine with parabolic interpolation
y0, y1, y2 = ac[lag - 1], ac[lag], ac[lag + 1]; lagf = lag + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)
period = lagf
# Produced tracks hold a fixed tempo, so fit one constant grid: search period and phase jointly
# around the autocorrelation estimate (and its 3/4, 4/3 relatives), scoring onset strength on the grid.
def grid_score(per):
    n_b = int((len(env) / fr - 1) / per)
    best = (-1, 0)
    for ph in np.arange(0, per, 0.005):
        idx = ((ph + per * np.arange(n_b)) * fr).astype(int)
        v = env[idx].mean() + 0.5 * env[np.clip(idx + 1, 0, len(env) - 1)].mean()
        if v > best[0]: best = (v, ph)
    return best
base = period / fr
cands = []
for mul in (1, 0.75, 4 / 3, 0.5, 2):
    for per in np.arange(base * mul * 0.94, base * mul * 1.06, 0.0005):
        if 60 / 190 < per < 60 / 60: cands.append(per)
scored = [(grid_score(p), p) for p in cands]
(sc, ph), per = max(scored, key=lambda z: z[0][0] * np.exp(-0.5 * (np.log2((60 / z[1]) / 110) / 1.0) ** 2))
period = per * fr
beats = ph + per * np.arange(int((len(x) / SR - ph) / per))
# downbeat phase: beat index mod 4 with most kick energy
lowe = np.array([low[int(b * fr) - 2:int(b * fr) + 3].sum() if int(b * fr) > 2 else 0 for b in beats])
phase = int(np.argmax([lowe[p::4].mean() for p in range(4)]))
rms = np.array([np.sqrt(np.mean(x[int(a * SR):int(b * SR)] ** 2)) for a, b in zip(beats[:-1], beats[1:])])
bars = beats[phase::4]
barloud = [float(20 * np.log10(rms[phase + 4 * k: phase + 4 * k + 4].mean() + 1e-9)) for k in range(len(bars) - 1)]
json.dump(dict(bpm=60 * fr / period, beats=beats.round(3).tolist(), downbeats=bars.round(3).tolist(), bar_db=[round(v, 1) for v in barloud],
               onsets=(find_peaks(env, height=0.25, distance=int(fr * 0.08))[0] / fr).round(3).tolist(), duration=len(x) / SR), open(out, "w"))
print(src, "bpm %.2f" % (60 * fr / period), "beats", len(beats), "phase", phase)
print(" bars(start s: dB):", " ".join(f"{b:.1f}:{d:.0f}" for b, d in zip(bars, barloud)))
