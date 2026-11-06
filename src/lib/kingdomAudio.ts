/** Render the original melody once, off the main thread. Its playback then needs one looping source. */
export async function renderKingdomMusic(sampleRate:number):Promise<AudioBuffer>{
 const beat=60/68,period=32*beat,tail=8*beat,length=Math.ceil((period+tail)*sampleRate),ctx=new OfflineAudioContext(1,length,sampleRate);
 const chords=[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,62]],melody=[74,0,77,76,74,72,69,0,70,0,74,72,70,69,65,0,72,0,76,74,72,69,67,0,69,0,72,74,76,74,69,0];
 const tone=(midi:number,start:number,duration:number,level:number,type:OscillatorType)=>{const voice=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();voice.type=type;voice.frequency.setValueAtTime(440*2**((midi-69)/12),start);filter.type='lowpass';filter.frequency.value=type==='triangle'?1400:2600;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+Math.min(.22,duration*.15));gain.gain.exponentialRampToValueAtTime(.0001,start+duration);voice.connect(filter);filter.connect(gain);gain.connect(ctx.destination);voice.start(start);voice.stop(start+duration+.03);};
 for(let step=0;step<32;step++){const chord=chords[Math.floor(step/8)],at=step*beat;if(step%8===0)chord.forEach((m,i)=>tone(m,at+i*.04,beat*8,.075,'triangle'));tone(chord[step%4]+12,at,beat*1.5,.075,'triangle');if(melody[step])tone(melody[step],at,beat*1.7,.085,'sine');}
 const rendered=await ctx.startRendering(),frames=Math.floor(period*sampleRate),buffer=ctx.createBuffer(1,frames,sampleRate),src=rendered.getChannelData(0),dst=buffer.getChannelData(0);dst.set(src.subarray(0,frames));for(let i=frames;i<src.length;i++)dst[(i-frames)%frames]+=src[i];return buffer;
}
/** Original local score and procedural soundscape. Nothing is downloaded. */
export class KingdomAudio {
 private context:AudioContext|null=null;
 private score:Promise<AudioBuffer>|null=null;
 private scoreSource:AudioBufferSourceNode|null=null;
 private master:GainNode|null=null;
 private music:GainNode|null=null;
 private ambience:GainNode|null=null;
 private timer:ReturnType<typeof setInterval>|null=null;
 private next=0;
 private beat=0;
 private generation=0;
 private voices=new Set<OscillatorNode>();
 private beds:AudioBufferSourceNode[]=[];
 private nodes:AudioNode[]=[];
 async play(volume:number,environment=.55){
  const generation=++this.generation;
  if(!this.context){
   const ctx=new AudioContext();this.context=ctx;this.master=ctx.createGain();this.music=ctx.createGain();this.ambience=ctx.createGain();this.master.gain.value=0;
   this.music.connect(this.master);this.ambience.connect(this.master);
   const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-20;compressor.ratio.value=4;this.master.connect(compressor);compressor.connect(ctx.destination);
   this.nodes.push(compressor);this.createEnvironment(ctx);
  }
  const ctx=this.context;await ctx.resume();
  if(generation!==this.generation||this.context!==ctx)return;
  this.setVolume(volume);this.setAmbience(environment);
  if(typeof OfflineAudioContext!=='undefined'){
   try{this.score??=renderKingdomMusic(ctx.sampleRate);const buffer=await this.score;if(generation!==this.generation||this.context!==ctx)return;if(!this.scoreSource){const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.music!);source.start();this.scoreSource=source;if(this.timer===null){const chirp=()=>{if(ctx.state!=='running')return;this.tone(94,ctx.currentTime+.08,.2,.035,'sine',true);this.tone(97,ctx.currentTime+.35,.16,.025,'sine',true);};this.timer=setInterval(chirp,16*60/68*1000);}}}catch{this.score=null;if(generation!==this.generation||this.context!==ctx)return;this.startScheduler(ctx);}
  }else this.startScheduler(ctx);
 }
 private startScheduler(ctx:AudioContext){if(this.timer===null){this.next=ctx.currentTime+.08;this.schedule();this.timer=setInterval(()=>this.schedule(),250);}}
 setVolume(value:number){if(this.context&&this.master)this.master.gain.setTargetAtTime(Math.max(0,Math.min(1,value))*.32,this.context.currentTime,.15);}
 setAmbience(value:number){if(this.context&&this.ambience)this.ambience.gain.setTargetAtTime(Math.max(0,Math.min(1,value)),this.context.currentTime,.25);}
 pause(){this.generation++;if(this.scoreSource){try{this.scoreSource.stop();}catch{}this.scoreSource.disconnect();this.scoreSource=null;}if(this.context&&this.master)this.master.gain.setValueAtTime(0,this.context.currentTime);if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.voices.forEach(v=>{try{v.stop();}catch{}});this.voices.clear();void this.context?.suspend().catch(()=>{});}
 close(){this.pause();this.score=null;this.beds.forEach(b=>{try{b.stop();}catch{}b.disconnect();});this.beds=[];this.nodes.forEach(n=>n.disconnect());this.nodes=[];void this.context?.close().catch(()=>{});this.context=null;this.master=null;this.music=null;this.ambience=null;}
 private createEnvironment(ctx:AudioContext){
  const buffer=ctx.createBuffer(1,ctx.sampleRate*6,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*5;}
  for(const [frequency,level,type] of [[420,.11,'lowpass'],[1800,.045,'bandpass']] as const){const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.6;gain.gain.value=level;source.connect(filter);filter.connect(gain);gain.connect(this.ambience!);source.start();this.beds.push(source);this.nodes.push(filter,gain);}
 }
 private tone(midi:number,start:number,duration:number,level:number,type:OscillatorType,environment=false){
  const ctx=this.context!,voice=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();voice.type=type;const frequency=440*2**((midi-69)/12);voice.frequency.setValueAtTime(frequency,start);
  if(environment)voice.frequency.exponentialRampToValueAtTime(frequency*1.35,start+duration*.6);
  filter.type='lowpass';filter.frequency.value=environment?4200:type==='triangle'?1400:2600;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+Math.min(.22,duration*.15));gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  voice.connect(filter);filter.connect(gain);gain.connect(environment?this.ambience!:this.music!);this.voices.add(voice);
  voice.onended=()=>{this.voices.delete(voice);voice.disconnect();filter.disconnect();gain.disconnect();};voice.start(start);voice.stop(start+duration+.03);
 }
 private schedule(){
  const ctx=this.context;if(!ctx||ctx.state!=='running')return;const beatDuration=60/68;
  if(this.next<ctx.currentTime)this.next=ctx.currentTime+.04;
  const chords=[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,62]],melody=[74,0,77,76,74,72,69,0,70,0,74,72,70,69,65,0,72,0,76,74,72,69,67,0,69,0,72,74,76,74,69,0];
  while(this.next<ctx.currentTime+1.5){const step=this.beat%32,chord=chords[Math.floor(step/8)];
   if(step%8===0)chord.forEach((m,i)=>this.tone(m,this.next+i*.04,beatDuration*8,.075,'triangle'));
   this.tone(chord[step%4]+12,this.next,beatDuration*1.5,.075,'triangle');
   if(melody[step])this.tone(melody[step],this.next,beatDuration*1.7,.085,'sine');
   if(step===5||step===21){this.tone(94,this.next,.2,.035,'sine',true);this.tone(97,this.next+.27,.16,.025,'sine',true);}
   if(step===0)this.tone(50,this.next,2.8,.025,'sine',true);
   this.beat++;this.next+=beatDuration;
  }
 }
}
