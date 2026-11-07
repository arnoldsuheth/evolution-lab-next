"use client";
import {enemyVitals} from '@/lib/combat';
import {cursorOn} from "@/lib/cursor";
import BiomeDetails from './BiomeDetails';
import {Html} from '@react-three/drei';
import {useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';

import {MONSTERS,REGIONS,nextRegion} from '@/lib/campaign';
import {INSTANCES,type InstanceId} from '@/lib/instances';
import {useGame} from '@/lib/store';
import {adventureOf,rareNow} from '@/lib/adventure';
import {doorsOf} from '@/lib/dungeon';
import MonsterModel from './MonsterModel';
/** Só desenha monstros que cabem na tela (com folga); só os próximos fazem sombra. Deixa o jogo bem mais leve. */
const VIEW_RADIUS=34,SHADOW_RADIUS=16;
/** Reação do monstro: treme ao levar golpe e avança quando ataca de volta. */
function Reacting({x,z,reduced,children}:{x:number;z:number;reduced:boolean;children:ReactNode}){
 const root=useRef<THREE.Group>(null);
 useFrame(()=>{const g=root.current;if(!g)return;const e=useGame.getState().battleEvent;const age=e?(Date.now()-e.time)/1000:9;if(reduced||!e||Math.abs(e.x-x)>.01||Math.abs(e.z-z)>.01||age>1){g.position.set(0,0,0);g.scale.setScalar(1);return;}
  const hit=age<.35?Math.sin(age*60)*.12*(1-age/.35):0,squash=age<.25?1-Math.sin(age/.25*Math.PI)*.12:1;
  const lunge=e.received>0&&age>.35&&age<.8?Math.sin((age-.35)/.45*Math.PI)*.9:0,dx=e.hx-x,dz=e.hz-z,len=Math.hypot(dx,dz)||1;
  g.position.set(hit+dx/len*lunge,0,dz/len*lunge);g.scale.set(1/squash,squash,1/squash);});
 return <group ref={root}>{children}</group>;
}
export default function CampaignWorld({paused,approach}:{paused:boolean;approach:(id:string)=>void}){
 const enemy=useGame(s=>s.encounter),target=useGame(s=>s.target);const slain=useGame(s=>s.slain),now=useGame(s=>s.now);const hero=useGame(s=>s.hero),reduced=useGame(s=>s.settings.reduceMotion),next=nextRegion(hero.region);
 const adv=adventureOf(hero),rare=hero.instance?null:rareNow(now,hero.region),rareId=rare&&adv.rareDone!==rare.window?rare.monsterId:null;
 const monsters=MONSTERS.filter(m=>m.region===hero.region&&(m.instance??null)===(hero.instance??null)&&(!hero.instance||!hero.instanceProgress?.includes(m.id))&&(slain[m.id]??0)<=now&&(Math.hypot(hero.position[0]-m.x,hero.position[1]-m.z)<VIEW_RADIUS||enemy?.monsterId===m.id||target===m.id)).map(m=>{const active=enemy?.monsterId===m.id?enemy:undefined,vitals=active??enemyVitals(m.kind,m.level,m.boss),near=Math.hypot(hero.position[0]-m.x,hero.position[1]-m.z)<6||target===m.id,isRare=rareId===m.id;return <group key={m.id} position={[m.x,0,m.z]} {...cursorOn("combat")} onClick={e=>{if(paused||e.delta>6||e.button!==0)return;e.stopPropagation();approach(m.id);}}><Reacting x={m.x} z={m.z} reduced={reduced}><group scale={isRare?1.3:1}><MonsterModel kind={m.kind} boss={m.boss} reduced={reduced} shadow={Math.hypot(hero.position[0]-m.x,hero.position[1]-m.z)<SHADOW_RADIUS}/></group></Reacting>{isRare&&!active&&target!==m.id&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.05,0]}><ringGeometry args={[1.5,1.75,40]}/><meshBasicMaterial color="#ffcf3a" transparent opacity={.9} depthWrite={false}/></mesh>}{(target===m.id||active)&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.06,0]}><ringGeometry args={[m.boss?1.9:1.2,m.boss?2.15:1.4,40]}/><meshBasicMaterial color={active?'#ff5a4a':'#ffd24a'} transparent opacity={.85} depthWrite={false}/></mesh>}{(near||active)&&<Html zIndexRange={[6,0]} position={[0,m.boss?4.4:2.8,0]} center style={{pointerEvents:'none'}}><div className={`monster-vitals ${active?'targeted':''}`} aria-label={`${m.name}, nível ${active?.level??m.level}`}>
 {(near||active||m.boss||isRare)&&<strong className={isRare?'rare-name':''}>{m.boss?'◆ ':isRare?'✦ ':''}{m.name}{isRare?' raro':''} <small>{active?.level??m.level}</small></strong>}
 <div className="world-resource health" role="meter" aria-label="HP" aria-valuemin={0} aria-valuemax={vitals.maxHp} aria-valuenow={active?.hp??vitals.maxHp}><i style={{width:`${(active?.hp??vitals.maxHp)/vitals.maxHp*100}%`}}/><span>HP</span></div>
 <div className={`world-resource ${vitals.resource}`} role="meter" aria-label={vitals.resource==='mp'?'MP':'Estamina'} aria-valuemin={0} aria-valuemax={vitals.resourceMax??100} aria-valuenow={vitals.resourceCurrent??100}><i style={{width:`${(vitals.resourceCurrent??100)/(vitals.resourceMax??100)*100}%`}}/><span>{vitals.resource==='mp'?'MP':'STA'}</span></div>
 </div></Html>}</group>;});
 const gate=(position:[number,number,number],label:string,action:()=>void)=><group position={position} {...cursorOn("point")} onClick={e=>{if(paused||e.delta>6||e.button!==0)return;e.stopPropagation();action();}}><mesh position={[0,1.5,0]}><torusGeometry args={[1.2,.2,8,32]}/><meshStandardMaterial color="#b7a5c9" emissive="#80629e" emissiveIntensity={.5}/></mesh>{Math.hypot(hero.position[0]-position[0],hero.position[1]-position[2])<9&&<Html zIndexRange={[6,0]} position={[0,3.3,0]} center style={{pointerEvents:"none"}}><span className="gate-label">{label}</span></Html>}</group>;
 const doors=hero.instance?doorsOf(hero.instance):[],firstClosed=doors.find(d=>!adv.doors.includes(d.id));
 const openDoor=(id:string)=>{if(!paused)window.dispatchEvent(new CustomEvent('lions-cave-door',{detail:id}));};
 const doorMeshes=doors.map(d=>{const isOpen=adv.doors.includes(d.id),next=firstClosed?.id===d.id;return <group key={d.id} position={[0,0,d.z]}>{isOpen?<mesh rotation={[-Math.PI/2,0,0]} position={[0,.05,0]}><planeGeometry args={[25,.35]}/><meshBasicMaterial color="#8be0a0" transparent opacity={.7}/></mesh>:<mesh position={[0,1.6,0]} {...cursorOn('point')} onClick={e=>{if(e.delta>6||e.button!==0)return;e.stopPropagation();openDoor(d.id);}}><boxGeometry args={[25.4,3.2,.3]}/><meshStandardMaterial color="#7fd3ff" emissive="#3a8fd0" emissiveIntensity={next?.9:.4} transparent opacity={next?.55:.3}/></mesh>}<Html zIndexRange={[6,0]} position={[0,3.9,0]} center>{next?<button className="gate-label door-label" onClick={()=>openDoor(d.id)}>🔒 Sala {d.room} · {d.title} · abrir com código</button>:<span className="gate-label">{isOpen?'🔓':'🔒'} Sala {d.room}</span>}</Html></group>;});
 if(hero.instance)return <group>{monsters}{doorMeshes}<mesh position={[0,.02,-5]} receiveShadow><boxGeometry args={[26,.04,38]}/><meshStandardMaterial color={hero.instance==='cavern'?'#53636a':'#8b8375'}/></mesh>{[-1,1].map(side=><group key={side}><mesh position={[side*13,2.5,-5]}><boxGeometry args={[.6,5,38]}/><meshStandardMaterial color="#414c57"/></mesh>{[0,1,2,3].map(i=><mesh key={i} position={[side*11.5,1.2,7-i*8]}><cylinderGeometry args={[.5,.8,2.4,hero.instance==='cavern'?5:12]}/><meshStandardMaterial color={hero.instance==='cavern'?'#89c4d0':'#d4c59e'} emissive="#40535d" emissiveIntensity={.4}/></mesh>)}</group>)}<mesh position={[0,2.5,-24]}><boxGeometry args={[26,5,.6]}/><meshStandardMaterial color="#414c57"/></mesh>{gate([0,0,10],'Sair · '+INSTANCES[hero.instance].name,()=>useGame.getState().leaveInstance())}<Html position={[0,5,-22]} center style={{pointerEvents:'none'}}><span className="gate-label">{INSTANCES[hero.instance].name} · XP ×2</span></Html></group>;
 return <group>{monsters}{hero.region!=='aurora'&&gate([0,0,10],'Voltar a Pedra da Aurora',()=>useGame.getState().travelRegion('aurora'))}{next&&gate(hero.region==='aurora'?[25,0,-18]:[8,0,-24],'Portal · '+REGIONS[next].name,()=>useGame.getState().travelRegion(next))}{(Object.entries(INSTANCES) as [InstanceId,typeof INSTANCES[InstanceId]][]).filter(([,place])=>place.region===hero.region).map(([id,place])=><group key={id}>{gate([place.x,0,place.z],`${place.name} · nível ${place.level}+ · XP ×2`,()=>useGame.getState().enterInstance(id))}</group>)}{hero.region!=='aurora'&&<><BiomeDetails region={hero.region}/><mesh position={[2,.02,-19]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.6,4,48]}/><meshStandardMaterial color="#c3a77b" emissive="#756b67" emissiveIntensity={.25}/></mesh></>}</group>;
}
