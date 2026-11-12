"use client";
import {isRangedClass} from "@/lib/combatEffects";
import {enemyVitals} from '@/lib/combat';
import {cursorOn} from "@/lib/cursor";
import BiomeDetails from './BiomeDetails';
import {Html} from '@react-three/drei';
import {useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';

import {isNewCity} from "@/lib/kingdomCities";
import {monsterPoint} from '@/lib/patrols';
import {MONSTERS,REGIONS,campaignGate,isAggressive,nextRegion,type Monster} from '@/lib/campaign';
import {INSTANCES,type InstanceId} from '@/lib/instances';
import {useGame} from '@/lib/store';
import {adventureOf,rareNow} from '@/lib/adventure';
import {doorsOf} from '@/lib/dungeon';
import NullarionSanctum from './NullarionSanctum';
import RealmEntrance from './RealmEntrance';
import MonsterModel from './MonsterModel';
/** Só desenha monstros que cabem na tela (com folga); só os próximos fazem sombra. Deixa o jogo bem mais leve. */
const VIEW_RADIUS=34,SHADOW_RADIUS=16;
/** Reação do monstro: treme ao levar golpe e avança quando ataca de volta. */
function Reacting({monster,fight,reduced,children}:{monster:Monster;fight?:[number,number];reduced:boolean;children:ReactNode}){
 const root=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{
  const g=root.current;
  if(!g)return;
  const state=useGame.getState(),now=Date.now();
  const [x,z]=fight??[monster.x,monster.z];
  if(!reduced&&(fight||monster.id.startsWith('wild-'))){
   const origin=fight??monsterPoint(monster,now-100);
   const destination=fight?state.hero.position:monsterPoint(monster,now+100);
   const dx=destination[0]-origin[0],dz=destination[1]-origin[1];
   if(Math.hypot(dx,dz)>.025){
    const turn=Math.atan2(dx,dz)-g.rotation.y;
    g.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*8);
   }
  }
  const e=state.battleEvent;const age=e?(now-e.time)/1000:9;if(reduced||!e||Math.abs(e.x-x)>.01||Math.abs(e.z-z)>.01||age>1){g.position.set(0,0,0);g.scale.setScalar(1);return;}
  const hit=age<.35?Math.sin(age*60)*.12*(1-age/.35):0,squash=age<.25?1-Math.sin(age/.25*Math.PI)*.12:1;
  const lunge=e.received>0&&age>.35&&age<.8?Math.sin((age-.35)/.45*Math.PI)*.9:0,dx=e.hx-x,dz=e.hz-z,len=Math.hypot(dx,dz)||1;
  g.position.set(hit+dx/len*lunge,0,dz/len*lunge);g.scale.set(1/squash,squash,1/squash);});
 return <group ref={root}>{children}</group>;
}
function Patrolling({monster,fight,children}:{monster:Monster;fight?:[number,number];children:ReactNode}){
 const ref=useRef<THREE.Group>(null);
 useFrame(()=>{
  const [x,z]=fight??monsterPoint(monster,Date.now());
  ref.current?.position.set(x-monster.x,0,z-monster.z);
 });
 return <group ref={ref}>{children}</group>;
}

