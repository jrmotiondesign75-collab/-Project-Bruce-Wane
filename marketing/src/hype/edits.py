#!/usr/bin/env python3
"""Hype-edit timelines (in beats) and the builder that locks them to each song's beat grid.

usage: python3 edits.py <beats-dir> <out-dir>
  <beats-dir> holds <song>.beats.json from beats.py. Writes <out-dir>/<edit>.html and
  <out-dir>/<edit>.clip.json (song file, clip start and length for the audio mux).
"""
import json
import os
import sys

TIERS = [("Bronze", "#b0703c"), ("Silver", "#a8b0bd"), ("Gold", "#e3b341"), ("Platinum", "#5ac8fa"), ("Diamond", "#7d7aff"), ("Legend", "#ff375f")]


def L(text, at=None, blue=False):
    d = {"text": text, "blue": blue}
    if at is not None:
        d["at"] = at
    return d


EDITS = {
    # 90.5 BPM. Strings build for 8 beats, drums drop on beat 8.
    "hype1-flashing": dict(song="flashing", anchor=(27.077, 8), beats=32, pulseFrom=8, endAt=28, strobes=[7, 7.5], shots=[
        dict(b0=0, b1=4, type="type", anim="track", lines=[L("You've got", 0), L("the game.", 1.5, True)], cam=[{"s": 0.96}, {"s": 1.06}]),
        dict(b0=4, b1=8, type="macro", tin="zoom", screen="home-after", focus=[[0.5, 0.16], [0.5, 0.33]], zoom=[1.55, 1.95], cam=[{"ry": -8}, {"ry": 6, "s": 1.04}]),
        dict(b0=8, b1=10, type="device", tin="slam", screen="quiz", cam=[{"s": 1.12, "ry": -22, "rx": 6}, {"s": 0.9, "ry": 14, "rx": -4}]),
        dict(b0=10, b1=11, type="type", tin="whip-left", bg="light", anim="slam", lines=[L("Answer.", 0)]),
        dict(b0=11, b1=12, type="type", tin="whip-up", bg="blue", anim="slam", lines=[L("Build.", 0)]),
        dict(b0=12, b1=14, type="macro", tin="zoom", screen="plan", focus=[[0.5, 0.1], [0.5, 0.3]], zoom=[2.0, 1.6]),
        dict(b0=14, b1=16, type="device", tin="whip-left", screen="train", cam=[{"r": -9, "s": 0.95}, {"r": 7, "s": 1.06}]),
        dict(b0=16, b1=17, type="macro", tin="whip-up", screen="drill-library", focus=[[0.5, 0.33]], zoom=[2.2, 2.6]),
        dict(b0=17, b1=18, type="macro", tin="whip-up", screen="result", focus=[[0.5, 0.31]], zoom=[2.5, 2.1]),
        dict(b0=18, b1=20, type="counter", tin="flash", label="Season XP", from_=0, to=1572, suffix=" XP", sub="Every rep counts."),
        dict(b0=20, b1=22, type="macro", tin="spin-left", screen="levelup", focus=[[0.5, 0.5]], zoom=[2.3, 1.9]),
        dict(b0=22, b1=24, type="stack", tin="pull", screens=["ranks", "home-after", "coach", "sleep", "fuel"], turn=0.6),
        dict(b0=24, b1=26, type="type", tin="whip-right", size="md", lines=[L("Your game.", 0), L("Your program.", 0.75, True)]),
        dict(b0=26, b1=32, type="end", tin="flash", line="Your personal basketball program.", cta="Start your program", fine="Train · Learn · Fuel · Sleep · Rank up"),
    ]),
    # 97.5 BPM. Wake-up / discipline. Hard cuts from the first bar.
    "hype2-mist": dict(song="mist", start=1.1, beats=36, pulseFrom=2, endAt=32, shakes=[2.5, 3, 3.5], shots=[
        dict(b0=0, b1=2, type="type", anim="slam", size="xl", lines=[L("6:15", 0)], kicker="AM · Rise & grind"),
        dict(b0=2, b1=4, type="device", tin="zoom", screen="alarm-ring", cam=[{"s": 1.15, "rx": 8}, {"s": 0.94, "rx": -4}]),
        dict(b0=4, b1=5, type="macro", tin="whip-up", screen="alarm-ring", focus=[[0.5, 0.36]], zoom=[2.4, 2.9]),
        dict(b0=5, b1=6, type="type", tin="flash", bg="light", anim="slam", lines=[L("Rise.", 0)]),
        dict(b0=6, b1=7, type="type", tin="cut", bg="blue", anim="slam", lines=[L("Grind.", 0)]),
        dict(b0=7, b1=9, type="device", tin="whip-left", screen="alarm-challenge", cam=[{"ry": 18, "s": 1.05}, {"ry": -10, "s": 0.95}]),
        dict(b0=9, b1=10, type="macro", tin="zoom", screen="alarm-solved", focus=[[0.5, 0.66], [0.5, 0.6]], zoom=[2.2, 2.5]),
        dict(b0=10, b1=12, type="counter", tin="slam", label="Up on time", from_=0, to=10, prefix="+", suffix=" XP", sub="Early Bird badge unlocked"),
        dict(b0=12, b1=15, type="stack", tin="whip-right", screens=["alarms", "alarm-editor", "sleep", "alarm-ring"], turn=1),
        dict(b0=15, b1=17, type="device", tin="pull", screen="sleep", cam=[{"s": 0.95, "r": 6}, {"s": 1.05, "r": -4}]),
        dict(b0=17, b1=18, type="macro", tin="whip-up", screen="sleep", focus=[[0.55, 0.8], [0.42, 0.8]], zoom=[1.7, 2.0]),
        dict(b0=18, b1=19, type="type", tin="flash", anim="slam", lines=[L("Study.", 0)]),
        dict(b0=19, b1=20, type="type", tin="cut", bg="light", anim="slam", lines=[L("Train.", 0)]),
        dict(b0=20, b1=22, type="device", tin="whip-left", screen="learn", cam=[{"ry": -16}, {"ry": 12}]),
        dict(b0=22, b1=23, type="macro", tin="zoom", screen="lesson", focus=[[0.5, 0.2], [0.5, 0.34]], zoom=[1.9, 1.9]),
        dict(b0=23, b1=25, type="device", tin="spin-right", screen="lesson-quiz", cam=[{"s": 1.1}, {"s": 0.95}]),
        dict(b0=25, b1=28, type="type", tin="whip-up", anim="slam", swap=True, lines=[L("Every.", 0), L("Single.", 1), L("Day.", 2, True)]),
        dict(b0=28, b1=36, type="end", tin="flash", line="Wake up. Show up.", cta="Set your first alarm", fine="Courtside · Your personal basketball program"),
    ]),
    # 148 BPM (8th-note grid). Instrumental intro builds; vocals hit on beat 12.
    "hype3-needit": dict(song="needit", anchor=(13.76, 12), div=2, beats=52, pulseFrom=12, pulseEvery=2, endAt=48, strobes=[11, 11.5], shots=[
        dict(b0=0, b1=4, type="type", anim="track", size="md", lines=[L("Who's putting", 0), L("in the work?", 1.5, True)]),
        dict(b0=4, b1=8, type="macro", tin="zoom", screen="ranks-board", focus=[[0.5, 0.25], [0.5, 0.55]], zoom=[1.5, 1.8], cam=[{"ry": 8}, {"ry": -6}]),
        dict(b0=8, b1=12, type="ladder", tin="whip-up", items=[{"text": n, "color": c} for n, c in TIERS], step=0.5),
        dict(b0=12, b1=14, type="device", tin="slam", screen="ranks", cam=[{"s": 1.15, "ry": -16}, {"s": 0.92, "ry": 10}]),
        dict(b0=14, b1=16, type="macro", tin="whip-left", screen="levelup", focus=[[0.5, 0.5]], zoom=[2.4, 2.0]),
        dict(b0=16, b1=18, type="counter", tin="flash", label="Level up", from_=10, to=11, prefix="LVL ", sub="Silver I · keep climbing"),
        dict(b0=18, b1=19, type="macro", tin="whip-up", screen="coach", focus=[[0.5, 0.4]], zoom=[2.2, 2.5]),
        dict(b0=19, b1=20, type="macro", tin="whip-up", screen="fuel", focus=[[0.5, 0.14]], zoom=[2.4, 2.1]),
        dict(b0=20, b1=21, type="macro", tin="whip-up", screen="train", focus=[[0.5, 0.2]], zoom=[2.3, 2.6]),
        dict(b0=21, b1=22, type="macro", tin="whip-up", screen="sleep", focus=[[0.5, 0.8]], zoom=[2.0, 1.8]),
        dict(b0=22, b1=24, type="type", tin="flash", bg="light", anim="slam", swap=True, lines=[L("Train.", 0), L("Learn.", 1)]),
        dict(b0=24, b1=26, type="type", tin="cut", bg="blue", anim="slam", swap=True, lines=[L("Fuel.", 0), L("Rank up.", 1)]),
        dict(b0=26, b1=28, type="device", tin="whip-left", screen="coach", cam=[{"ry": 16}, {"ry": -12}]),
        dict(b0=28, b1=30, type="device", tin="spin-left", screen="fuel-meals", scroll=[0, 240]),
        dict(b0=30, b1=32, type="device", tin="zoom", screen="result", cam=[{"s": 1.12}, {"s": 0.95}]),
        dict(b0=32, b1=36, type="stack", tin="pull", screens=["ranks-board", "coach", "fuel", "learn", "sleep", "train"], turn=1),
        dict(b0=36, b1=40, type="type", tin="whip-up", size="md", lines=[L("All in", 0), L("one app.", 1, True)]),
        dict(b0=40, b1=52, type="end", tin="flash", line="Your personal basketball program.", cta="Start climbing", fine="Train · Learn · Fuel · Sleep · Rank up"),
    ]),
}

