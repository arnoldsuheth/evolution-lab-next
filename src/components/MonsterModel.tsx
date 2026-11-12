"use client";
import {useLayoutEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {HunterCompanion} from '@/lib/game';
import type {MonsterKind} from '@/lib/campaign';
import {bakeStatic} from './MergedParts';
type Point = [number,number,number];
function Piece({p,s,c,cone=false,rock=false,r=[0,0,0]}:{p:Point;s:Point;c:string;cone?:boolean;rock?:boolean;r?:Point}){
 return <mesh position={p} scale={s} rotation={r} castShadow>
  {rock?<dodecahedronGeometry args={[.55,0]}/>:cone?<coneGeometry args={[.5,1,10]}/>:<sphereGeometry args={[.5,14,10]}/>}
  <meshStandardMaterial color={c} roughness={.88} flatShading={rock}/>
 </mesh>;
}

function Segment({from,to,base,tip,color}:{from:Point;to:Point;base:number;tip:number;color:string}){
 const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to),direction=end.clone().sub(start);
 const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
 return <mesh position={start.lerp(end,.5)} quaternion={rotation} castShadow>
  <cylinderGeometry args={[tip,base,direction.length(),7]}/><meshStandardMaterial color={color} roughness={.87}/>
 </mesh>;
}

const SIDES = [-1,1];

function WildCreature({kind}:{kind:'stag'|'beetle'|'basilisk'}){
 if(kind==='stag')return <>
  <Piece p={[0,1.2,0]} s={[.74,.77,1.74]} c="#8a5e41"/>
  <Piece p={[0,1.26,.41]} s={[.64,.89,.66]} c="#ad7952"/>
  <Piece p={[0,1.66,.57]} s={[.44,.96,.49]} r={[.38,0,0]} c="#996846"/>
  <Piece p={[0,2.03,.86]} s={[.45,.48,.68]} c="#a67752"/>
  <Piece p={[0,1.91,1.13]} s={[.33,.31,.33]} c="#c5a681"/>
  <Piece p={[0,1.19,-.89]} s={[.22,.38,.36]} c="#efe2bc" r={[.55,0,0]}/>
  {SIDES.map(side=><group key={side}>
   <Piece p={[side*.31,2.19,.69]} s={[.18,.39,.18]} c="#a67752" r={[0,0,-side*.8]}/>
   <Piece p={[side*.18,2.08,1.01]} s={[.10,.09,.12]} c="#30261e"/>
   <Segment from={[side*.14,2.22,.70]} to={[side*.34,2.74,.46]} base={.07} tip={.046} color="#d3c3a3"/>
   <Segment from={[side*.34,2.74,.46]} to={[side*.57,3.03,.33]} base={.046} tip={.013} color="#d3c3a3"/>
   <Segment from={[side*.31,2.67,.48]} to={[side*.33,2.96,.68]} base={.037} tip={.009} color="#d3c3a3"/>
   {[-.56,.54].map(z=><group key={z}>
    <Segment from={[side*.25,1.20,z]} to={[side*.23,.58,z-.1]} base={.13} tip={.072} color="#946446"/>
    <Segment from={[side*.23,.58,z-.1]} to={[side*.24,.12,z]} base={.072} tip={.043} color="#664b3b"/>
    <Piece p={[side*.24,.08,z+.04]} s={[.15,.16,.25]} c="#3e3832"/>
   </group>)}
  </group>)}
 </>;
 if(kind==='beetle')return <>
  <Piece p={[0,.53,-.23]} s={[1.27,.63,1.59]} c="#372e2b"/>
  <Piece p={[0,.49,.61]} s={[.69,.49,.64]} c="#55412c"/>
  {SIDES.map(side=><group key={side}>
   <Piece p={[side*.285,.68,-.24]} s={[.67,.65,1.58]} c={side<0?'#99723e':'#a38349'} r={[.08,side*.035,side*.13]}/>
   <Piece p={[side*.22,.60,.86]} s={[.14,.12,.12]} c="#f1ca68"/>
   <Segment from={[side*.19,.53,.83]} to={[side*.32,.70,1.19]} base={.046} tip={.012} color="#413125"/>
   <Segment from={[side*.31,.47,.83]} to={[side*.20,.41,1.09]} base={.088} tip={.012} color="#685238"/>
   {[-.53,-.08,.39].map((z,i)=><group key={z}>
    <Segment from={[side*.45,.50,z]} to={[side*.79,.54,z-.12]} base={.078} tip={.052} color="#5d4932"/>
    <Segment from={[side*.79,.54,z-.12]} to={[side*(.95-i*.04),.07,z+.15]} base={.054} tip={.019} color="#4c3b2d"/>
   </group>)}
  </group>)}
 </>;
 return <>
  <Piece p={[0,.56,-.26]} s={[.92,.67,1.75]} c="#6b7950"/>
  <Piece p={[0,.44,.30]} s={[.71,.52,1.13]} c="#87926a"/>
  <Piece p={[0,.81,.83]} s={[.83,.53,1.03]} c="#596848"/>
  <Piece p={[0,.67,1.06]} s={[.61,.24,.72]} c="#a79d70"/>
  <Segment from={[0,.52,-.91]} to={[.24,.33,-1.56]} base={.27} tip={.14} color="#66784d"/>
  <Segment from={[.24,.33,-1.56]} to={[.74,.26,-2.09]} base={.14} tip={.015} color="#66784d"/>
  {[-.88,-.56,-.23,.10,.43,.74].map((z,i)=><Piece key={z} p={[0,.91+i*.025,z]} s={[.25,.28+(i%2)*.07,.28]} c="#45583f" rock/>)}
  {SIDES.map(side=><group key={side}>
   <Piece p={[side*.34,.9,1.05]} s={[.14,.13,.12]} c="#e7ad60"/>
   <Piece p={[side*.397,.9,1.065]} s={[.048,.11,.07]} c="#2c2723"/>
   {[-.57,.43].map(z=><group key={z}>
    <Segment from={[side*.31,.59,z]} to={[side*.62,.31,z-.12]} base={.14} tip={.09} color="#65734e"/>
    <Segment from={[side*.62,.31,z-.12]} to={[side*.70,.11,z+.14]} base={.09} tip={.07} color="#596448"/>
    {[-.10,0,.10].map(dx=><Piece key={dx} p={[side*.70+dx,.075,z+.25]} s={[.065,.10,.17]} c="#c9ba91"/>)}
   </group>)}
  </group>)}
 </>;
}

