// Piggy's Last Semester — engine (no dependencies)
(() => {
  const $ = id => document.getElementById(id);
  const CHOICE_SECONDS = 15;
  const LINE_MS = 2800;            // placeholder pacing per subtitle line
  const ENDINGS_KEY = "piggy.endings";

  let S;                           // game state
  let timers = [];                 // pending timeouts/intervals for the current clip
  let countdown = null;

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(ENDINGS_KEY)) || []; } catch { return []; } },
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
    if (e.money) toast(`${e.money > 0 ? "+" : "−"}HK$${fmt(Math.abs(e.money))} ${e.money > 0 ? "💰" : "💸"}`, e.money > 0 ? "#2bb673" : "#e5484d");
  }
  function toast(msg, color = "#e5484d", ms = 2600) {
    const t = $("toast"); t.textContent = msg; t.style.background = color; show(t);
    clearTimeout(toast._t); toast._t = setTimeout(() => show(t, false), ms);
  }

  // ---------- navigation ----------
  function go(id, opts = {}) {
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
    if (n.ending) { store.add(id); }
    playClip(n);
  }

  function rewindTo(id) {
    for (let i = S.history.length - 1; i >= 0; i--) {
      const h = S.history[i];
      if (h.entering === id) {
        S.history = S.history.slice(0, i);
        Object.assign(S, { money: h.money, lost: h.lost, recovered: h.recovered, flags: [...h.flags] });
        toast("⏪ Rewinding… choose again.", "#7a5aa8");
        return go(id);
      }
    }
    go(id);
  }

  // ---------- clip playback ----------
  function playClip(n) {
    ["startScreen", "endScreen", "choiceOverlay", "continueOverlay"].forEach(x => show($(x), false));
    show($("clip"));
    $("sceneTag").textContent = `${n.chapter} · ${n.scene?.tag || ""}`;
    $("subs").innerHTML = "";
    $("progressBar").style.width = "0";
    renderPhone(n.phone);

    const media = $("media");
    media.innerHTML = "";
    const done = () => finishClip(n);

    const placeholder = () => {
      media.innerHTML = `<div class="placeholder ${n.scene?.glitch ? "glitch" : ""}" style="background:${n.scene?.bg || "#333"}">
        <div class="emoji">${n.scene?.emoji || "🎬"}</div>
        <div class="kind">${n.kind === "video" ? "🎬 video clip goes here" : "🖼️ image clip goes here"} · ${n.title}</div></div>`;
      const total = Math.max(1, n.lines.length) * LINE_MS + 600;
      runSubsTimed(n.lines, total, done);
    };

    if (n.media && /\.(mp4|webm|mov)$/i.test(n.media)) {
      const v = document.createElement("video");
      Object.assign(v, { src: n.media, autoplay: true, playsInline: true, preload: "auto" });
      v.addEventListener("error", placeholder, { once: true });
      v.addEventListener("loadedmetadata", () => runSubsTimed(n.lines, v.duration * 1000, null, v), { once: true });
      v.addEventListener("ended", done, { once: true });
      media.appendChild(v);
      v.play().catch(() => {});
    } else if (n.media) {
      const img = new Image();
      img.className = "kenburns"; img.src = n.media; img.alt = n.title;
      img.onerror = placeholder;
      img.onload = () => runSubsTimed(n.lines, Math.max(1, n.lines.length) * LINE_MS + 600, done);
      media.appendChild(img);
    } else placeholder();

    $("btnSkip").onclick = () => { const v = media.querySelector("video"); if (v) v.pause(); clearTimers(); finishClip(n); };
  }

  // spreads subtitle lines across `total` ms; if a <video> is given, follows its clock
  function runSubsTimed(lines, total, onDone, video) {
    const subs = $("subs"), bar = $("progressBar");
    const per = total / Math.max(1, lines.length);
    let shown = -1;
    const start = performance.now();
    const tick = () => {
      const t = video ? video.currentTime * 1000 : performance.now() - start;
      const idx = Math.min(lines.length - 1, Math.floor(t / per));
      if (idx !== shown && lines[idx]) {
        shown = idx;
        const l = lines[idx];
        subs.innerHTML = `<span class="sub"><b>${l.who}</b>${l.text}</span>`;
      }
      bar.style.width = Math.min(100, (t / total) * 100) + "%";
      if (!video && t >= total) { clearInterval(iv); onDone && onDone(); }
    };
    const iv = setInterval(tick, 100); timers.push(iv); tick();
  }

  function renderPhone(p) {
    const el = $("phone");
    if (!p) { show(el, false); return; }
    el.className = "phone " + p.kind;
    const body = p.kind === "call" ? "📞" : p.text;
    el.innerHTML = `<div class="from">${p.kind === "call" ? "Incoming · " : ""}${p.from}</div><div class="bubble"></div>`;
    el.querySelector(".bubble").textContent = body;
    show(el);
  }

  // ---------- after a clip ----------
  function finishClip(n) {
    clearTimers();
    $("progressBar").style.width = "100%";
    if (n.ending) return showEnding(n);
    if (n.choices) return showChoices(n);
    // auto-continue
    const target = n.branch ? (S.lost ? n.branch.ifLost : n.branch.else) : n.next;
    const fe = $("flagEarned");
    if (n.flag) { fe.innerHTML = `<img src="assets/icon-flag.svg" alt=""><span></span>`; fe.querySelector("span").textContent = `Red flag spotted: ${n.flag}`; fe.className = "flag-earned"; show(fe); } else show(fe, false);
    if (n.enter && n.enter.recovered) { fe.textContent = "🏦 Money frozen & recovered — because you spoke up fast"; fe.className = "flag-earned recovered"; show(fe); }
    show($("continueOverlay"));
    $("btnContinue").onclick = () => go(target);
    $("btnContinue").focus();
  }

  function showChoices(n) {
    const box = $("choices");
    box.innerHTML = "";
    n.choices.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.innerHTML = `<span class="k">${String.fromCharCode(65 + i)}</span>`;
      b.append(c.label);
      b.onclick = () => choose(c);
      box.appendChild(b);
    });
    const fl = $("flagsList");
    fl.innerHTML = (n.redFlags || []).map(f => `<li>🚩 ${f}</li>`).join("");
    show(fl, false);
    $("btnHint").hidden = !(n.redFlags && n.redFlags.length);
    $("btnHint").onclick = () => { show(fl, fl.hidden); pauseCountdown(); };
    show($("choiceOverlay"));
    if (!setPig._lock) setPig("worried");

    const pressure = $("pressure").checked && n.timeoutTo;
    show($("timer"), !!pressure);
    if (pressure) startCountdown(n);
  }

  function choose(c) {
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
        toast("⏰ Time's up — panic chose for you. Scammers LOVE a ticking clock.", "#e5484d", 3800);
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
    $("endCard").innerHTML = `
      <img class="badge-pig" src="assets/piggy-${{end_slayer:"cool",end_comeback:"happy",end_dark:"fainted",end_faceswap:"broke"}[S.node] || "happy"}.svg" alt="">
      <div class="small">${e.badge} ENDING ${endingIds.indexOf(S.node) + 1} of ${endingIds.length}</div>
      <h2>${e.title}</h2>
      <p>${e.text}</p>
      <div class="stats">
        <div class="stat">🐷 HK$${fmt(S.money)} left</div>
        <div class="stat">🚩 ${S.flags.length} red flags spotted</div>
        <div class="stat">🏆 ${unlocked.length}/${endingIds.length} endings found</div>
      </div>
      ${S.flags.length ? `<ul>${S.flags.map(f => `<li>${f}</li>`).join("")}</ul>` : ""}
      <div class="help">Real help in HK: ${HELP_LINES.map(h => `${h.label} <b>${h.value}</b>`).join(" · ")}</div>
      <div class="btns">
        ${e.rewind ? `<button class="primary" id="btnRewind">⏪ Rewind to the last choice</button>` : ""}
        <button class="${e.rewind ? "ghost" : "primary"}" id="btnRestart">↻ Play again</button>
        <button class="ghost" id="btnMap2">🗺 See all paths</button>
      </div>`;
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
    let svg = `<svg width="${cols * COL_W}" height="${rows * ROW_H}"><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#9b8bb8"/></marker></defs>`;
    ids.forEach(id => edgesOf(id).forEach(([to, safe]) => {
      const [x1, y1] = xy(id), [x2, y2] = xy(to);
      const sx = x1 + NODE_W, sy = y1 + NODE_H / 2, ex = x2, ey = y2 + NODE_H / 2;
      const mx = (sx + ex) / 2;
      svg += `<path d="M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex - 2},${ey}" fill="none" stroke="${safe ? "#2bb673" : "#e5484d"}" stroke-width="2" stroke-opacity=".7" ${safe ? "" : 'stroke-dasharray="5 4"'} marker-end="url(#ar)"/>`;
    }));
    svg += "</svg>";
    const nodes = ids.map(id => {
      const n = STORY[id], [x, y] = xy(id);
      const cls = ["node", n.kind === "image" ? "img" : "vid",
        S && S.visited.has(id) ? "visited" : "", S && S.node === id ? "current" : "",
        n.ending ? `end ${n.ending.good ? "good" : "bad"}` : "",
        n.ending && !unlocked.has(id) ? "locked" : ""].join(" ");
      const label = n.ending ? `${n.ending.badge} ${n.ending && !unlocked.has(id) ? "???" : n.title}` : n.title;
      return `<div class="${cls}" style="left:${x}px;top:${y}px" title="${id}">${label}</div>`;
    }).join("");
    map.innerHTML = svg + nodes;
  }
  function toggleMap() {
    const p = $("mapPanel"); show(p, p.hidden); renderMap();
    if (!p.hidden) p.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---------- boot ----------
  function restart() { clearTimers(); S = freshState(); updateHud(); go("intro"); }
  function boot() {
    S = freshState(); updateHud(); renderMap();
    const u = store.get().length;
    $("endingsUnlocked").textContent = u ? `🏆 You've found ${u} of ${endingIds.length} endings so far.` : `${endingIds.length} endings to discover.`;
    $("btnStart").onclick = restart;
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
