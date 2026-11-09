// Local audio only. Optional files may be absent; failures resolve to silence.
const PiggyAudio = (() => {
  let context, master, unlocked = false, muted = false, currentMood = null;
  let videoPlaying = false;
  let voiceActive = false, voiceVersion = 0, currentTrack = null;
  let musicVersion = 0, musicRequest = null;
  const retiringTracks = new Set();
  const voice = new Audio();
  voice.preload = 'auto';
  let voiceGain;
  try { muted = localStorage.getItem('piggy.muted') === 'true'; } catch {}
  function ramp(gain, value, seconds = .6) {
    if (!context || !gain) return;
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(value, now + seconds);
  }
  function unlock() {
    if (!unlocked) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        context = new AudioContext(); master = context.createGain();
        master.gain.value = muted ? 0 : 1; master.connect(context.destination);
        voiceGain = context.createGain(); voiceGain.connect(master);
        context.createMediaElementSource(voice).connect(voiceGain);
        // Prime the reusable voice element during the user gesture.
        voice.muted = muted;
        unlocked = true;
      } catch { return; }
    }
    if (context.state !== 'running') context.resume().catch(() => {});
    // Schedule a silent buffer in the gesture itself to activate the output path.
    const prime = context.createBufferSource();
    prime.buffer = context.createBuffer(1, 1, context.sampleRate);
    prime.connect(master); prime.onended = () => prime.disconnect(); prime.start();
  }
  function setMuted(value) {
    muted = value; voice.muted = value;
    // BGM is muted through master gain only, avoiding media unmute autoplay rules.
    ramp(master, muted ? 0 : 1, .16);
    try { localStorage.setItem('piggy.muted', String(muted)); } catch {}
    if (!muted && currentTrack) ramp(currentTrack.gain, musicLevel(), .16);
  }
  function musicLevel() { return voiceActive ? .06 : videoPlaying ? .05 : .2; }
  function duck(on) {
    voiceActive = on;
    if (currentTrack) ramp(currentTrack.gain, musicLevel(), .32);
  }
  function setVideoPlaying(on) {
    videoPlaying = !!on;
    if (currentTrack) ramp(currentTrack.gain, musicLevel(), .32);
  }
  function releaseMusic(track) {
    clearTimeout(track.stop);
    try { track.source.stop(); } catch {}
    track.source.disconnect(); track.source.buffer = null; track.gain.disconnect();
    retiringTracks.delete(track);
  }
  async function mood(name) {
    if (!unlocked || !['home', 'ch1', 'ch2', 'ch3'].includes(name)) return;
    if (name === currentMood && (currentTrack || musicRequest)) return;
    currentMood = name;
    const version = ++musicVersion;
    musicRequest?.abort();
    const request = new AbortController(); musicRequest = request;
    // Only the current decoded track and a short outgoing crossfade are retained.
    // BGM never calls HTMLMediaElement.play(), which has a separate autoplay gate.
    try {
      const response = await fetch(`media/audio/bgm-${name}.mp3`, {
        signal: request.signal, credentials: 'omit', mode: 'same-origin', redirect: 'error'
      });
      if (!response.ok) throw new Error('Missing music');
      const bytes = await response.arrayBuffer();
      if (version !== musicVersion) return;
      const buffer = await context.decodeAudioData(bytes);
      if (version !== musicVersion) return;
      retiringTracks.forEach(releaseMusic);
      const previous = currentTrack;
      const gain = context.createGain(); gain.gain.value = 0; gain.connect(master);
      const source = context.createBufferSource(); source.buffer = buffer;
      source.loop = true; source.connect(gain); source.start();
      currentTrack = { source, gain };
      ramp(gain, musicLevel());
      if (previous) {
        ramp(previous.gain, 0); retiringTracks.add(previous);
        previous.stop = setTimeout(() => releaseMusic(previous), 650);
      }
    } catch {
      if (version === musicVersion) {
        // Missing/failed music leaves this mood silent and can retry on revisiting.
        if (currentTrack) releaseMusic(currentTrack);
        currentTrack = null; currentMood = null;
      }
    } finally {
      if (version === musicVersion) musicRequest = null;
    }
  }
  function stopVoice() {
    voiceVersion++; voice.pause(); voice.onended = voice.onerror = voice.onloadedmetadata = null;
    voice.removeAttribute('src'); voice.load(); duck(false);
  }
  function startVoice(id, onEnd) {
    stopVoice();
    if (!unlocked) return Promise.resolve(null);
    const version = voiceVersion;
    return new Promise(resolve => {
      let settled = false;
      const finish = value => { if (!settled) { settled = true; clearTimeout(timeout); resolve(value); } };
      const timeout = setTimeout(() => { if (version === voiceVersion) stopVoice(); finish(null); }, 2500);
      voice.onerror = () => { if (version === voiceVersion) { duck(false); finish(null); } };
      voice.onloadedmetadata = () => {
        if (version !== voiceVersion || !Number.isFinite(voice.duration) || voice.duration <= 0) return finish(null);
        voice.play().then(() => {
          if (version !== voiceVersion) return finish(null);
          duck(true); finish(voice);
        }).catch(() => { duck(false); finish(null); });
      };
      voice.onended = () => { if (version === voiceVersion) { duck(false); onEnd(); } };
      voice.src = `media/audio/${id}.mp3`; voice.load();
    });
  }
  function sfx(kind) {
    if (!unlocked || muted || context.state !== 'running') return;
    const now = context.currentTime, gain = context.createGain();
    gain.connect(master); gain.gain.setValueAtTime(.0001, now);
    const duration = kind === 'loss' ? .35 : kind === 'hiss' ? .13 : .16;
    gain.gain.exponentialRampToValueAtTime(kind === 'hiss' ? .012 : .035, now + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    let source;
    if (kind === 'hiss') {
      source = context.createBufferSource();
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      source.buffer = buffer;
      const filter = context.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 3000;
      source.connect(filter); filter.connect(gain);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    } else {
      source = context.createOscillator(); source.type = 'sine';
      const pitch = kind === 'coin' ? [880,1320] : kind === 'loss' ? [440,110] : [160,60];
      source.frequency.setValueAtTime(pitch[0], now);
      source.frequency.exponentialRampToValueAtTime(pitch[1], now + duration);
      source.connect(gain); source.onended = () => { source.disconnect(); gain.disconnect(); };
    }
    source.start(now); source.stop(now + duration);
  }
  return { unlock, setMuted, setVideoPlaying, mood, startVoice, stopVoice, sfx, get unlocked() { return unlocked; }, get muted() { return muted; }, get voiceActive() { return voiceActive; } };
})();
