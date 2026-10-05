// Courtside ad engine. Each ad defines window.AD = { duration, intro, scenes, outro } and
// the engine draws any time t as a pure function, so frames render deterministically.
// Motion uses springs described Apple's way (response + damping ratio). Springs are linear,
// so retargeting is a sum of step responses: value(t) = Σ Δtarget_i · spring(t − t_i).

(function () {
  const W = 1080;
  const SCREEN_W = 604; // inner screen width of the phone, px
  const SCREEN_H = 1320;

  function spring(t, response = 0.5, damping = 1) {
    if (t <= 0) return 0;
    const w = (2 * Math.PI) / response;
    if (damping >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
    const wd = w * Math.sqrt(1 - damping * damping);
    return 1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + ((damping * w) / wd) * Math.sin(wd * t));
  }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // Value that springs between targets: events = [{ at, to }], starting at `from`
  function sprung(t, from, events, response = 0.6, damping = 1) {
    let v = from, prev = from;
    for (const e of events) {
      v += (e.to - prev) * spring(t - e.at, e.response || response, e.damping || damping);
      prev = e.to;
    }
    return v;
  }

  const ICON = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" class="ball"/><path class="seams" d="M3 12h18M12 3v18M6 5.5c3 3 3 10 0 13M18 5.5c-3 3-3 10 0 13"/></svg>';

  function build(AD) {
    const st = document.getElementById("stage");
    let html = `<div class="glow layer" id="glow"></div>
      <div class="logo layer" id="logo"><div class="mark" id="mark">${ICON}</div><div class="word" id="word">Courtside</div><div class="tag" id="tag">${esc(AD.intro.line)}</div></div>`;
    AD.scenes.forEach((s, i) => {
      if (s.title) html += `<div class="cap layer ${s.type === "type" ? "cap-type" : ""}" id="cap${i}">${esc(s.title[0])}<br><span class="blue">${esc(s.title[1])}</span></div>`;
      if (s.sub) html += `<div class="sub layer ${s.type === "type" ? "sub-type" : ""}" id="sub${i}">${esc(s.sub)}</div>`;
      (s.chips || []).forEach((c, j) => {
        html += `<div class="chip layer ${c.xp ? "xp" : ""} ${c.dot ? "dotted" : ""}" id="ch${i}_${j}" ${c.dot ? `style="--dot:${c.dot}"` : ""}>${c.small ? `<small>${esc(c.small)}</small>` : ""}${esc(c.text)}</div>`;
      });
      if (s.tiers) html += `<div class="tiers layer" id="tiers${i}">${s.tiers.map((t, k) => `<div class="tier" id="tier${i}_${k}" style="--c:${t.color}"><span></span><b>${esc(t.name)}</b></div>`).join("")}</div>`;
      if (s.grid) html += `<div class="fgrid layer" id="grid${i}">${s.grid.map((g, k) => `<div class="fcell" id="cell${i}_${k}" style="--c:${g.color}"><i>${g.icon}</i><b>${esc(g.label)}</b><small>${esc(g.sub)}</small></div>`).join("")}</div>`;
    });
    const screens = [...new Set(AD.scenes.flatMap((s) => [s.screen, s.swap && s.swap.to]).filter(Boolean))];
    html += `<div class="phone layer" id="phone"><div class="island"></div><div class="screen" id="screen">
      ${screens.map((n) => `<img id="img_${n}" src="shots/${n}.png" alt="">`).join("")}
      <div class="taps" id="taps"></div></div></div>`;
    html += `<div class="cta layer" id="cta">${esc(AD.outro.cta)}</div><div class="fine layer" id="fine">${esc(AD.outro.fine)}</div>`;
    st.innerHTML = html;
    // tap ripples
    const taps = document.getElementById("taps");
    AD.scenes.forEach((s, i) => (s.taps || []).forEach((tp, j) => {
      const d = document.createElement("span");
      d.className = "tap";
      d.id = `tap${i}_${j}`;
      d.style.left = tp.x * 100 + "%";
      d.style.top = tp.y * 100 + "%";
      taps.appendChild(d);
    }));
    return screens;
  }

  function set(el, { x = 0, y = 0, s = 1, o = 1, blur = 0, r = 0, base = "" } = {}) {
    if (!el) return;
    el.style.opacity = o;
    el.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
    el.style.transform = `${base}translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
  }
  const $ = (id) => document.getElementById(id);

  window.startAd = function (AD) {
    const screens = build(AD);
    const scenes = AD.scenes;
    const end = AD.outro.at;
    const introEnd = AD.intro.until;

    // Phone visibility: hidden during intro, "type" scenes and the outro
    const phoneEvents = [];
    let shown = 0;
    scenes.forEach((s) => {
      const want = s.type === "type" ? 0 : 1;
      if (want !== shown) { phoneEvents.push({ at: s.at, to: want, response: 0.75 }); shown = want; }
    });
    if (shown) phoneEvents.push({ at: end - 0.1, to: 0, response: 0.6 });

    // Screen order for pushes: each change pushes the new one in from the right
    const pushes = [];
    let cur = null;
    scenes.forEach((s) => {
      if (s.screen && s.screen !== cur) { pushes.push({ name: s.screen, at: s.at + (s.pushDelay || 0) }); cur = s.screen; }
      if (s.swap) pushes.push({ name: s.swap.to, at: s.swap.at, fade: true });
    });

    window.render = function (t) {
      set($("glow"), { x: Math.sin(t * 0.35) * 80, y: Math.cos(t * 0.27) * 60 - 200 + t * 6 });

      // ---- Intro + outro logo ----
      const inA = spring(t - 0.15, 0.6, 0.8);
      const out = ease((t - (introEnd - 0.45)) / 0.5);
      const ball = document.querySelector(".ball"), seams = document.querySelector(".seams");
      if (t < end) {
        set($("logo"), { y: -out * 60, o: 1 - out, s: 1 - out * 0.06, blur: out * 10 });
        set($("mark"), { s: 0.6 + 0.4 * inA, o: clamp(inA * 1.5) });
        ball.style.strokeDasharray = 57; ball.style.strokeDashoffset = 57 * (1 - ease((t - 0.3) / 0.9));
        seams.style.strokeDasharray = 80; seams.style.strokeDashoffset = 80 * (1 - ease((t - 0.5) / 0.9));
        const w = spring(t - 0.5, 0.6, 1), g = spring(t - 0.85, 0.6, 1);
        set($("word"), { y: (1 - w) * 50, o: clamp(w), blur: (1 - clamp(w)) * 12 });
        set($("tag"), { y: (1 - g) * 40, o: clamp(g), blur: (1 - clamp(g)) * 10 });
      } else {
        const a = spring(t - end, 0.6, 1);
        set($("logo"), { y: (1 - a) * 60 - 120, o: clamp(a) });
        set($("mark"), { s: 0.6 + 0.4 * spring(t - end, 0.6, 0.8), o: 1 });
        ball.style.strokeDashoffset = 0; seams.style.strokeDashoffset = 0;
        set($("word"), { o: 1 });
        const g = spring(t - end - 0.25, 0.6, 1);
        $("tag").textContent = AD.outro.line || AD.intro.line;
        set($("tag"), { o: clamp(g), y: (1 - g) * 30 });
      }
      const c = spring(t - end - 0.2, 0.6, 0.85);
      set($("cta"), { base: "translateX(-50%) ", y: (1 - c) * 60, s: 0.9 + 0.1 * c, o: t >= end ? clamp(c * 1.3) : 0 });
      set($("fine"), { o: t >= end ? clamp(spring(t - end - 0.6, 0.6, 1)) : 0 });

      // ---- Phone ----
      const vis = sprung(t, 0, phoneEvents);
      const float = Math.sin(t * 1.1) * 6;
      let shake = 0;
      scenes.forEach((s) => { if (s.shake && t > s.shake[0] && t < s.shake[1]) shake = Math.sin(t * 90) * 7 * (Math.floor(t * 4) % 2 ? 1 : 0.3); });
      set($("phone"), { x: shake, y: (1 - vis) * 1600 + float, s: 0.92 + 0.08 * vis, o: vis > 0.002 ? 1 : 0 });

      // ---- Screens (iOS push, or crossfade for swaps) ----
      pushes.forEach((p, i) => {
        const next = pushes[i + 1];
        const el = $("img_" + p.name);
        const enter = i === 0 ? 1 : spring(t - p.at, 0.55, 1);
        const leave = next && !next.fade ? spring(t - next.at, 0.55, 1) : 0;
        const fadeOut = next && next.fade ? clamp((t - next.at) / 0.35) : 0;
        if (t < p.at - 0.001 && i > 0) { el.style.opacity = 0; return; }
        const sc = scenes.find((s) => s.screen === p.name && s.scroll);
        let scroll = 0;
        if (sc) scroll = -sc.scroll.px * ease((t - sc.scroll.at) / sc.scroll.dur);
        const fadeIn = p.fade ? clamp((t - p.at) / 0.35) : 1;
        el.style.transform = `translate(${p.fade ? 0 : (1 - enter) * 100 - leave * 30}%, ${scroll}px)`;
        el.style.opacity = fadeIn * (1 - fadeOut) * (1 - leave * 0.4);
        el.style.zIndex = i;
      });

      // ---- Per-scene captions, chips, taps, extras ----
      scenes.forEach((s, i) => {
        const stop = s.until;
        const title = (el, delay) => {
          const a = spring(t - s.at - delay, 0.6, 1), b = ease((t - stop + 0.3) / 0.45);
          set(el, { y: (1 - a) * 60 - b * 40, o: clamp(a) * (1 - b), blur: (1 - clamp(a)) * 14 + b * 10 });
        };
        title($("cap" + i), 0.1);
        title($("sub" + i), 0.35);
        (s.chips || []).forEach((cp, j) => {
          const el = $(`ch${i}_${j}`);
          const a = spring(t - cp.at, 0.55, 0.78), b = ease((t - (cp.until || stop - 0.3)) / 0.35);
          const rise = cp.rise ? ease((t - cp.at) / 2) * cp.rise : 0;
          el.style.left = cp.x + "px";
          el.style.top = cp.y - rise + "px";
          set(el, { y: (1 - a) * 50, s: 0.86 + 0.14 * a - b * 0.06, o: clamp(a * 1.4) * (1 - b) });
        });
        (s.taps || []).forEach((tp, j) => {
          const el = $(`tap${i}_${j}`);
          const k = (t - tp.at) / 0.6;
          el.style.opacity = k > 0 && k < 1 ? (1 - k) * 0.55 : 0;
          el.style.transform = `translate(-50%, -50%) scale(${0.3 + ease(k) * 1.1})`;
        });
        if (s.tiers) {
          const box = $("tiers" + i);
          const b = ease((t - stop + 0.3) / 0.4);
          set(box, { o: t >= s.at ? 1 - b : 0, y: -b * 30 });
          s.tiers.forEach((tr, k) => {
            const a = spring(t - s.at - 0.5 - k * 0.22, 0.5, 0.8);
            set($(`tier${i}_${k}`), { y: (1 - a) * 60, o: clamp(a * 1.3), s: 0.8 + 0.2 * a });
          });
        }
        if (s.grid) {
          const box = $("grid" + i);
          const b = ease((t - stop + 0.3) / 0.4);
          set(box, { o: t >= s.at ? 1 - b : 0 });
          s.grid.forEach((g, k) => {
            const a = spring(t - s.at - 0.45 - k * 0.15, 0.55, 0.8);
            set($(`cell${i}_${k}`), { y: (1 - a) * 60, o: clamp(a * 1.3), s: 0.85 + 0.15 * a });
          });
        }
      });
    };
    window.DURATION = AD.duration;
    window.CUES = { scenes: scenes.map((s) => s.at), end, taps: scenes.flatMap((s) => (s.taps || []).map((tp) => tp.at)), chips: scenes.flatMap((s) => (s.chips || []).filter((c) => c.xp).map((c) => c.at)), rings: scenes.filter((s) => s.shake).map((s) => s.shake) };
    render(0);
  };
})();
