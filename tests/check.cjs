// Run with Node.js: node tests/check.cjs. No packages required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
for (const file of ['story.js','app.js','audio.js']) new vm.Script(read(file));
const { STORY, QUIZ } = vm.runInNewContext(read('story.js')+'; ({STORY,QUIZ})');
const endings = new Map();
let paths = 0;
function effect(s,e) { if (!e) return; s.money=Math.max(0,s.money+(e.money||0)); s.lost ||= !!e.lost; }
function walk(id,state,depth=0) {
  assert.ok(depth<30,'Story must terminate');
  const n=STORY[id]; assert.ok(n,`Missing node ${id}`);
  const s={...state}; effect(s,n.enter);
  if(n.ending){paths++; if(!endings.has(id))endings.set(id,new Set()); endings.get(id).add(s.money); return;}
  if(n.choices){assert.ok(n.choices.length<=2); assert.ok(n.choices.some(c=>c.to===n.timeoutTo)); for(const c of n.choices){const next={...s};effect(next,c.effect);walk(c.to,next,depth+1);}}
  else walk(n.branch?(s.lost?n.branch.ifLost:n.branch.else):n.next,s,depth+1);
}
walk('intro',{money:8000,lost:false}); assert.equal(endings.size,4);
assert.equal(paths,40);
for (const [id, expected] of Object.entries({
  end_comeback:[3050,5050,6000,6050,7050,8000,8050],
  end_faceswap:[1050,3050,4000,4050], end_dark:[2050,4050,5000,5050], end_slayer:[8000,8050]
})) assert.deepEqual([...endings.get(id)].sort((a,b)=>a-b),expected,`${id} balances`);
// Spoken words: contractions, hyphenated compounds and numbers count as one;
// stage directions in *asterisks* are not spoken dialogue.
const videoWordCounts = {};
for (const [id, n] of Object.entries(STORY)) {
  if (n.kind !== 'video') continue;
  const spoken = n.lines.map(line => line.text.en.replace(/\*[^*]*\*/g, '')).join(' ');
  const words = spoken.match(/[A-Za-z0-9]+(?:['’,-][A-Za-z0-9]+)*/g) || [];
  videoWordCounts[id] = words.length;
  assert.ok(words.length <= 30, `${id}: ${words.length} spoken English words exceeds 30`);
}
function checkText(v,key='') {
  if(Array.isArray(v)){v.forEach(x=>checkText(x,key));return;}
  if(v&&typeof v==='object') {
    if('en'in v){assert.equal(typeof v.en,'string');assert.equal(typeof v.zh,'string');assert.ok(v.zh.length);return;}
    for(const [k,x]of Object.entries(v))checkText(x,k);
  } else if(['who','text','label','chapter','title','tag','from','flag'].includes(key)) assert.fail(`Untranslated ${key}`);
}
checkText(STORY); checkText(QUIZ);
assert.equal(QUIZ.length,3);QUIZ.forEach(q=>assert.ok(q.correct>=0&&q.correct<q.answers.length));
assert.ok(!/innerHTML|insertAdjacentHTML|eval\(/.test(read('app.js')));
assert.ok(!/https?:\/\//.test(read('audio.js')));
assert.ok(read('index.html').includes("connect-src 'self'"));
assert.ok(!read('index.html').includes('https://fonts.'));

// Check explicit cues and the video/voice clock, including paused playback.
const app=read('app.js');
const subtitleFunction=app.slice(app.indexOf('  function runSubsTimed('),app.indexOf('  function renderPhone('));
let now=0,tick;
class TextElement { constructor(text=''){this.text=text;this.children=[];this.style={};} append(...items){this.children.push(...items);} replaceChildren(...items){this.children=items;} }
const subs=new TextElement(),progress=new TextElement();
const captionSandbox={ $:id=>id==='subs'?subs:progress,el:(_tag,_cls,text)=>new TextElement(text),tx:x=>x,language:'en',document:{createTextNode:text=>new TextElement(text)},performance:{now:()=>now},setInterval:f=>{tick=f;return 1;},clearInterval(){},timers:[] };
const run=vm.runInNewContext(subtitleFunction+'; runSubsTimed',captionSandbox);
const caption=()=>subs.children[0]?.children.map(x=>x.text).join('');
const clock={currentTime:0};
run([{who:'Mia',text:'first',t:1},{who:'Piggy',text:'second',t:3}],6000,null,clock);
assert.equal(subs.children.length,0);clock.currentTime=1;tick();assert.equal(caption(),'Miafirst');
now=50000;tick();assert.equal(caption(),'Miafirst','Paused voice must not advance subtitles');
clock.currentTime=3;tick();assert.equal(caption(),'Piggysecond');clock.currentTime=.5;tick();assert.equal(subs.children.length,0);
now=0;run([{who:'A',text:'one'},{who:'B',text:'two'}],6000,()=>{});now=3100;tick();assert.equal(caption(),'Btwo');

// Exercise the actual clip controller with deterministic video and audio events.
async function checkVideoPlayback() {
  const playSource=app.slice(app.indexOf('  function playClip('),app.indexOf('  // Optional t values'));
  async function scenario(hasNarration) {
    const elements=new Map();
    class Element extends TextElement { constructor(){super();this.hidden=true;} contains(x){return this.children.includes(x);} }
    const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
    let started=0,finished=0,voiceStarts=0,voiceEnd,ducked=false,subArgs;
    const video={muted:true,duration:5,currentTime:0,paused:true,preload:'auto',audioTracks:[{}],
      pause(){this.paused=true;this.onpause?.();},load(){},
      play(){started++;this.paused=false;this.onplaying?.();return Promise.resolve();}};
    const narration={duration:3,currentTime:0};
    const audio={unlocked:true,muted:false,stopVoice(){},setVideoPlaying(v){ducked=v;},
      startVoice(_id,cb){voiceStarts++;voiceEnd=cb;return Promise.resolve(hasNarration?narration:null);}};
    const env={$:get,S:{node:'intro'},clipVersion:0,narrationForClip:false,player:video,PiggyAudio:audio,
      show:(x,on=true)=>{x.hidden=!on;},tx:x=>x,renderPhone(){},clearTimers(){},finishClip(){finished++;},
      LINE_MS:2800,runSubsTimed:(...args)=>{subArgs=args;},localMedia:x=>'http://localhost/'+x,URL,
      preloadNext(){},unlockAudio(){},el:()=>new Element(),moodOf:()=> 'home'};
    const play=vm.runInNewContext(playSource+'; playClip',env);
    const node={kind:'video',lines:[{text:'one'},{text:'two'}],title:'test',chapter:'test'};
    play(node);assert.equal(started,0,'Probe before starting soundtrack');assert.equal(video.muted,true);
    await video.onloadedmetadata();
    assert.equal(started,1);assert.equal(video.muted,hasNarration);
    assert.equal(ducked,!hasNarration);assert.equal(subArgs[1],5000);assert.equal(subArgs[3],video,'Captions follow video even with narration');
    voiceEnd();assert.equal(finished,0,'Narration ending must not cut video short');
    video.currentTime=5;video.onended();assert.equal(finished,1);assert.equal(ducked,false);
    play(node);get('btnSkip').onclick();assert.equal(finished,2);assert.equal(video.paused,true);
    play(node);video.onerror();assert.equal(ducked,false);assert.equal(voiceStarts,1,'Placeholder must not start narration');
    assert.equal(subArgs[3],undefined);assert.equal(subArgs[1],6200,'Preserve placeholder pacing');
  }
  await scenario(false);await scenario(true);
}

// Exercise real audio module logic using deterministic media/Web Audio doubles.
const audios=[], gains=[], tones=[], buffers=[], contexts=[], jobs=new Map(); let job=0;
class Param { constructor(v=0){this.value=v;this.targets=[];} setValueAtTime(v){this.value=v;} cancelScheduledValues(){} linearRampToValueAtTime(v){this.value=v;this.targets.push(v);} exponentialRampToValueAtTime(v){this.value=v;this.targets.push(v);} }
class Gain {constructor(){this.gain=new Param();gains.push(this);}connect(){}disconnect(){}}
class Media {
 constructor(){this.duration=3;this.currentTime=0;this.paused=true;audios.push(this);}
 set src(v){this._src=v;}get src(){return this._src;}
 play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}
 removeAttribute(){this._src='';}load(){if(this._src)queueMicrotask(()=>this.onloadedmetadata?.());}
}
class Context {
 constructor(){this.currentTime=0;this.state='suspended';this.sampleRate=8000;contexts.push(this);}
 resume(){this.state="running";return Promise.resolve();}createGain(){return new Gain();}
 createMediaElementSource(){return {connect(){}};}
 createOscillator(){const s={frequency:new Param(),connect(){},disconnect(){},start(){},stop(){}};tones.push(s);return s;}
 createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}
 decodeAudioData(bytes){return Promise.resolve({decoded:bytes});}
 createBufferSource(){const s={connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};buffers.push(s);return s;}
 createBiquadFilter(){return {frequency:new Param(),connect(){},disconnect(){}};}
}
const sandbox={AbortController,fetch:async url=>({ok:true,arrayBuffer:async()=>url}),Audio:Media,window:{AudioContext:Context},localStorage:{getItem(){return null;},setItem(){}},setTimeout:f=>{jobs.set(++job,f);return job;},clearTimeout:id=>jobs.delete(id),Math};
const audio=vm.runInNewContext(read('audio.js')+'; PiggyAudio',sandbox);
module.exports = (async()=>{
 await checkVideoPlayback();
 audio.sfx('coin'); assert.equal(tones.length,0,'No sound before first click');
 audio.unlock();audio.sfx('coin');audio.sfx('loss');audio.sfx('stamp');audio.sfx('hiss');assert.equal(tones.length,3);
 await audio.mood('home'); const homeGain=gains.at(-1), home=buffers.at(-1);
 assert.equal(home.buffer.decoded,'media/audio/bgm-home.mp3');assert.equal(home.started,true);assert.equal(home.loop,true);
 assert.equal(homeGain.gain.value,.2);assert.equal(audios.length,1,'No BGM HTML audio elements');
 await audio.mood('ch1');const ch1Gain=gains.at(-1);assert.equal(homeGain.gain.value,0);assert.equal(ch1Gain.gain.value,.2);
 for(const fn of [...jobs.values()]) fn(); jobs.clear();
 assert.equal(home.stopped,true);assert.equal(home.buffer,null,'Release outgoing decoded PCM');
 audio.setVideoPlaying(true);assert.equal(ch1Gain.gain.value,.05);
 let ended=false;const voice=await audio.startVoice('intro',()=>{ended=true;});assert.equal(voice.duration,3);assert.equal(ch1Gain.gain.value,.06);
 voice.onended();assert.equal(ended,true);assert.equal(ch1Gain.gain.value,.05);
 audio.setVideoPlaying(false);assert.equal(ch1Gain.gain.value,.2);
 const beforeToggle=buffers.length;
 audio.setMuted(true);assert.equal(gains[0].gain.value,0);audio.sfx('coin');assert.equal(tones.length,3);
 audio.setMuted(false);assert.equal(gains[0].gain.value,1);assert.equal(buffers.length,beforeToggle,'Mute must not restart the music');
 audio.stopVoice();assert.ok(voice.paused);assert.equal(audio.voiceActive,false);
 contexts[0].state='interrupted';audio.unlock();assert.equal(contexts[0].state,'running');
 // Fresh page: saved sound preference does not replace first-gesture activation.
 for(const stored of ['true','false']){
  const fresh=vm.runInNewContext(read('audio.js')+'; PiggyAudio',{...sandbox,localStorage:{getItem(){return stored;},setItem(){}}});
  const before=buffers.length; await fresh.mood('home');assert.equal(buffers.length,before);
  fresh.unlock(); const masterGain=gains.at(-2); await fresh.mood('home');
  assert.equal(buffers.at(-1).started,true);assert.equal(masterGain.gain.value,stored==='true'?0:1);
  fresh.setMuted(false);assert.equal(masterGain.gain.value,1);
 }
 // Slow old requests must not replace a newer mood; failed files remain silent.
 const pending=[];
 const race=vm.runInNewContext(read('audio.js')+'; PiggyAudio',{...sandbox,fetch:(url,options)=>new Promise(resolve=>pending.push({url,options,resolve}))});
 race.unlock();const old=race.mood('home'), latest=race.mood('ch3');
 assert.equal(pending[0].options.signal.aborted,true);
 pending[1].resolve({ok:true,arrayBuffer:async()=> 'new'});await latest;const active=buffers.at(-1);
 pending[0].resolve({ok:true,arrayBuffer:async()=> 'old'});await old;assert.equal(buffers.at(-1),active);
 assert.equal(active.buffer.decoded,'new');
 const fail=race.mood('ch2');pending[2].resolve({ok:false});await fail;
 assert.equal(active.stopped,true);assert.equal(active.buffer,null);
 const retry=race.mood('ch2');pending[3].resolve({ok:true,arrayBuffer:async()=> 'retry'});await retry;
 assert.equal(buffers.at(-1).buffer.decoded,'retry');
 const result = {syntax:'pass',storyPaths:paths,endings:[...endings].map(([id,money])=>({id,balances:[...money].sort((a,b)=>a-b)})),bilingualText:'pass',videoWordCounts,subtitleClocks:'pass',security:'pass',audioLifecycle:'pass',videoSoundtrack:'pass'};
 if(require.main===module)console.log(JSON.stringify(result,null,2));
 return result;
})().catch(e=>{if(require.main===module){console.error(e);process.exitCode=1;}else throw e;});
