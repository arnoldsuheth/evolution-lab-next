/** Original slow modal score, synthesized locally; no external audio or requests. */
export class KingdomAudio {
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private timer:ReturnType<typeof setInterval>|null=null;
 private next=0;
 private beat=0;
 private voices=new Set<OscillatorNode>();
 async play(volume:number){
  if(!this.context){
   const ctx=new AudioContext();this.context=ctx;this.master=ctx.createGain();this.master.gain.value=0;
   const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-20;compressor.ratio.value=4;
   this.master.connect(compressor);compressor.connect(ctx.destination);
  }
  await this.context.resume();this.setVolume(volume);
  if(this.timer===null){this.next=this.context.currentTime+.08;this.schedule();this.timer=setInterval(()=>this.schedule(),250);}
 }
 setVolume(value:number){if(this.context&&this.master)this.master.gain.setTargetAtTime(Math.max(0,Math.min(1,value))*.32,this.context.currentTime,.25);}
 pause(){if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.voices.forEach(v=>{try{v.stop();}catch{}});this.voices.clear();void this.context?.suspend();}
 close(){this.pause();void this.context?.close();this.context=null;this.master=null;}
 private tone(midi:number,start:number,duration:number,level:number,type:OscillatorType){
  const ctx=this.context!,voice=ctx.createOscillator(),gain=ctx.createGain();voice.type=type;voice.frequency.value=440*2**((midi-69)/12);
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='triangle'?1400:2600;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+Math.min(.22,duration*.15));gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  voice.connect(filter);filter.connect(gain);gain.connect(this.master!);this.voices.add(voice);
  voice.onended=()=>{this.voices.delete(voice);voice.disconnect();filter.disconnect();gain.disconnect();};voice.start(start);voice.stop(start+duration+.03);
 }
 private schedule(){
  const ctx=this.context!;const beatDuration=60/68;
  const chords=[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,62]];
  const melody=[74,0,77,76,74,72,69,0,70,0,74,72,70,69,65,0,72,0,76,74,72,69,67,0,69,0,72,74,76,74,69,0];
  while(this.next<ctx.currentTime+1.5){const step=this.beat%32,chord=chords[Math.floor(step/8)];
   if(step%8===0)chord.forEach((m,i)=>this.tone(m,this.next+i*.04,beatDuration*8,.075,'triangle'));
   this.tone(chord[step%4]+12,this.next,beatDuration*1.5,.075,'triangle');
   if(melody[step]){this.tone(melody[step],this.next,beatDuration*1.7,.10,'sine');this.tone(melody[step]+12,this.next+.05,beatDuration*2,.012,'sine');}
   this.beat++;this.next+=beatDuration;
  }
 }
}
