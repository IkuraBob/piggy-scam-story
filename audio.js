// Local audio only. Optional files may be absent; failures resolve to silence.
const PiggyAudio = (() => {
  let context, master, unlocked = false, muted = false, currentMood = null;
  let voiceActive = false, voiceVersion = 0, currentTrack = null;
  const tracks = new Map();
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
    context.resume().catch(() => {});
  }
  function setMuted(value) {
    muted = value; voice.muted = value;
    tracks.forEach(track => { track.audio.muted = value; });
    ramp(master, muted ? 0 : 1, .16);
    try { localStorage.setItem('piggy.muted', String(muted)); } catch {}
    if (!muted && currentTrack && !currentTrack.failed) currentTrack.audio.play().catch(() => {});
  }
  function duck(on) {
    voiceActive = on;
    if (currentTrack) ramp(currentTrack.gain, on ? .06 : .2, .32);
  }
  function mood(name) {
    if (!unlocked || name === currentMood) return;
    currentMood = name;
    const previous = currentTrack;
    if (previous) {
      ramp(previous.gain, 0);
      clearTimeout(previous.stop);
      previous.stop = setTimeout(() => { if (currentTrack !== previous) previous.audio.pause(); }, 650);
    }
    let track = tracks.get(name);
    if (!track) {
      const audio = new Audio(); audio.loop = true; audio.preload = 'auto'; audio.muted = muted;
      const gain = context.createGain(); gain.gain.value = 0; gain.connect(master);
      context.createMediaElementSource(audio).connect(gain);
      track = { audio, gain, failed: false };
      audio.onerror = () => { track.failed = true; audio.pause(); };
      audio.src = `media/audio/bgm-${name}.mp3`;
      tracks.set(name, track);
    }
    currentTrack = track; clearTimeout(track.stop);
    if (!track.failed) {
      track.audio.play().then(() => { if (currentTrack === track) ramp(track.gain, voiceActive ? .06 : .2); }).catch(() => {});
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
  return { unlock, setMuted, mood, startVoice, stopVoice, sfx, get muted() { return muted; }, get voiceActive() { return voiceActive; } };
})();
