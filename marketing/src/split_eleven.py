"""Split one ElevenLabs take (whole ad script) into per-line WAVs at the longest pauses.
usage: python3 split_eleven.py <take.mp3> <ad> <out-dir>   (prints a fit report)"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf

src, ad, out = sys.argv[1:4]
lines = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "narration.json")))[ad]
SR = 44100
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()
hop = int(0.01 * SR)
rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
db = 20 * np.log10(rms + 1e-9)
thr = db.max() - 30
voiced = db > thr
# silent runs between first and last voiced frame
idx = np.flatnonzero(voiced); a0, a1 = idx[0], idx[-1]
gaps, i = [], a0
while i < a1:
    if not voiced[i]:
        j = i
        while j < a1 and not voiced[j]: j += 1
        gaps.append((j - i, i, j)); i = j
    else: i += 1
k = len(lines) - 1
def syl(t):
    t = t.lower().replace("xp", "ex pee").replace("ai ", "ay eye ")
    return sum(max(1, len(re.findall(r"[aeiouy]+", w.rstrip("e")) )) for w in re.findall(r"[a-z]+", t))
cand = [g for g in gaps if g[0] >= 3]  # any dip of 30 ms or more
speech = a1 + 1 - a0
exp = np.array([syl(t) + 1.6 * len(re.findall(r"[.,!?](?=\s)", t)) for _, t in lines], float); exp = exp / exp.sum()  # inner pauses take time too
# DP: choose k cuts (in order) minimising squared log error of each line's share, rewarding longer pauses
best = {}
def seg_cost(s, e, n):
    share = (e - s) / speech
    return np.log(share / exp[n]) ** 2
INF = 1e18
m = len(cand)
dp = [[INF] * (m + 1) for _ in range(k + 1)]; back = [[None] * (m + 1) for _ in range(k + 1)]
# dp[c][j]: placed c cuts, last cut is cand[j-1] (j=0 means none)
dp[0][0] = 0
for c in range(1, k + 1):
    for j in range(1, m + 1):
        g = cand[j - 1]
        for p in range(0, j):
            if dp[c - 1][p] >= INF: continue
            start = a0 if p == 0 else cand[p - 1][2]
            v = dp[c - 1][p] + seg_cost(start, g[1], c - 1) - 0.5 * min(g[0], 45) / 45
            if v < dp[c][j]: dp[c][j], back[c][j] = v, p
tot = [dp[k][j] + seg_cost(cand[j - 1][2], a1 + 1, k) if dp[k][j] < INF else INF for j in range(m + 1)]
j = int(np.argmin(tot)); cuts = []
for c in range(k, 0, -1):
    cuts.append(cand[j - 1]); j = back[c][j]
cuts = cuts[::-1]
bounds = [a0] + [c for g in cuts for c in (g[1], g[2])] + [a1 + 1]
segs = [(bounds[2 * n], bounds[2 * n + 1]) for n in range(len(lines))]
import os; os.makedirs(f"{out}/{ad}", exist_ok=True)
chars = np.array([len(t) for _, t in lines], float)
durs = np.array([(e - s) / 100 for s, e in segs])
ratio = durs / durs.sum() / exp
report = []
for n, ((s, e), (at, text)) in enumerate(zip(segs, lines)):
    pad = 4  # 40 ms each side
    s0, e0 = max(0, (s - pad) * hop), min(len(x), (e + pad) * hop)
    seg = x[s0:e0].copy()
    f = int(0.01 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    sf.write(f"{out}/{ad}/{n}.wav", seg, SR)
    nxt = lines[n + 1][0] if n + 1 < len(lines) else 99
    report.append(dict(line=n, text=text, dur=round(len(seg) / SR, 2), gap_to_next=round(nxt - at - len(seg) / SR, 2), len_ratio=round(float(ratio[n]), 2)))
cutgaps = [round(g[0] / 100, 2) for g in cuts]
nextbest = sorted(gaps, reverse=True)[k][0] / 100 if len(gaps) > k else 0
print(json.dumps(dict(src=src, cut_gaps=cutgaps, next_largest_gap=nextbest, lines=report), indent=1))