function BeastDetail({boar,cold}:{boar:boolean;cold:boolean}){
 const dark=boar?'#3d312b':cold?'#566c78':'#3f4950';
 const light=boar?'#88674c':cold?'#dbe6e2':'#adb1a7';
 return <>
  <Piece p={[0,.86,.32]} s={[.58,.52,1.03]} c={light}/>
  <Piece p={[0,1.015,1.35]} s={[boar?.31:.21,.18,.13]} c={dark}/>
  {SIDES.map(side=><group key={side}>
   <Piece p={[side*.2,1.41,.75]} s={[.21,.32,.18]} c={dark} rock/>
   <Piece p={[side*.19,1.235,1.11]} s={[.12,.10,.09]} c={dark}/>
   <Piece p={[side*.195,1.24,1.156]} s={[.067,.064,.035]} c="#efb45f"/>
   {[-.46,.47].map(z=><group key={z}>
    <Piece p={[side*.31,.43,z]} s={[.25,.46,.30]} c={light}/>
    <Piece p={[side*.30,.095,z+.04]} s={[.26,.19,.35]} c={dark}/>
   </group>)}
  </group>)}
  {[-.48,-.25,-.02,.21,.44].map((z,i)=><Piece key={z} p={[0,1.17+i*.013,z]} s={[.29,.31+(boar?.09:0),.44]} c={dark} rock r={[.27,0,0]}/>)}
 </>;
}