export default function CampaignWorld({paused,approach,approachGate}:{paused:boolean;approach:(id:string)=>void;approachGate:(x:number,z:number,open:()=>void)=>void}){
 const enemy=useGame(s=>s.encounter),target=useGame(s=>s.target);const slain=useGame(s=>s.slain),now=useGame(s=>s.now);const hero=useGame(s=>s.hero),reduced=useGame(s=>s.settings.reduceMotion),next=nextRegion(hero.region);
 const adv=adventureOf(hero),rare=hero.instance?null:rareNow(now,hero.region),rareId=rare&&adv.rareDone!==rare.window?rare.monsterId:null;
 const low=useGame(s=>s.settings.quality==="low");
 const ranged=isRangedClass(hero.classId),viewRadius=low?(ranged?34:28):ranged?42:VIEW_RADIUS;
 const monsters=MONSTERS.filter(m=>m.region===hero.region&&(m.instance??null)===(hero.instance??null)&&(!hero.instance||!hero.instanceProgress?.includes(m.id))&&(slain[m.id]??0)<=now&&(Math.hypot(hero.position[0]-m.x,hero.position[1]-m.z)<viewRadius||enemy?.monsterId===m.id||target===m.id)).map(m=>{const active=enemy?.monsterId===m.id?enemy:undefined,vitals=active??enemyVitals(m.kind,m.level,m.boss),near=Math.hypot(hero.position[0]-m.x,hero.position[1]-m.z)<(ranged?9:6),isRare=rareId===m.id;return <group key={m.id} position={[m.x,0,m.z]} {...cursorOn("combat")} onClick={e=>{if(paused||e.delta>6||e.button!==0)return;e.stopPropagation();approach(m.id);}}><Patrolling monster={m} fight={active?.position}><Reacting monster={m} fight={active?.position} reduced={reduced}><group scale={isRare?1.3:1}><MonsterModel kind={m.kind} boss={m.boss} reduced={reduced} shadow={Math.hypot(hero.position[0]-m.x,hero.position[1]-m.z)<(low?9:SHADOW_RADIUS)}/></group></Reacting>{isRare&&!active&&target!==m.id&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.05,0]}><ringGeometry args={[1.5,1.75,40]}/><meshBasicMaterial color="#ffcf3a" transparent opacity={.9} depthWrite={false}/></mesh>}{(target===m.id||active)&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.06,0]}><ringGeometry args={[m.boss?1.9:1.2,m.boss?2.15:1.4,40]}/><meshBasicMaterial color={active?'#ff5a4a':'#ffd24a'} transparent opacity={.85} depthWrite={false}/></mesh>}{(near||active||target===m.id)&&<Html zIndexRange={[6,0]} position={[0,m.boss?4.4:2.8,0]} center style={{pointerEvents:'none'}}><div className={`monster-vitals ${active?'targeted':''}`} aria-label={`${m.name}, nível ${active?.level??m.level}`}>
 {(near||active||target===m.id||m.boss||isRare)&&<strong className={isRare?'rare-name':''}>{m.boss?'◆ ':isRare?'✦ ':isAggressive(m)?'⚠ ':''}{m.name}{isRare?' raro':''} <small>{active?.level??m.level}</small></strong>}
 <div className="world-resource health" role="meter" aria-label="HP" aria-valuemin={0} aria-valuemax={vitals.maxHp} aria-valuenow={active?.hp??vitals.maxHp}><i style={{width:`${(active?.hp??vitals.maxHp)/vitals.maxHp*100}%`}}/><span>HP</span></div>
 <div className={`world-resource ${vitals.resource}`} role="meter" aria-label={vitals.resource==='mp'?'MP':'Estamina'} aria-valuemin={0} aria-valuemax={vitals.resourceMax??100} aria-valuenow={vitals.resourceCurrent??100}><i style={{width:`${(vitals.resourceCurrent??100)/(vitals.resourceMax??100)*100}%`}}/><span>{vitals.resource==='mp'?'MP':'STA'}</span></div>
 </div></Html>}</Patrolling></group>;});
 const gate=(point:[number,number],label:string,action:()=>void)=>
  <RealmEntrance point={point} label={label} kind="portal" paused={paused}
    onEnter={()=>approachGate(...point,action)}/>;
 const doors=hero.instance?doorsOf(hero.instance):[],firstClosed=doors.find(d=>!adv.doors.includes(d.id));
 const openDoor=(id:string)=>{if(!paused)window.dispatchEvent(new CustomEvent('lions-cave-door',{detail:id}));};
 const doorMeshes=doors.map(d=>{const isOpen=adv.doors.includes(d.id),next=firstClosed?.id===d.id;return <group key={d.id} position={[0,0,d.z]}>{isOpen?<mesh rotation={[-Math.PI/2,0,0]} position={[0,.05,0]}><planeGeometry args={[25,.35]}/><meshBasicMaterial color="#8be0a0" transparent opacity={.7}/></mesh>:<mesh position={[0,1.6,0]} {...cursorOn('point')} onClick={e=>{if(e.delta>6||e.button!==0)return;e.stopPropagation();openDoor(d.id);}}><boxGeometry args={[25.4,3.2,.3]}/><meshStandardMaterial color="#7fd3ff" emissive="#3a8fd0" emissiveIntensity={next?.9:.4} transparent opacity={next?.55:.3}/></mesh>}{Math.hypot(hero.position[0],hero.position[1]-d.z)<9&&<Html zIndexRange={[6,0]} position={[0,3.9,0]} center>{next?<button className="gate-label door-label" onClick={()=>openDoor(d.id)}>🔒 Sala {d.room} · {d.title} · abrir com código</button>:<span className="gate-label">{isOpen?'🔓':'🔒'} Sala {d.room}</span>}</Html>}</group>;});
 if(hero.instance)return <group>{monsters}{doorMeshes}<mesh position={[0,.02,-5]} receiveShadow><boxGeometry args={[26,.04,38]}/><meshStandardMaterial color={hero.instance==='cavern'?'#53636a':'#8b8375'}/></mesh>{[-1,1].map(side=><group key={side}><mesh position={[side*13,2.5,-5]}><boxGeometry args={[.6,5,38]}/><meshStandardMaterial color="#414c57"/></mesh>{[0,1,2,3].map(i=><mesh key={i} position={[side*11.5,1.2,7-i*8]}><cylinderGeometry args={[.5,.8,2.4,hero.instance==='cavern'?5:12]}/><meshStandardMaterial color={hero.instance==='cavern'?'#89c4d0':'#d4c59e'} emissive="#40535d" emissiveIntensity={.4}/></mesh>)}</group>)}<mesh position={[0,2.5,-24]}><boxGeometry args={[26,5,.6]}/><meshStandardMaterial color="#414c57"/></mesh>{gate([0,10],'Sair · '+INSTANCES[hero.instance].name,()=>useGame.getState().leaveInstance())}<Html position={[0,5,-22]} center style={{pointerEvents:'none'}}><span className="gate-label">{INSTANCES[hero.instance].name} · XP ×2</span></Html></group>;
 const entrances=(Object.entries(INSTANCES) as [InstanceId,typeof INSTANCES[InstanceId]][])
  .filter(([,place])=>place.region===hero.region)
  .map(([id,place])=><RealmEntrance key={id} point={[place.x,place.z]} kind={place.kind}
    color={id==='wood-rift'?'#89da9f':id==='eclipse-rift'?'#bf9aef':undefined}
    label={`${place.name} · nível ${place.level}+`} paused={paused}
    onEnter={()=>approachGate(place.x,place.z,()=>useGame.getState().enterInstance(id))}/>);

 if(isNewCity(hero.region))return <group>{monsters}{entrances}</group>;
 return <group>{monsters}{hero.region!=='aurora'&&gate([0,10],'Voltar a Pedra da Aurora',()=>useGame.getState().travelRegion('aurora'))}{next&&gate(campaignGate(hero.region,next)!,'Portal · '+REGIONS[next].name,()=>useGame.getState().travelRegion(next))}{entrances}{hero.region!=='aurora'&&<><BiomeDetails region={hero.region}/>{hero.region==="heart"&&<NullarionSanctum/>}<mesh position={[2,.02,-19]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.6,4,48]}/><meshStandardMaterial color="#c3a77b" emissive="#756b67" emissiveIntensity={.25}/></mesh></>}</group>;
}
