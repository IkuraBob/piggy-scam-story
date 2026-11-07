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
assert.ok(read('index.html').includes("connect-src 'none'"));
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

// Exercise real audio module logic using deterministic media/Web Audio doubles.
const audios=[], gains=[], tones=[], jobs=new Map(); let job=0;
class Param { constructor(v=0){this.value=v;this.targets=[];} setValueAtTime(v){this.value=v;} cancelScheduledValues(){} linearRampToValueAtTime(v){this.value=v;this.targets.push(v);} exponentialRampToValueAtTime(v){this.value=v;this.targets.push(v);} }
class Gain {constructor(){this.gain=new Param();gains.push(this);}connect(){}disconnect(){}}
class Media {
 constructor(){this.duration=3;this.currentTime=0;this.paused=true;audios.push(this);}
 set src(v){this._src=v;}get src(){return this._src;}
 play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}
 removeAttribute(){this._src='';}load(){if(this._src)queueMicrotask(()=>this.onloadedmetadata?.());}
}
class Context {
 constructor(){this.currentTime=0;this.state='running';this.sampleRate=8000;}
 resume(){return Promise.resolve();}createGain(){return new Gain();}
 createMediaElementSource(){return {connect(){}};}
 createOscillator(){const s={frequency:new Param(),connect(){},disconnect(){},start(){},stop(){}};tones.push(s);return s;}
 createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}
 createBufferSource(){return {connect(){},disconnect(){},start(){},stop(){}};}
 createBiquadFilter(){return {frequency:new Param(),connect(){},disconnect(){}};}
}
const sandbox={Audio:Media,window:{AudioContext:Context},localStorage:{getItem(){return null;},setItem(){}},setTimeout:f=>{jobs.set(++job,f);return job;},clearTimeout:id=>jobs.delete(id),Math};
const audio=vm.runInNewContext(read('audio.js')+'; PiggyAudio',sandbox);
module.exports = (async()=>{
 audio.sfx('coin'); assert.equal(tones.length,0,'No sound before first click');
 audio.unlock();audio.sfx('coin');audio.sfx('loss');audio.sfx('stamp');audio.sfx('hiss');assert.equal(tones.length,3);
 audio.mood('home');const homeGain=gains.at(-1);await Promise.resolve();assert.equal(audios[1].src,'media/audio/bgm-home.mp3');assert.equal(homeGain.gain.value,.2);
 audio.mood('ch1');const ch1Gain=gains.at(-1);await Promise.resolve();assert.equal(homeGain.gain.value,0);assert.equal(ch1Gain.gain.value,.2);
 let ended=false;const voice=await audio.startVoice('intro',()=>{ended=true;});assert.equal(voice.duration,3);assert.equal(ch1Gain.gain.value,.06,'Voice ducks music to 30%');
 voice.onended();assert.equal(ended,true);assert.equal(ch1Gain.gain.value,.2);
 audio.setMuted(true);assert.equal(gains[0].gain.value,0);audio.sfx('coin');assert.equal(tones.length,3);audio.setMuted(false);
 audio.stopVoice();assert.ok(voice.paused);assert.equal(audio.voiceActive,false);
 audios[2].onerror();audio.mood('ch2');await Promise.resolve();assert.equal(audios[3].src,'media/audio/bgm-ch2.mp3');
 const result = {syntax:'pass',storyPaths:paths,endings:[...endings].map(([id,money])=>({id,balances:[...money].sort((a,b)=>a-b)})),bilingualText:'pass',subtitleClocks:'pass',security:'pass',audioLifecycle:'pass'};
 if(require.main===module)console.log(JSON.stringify(result,null,2));
 return result;
})().catch(e=>{if(require.main===module){console.error(e);process.exitCode=1;}else throw e;});