/** shadow=false: monstro longe não faz sombra (desenha metade das vezes). */
export default function MonsterModel({kind,boss=false,reduced=false,shadow=true}:{kind:MonsterKind|HunterCompanion;boss?:boolean;reduced?:boolean;shadow?:boolean}){const root=useRef<THREE.Group>(null);useLayoutEffect(()=>root.current?bakeStatic(root.current):undefined,[kind,boss]); // peças paradas viram uma malha só (mesma aparência)
useLayoutEffect(()=>{root.current?.traverse(o=>{o.castShadow=shadow;});},[shadow,kind,boss]);useFrame(s=>{if(root.current&&!reduced)root.current.position.y=Math.sin(s.clock.elapsedTime*2)*.035;});const tone=boss?'#6a405e':kind==='wolf'?'#687581':kind==='frostcat'?'#c0d0d2':kind==='boar'?'#665144':kind==='fox'?'#a55f38':kind==='lynx'?'#967b57':kind==='crystal'?'#4b909f':'#647789';return <group ref={root} scale={boss?1.55:1}>
 {(['wolf','boar','fox','lynx','crystal','frostcat'].includes(kind))&&<><Piece p={[0,.8,0]} s={[.8,.8,1.5]} c={tone}/><Piece p={[0,1.08,.8]} s={kind==='boar'?[.75,.75,.9]:[.5,.7,.7]} c={tone}/><Piece p={[0,1.02,1.12]} s={[.44,.3,.48]} c={kind==='boar'?'#9b7b64':kind==='fox'?'#ece2c9':kind==='crystal'?'#a4e1ea':'#a6aaa9'}/>{[-1,1].map(side=><group key={side}><Piece p={[side*.28,1.47,.72]} s={[.24,.45,.22]} c={tone} cone/><Piece p={[side*.16,1.2,1.06]} s={[.1,.07,.08]} c="#e9ba76"/>{[-1,1].map(z=><Piece key={z} p={[side*.28,.35,z*.44]} s={[.25,.7,.26]} c={tone}/>)}{kind==='boar'&&<Piece p={[side*.28,.93,1.2]} s={[.15,.5,.15]} c="#e2d0aa" cone r={[.3,0,side*.25]}/>}</group>)}<Piece p={[0,1,-.85]} s={(kind==='lynx'||kind==='frostcat')?[.21,.22,.38]:kind==='fox'?[.34,.33,1.12]:[.23,.24,.95]} c={tone} r={[-.4,0,0]}/>{kind==='crystal'&&[0,1,2].map(i=><Piece key={i} p={[0,1.24,.26-i*.29]} s={[.2,.45,.2]} r={[-.25,0,0]} c="#94e2e9" cone/>)}</>}
 {kind==='owl'&&<><Piece p={[0,.55,0]} s={[.64,.88,.65]} c="#80684f"/><Piece p={[0,1.03,.15]} s={[.72,.63,.62]} c="#a48963"/><Piece p={[0,.94,.51]} s={[.13,.2,.18]} c="#d49b55" cone r={[0,0,Math.PI]}/>{[-1,1].map(side=><group key={side}><Piece p={[side*.17,1.05,.43]} s={[.22,.23,.09]} c="#dfc7a0"/><Piece p={[side*.17,1.05,.48]} s={[.1,.13,.04]} c="#222737"/><Piece p={[side*.54,.66,-.09]} s={[.82,.17,.48]} c="#6f5847" r={[0,side*.28,side*.14]}/></group>)}</>}
 {(kind==='wolf'||kind==='boar'||kind==='frostcat')&&<BeastDetail boar={kind==='boar'} cold={kind==='frostcat'}/>}
 {(kind==='stag'||kind==='beetle'||kind==='basilisk')&&<WildCreature kind={kind}/>}
 {kind==='spider'&&<>
  <Piece p={[0,.77,-.33]} s={[1.23,.87,1.40]} c={boss?'#663b58':'#433944'}/>
  <Piece p={[0,1.03,-.45]} s={[.65,.33,.78]} c={boss?'#a96a64':'#77615b'} rock/>
  <Piece p={[0,.60,.52]} s={[.72,.56,.73]} c="#4e3f50"/>
  {SIDES.map(side=><group key={side}>
   {[0,1,2,3].map(i=>{const z=-.53+i*.33;return <group key={i}>
    <Segment from={[side*.33,.60,z]} to={[side*(.86+i*.09),1.05,z-.25+i*.13]} base={.109} tip={.073} color="#594652"/>
    <Segment from={[side*(.86+i*.09),1.05,z-.25+i*.13]} to={[side*(1.48+i*.095),.06,z-.39+i*.22]} base={.076} tip={.018} color="#78626a"/>
   </group>;})}
   {[0,1,2].map(i=><Piece key={i} p={[side*(.095+i*.095),.70-i*.035,.87-i*.035]} s={[.11-i*.018,.10-i*.018,.075]} c="#ebad64"/>)}
   <Segment from={[side*.18,.51,.85]} to={[side*.14,.28,1.02]} base={.064} tip={.012} color="#d7b899"/>
  </group>)}
 </>}
 {kind==='golem'&&<><Piece p={[0,1.1,0]} s={[1.35,1.5,.9]} c={tone} rock/><Piece p={[0,2.05,.07]} s={[.72,.75,.65]} c="#839397" rock/>{[-1,1].map(side=><group key={side}><Piece p={[side*.85,1.1,0]} s={[.6,1.5,.64]} c={tone} rock/><Piece p={[side*.4,.33,0]} s={[.6,.75,.65]} c="#536574"/><Piece p={[side*.17,2.13,.37]} s={[.15,.1,.05]} c="#e7b36d"/></group>)}<Piece p={[0,1.25,.47]} s={[.38,.6,.15]} c="#9fbbd9" cone/></>}
 {kind==='wraith'&&<><Piece p={[0,1.18,0]} s={[1.05,1.9,.8]} c="#736b92" cone r={[Math.PI,0,0]}/><Piece p={[0,2,0]} s={[.64,.8,.64]} c="#3a4254"/>{[-1,1].map(side=><group key={side}><Piece p={[side*.65,1.35,0]} s={[.25,1.2,.3]} c="#968bb7" r={[0,0,side*.5]}/><Piece p={[side*.14,2.1,.33]} s={[.14,.1,.07]} c="#c8d7e6"/></group>)}<Piece p={[0,.2,0]} s={[1.2,.2,1.1]} c="#4e4b6d"/></>}
 {kind==='dragon'&&<>
  {[-1.02,-.69,-.36,-.03,.3,.63].map((z,i)=><Piece key={z} p={[0,1.82+i*.05,z]} s={[.3,.44+(i%3)*.14,.44]} c="#b08b80" cone r={[-.38,0,0]}/>)}
<Piece p={[0,1.1,0]} s={[1.5,1.5,2.5]} c="#674657"/><Piece p={[0,2,1]} s={[.8,1.2,.8]} c="#7e5868"/><Piece p={[0,2.5,1.4]} s={[.7,.65,1.15]} c="#836170"/><Piece p={[0,1.1,-1.5]} s={[.4,.4,2.1]} c="#674657" r={[-.35,0,0]}/>{[-1,1].map(side=><group key={side}><Piece p={[side*.5,.35,.3]} s={[.5,.8,.55]} c="#674657"/><Piece p={[side*.24,2.95,1.15]} s={[.14,.7,.14]} c="#d5c396" cone r={[0,0,side*-.25]}/><Piece p={[side*.25,2.6,1.89]} s={[.13,.09,.08]} c="#f1bb73"/><mesh position={[side*1.45,1.9,-.3]} rotation={[0,0,side*.42]}><coneGeometry args={[1.35,2.4,3]}/><meshStandardMaterial color="#805d7f" side={THREE.DoubleSide} roughness={.9}/></mesh></group>)}</>}
 </group>;}
