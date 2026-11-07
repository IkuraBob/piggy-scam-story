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
  try { if (localStorage.getItem("piggy.language") === "zh") language = "zh"; } catch {}
  let quizIndex = 0, quizScore = 0, quizAnswered = false, quizChoice = null;
  const ui = (en, zh) => language === "zh" ? zh : en;
  function unlockAudio() { PiggyAudio.unlock(); }
  function localMedia(path) {
    if (!path) return null;
    try {
      const url = new URL(path, location.href);
      return url.origin === location.origin ? url.href : null;
    } catch { return null; }
  }
  function preloadNext(n) {
    const ids = [...(n.choices || []).map(c => c.to), n.next, n.branch?.ifLost, n.branch?.else].filter(Boolean);
    const paths = new Set(ids.map(id => localMedia(STORY[id]?.media || `media/${id}.${STORY[id]?.kind === "video" ? "mp4" : "jpg"}`)).filter(Boolean));
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

  function freshState() { return { node: null, money: START_MONEY, lost: false, recovered: false, flags: [], history: [], route: [], visited: new Set() }; }
  const snapshot = () => ({ node: S.node, money: S.money, lost: S.lost, recovered: S.recovered, flags: [...S.flags], route: [...S.route] });

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
    if (e.money) PiggyAudio.sfx(e.money > 0 ? "coin" : "loss");
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
    clearTimeout(toast._t); show($("toast"), false);
    S.history.push({ entering: id, ...snapshot() });   // state right before entering `id`
    S.node = id;
    S.visited.add(id);
    applyEffect(n.enter);
    if (n.flag && !S.flags.includes(n.flag)) { S.flags.push(n.flag); PiggyAudio.sfx("stamp"); setPig("cool", 2500); }
    document.body.dataset.mood = moodOf(id);
    PiggyAudio.mood(moodOf(id));
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
        Object.assign(S, { money: h.money, lost: h.lost, recovered: h.recovered, flags: [...h.flags], route: [...h.route] });
        toast(ui("⏪ Rewinding… choose again.", "⏪ 正在倒带……重新选择。"), "var(--lavender)");
        return go(id);
      }
    }
    go(id);
  }

  // ---------- clip playback ----------
  function playClip(n) {
    const version = ++clipVersion;
    const nodeId = S.node;
    let finished = false, narration = null, timelineReady = false, videoEnded = false;
    PiggyAudio.stopVoice();
    player.pause(); player.onended = player.onerror = player.onloadedmetadata = null;
    ["startScreen", "endScreen", "choiceOverlay", "continueOverlay", "btnResume"].forEach(x => show($(x), false));
    show($("clip")); show($("btnSkip"));
    player.muted = PiggyAudio.muted;
    $("sceneTag").textContent = `${tx(n.chapter)} · ${tx(n.scene?.tag) || ""}`;
    $("subs").replaceChildren();
    $("progressBar").style.width = "0";
    renderPhone(n.phone);
    const media = $("media");
    media.replaceChildren();
    const active = () => version === clipVersion && !finished;
    const done = () => { if (!active()) return; finished = true; player.pause(); PiggyAudio.stopVoice(); finishClip(n); };
    const duration = () => Math.max(Math.max(1, n.lines.length) * LINE_MS + 600,
      ...n.lines.map(line => Number.isFinite(line.t) ? line.t * 1000 + LINE_MS : 0));
    const timeline = async (total, video) => {
      narration = await PiggyAudio.startVoice(nodeId, done);
      if (!active()) return;
      timelineReady = true;
      if (narration) {
        if (video) video.muted = true;
        runSubsTimed(n.lines, narration.duration * 1000, null, narration);
      } else if (video && videoEnded) done();
      else runSubsTimed(n.lines, total, video ? null : done, video);
    };
    const placeholder = () => {
      if (!active()) return;
      clearTimers(); player.pause(); show($("btnResume"), false);
      const card = el("div", `placeholder ${n.scene?.glitch ? "glitch" : ""}`);
      card.style.background = `var(--mood-${moodOf(S.node)})`;
      card.append(el("div", "emoji", n.scene?.emoji || "🎬"), el("div", "kind", `${n.kind === "video" ? "🎬" : "🖼️"} ${tx(n.title)}`));
      media.replaceChildren(card);
      timeline(duration());
    };
    const path = localMedia(n.media || `media/${S.node}.${n.kind === "video" ? "mp4" : "jpg"}`);
    if (path && /\.(mp4|webm|mov)$/i.test(new URL(path).pathname)) {
      player.src = path;
      player.onerror = placeholder;
      player.onloadedmetadata = () => {
        if (active() && Number.isFinite(player.duration) && player.duration > 0) timeline(player.duration * 1000, player);
      };
      player.onended = () => { videoEnded = true; if (timelineReady && !narration) done(); };
      media.append(player);
      const play = () => player.play().then(() => { if (active()) show($("btnResume"), false); }).catch(() => {
        if (active() && media.contains(player)) show($("btnResume"));
      });
      $("btnResume").onclick = () => { unlockAudio(); play(); };
      play();
    } else if (path) {
      const img = new Image();
      img.className = "kenburns"; img.alt = tx(n.title);
      img.onerror = placeholder;
      img.onload = () => { if (active()) timeline(duration()); };
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
    let shown = -1, shownLanguage = null;
    const start = performance.now();
    const tick = () => {
      const t = video ? video.currentTime * 1000 : performance.now() - start;
      let idx = -1;
      cues.forEach((cue, i) => { if (t >= cue.at) idx = i; });
      if (idx !== shown || shownLanguage !== language) {
        shownLanguage = language;
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
    box.querySelector(".bubble").dataset.status = ui(" · ringing", " · 响铃中");
    show(box);
  }

  // ---------- after a clip ----------
  function finishClip(n) {
    clearTimers(); show($("btnSkip"), false);
    $("progressBar").style.width = "100%";
    if (n.ending) { quizIndex = quizScore = 0; quizAnswered = false; quizChoice = null; return showEnding(n); }
    if (n.choices) return showChoices(n);
    // auto-continue
    const target = n.branch ? (S.lost ? n.branch.ifLost : n.branch.else) : n.next;
    const fe = $("flagEarned");
    if (n.flag) { const icon = el("img"); icon.src = "assets/icon-flag.svg"; icon.alt = ""; fe.replaceChildren(icon, el("span", "", ui("Red flag spotted: ", "已识别红旗：") + tx(n.flag))); fe.className = "flag-earned"; show(fe); } else show(fe, false);
    if (n.enter && n.enter.recovered) { fe.textContent = ui("🏦 Money frozen & recovered — because you spoke up fast", "🏦 及时求助，款项已被冻结并追回"); fe.className = "flag-earned recovered"; show(fe); }
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
    $("btnHint").onclick = () => { show(fl, fl.hidden); pauseCountdown(); if (!fl.hidden) PiggyAudio.sfx("stamp"); };
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
    const index = STORY[S.node].choices.indexOf(c);
    if (index >= 0) S.route.push(String.fromCharCode(65 + index));
    applyEffect(c.effect);
    go(c.to);
  }

  function startCountdown(n) {
    let left = CHOICE_SECONDS;
    const bar = $("timerBar"), txt = $("timerText"), wrap = $("timer");
    wrap.classList.remove("paused");
    const spark = wrap.querySelector(".spark");
    const draw = () => { const pct = left / CHOICE_SECONDS * 100; bar.style.width = `calc(${pct}% - 4px)`; spark.style.left = pct + "%"; txt.textContent = ui(`⏱ ${left}s — decide!`, `⏱ ${left} 秒——做决定！`); };
    draw();
    countdown = { paused: false, iv: setInterval(() => {
      if (countdown.paused) return;
      left--; draw();
      if (left > 0 && left <= 5) PiggyAudio.sfx("hiss");
      if (left <= 0) {
        stopCountdown();
        toast(ui("⏰ Time's up — panic chose for you. Scammers LOVE a ticking clock.", "⏰ 时间到——慌乱替你做了选择。骗子就喜欢催你。"), "var(--alert)", 3800);
        const c = n.choices.find(x => x.to === n.timeoutTo) || { to: n.timeoutTo };
        choose(c);
      }
    }, 1000) };
  }
  function pauseCountdown() {
    if (!countdown) return;
    countdown.paused = true;
    $("timer").classList.add("paused");
    $("timerText").textContent = ui("⏸ Paused — good instinct. Slowing down beats scammers.", "⏸ 已暂停——先慢下来，才能识破骗局。");
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
    const route = S.route.join("-");
    const routeBox = el("div", "help", ui("Route code: ", "路线代码："));
    routeBox.append(el("b", "", route));
    button("btnCopyRoute", "ghost", ui("Copy route code", "复制路线代码"));
    button("btnShareCard", "ghost", ui("Save ending card", "保存结局卡片"));
    button("btnCopyLink", "ghost", ui("Copy story link", "复制故事链接"));
    card.append(help, routeBox, buttons);
    const quiz = el("section", "help"); quiz.id = "quiz"; card.append(quiz);
    renderQuiz();
    show(scr);
    if (e.rewind) $("btnRewind").onclick = () => rewindTo(e.rewind);
    $("btnRestart").onclick = restart;
    $("btnMap2").onclick = toggleMap;
    $("btnCopyRoute").onclick = () => copyText(route);
    $("btnCopyLink").onclick = () => copyText(new URL(".", location.href).href);
    $("btnShareCard").onclick = () => saveEndingCard(n);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast(ui("Copied!", "已复制！"), "var(--safe)"); }
    catch {
      const input = el("input"); input.value = text; input.readOnly = true;
      input.setAttribute("aria-label", ui("Select and copy", "请选择并复制"));
      $("endCard").append(input); input.focus(); input.select();
      toast(ui("Select the text and copy it.", "请选择文本后复制。"), "var(--amber)");
    }
  }
  function renderQuiz() {
    const box = $("quiz"); if (!box) return;
    box.replaceChildren(el("h3", "", ui("Quick scam check", "防诈小测验")));
    if (quizIndex >= QUIZ.length) {
      box.append(el("p", "", ui(`Score: ${quizScore} / ${QUIZ.length}`, `得分：${quizScore} / ${QUIZ.length}`)));
      const retry = el("button", "ghost", ui("Try the quiz again", "重新答题"));
      retry.onclick = () => { quizIndex = quizScore = 0; quizAnswered = false; quizChoice = null; renderQuiz(); };
      box.append(retry); return;
    }
    const q = QUIZ[quizIndex]; box.append(el("p", "", `${quizIndex + 1}/${QUIZ.length} · ${tx(q.question)}`));
    const choices = el("div", "choices");
    q.answers.forEach((answer, i) => {
      const b = el("button", "choice");
      b.append(el("span", "k", String.fromCharCode(65 + i)), document.createTextNode(tx(answer)));
      b.disabled = quizAnswered;
      b.onclick = () => { if (quizAnswered) return; quizAnswered = true; quizChoice = i; if (i === q.correct) quizScore++; renderQuiz(); };
      choices.append(b);
    });
    box.append(choices);
    if (quizAnswered) {
      box.append(el("p", "", (quizChoice === q.correct ? ui("Correct. ", "答对了。") : ui("Review this clue: ", "留意这个线索：")) + tx(q.explanation)));
      const next = el("button", "ghost", ui("Next", "下一题"));
      next.onclick = () => { quizIndex++; quizAnswered = false; quizChoice = null; renderQuiz(); };
      box.append(next);
    }
  }
  async function saveEndingCard(n) {
    const button = $("btnShareCard"); button.disabled = true;
    try {
      await document.fonts.ready;
      const canvas = el("canvas"); canvas.width = 1000; canvas.height = 800;
      const ctx = canvas.getContext("2d"), css = getComputedStyle(document.documentElement);
      const token = name => css.getPropertyValue(name).trim();
      ctx.fillStyle = token("--paper"); ctx.fillRect(0, 0, 1000, 800);
      ctx.fillStyle = token("--ink"); ctx.beginPath(); ctx.roundRect(44, 44, 916, 716, parseFloat(token("--r-lg"))); ctx.fill();
      ctx.fillStyle = token("--card"); ctx.beginPath(); ctx.roundRect(40, 40, 916, 716, parseFloat(token("--r-lg"))); ctx.fill();
      ctx.strokeStyle = token("--ink"); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(40,40,916,716,parseFloat(token("--r-lg"))); ctx.stroke();
      ctx.fillStyle = token("--ink"); ctx.textAlign = "center";
      ctx.font = `700 34px ${token("--font-display")}`;
      ctx.fillText("Piggy's Last Semester", 500, 100);
      const pig = new Image();
      // The card uses the same mascot as the visible ending.
      pig.src = document.querySelector("#endCard .badge-pig").src;
      await pig.decode(); ctx.drawImage(pig, 420, 125, 160, 147);
      ctx.font = `700 42px ${token("--font-display")}`; ctx.fillText(tx(n.ending.title), 500, 330);
      ctx.font = `800 28px ${token("--font-body")}`; ctx.fillText(`HK$${fmt(S.money)} · ${S.flags.length} ${ui("red flags spotted", "个红旗")}`,500,390);
      ctx.font = `400 24px ${token("--font-body")}`;
      const words = language === "zh" ? Array.from(tx(n.ending.text)) : tx(n.ending.text).split(" ");
      let line = "", y = 450;
      for (const word of words) {
        const test = line + (line && language !== "zh" ? " " : "") + word;
        if (ctx.measureText(test).width > 800 && line) { ctx.fillText(line,500,y); y += 34; line = word; } else line = test;
      }
      ctx.fillText(line,500,y);
      ctx.font = `800 24px ${token("--font-body")}`; ctx.fillText(ui("Route: ", "路线：") + S.route.join("-"),500,620);
      ctx.font = `400 20px ${token("--font-body")}`;
      ctx.fillText("18222 · cyberdefender.hk · 999",500,670);
      ctx.fillText("ikurabob.github.io/piggy-scam-story/",500,710);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image unavailable");
      const url = URL.createObjectURL(blob), link = el("a");
      link.href = url; link.download = `piggy-${S.node}.png`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { toast(ui("Could not save the card. Please try again.", "卡片未能保存，请重试。")); }
    finally { button.disabled = false; }
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

  const UI_TEXT = {"pressureLabel": ["⏱ Pressure mode", "⏱ 压力模式"], "btnMap": ["🗺 Story map", "🗺 故事地图"], "btnLanguage": ["中文", "English"], "startIntro": ["Mia just moved to Hong Kong for uni. Her whole semester — HK$8,000 — lives inside Piggy.", "Mia 刚到香港上大学。她整个学期的港币 8,000 元生活费，都装在 Piggy 肚子里。"], "startInstructions": ["After each clip, you decide what Mia does. Choose fast… or choose wisely.", "每段片段结束后，由你决定 Mia 怎么做。快点选……还是想清楚再选。"], "btnStart": ["▶ Start the story", "▶ 开始故事"], "btnResume": ["▶ Play video", "▶ 播放视频"], "btnSkip": ["Skip ⏭", "跳过 ⏭"], "choiceTitle": ["What should Mia do?", "Mia 应该怎么做？"], "btnHint": ["🚩 Pause & spot the red flags", "🚩 暂停，寻找诈骗红旗"], "btnContinue": ["Continue ▶", "继续 ▶"], "mapTitle": ["Story map", "故事地图"], "footer": ["Fictional story for GTSC2066 (educational, non-commercial). Real help in Hong Kong: Anti-Scam Helpline 18222 · Scameter on cyberdefender.hk · Emergency 999", "GTSC2066 虚构故事，仅供教育及非商业用途。香港求助：防骗易热线 18222 · 防骗视伏器 cyberdefender.hk · 紧急求助 999"]};
  function updateLanguage() {
    document.documentElement.lang = language === "zh" ? "zh-Hans" : "en";
    Object.entries(UI_TEXT).forEach(([id, texts]) => { $(id).textContent = texts[language === "zh" ? 1 : 0]; });
    const u = store.get().length;
    $("endingsUnlocked").textContent = ui(`You've found ${u} of ${endingIds.length} endings.`, `已发现 ${u}/${endingIds.length} 个结局。`);
    $("btnSound").setAttribute("aria-label", PiggyAudio.muted ? ui("Unmute audio", "开启声音") : ui("Mute audio", "关闭声音"));
    const n = STORY[S.node];
    if (n) {
      $("sceneTag").textContent = `${tx(n.chapter)} · ${tx(n.scene?.tag) || ""}`;
      const kind = document.querySelector(".placeholder .kind");
      if (kind) kind.textContent = `${n.kind === "video" ? "🎬" : "🖼️"} ${tx(n.title)}`;
      renderPhone(n.phone);
      if (!$("choiceOverlay").hidden) {
        document.querySelectorAll("#choices .choice").forEach((b, i) => b.replaceChildren(el("span", "k", String.fromCharCode(65+i)), document.createTextNode(tx(n.choices[i].label))));
        $("flagsList").replaceChildren(...(n.redFlags || []).map(f => el("li", "", "🚩 " + tx(f))));
        if (countdown?.paused) pauseCountdown();
      }
      if (!$("continueOverlay").hidden && n.flag) $("flagEarned").textContent = ui("Red flag spotted: ", "已识别红旗：") + tx(n.flag);
      if (!$("endScreen").hidden) showEnding(n);
    }
    renderMap();
  }

  // ---------- boot ----------
  function restart() { unlockAudio(); clearTimeout(setPig._t); setPig._lock = false; clearTimers(); S = freshState(); updateHud(); go("intro"); }
  function boot() {
    S = freshState(); updateHud(); renderMap();
    const u = store.get().length;
    $("endingsUnlocked").textContent = u ? `🏆 You've found ${u} of ${endingIds.length} endings so far.` : `${endingIds.length} endings to discover.`;
    updateLanguage();
    $("btnLanguage").onclick = () => {
      language = language === "en" ? "zh" : "en";
      try { localStorage.setItem("piggy.language", language); } catch {}
      updateLanguage();
    };
    $("btnStart").onclick = restart;
    const sound = $("btnSound");
    const updateSound = () => { sound.textContent = PiggyAudio.muted ? "🔇" : "🔊"; sound.setAttribute("aria-label", PiggyAudio.muted ? ui("Unmute audio", "开启声音") : ui("Mute audio", "关闭声音")); sound.setAttribute("aria-pressed", String(!PiggyAudio.muted)); };
    updateSound();
    sound.onclick = () => { unlockAudio(); PiggyAudio.setMuted(!PiggyAudio.muted); player.muted = PiggyAudio.muted || PiggyAudio.voiceActive; updateSound(); };
    document.addEventListener("click", unlockAudio, { once: true, capture: true });
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