PAGE = """<!doctype html>
<html><head><meta charset="utf-8"><title>Courtside – {name}</title><link rel="stylesheet" href="hype.css"></head>
<body><div class="stage" id="stage"></div>
<script src="hype.js"></script>
<script>window.EDIT = {edit}; startEdit(window.EDIT);</script>
</body></html>
"""


def build(name, e, beats_dir, out_dir):
    bj = json.load(open(f"{beats_dir}/{e['song']}.beats.json"))
    beats = bj["beats"]
    div = e.get("div", 1)  # subdivide the grid (2 = cut on half-beats of a half-time feel)
    if div > 1:
        beats = [a + (b - a) * k / div for a, b in zip(beats, beats[1:]) for k in range(div)]
    if "anchor" in e:  # (song time, edit beat): lock that edit beat to a moment in the song, e.g. the drop
        at, k = e["anchor"]
        i0 = min(range(len(beats)), key=lambda i: abs(beats[i] - at)) - k
    else:  # start on the downbeat nearest `start`
        t_start = min(bj["downbeats"], key=lambda d: abs(d - e["start"]))
        i0 = min(range(len(beats)), key=lambda i: abs(beats[i] - t_start))
    t0 = beats[i0]
    rel = [round(b - t0, 4) for b in beats[i0:i0 + e["beats"] + 4]]
    duration = round(rel[e["beats"]], 3)
    shots = []
    for s in e["shots"]:
        s = dict(s)
        if "from_" in s:
            s["from"] = s.pop("from_")
        shots.append(s)
    edit = dict(beats=rel, duration=duration, shots=shots, pulseFrom=e.get("pulseFrom", 0), pulseEvery=e.get("pulseEvery", 1),
                endAt=e.get("endAt"), strobes=e.get("strobes", []), shakes=e.get("shakes", []), downbeatPhase=0)
    open(f"{out_dir}/{name}.html", "w").write(PAGE.format(name=name, edit=json.dumps(edit)))
    json.dump(dict(song=e["song"], start=t0, duration=duration), open(f"{out_dir}/{name}.clip.json", "w"))
    print(f"{name}: clip {t0:.3f}s + {duration:.2f}s, {len(shots)} shots, bpm {bj['bpm']:.1f}")


if __name__ == "__main__":
    beats_dir, out_dir = sys.argv[1:3]
    os.makedirs(out_dir, exist_ok=True)
    for name, e in EDITS.items():
        build(name, e, beats_dir, out_dir)
