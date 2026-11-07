// Piggy's Last Semester — engine (no dependencies)
(() => {
  const $ = id => document.getElementById(id);
  const CHOICE_SECONDS = 15;
  const LINE_MS = 2800;            // placeholder pacing per subtitle line
  const ENDINGS_KEY = "piggy.endings";

  let S;                           // game state
  let timers = [];                 // pending timeouts/intervals for the current clip
  let countdown = null;
  let clipVersion = 0;
  let audioContext;
  const player = document.createElement("video");
  player.playsInline = true;
  player.preload = "auto";
  const preloaders = new Map();
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const tx = value => typeof value === "object" && value ? value[language] || value.en || "" : value;
  let language = "en";
  const ui = (en, zh) => language === "zh" ? zh : en;
  function unlockAudio() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) {
        audioContext ||= new Audio();
        audioContext.resume().catch(() => {});
        const source = audioContext.createBufferSource();
        source.buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
        source.connect(audioContext.destination);
        source.start();
      }
    } catch { /* Silent media remains usable without Web Audio. */ }
  }
  function localMedia(path) {
    if (!path) return null;
    try {
      const url = new URL(path, location.href);
      return url.origin === location.origin ? url.href : null;
    } catch { return null; }
  }
  function preloadNext(n) {
    const ids = [...(n.choices || []).map(c => c.to), n.next, n.branch?.ifLost, n.branch?.else].filter(Boolean);
    const paths = new Set(ids.map(id => localMedia(STORY[id]?.media)).filter(Boolean));
    for (const [path, item] of preloaders) {
      if (!paths.has(path)) { item.remove(); if (item.tagName === "VIDEO") { item.removeAttribute("src"); item.load(); } preloaders.delete(path); }
    }
    for (const path of paths) {
      if (preloaders.has(path)) continue;
      const item = /\.(mp4|webm|mov)$/i.test(new URL(path).pathname) ? document.createElement("video") : new Image();
      if (item.tagName === "VIDEO") { item.preload = "auto"; item.muted = true; item.playsInline = true; }
      item.hidden = true; item.src = path;
      document.body.append(item); preloaders.set(path, item);
    }
  }

  const store = {
    get() { try { const saved = JSON.parse(localStorage.getItem(ENDINGS_KEY)); return Array.isArray(saved) ? [...new Set(saved.filter(id => STORY[id]?.ending))] : []; } catch { return []; } },
    add(id) { try { const s = new Set(store.get()); s.add(id); localStorage.setItem(ENDINGS_KEY, JSON.stringify([...s])); } catch {} }
  };
  const endingIds = Object.keys(STORY).filter(k => STORY[k].ending);

  function freshState() { return { node: null, money: START_MONEY, lost: false, recovered: false, flags: [], history: [], visited: new Set() }; }
  const snapshot = () => ({ node: S.node, money: S.money, lost: S.lost, recovered: S.recovered, flags: [...S.flags] });

  function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; stopCountdown(); }
  function show(el, on = true) { el.hidden = !on; }
  function fmt(n) { return n.toLocaleString("en-US"); }

  function updateHud(delta = 0) {
    $("hudMoney").textContent = fmt(S.money);
    $("hudFlags").textContent = S.flags.length;
    const pig = $("hudPig");
    pig.style.transform = `scale(${0.75 + 0.25 * Math.min(1, S.money / START_MONEY)})`;
    if (delta) { pig.classList.remove("hit", "gain"); void pig.offsetWidth; pig.classList.add(delta < 0 ? "hit" : "gain"); }
    if (delta < 0) setPig("fainted", 2000);
    else if (!setPig._lock) setPig(basePig());
  }
  // Piggy = live status meter: the pre-rendered video can't know the viewer's balance, the UI can.
  function basePig() { const r = S.money / START_MONEY; return r >= 0.8 ? "happy" : r >= 0.5 ? "worried" : "broke"; }
  function setPig(state, holdMs) {
    $("hudPig").src = `assets/piggy-${state}.svg`;
    if (holdMs) { clearTimeout(setPig._t); setPig._lock = true; setPig._t = setTimeout(() => { setPig._lock = false; $("hudPig").src = `assets/piggy-${basePig()}.svg`; }, holdMs); }
  }
  function moodOf(id) { return /^c1/.test(id) ? "ch1" : /^c2/.test(id) ? "ch2" : /^c3/.test(id) ? "ch3" : "home"; }
  function applyEffect(e) {
    if (!e) return;
    if (e.money) { S.money = Math.max(0, S.money + e.money); }
    if (e.lost) S.lost = true;
    if (e.recovered) S.recovered = true;
    updateHud(e.money || 0);
    if (e.money) toast(`${e.money > 0 ? "+" : "−"}HK$${fmt(Math.abs(e.money))} ${e.money > 0 ? "💰" : "💸"}`, e.money > 0 ? "var(--safe)" : "var(--alert)");
  }
  function toast(msg, color = "var(--alert)", ms = 2600) {
    const t = $("toast"); t.textContent = msg; t.style.background = color; show(t);
    clearTimeout(toast._t); toast._t = setTimeout(() => show(t, false), ms);
  }

  // ---------- navigation ----------
  function go(id) {
    const n = STORY[id];
    if (!n) { console.error("Missing node", id); return; }
    clearTimers();
    S.history.push({ entering: id, ...snapshot() });   // state right before entering `id`
    S.node = id;
    S.visited.add(id);
    applyEffect(n.enter);
    if (n.flag && !S.flags.includes(n.flag)) { S.flags.push(n.flag); setPig("cool", 2500); }
    document.body.dataset.mood = moodOf(id);
    updateHud();
    renderMap();
    if (n.ending) { store.add(id); renderMap(); }
    playClip(n);
  }

  function rewindTo(id) {
    for (let i = S.history.length - 1; i >= 0; i--) {
      const h = S.history[i];
      if (h.entering === id) {
        S.history = S.history.slice(0, i);
        Object.assign(S, { money: h.money, lost: h.lost, recovered: h.recovered, flags: [...h.flags] });
        toast("⏪ Rewinding… choose again.", "var(--lavender)");
        return go(id);
      }
    }
    go(id);
  }

  // ---------- clip playback ----------
  function playClip(n) {
    const version = ++clipVersion;
    let finished = false;
    player.pause(); player.onended = player.onerror = player.onloadedmetadata = null;
    ["startScreen", "endScreen", "choiceOverlay", "continueOverlay", "btnResume"].forEach(x => show($(x), false));
    show($("clip")); show($("btnSkip"));
    $("sceneTag").textContent = `${tx(n.chapter)} · ${tx(n.scene?.tag) || ""}`;
    $("subs").replaceChildren();
    $("progressBar").style.width = "0";
    renderPhone(n.phone);
    const media = $("media");
    media.replaceChildren();
    const active = () => version === clipVersion && !finished;
    const done = () => { if (!active()) return; finished = true; player.pause(); finishClip(n); };
    const duration = () => Math.max(Math.max(1, n.lines.length) * LINE_MS + 600,
      ...n.lines.map(line => Number.isFinite(line.t) ? line.t * 1000 + LINE_MS : 0));
    const placeholder = () => {
      if (!active()) return;
      clearTimers(); player.pause(); show($("btnResume"), false);
      const card = el("div", `placeholder ${n.scene?.glitch ? "glitch" : ""}`);
      card.style.background = `var(--mood-${moodOf(S.node)})`;
      card.append(el("div", "emoji", n.scene?.emoji || "🎬"), el("div", "kind", `${n.kind === "video" ? "🎬" : "🖼️"} ${tx(n.title)}`));
      media.replaceChildren(card);
      runSubsTimed(n.lines, duration(), done);
    };
    const path = localMedia(n.media);
    if (path && /\.(mp4|webm|mov)$/i.test(new URL(path).pathname)) {
      player.src = path;
      player.onerror = placeholder;
      player.onloadedmetadata = () => {
        if (active() && Number.isFinite(player.duration) && player.duration > 0) runSubsTimed(n.lines, player.duration * 1000, null, player);
      };
      player.onended = done;
      media.append(player);
      const play = () => player.play().then(() => { if (active()) show($("btnResume"), false); }).catch(() => {
        if (active()) show($("btnResume"));
      });
      $("btnResume").onclick = () => { unlockAudio(); play(); };
      play();
    } else if (path) {
      const img = new Image();
      img.className = "kenburns"; img.alt = tx(n.title);
      img.onerror = placeholder;
      img.onload = () => { if (active()) runSubsTimed(n.lines, duration(), done); };
      img.src = path; media.append(img);
    } else placeholder();
    preloadNext(n);
    $("btnSkip").onclick = () => { clearTimers(); show($("btnResume"), false); done(); };
  }

  // Optional t values are seconds. Untimed lines retain evenly spaced slots.
  function runSubsTimed(lines, total, onDone, video) {
    const subs = $("subs"), bar = $("progressBar");
    const cues = lines.map((line, i) => ({ line, at: Number.isFinite(line.t) && line.t >= 0 ? line.t * 1000 : i * total / Math.max(1, lines.length) }))
      .sort((a, b) => a.at - b.at);
    let shown = -1;
    const start = performance.now();
    const tick = () => {
      const t = video ? video.currentTime * 1000 : performance.now() - start;
      let idx = -1;
      cues.forEach((cue, i) => { if (t >= cue.at) idx = i; });
      if (idx !== shown) {
        shown = idx; subs.replaceChildren();
        if (cues[idx]) {
          const line = cues[idx].line, span = el("span", "sub");
          span.append(el("b", "", tx(line.who)), document.createTextNode(tx(line.text)));
          subs.append(span);
        }
      }
      bar.style.width = Math.min(100, t / total * 100) + "%";
      if (!video && t >= total) { clearInterval(iv); onDone?.(); }
    };
    const iv = setInterval(tick, 100); timers.push(iv); tick();
  }

  function renderPhone(p) {
    const box = $("phone");
    if (!p) { show(box, false); return; }
    box.className = "phone " + p.kind;
    box.replaceChildren(el("div", "from", `${p.kind === "call" ? ui("Incoming · ", "来电 · ") : ""}${tx(p.from)}`), el("div", "bubble", p.kind === "call" ? "📞" : tx(p.text)));
    show(box);
  }

  // ---------- after a clip ----------
  function finishClip(n) {
    clearTimers(); show($("btnSkip"), false);
    $("progressBar").style.width = "100%";
    if (n.ending) return showEnding(n);
    if (n.choices) return showChoices(n);
    // auto-continue
    const target = n.branch ? (S.lost ? n.branch.ifLost : n.branch.else) : n.next;
    const fe = $("flagEarned");
    if (n.flag) { const icon = el("img"); icon.src = "assets/icon-flag.svg"; icon.alt = ""; fe.replaceChildren(icon, el("span", "", ui("Red flag spotted: ", "已识别红旗：") + tx(n.flag))); fe.className = "flag-earned"; show(fe); } else show(fe, false);
    if (n.enter && n.enter.recovered) { fe.textContent = "🏦 Money frozen & recovered — because you spoke up fast"; fe.className = "flag-earned recovered"; show(fe); }
    show($("continueOverlay"));
    $("btnContinue").onclick = () => go(target);
    $("btnContinue").focus();
  }

  function showChoices(n) {
    const box = $("choices");
    box.replaceChildren();
    n.choices.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.append(el("span", "k", String.fromCharCode(65 + i)), document.createTextNode(tx(c.label)));
      b.onclick = () => choose(c);
      box.appendChild(b);
    });
    const fl = $("flagsList");
    fl.replaceChildren(...(n.redFlags || []).map(f => el("li", "", "🚩 " + tx(f))));
    show(fl, false);
    $("btnHint").hidden = !(n.redFlags && n.redFlags.length);
    $("btnHint").onclick = () => { show(fl, fl.hidden); pauseCountdown(); };
    show($("choiceOverlay"));
    if (!setPig._lock) setPig("worried");

    const pressure = $("pressure").checked && n.timeoutTo;
    show($("timer"), !!pressure);
    show($("timerText"), !!pressure);
    if (pressure) startCountdown(n);
  }

  function choose(c) {
    if ($("choiceOverlay").hidden) return;
    show($("choiceOverlay"), false);
    stopCountdown();
    applyEffect(c.effect);
    go(c.to);
  }

  function startCountdown(n) {
    let left = CHOICE_SECONDS;
    const bar = $("timerBar"), txt = $("timerText"), wrap = $("timer");
    wrap.classList.remove("paused");
    const spark = wrap.querySelector(".spark");
    const draw = () => { const pct = left / CHOICE_SECONDS * 100; bar.style.width = `calc(${pct}% - 4px)`; spark.style.left = pct + "%"; txt.textContent = `⏱ ${left}s — decide!`; };
    draw();
    countdown = { paused: false, iv: setInterval(() => {
      if (countdown.paused) return;
      left--; draw();
      if (left <= 0) {
        stopCountdown();
        toast("⏰ Time's up — panic chose for you. Scammers LOVE a ticking clock.", "var(--alert)", 3800);
        const c = n.choices.find(x => x.to === n.timeoutTo) || { to: n.timeoutTo };
        choose(c);
      }
    }, 1000) };
  }
  function pauseCountdown() {
    if (!countdown) return;
    countdown.paused = true;
    $("timer").classList.add("paused");
    $("timerText").textContent = "⏸ Paused — good instinct. Slowing down beats scammers.";
  }
  function stopCountdown() { if (countdown) { clearInterval(countdown.iv); countdown = null; } }

  // ---------- endings ----------
  function showEnding(n) {
    show($("clip"), false);
    const e = n.ending;
    const scr = $("endScreen");
    scr.className = "screen " + (e.good ? "good" : "bad");
    const unlocked = store.get();
    const card = $("endCard"); card.replaceChildren();
    const pig = el("img", "badge-pig");
    pig.src = `assets/piggy-${{end_slayer:"cool",end_comeback:"happy",end_dark:"fainted",end_faceswap:"broke"}[S.node] || "happy"}.svg`; pig.alt = "Piggy";
    const stats = el("div", "stats");
    stats.append(el("div", "stat", `🐷 HK$${fmt(S.money)} ${ui("left", "余额")}`), el("div", "stat", `🚩 ${S.flags.length} ${ui("red flags spotted", "个红旗")}`), el("div", "stat", `🏆 ${unlocked.length}/${endingIds.length} ${ui("endings found", "结局已解锁")}`));
    card.append(pig, el("div", "small", `${e.badge} ${ui("ENDING", "结局")} ${endingIds.indexOf(S.node) + 1} / ${endingIds.length}`), el("h2", "", tx(e.title)), el("p", "", tx(e.text)), stats);
    if (S.flags.length) { const list = el("ul"); list.append(...S.flags.map(f => el("li", "", tx(f)))); card.append(list); }
    const help = el("div", "help", ui("Real help in HK: ", "香港求助："));
    HELP_LINES.forEach((h, i) => { if (i) help.append(" · "); help.append(tx(h.label) + " ", el("b", "", h.value)); });
    const buttons = el("div", "btns");
    const button = (id, cls, text) => { const b = el("button", cls, text); b.id = id; buttons.append(b); };
    if (e.rewind) button("btnRewind", "primary", ui("⏪ Rewind to the last choice", "⏪ 倒带回到上个选择"));
    button("btnRestart", e.rewind ? "ghost" : "primary", ui("↻ Play again", "↻ 再玩一次"));
    button("btnMap2", "ghost", ui("🗺 See all paths", "🗺 查看全部路线"));
    card.append(help, buttons);
    show(scr);
    if (e.rewind) $("btnRewind").onclick = () => rewindTo(e.rewind);
    $("btnRestart").onclick = restart;
    $("btnMap2").onclick = toggleMap;
  }

  // ---------- map ----------
  const COL_W = 140, ROW_H = 78, NODE_W = 110, NODE_H = 46;
  function edgesOf(id) {
    const n = STORY[id], out = [];
    (n.choices || []).forEach(c => out.push([c.to, c.safe]));
    if (n.next) out.push([n.next, true]);
    if (n.branch) { out.push([n.branch.ifLost, true]); out.push([n.branch.else, true]); }
    return out;
  }
  function renderMap() {
    const map = $("map");
    const ids = Object.keys(STORY);
    const cols = Math.max(...ids.map(i => STORY[i].pos[0])) + 1;
    const rows = Math.max(...ids.map(i => STORY[i].pos[1])) + 1;
    map.style.width = cols * COL_W + "px"; map.style.height = rows * ROW_H + "px";
    const unlocked = new Set(store.get());
    const xy = id => [STORY[id].pos[0] * COL_W, STORY[id].pos[1] * ROW_H];
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", cols * COL_W); svg.setAttribute("height", rows * ROW_H);
    ids.forEach(id => edgesOf(id).forEach(([to, safe]) => {
      const [x1, y1] = xy(id), [x2, y2] = xy(to);
      const sx = x1 + NODE_W, sy = y1 + NODE_H / 2, ex = x2, ey = y2 + NODE_H / 2, mx = (sx + ex) / 2;
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex - 2},${ey}`);
      path.setAttribute("fill", "none"); path.setAttribute("stroke", safe ? "var(--safe)" : "var(--alert)");
      path.setAttribute("stroke-width", "2"); path.setAttribute("stroke-opacity", ".7");
      if (!safe) path.setAttribute("stroke-dasharray", "5 4");
      svg.append(path);
    }));
    map.replaceChildren(svg);
    ids.forEach(id => {
      const n = STORY[id], [x, y] = xy(id);
      const cls = ["node", n.kind === "image" ? "img" : "vid", S?.visited.has(id) ? "visited" : "", S?.node === id ? "current" : "", n.ending ? `end ${n.ending.good ? "good" : "bad"}` : "", n.ending && !unlocked.has(id) ? "locked" : ""].join(" ");
      const label = n.ending ? `${n.ending.badge} ${!unlocked.has(id) ? "???" : tx(n.title)}` : tx(n.title);
      const node = el("div", cls, label); node.title = id;
      node.style.left = x + "px"; node.style.top = y + "px"; map.append(node);
    });
  }

  function toggleMap() {
    const p = $("mapPanel"); show(p, p.hidden); renderMap();
    if (!p.hidden) p.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---------- boot ----------
  function restart() { unlockAudio(); clearTimeout(setPig._t); setPig._lock = false; clearTimers(); S = freshState(); updateHud(); go("intro"); }
  function boot() {
    S = freshState(); updateHud(); renderMap();
    const u = store.get().length;
    $("endingsUnlocked").textContent = u ? `🏆 You've found ${u} of ${endingIds.length} endings so far.` : `${endingIds.length} endings to discover.`;
    $("btnStart").onclick = restart;
    $("pressure").onchange = () => {
      stopCountdown();
      if (!$("choiceOverlay").hidden) {
        const n = STORY[S.node];
        const enabled = $("pressure").checked && !!n.timeoutTo;
        show($("timer"), enabled); show($("timerText"), enabled);
        if (enabled) { startCountdown(n); if (!$("flagsList").hidden) pauseCountdown(); }
      }
    };
    $("btnMap").onclick = toggleMap;
    $("btnCloseMap").onclick = toggleMap;
    document.addEventListener("keydown", e => {
      if ($("choiceOverlay").hidden) return;
      const i = e.key.toUpperCase().charCodeAt(0) - 65;
      const btns = $("choices").querySelectorAll(".choice");
      if (i >= 0 && i < btns.length && e.key.length === 1) btns[i].click();
    });
  }
  boot();
})();
