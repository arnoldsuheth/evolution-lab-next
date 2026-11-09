"use client";
import {useEffect,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {useGame} from '@/lib/store';
import {ORE_VEINS} from '@/lib/mining';
import {GATHER_NODES} from '@/lib/quests';
import {WORLD_UNLOCKS} from '@/lib/town';
import {cursorOn} from '@/lib/cursor';

/** Ervas e cristais que brilham no chão; um clique leva o herói até lá e coleta. */
export default function GatherNodes({paused,approach}:{paused:boolean;approach:(id:string,x:number,z:number)=>void}){
 const region=useGame(s=>s.hero.region),instance=useGame(s=>s.hero.instance??null);
 const forest=useGame(s=>s.education.completed.includes('variables'));
 const gathered=useGame(s=>s.gathered),now=useGame(s=>s.now),root=useRef<THREE.Group>(null);
 useFrame(({clock})=>{root.current?.children.forEach((g,i)=>{g.position.y=.08+Math.sin(clock.elapsedTime*2+i)*.05;g.rotation.y=clock.elapsedTime*.6+i;});});
 return <><group>{ORE_VEINS.filter(vein=>(vein.region??'aurora')===region&&(vein.instance??null)===instance).map(vein=>(gathered[vein.id]??0)>now||(!forest&&vein.id==='vein-iron-forest')?null:
   <group key={vein.id} position={[vein.x,0,vein.z]} {...cursorOn('point')} onClick={event=>{
    if(paused||event.delta>6||event.button!==0)return;
    event.stopPropagation();approach(vein.id,vein.x,vein.z);
   }}>
    <mesh position={[0,.27,0]} scale={[1.3,.7,1]}><dodecahedronGeometry args={[.58,0]}/><meshStandardMaterial color="#545553" flatShading/></mesh>
    <mesh position={[.21,.5,.15]} rotation={[.2,0,.35]}><octahedronGeometry args={[.25]}/><meshStandardMaterial color={vein.color} flatShading/></mesh>
    <Html center position={[0,1.15,0]} style={{pointerEvents:'none'}}><span className="town-sign">{vein.name}</span></Html>
   </group>)}</group><group ref={root}>{region==='aurora'&&!instance&&GATHER_NODES.map(n=>(gathered[n.id]??0)>now?null:<group key={n.id} position={[n.x,0,n.z]} {...cursorOn('point')} onClick={e=>{if(paused||e.delta>6||e.button!==0)return;e.stopPropagation();approach(n.id,n.x,n.z);}}>
  {n.node==='herb'?<>{[0,1,2,3].map(i=><mesh key={i} position={[Math.cos(i*1.57)*.12,.3,Math.sin(i*1.57)*.12]} rotation={[Math.cos(i*1.57)*.5,0,Math.sin(i*1.57)*.5]}><coneGeometry args={[.09,.55,5]}/><meshStandardMaterial color="#6fdc8c" emissive="#2fae5c" emissiveIntensity={.7}/></mesh>)}<mesh position={[0,.62,0]}><sphereGeometry args={[.1,10,8]}/><meshStandardMaterial color="#fff6a8" emissive="#ffe066" emissiveIntensity={1.4}/></mesh></>
  :<><mesh position={[0,.45,0]} scale={[1,1.8,1]}><octahedronGeometry args={[.22]}/><meshStandardMaterial color="#c9a8ff" emissive="#8a5cff" emissiveIntensity={1.1} roughness={.25}/></mesh><mesh position={[.22,.25,.05]} scale={[1,1.6,1]}><octahedronGeometry args={[.11]}/><meshStandardMaterial color="#c9a8ff" emissive="#8a5cff" emissiveIntensity={1}/></mesh></>}
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.03,0]}><ringGeometry args={[.35,.45,24]}/><meshBasicMaterial color={n.node==='herb'?'#a6f5b8':'#d9c4ff'} transparent opacity={.55} depthWrite={false}/></mesh>
 </group>)}</group></>;
}

/** Quando uma runa é restaurada, o lugar que ela muda ganha um brilho e um aviso com o que aconteceu. */
export function WorldUnlocks(){
 const completed=useGame(s=>s.education.completed),seen=useRef<string[]|null>(null),[show,setShow]=useState<{x:number;z:number;title:string;time:number}|null>(null),burst=useRef<THREE.Group>(null);
 useEffect(()=>{
  if(seen.current===null){seen.current=completed;return;}
  const fresh=WORLD_UNLOCKS.find(u=>completed.includes(u.lesson)&&!seen.current!.includes(u.lesson));seen.current=completed;
  if(!fresh)return;
  const timer=setTimeout(()=>{setShow({x:fresh.x,z:fresh.z,title:fresh.title,time:performance.now()});useGame.setState({notice:`✦ ${fresh.title} ${fresh.text}`});},0);
  const end=setTimeout(()=>setShow(null),4500);return()=>{clearTimeout(timer);clearTimeout(end);};
 },[completed]);
 useFrame(()=>{const g=burst.current;if(!g||!show)return;const age=(performance.now()-show.time)/1000;g.children.forEach((c,i)=>{if(i===0){c.scale.setScalar(1+age*3);((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=Math.max(0,.8-age*.25);}else{const a=i*.9+age;c.position.set(Math.cos(a)*(1+age*.6),.4+((age*1.6+i*.3)%3),Math.sin(a)*(1+age*.6));}});});
 if(!show)return null;
 return <group position={[show.x,0,show.z]}><group ref={burst}><mesh rotation={[-Math.PI/2,0,0]} position={[0,.08,0]}><ringGeometry args={[.8,1,40]}/><meshBasicMaterial color="#ffe28a" transparent opacity={.8} depthWrite={false}/></mesh>{Array.from({length:14},(_,i)=><mesh key={i}><octahedronGeometry args={[.12]}/><meshBasicMaterial color={i%2?'#fff3b0':'#9fe8ff'}/></mesh>)}</group>
  <Html center position={[0,4,0]} zIndexRange={[9,0]} style={{pointerEvents:'none'}}><div className="unlock-banner">✦ {show.title}</div></Html></group>;
}
