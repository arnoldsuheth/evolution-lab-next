import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {KingdomAudio} from './kingdomAudio';
class Param {value=0;events:number[]=[];setTargetAtTime(v:number){this.value=v;this.events.push(v);}setValueAtTime(v:number){this.value=v;}linearRampToValueAtTime(v:number){this.value=v;}exponentialRampToValueAtTime(v:number){this.value=v;}}
class Node {gain=new Param();frequency=new Param();Q=new Param();threshold=new Param();ratio=new Param();type='';buffer:unknown=null;loop=false;onended:(()=>void)|null=null;stopped=false;connect(){}disconnect(){}start(){}stop(){this.stopped=true;this.onended?.();}}
class Context {static instances:Context[]=[];currentTime=0;sampleRate=100;state='suspended';destination=new Node();gains:Node[]=[];sources:Node[]=[];resolveResume:(()=>void)|null=null;static delayed=false;constructor(){Context.instances.push(this);}createGain(){const n=new Node();this.gains.push(n);return n;}createDynamicsCompressor(){return new Node();}createBiquadFilter(){return new Node();}createOscillator(){return new Node();}createBufferSource(){const n=new Node();this.sources.push(n);return n;}createBuffer(){return{getChannelData:()=>new Float32Array(600)};}resume(){if(Context.delayed)return new Promise<void>(r=>{this.resolveResume=()=>{this.state='running';r();};});this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}}
Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:Context});
test('ambiente usa duas fontes, volume separado e encerra ao sair',async()=>{Context.delayed=false;const audio=new KingdomAudio();try{await audio.play(.5,.25);const ctx=Context.instances.at(-1)!;assert.equal(ctx.sources.length,2);assert.equal(ctx.gains[0].gain.value,.16);assert.equal(ctx.gains[2].gain.value,.25);audio.setVolume(0);assert.equal(ctx.gains[0].gain.value,0);audio.setVolume(.8);assert.equal(ctx.gains[0].gain.value,.8*.32);audio.pause();assert.equal(ctx.state,'suspended');audio.close();assert.ok(ctx.sources.every(n=>n.stopped));assert.equal(ctx.state,'closed');}finally{audio.close();}});
test('mudo durante liberação do áudio cancela início pendente',async()=>{Context.delayed=true;const audio=new KingdomAudio();try{const pending=audio.play(.5);const ctx=Context.instances.at(-1)!;audio.pause();ctx.resolveResume!();await pending;assert.equal(ctx.gains[0].gain.value,0);}finally{audio.close();Context.delayed=false;}});

test('partitura é renderizada uma vez e usa uma única fonte musical em repetições de play',async()=>{
 class Offline extends Context {
  frames:number;constructor(_channels:number,frames:number){super();this.frames=frames;}
  createBuffer(_channels=1,frames=this.frames){void _channels;return {getChannelData:()=>new Float32Array(frames)};}
  startRendering(){return Promise.resolve(this.createBuffer());}
 }
 Object.defineProperty(globalThis,'OfflineAudioContext',{configurable:true,value:Offline});Context.delayed=false;
 const index=Context.instances.length,audio=new KingdomAudio();
 try{await audio.play(.5);const live=Context.instances[index];assert.equal(live.sources.length,3);const contexts=Context.instances.length;await audio.play(.5);assert.equal(live.sources.length,3);assert.equal(Context.instances.length,contexts);audio.pause();assert.ok(live.sources.every(n=>n===live.sources[2]?n.stopped:true));await audio.play(.5);assert.equal(Context.instances.length,contexts);assert.equal(live.sources.length,4);}finally{audio.close();Reflect.deleteProperty(globalThis,'OfflineAudioContext');}
});
