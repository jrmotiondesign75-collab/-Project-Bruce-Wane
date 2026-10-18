// Courtside hype-edit engine: beat-locked rapid cuts with seamless, speed-ramped motion.
// An edit defines window.EDIT = { beats, duration, shots, end }. `beats` are the song's real beat
// times (seconds from the clip start), so every cut lands on the music even if the tempo drifts.
// Each shot spans [b0, b1) in beats and says how it enters (`tin`). render(t) is a pure function
// of t, so frames render deterministically.
//
// Seamless rule: a transition moves the outgoing and incoming shot in the SAME direction, with the
// outgoing one accelerating (ease-in) and the incoming one decelerating (ease-out), so the motion
// reads as one continuous camera move across the cut. Within a shot the camera follows a speed
// ramp (fast, slow, fast) so it hands its momentum to the next transition.

(function () {
  const W = 1080, H = 1920;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const inExpo = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, 10 * u - 10));
  const outExpo = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  const outCubic = (u) => 1 - Math.pow(1 - clamp(u), 3);
  // speed ramp: quick start, hang in the middle, quick finish
  const ramp = (u) => { u = clamp(u); const k = 2 * u - 1; return 0.5 + 0.5 * Math.sign(k) * Math.pow(Math.abs(k), 2.2) * 0.55 + 0.5 * k * 0.45; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function spring(t, response = 0.4, damping = 0.6) {
    if (t <= 0) return 0;
    const w = (2 * Math.PI) / response;
    if (damping >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
    const wd = w * Math.sqrt(1 - damping * damping);
    return 1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + ((damping * w) / wd) * Math.sin(wd * t));
  }
  const ICON = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M6 5.5c3 3 3 10 0 13M18 5.5c-3 3-3 10 0 13"/></svg>';

  window.startEdit = function (E) {
    const beats = E.beats;
    const period = (beats[beats.length - 1] - beats[0]) / (beats.length - 1);
    const bt = (b) => { // beat index (fractional) -> seconds
      const i = Math.floor(b);
      if (i < 0) return beats[0] + b * period;
      if (i >= beats.length - 1) return beats[beats.length - 1] + (b - beats.length + 1) * period;
      return lerp(beats[i], beats[i + 1], b - i);
    };
    const shots = E.shots.map((s, i) => ({ ...s, i, t0: bt(s.b0), t1: bt(s.b1) }));
    // half-length of each soft transition: 0.2 s, shortened between quick shots so they stay readable
    const TRb = shots.map((s, i) => (i === 0 ? 0.2 : Math.min(0.2, 0.3 * Math.min(s.t1 - s.t0, shots[i - 1].t1 - shots[i - 1].t0))));

    // ---------- build DOM ----------
    const st = document.getElementById("stage");
    let html = `<svg width="0" height="0" style="position:absolute"><defs>${shots.map((s) => `<filter id="mb${s.i}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur id="mbg${s.i}" stdDeviation="0 0"/></filter>`).join("")}</defs></svg><div class="world" id="world">`;
    shots.forEach((s) => {
      html += `<div class="shot bg-${s.bg || "dark"}" id="s${s.i}"><div class="glowbg"></div><div class="cam" id="c${s.i}">`;
      if (s.type === "device") html += `<div class="dev"><div class="island"></div><div class="scr"><img id="im${s.i}" src="../shots/${s.screen}.png"></div></div>`;
      if (s.type === "macro") html += `<div class="macro"><img id="im${s.i}" src="../shots/${s.screen}.png"></div>`;
      if (s.type === "type") {
        html += `<div class="type ${s.size || ""}">${s.lines.map((ln, li) => `<div class="ln ${ln.blue ? "blue" : ""}" id="l${s.i}_${li}">${[...ln.text].map((ch, ci) => `<span id="g${s.i}_${li}_${ci}"${ch === " " ? ' class="sp"' : ""}>${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("")}</div>`).join("")}</div>`;
        if (s.kicker) html += `<div class="kicker" id="k${s.i}">${esc(s.kicker)}</div>`;
      }
      if (s.type === "counter") html += `<div class="counter"><div class="cl" id="cl${s.i}">${esc(s.label)}</div><div class="cv" id="cv${s.i}"></div><div class="cs" id="cs${s.i}">${esc(s.sub || "")}</div></div>`;
      if (s.type === "stack") html += `<div class="stack">${s.screens.map((n, k) => `<div class="card" id="cd${s.i}_${k}"><img src="../shots/${n}.png"></div>`).join("")}</div>`;
      if (s.type === "ladder") html += `<div class="ladder">${s.items.map((it, k) => `<div class="rung" id="r${s.i}_${k}" style="--c:${it.color}"><span></span>${esc(it.text)}</div>`).join("")}</div>`;
      if (s.type === "end") html += `<div class="endc"><div class="mark" id="mk${s.i}">${ICON}</div><div class="word" id="wd${s.i}">Courtside</div><div class="line" id="ln${s.i}">${esc(s.line)}</div><div class="cta" id="ct${s.i}">${esc(s.cta)}<i id="sh${s.i}"></i></div><div class="fine" id="fn${s.i}">${esc(s.fine)}</div></div>`;
      html += `</div></div>`;
    });
    html += `</div><div class="flash" id="flash"></div><div class="vignette"></div>`;
    st.innerHTML = html;
    const $ = (id) => document.getElementById(id);

    // ---------- transitions ----------
    // Offsets for a shot at time t from its own entry (tin) and the next shot's entry (tout).
    const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    const inOutExpo = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2);
    // Soft transitions span [T - TR, T + TR] around the cut at T; u runs 0 -> 1 over that window.
    function trans(kind, phase, u) {
      u = clamp(u);
      const o = { x: 0, y: 0, s: 1, r: 0, op: 1 };
      const [name, dirName] = kind.split("-");
      const d = DIRS[dirName] || [-1, 0];
      if (name === "whip" || name === "spin") {
        // film strip: both shots travel along d together, accelerating into the cut and settling out of it
        const p = inOutExpo(u), k = phase === "out" ? p : p - 1;
        o.x = d[0] * W * 1.05 * k; o.y = d[1] * H * 1.05 * k;
        if (name === "spin") o.r = 32 * k * (d[0] || d[1]);
      } else if (name === "zoom") { // push through: outgoing grows past the camera, incoming grows in from far
        if (phase === "out") { const v = inExpo(clamp(u * 2)); o.s = 1 + 3.2 * v; o.op = u < 0.5 ? 1 - v * 0.6 : 0; }
        else { o.s = lerp(0.3, 1, outExpo(clamp(u * 2 - 1))); o.op = u < 0.5 ? 0 : 1; }
      } else if (name === "pull") { // pull back: outgoing shrinks away, incoming lands from oversized
        if (phase === "out") { const v = inExpo(clamp(u * 2)); o.s = 1 - 0.7 * v; o.op = u < 0.5 ? 1 : 0; }
        else { o.s = lerp(3.6, 1, outExpo(clamp(u * 2 - 1))); o.op = u < 0.5 ? 0 : 1; }
      }
      return o;
    }
    const isHard = (k) => !k || k === "cut" || k.startsWith("slam") || k.startsWith("flash");

    function shotXform(s, t) {
      const next = shots[s.i + 1];
      let x = 0, y = 0, sc = 1, r = 0, op = 1;
      const add = (o) => { x += o.x; y += o.y; sc *= o.s; r += o.r; op *= o.op; };
      if (s.i > 0) {
        const lt = t - s.t0;
        const TR = TRb[s.i];
        if (!isHard(s.tin)) { if (lt < TR) add(trans(s.tin, "in", (t - s.t0 + TR) / (2 * TR))); }
        else if (s.tin.startsWith("slam")) sc *= lerp(2.4, 1, spring(lt, 0.28, 0.55));
        else if (s.tin.startsWith("flash")) sc *= lerp(1.15, 1, outExpo(clamp(lt / 0.4)));
      }
      if (next) {
        const TR = TRb[next.i];
        if (!isHard(next.tin)) { if (t > s.t1 - TR) add(trans(next.tin, "out", (t - s.t1 + TR) / (2 * TR))); }
        else if (next.tin.startsWith("flash")) sc *= 1 + 0.15 * inExpo(clamp((t - s.t1 + 0.15) / 0.15));
      }
      return { x, y, sc, r, op };
    }
    function visible(s, t) {
      const next = shots[s.i + 1];
      const start = s.i === 0 ? -1 : s.t0 - (isHard(s.tin) ? 0 : TRb[s.i]);
      const stop = next ? next.t0 + (isHard(next.tin) ? 0 : TRb[next.i]) : 1e9;
      return t >= start && t < stop;
    }
    // inside-shot camera move, speed-ramped
    function camAt(s, t) {
      const u = ramp((t - s.t0) / (s.t1 - s.t0));
      const a = s.cam ? s.cam[0] : {}, b = s.cam ? s.cam[1] : {};
      const g = (k, d) => lerp(a[k] ?? d, b[k] ?? d, u);
      return { x: g("x", 0), y: g("y", 0), s: g("s", 1), rx: g("rx", 0), ry: g("ry", 0), r: g("r", 0) };
    }

    // ---------- per-type content animation ----------
    function content(s, t) {
      const lt = t - s.t0, dur = s.t1 - s.t0;
      if (s.type === "device" || s.type === "macro") {
        const im = $("im" + s.i);
        const u = ramp(lt / dur);
        if (s.type === "device") {
          const sc = s.scroll ? lerp(s.scroll[0], s.scroll[1], u) : 0;
          im.style.transform = `translateY(${-sc}px)`;
        } else {
          // macro: image fills the card at `zoom`, centred on focus (fx, fy), drifting from f0 to f1
          const f0 = s.focus[0], f1 = s.focus[1] || s.focus[0];
          const fx = lerp(f0[0], f1[0], u), fy = lerp(f0[1], f1[1], u);
          const z = lerp(s.zoom[0], s.zoom[1] ?? s.zoom[0], u);
          const iw = 940 * z, ih = iw * (1688 / 780);
          im.style.width = iw + "px";
          im.style.transform = `translate(${470 - fx * iw}px, ${800 - fy * ih}px)`;
        }
      }
      if (s.type === "type") {
        s.lines.forEach((ln, li) => {
          const start = (ln.at ?? li * 0.5) ; // in beats from shot start
          const ts = bt(s.b0 + start) - s.t0;
          const chars = [...ln.text];
          chars.forEach((_, ci) => {
            const el = $(`g${s.i}_${li}_${ci}`);
            const mode = s.anim || "rise";
            if (mode === "rise") {
              const a = outExpo(clamp((lt - ts - ci * 0.025) / 0.35));
              el.style.transform = `translateY(${(1 - a) * 120}%)`; el.style.opacity = a; el.style.filter = a < 0.98 ? `blur(${(1 - a) * 14}px)` : "none";
            } else if (mode === "slam") {
              el.style.opacity = lt >= ts ? 1 : 0;
            } else if (mode === "track") { // letters fly together from wide tracking
              const a = outExpo(clamp((lt - ts) / 0.6));
              const off = (ci - (chars.length - 1) / 2) * (1 - a) * 90;
              el.style.transform = `translateX(${off}px)`; el.style.opacity = clamp(a * 2); el.style.filter = a < 0.98 ? `blur(${(1 - a) * 18}px)` : "none";
            }
          });
          // `swap` lines replace each other: each shows from its start until the next one starts
          const lnEl = $(`l${s.i}_${li}`);
          if (s.swap) {
            const nx = li < s.lines.length - 1 ? bt(s.b0 + (s.lines[li + 1].at ?? (li + 1) * 0.5)) - s.t0 : 1e9;
            lnEl.style.display = lt >= ts && lt < nx ? "" : "none";
          }
          if ((s.anim || "rise") === "slam") { // the whole word slams in from oversized, settling with overshoot
            const a = spring(lt - ts, 0.3, 0.5);
            lnEl.style.transform = `scale(${lerp(2.6, 1, a)})`;
            lnEl.style.filter = lt - ts < 0.06 && lt >= ts ? "blur(8px)" : "none";
          }
        });
        if (s.kicker) { const a = outExpo(clamp((lt - 0.15) / 0.4)); const k = $("k" + s.i); k.style.opacity = a; k.style.transform = `translateY(${(1 - a) * 30}px)`; }
      }
      if (s.type === "counter") {
        const u = outExpo(clamp((lt - 0.05) / (dur * 0.8)));
        const v = Math.round(lerp(s.from, s.to, u));
        $("cv" + s.i).innerHTML = esc(s.prefix || "") + v.toLocaleString("en-US") + (s.suffix ? `<small>${esc(s.suffix)}</small>` : "");
        const p = spring(lt - dur * 0.8, 0.3, 0.45); // pop when it lands
        $("cv" + s.i).style.transform = `scale(${1 + 0.12 * Math.sin(Math.PI * clamp(p))})`;
      }
      if (s.type === "stack") { // coverflow: cards slide past centre, tilting away on each side
        const n = s.screens.length;
        const pos = ramp(lt / dur) * (n - 1) * (s.turn ?? 1);
        s.screens.forEach((_, k) => {
          const o = k - pos, a = Math.abs(o);
          const el = $(`cd${s.i}_${k}`);
          el.style.transform = `translate(-50%, -50%) translateX(${Math.sign(o) * Math.min(a, 1) * 380 + o * 170}px) translateZ(${-Math.min(a, 2.5) * 320}px) rotateY(${-Math.max(-1, Math.min(1, o)) * 52}deg)`;
          el.style.zIndex = 100 - Math.round(a * 10);
          el.style.filter = `brightness(${1 - Math.min(a, 2) * 0.28})`;
        });
      }
      if (s.type === "ladder") {
        s.items.forEach((_, k) => {
          const ts = bt(s.b0 + k * (s.step || 0.5)) - s.t0;
          const a = spring(lt - ts, 0.32, 0.6);
          const el = $(`r${s.i}_${k}`);
          el.style.opacity = lt >= ts ? 1 : 0;
          el.style.transform = `translateX(${(1 - a) * 700}px) skewX(${(1 - a) * -20}deg)`;
        });
      }
      if (s.type === "end") {
        const m = spring(lt, 0.45, 0.55);
        $("mk" + s.i).style.transform = `scale(${lerp(2.6, 1, m)}) rotate(${(1 - m) * -40}deg)`;
        const w = outExpo(clamp((lt - 0.25) / 0.6));
        $("wd" + s.i).style.cssText = `opacity:${w};letter-spacing:${lerp(0.4, -0.035, w)}em;filter:${w < 0.98 ? `blur(${(1 - w) * 16}px)` : "none"}`;
        const l = outExpo(clamp((lt - 0.55) / 0.5));
        $("ln" + s.i).style.cssText = `opacity:${l};transform:translateY(${(1 - l) * 30}px)`;
        const c = spring(lt - 0.8, 0.4, 0.6);
        $("ct" + s.i).style.cssText = `opacity:${clamp(c * 2)};transform:translateX(-50%) scale(${lerp(0.7, 1, c)})`;
        $("sh" + s.i).style.transform = `translateX(${lerp(-200, 900, clamp((lt - 1.4) / 0.9))}px) skewX(-20deg)`;
        $("fn" + s.i).style.opacity = outExpo(clamp((lt - 1.2) / 0.5));
      }
    }

    // ---------- global feel: beat pulse, shake, flash ----------
    const pulseFrom = E.pulseFrom ?? 0, pulseEvery = E.pulseEvery ?? 1;
    function pulse(t) {
      let v = 0;
      for (let b = pulseFrom; b < beats.length; b += pulseEvery) {
        const d = t - beats[b];
        if (d < 0) break;
        if (d < 0.5) v = Math.max(v, Math.exp(-d * 11) * (b % 4 === (E.downbeatPhase || 0) ? 1 : 0.55));
      }
      return t < bt(E.endAt ?? 1e9) ? v : 0;
    }
    const flashes = shots.filter((s) => s.tin && (s.tin.startsWith("flash") || s.tin.startsWith("slam"))).map((s) => ({ t: s.t0, k: s.tin.startsWith("flash") ? 1 : 0.55 }))
      .concat((E.strobes || []).map((b) => ({ t: bt(b), k: 0.8 })));
    const shakes = shots.filter((s) => s.tin && s.tin.startsWith("slam")).map((s) => s.t0).concat((E.shakes || []).map(bt));

    const prev = {};
    window.render = function (t) {
      const p = pulse(t);
      let sx = 0, sy = 0, sr = 0;
      shakes.forEach((t0) => { const d = t - t0; if (d > 0 && d < 0.35) { const a = Math.exp(-d * 12) * 26; sx += Math.sin(d * 97) * a; sy += Math.cos(d * 83) * a; sr += Math.sin(d * 61) * a * 0.04; } });
      $("world").style.transform = `translate(${sx}px, ${sy}px) rotate(${sr}deg) scale(${1 + 0.03 * p})`;
      let f = 0;
      flashes.forEach((fl) => { const d = t - fl.t; if (d >= -0.017 && d < 0.25) f = Math.max(f, fl.k * Math.exp(-Math.max(d, 0) * 16)); });
      $("flash").style.opacity = f;

      shots.forEach((s) => {
        const el = $("s" + s.i);
        if (!visible(s, t)) { el.style.display = "none"; return; }
        el.style.display = "block";
        const o = shotXform(s, t);
        // incoming shot stacks above outgoing during soft transitions
        el.style.zIndex = s.i;
        el.style.opacity = o.op;
        el.style.transform = `translate(${o.x}px, ${o.y}px) scale(${o.sc}) rotate(${o.r}deg)`;
        const c = camAt(s, t);
        $("c" + s.i).style.transform = `perspective(2200px) translate(${c.x}px, ${c.y}px) scale(${c.s}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotate(${c.r}deg)`;
        // directional motion blur from on-screen velocity (shot transform + camera)
        const key = s.i, dt = 1 / 60;
        const o2 = shotXform(s, t - dt), c2 = camAt(s, t - dt);
        const vx = (o.x + c.x - o2.x - c2.x), vy = (o.y + c.y - o2.y - c2.y);
        const vs = Math.abs(o.sc * c.s - o2.sc * c2.s) * 900 + Math.abs(o.r - o2.r) * 12;
        const vsb = Math.min(14, vs * 0.12);
        const bx = Math.min(60, Math.abs(vx) * 0.32 + vsb), by = Math.min(60, Math.abs(vy) * 0.32 + vsb);
        const tag = bx.toFixed(1) + " " + by.toFixed(1);
        if (prev[key] !== tag) { $("mbg" + s.i).setAttribute("stdDeviation", tag); prev[key] = tag; }
        el.style.filter = bx > 0.6 || by > 0.6 ? `url(#mb${s.i})` : "none";
        content(s, t);
      });
    };
    window.DURATION = E.duration;
    // cue sheet for the sound design: soft transitions get a whoosh, hard ones an impact
    window.CUES = {
      duration: E.duration,
      whoosh: shots.filter((s) => s.i > 0 && !isHard(s.tin)).map((s) => s.t0),
      impact: shots.filter((s) => s.i > 0 && isHard(s.tin) && s.tin !== "cut").map((s) => s.t0),
      end: shots[shots.length - 1].t0,
    };
    render(0);
  };
})();
