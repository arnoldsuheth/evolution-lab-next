"use client";

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { cursorOn } from '@/lib/cursor';
import { CLASSES, DEFAULT_LOOK, RACE_CLASSES, type ClassId, type Race } from '@/lib/game';
import { RACIAL_CITIES, trainerHouses, type RacialCity } from '@/lib/kingdomCities';
import { useGame } from '@/lib/store';
import Character from './Character';

const MATERIALS = {
  aurora: ['#b8ab94','#475477'],
  'iron-forge': ['#728996','#526471'],
  gnomolandia: ['#738089','#875637'],
  bosque: ['#977554','#365e46'],
  ogrimmar: ['#955a44','#573630'],
} as const;

function Trainer({race, classId, index, door}: {race:Race;classId:ClassId;index:number;door:number}) {
  const model = useRef<Group>(null);
  const reduced = useGame(s=>s.settings.reduceMotion);
  useFrame(({clock})=>{
    const npc=model.current;
    if (!npc || reduced) return;
    const phase=clock.elapsedTime*.45+index*1.4;
    npc.position.z=door-.28+Math.sin(phase)*.78;
    npc.rotation.y=Math.cos(phase)>=0?0:Math.PI;
  });
  return <group ref={model} position={[0,0,door-.28]}>
    {/* Mestres montados igual aos heróis; “Mestra” tem corpo feminino. */}
    <Character race={race} classId={classId} animated={!reduced} walking={!reduced} equipped={[]}
      look={{...DEFAULT_LOOK,gender:index%2,body:1+index%4,hair:[1,3,2,5,10,11][index%6],hairColor:(index+1)%5,beard:race==='dwarf'?index%6:index%2?0:2,skin:index%3,face:index%6}} />
  </group>;
}

export default function TrainerDistrict({city, paused, approach, openJourney}: {
  city:RacialCity;
  paused:boolean;
  approach:(x:number,z:number,action:()=>void)=>void;
  openJourney:()=>void;
}) {
  const position=useGame(s=>s.hero.position);
  const race=RACIAL_CITIES[city].race;
  const [wall,roof]=MATERIALS[city];
  return <group>{trainerHouses(city).map(({x,z,w,d},index)=>{
    const classId=RACE_CLASSES[race][index];
    const accent=CLASSES[classId].color;
    const name=`${index%2?'Mestra':'Mestre'} de ${CLASSES[classId].name}`;
    return <group key={classId} position={[x,0,z]} {...cursorOn('talk')} onClick={event=>{
      if (paused || event.button!==0 || event.delta>6) return;
      event.stopPropagation();
      approach(x,z+.4,()=>{
        const state=useGame.getState();
        if (state.hero.classInitiated===false && state.hero.race===race) state.trainClass(classId);
        else openJourney();
      });
    }}>
      <mesh position={[0,.035,0]} receiveShadow><boxGeometry args={[2*w,.07,2*d]}/><meshStandardMaterial color="#8c7359"/></mesh>
      <mesh position={[0,1.07,-d]}><boxGeometry args={[2*w,2.14,.23]}/><meshStandardMaterial color={wall}/></mesh>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[side*w,1.07,0]}><boxGeometry args={[.22,2.14,2*d]}/><meshStandardMaterial color={wall}/></mesh>
        <mesh position={[side*(w+.57)/2,1.07,d]}><boxGeometry args={[w-.57,2.14,.22]}/><meshStandardMaterial color={wall}/></mesh>
        <mesh position={[side*.64,1.84,d+.13]}><boxGeometry args={[.13,.25,.11]}/><meshStandardMaterial color="#eac083" emissive="#a87539" emissiveIntensity={.65}/></mesh>
      </group>)}
      <mesh position={[0,2.32,-d*.56]} rotation={[.23,0,0]} castShadow><boxGeometry args={[2*w+.23,.16,d*.95]}/><meshStandardMaterial color={roof}/></mesh>
      <mesh position={[0,2.18,d]}><boxGeometry args={[2*w+.12,.18,.27]}/><meshStandardMaterial color={roof}/></mesh>
      <mesh position={[0,2.32,d+.18]}><boxGeometry args={[.82,.22,.08]}/><meshStandardMaterial color={accent}/></mesh>
      <mesh position={[0,.04,d+.36]} receiveShadow><boxGeometry args={[1.12,.08,.9]}/><meshStandardMaterial color="#ad9a7d"/></mesh>
      <Trainer race={race} classId={classId} index={index} door={d}/>
      {Math.hypot(position[0]-x,position[1]-z)<6 &&
        <Html center position={[0,2.78,d]} style={{pointerEvents:'none'}}><span className="town-sign trainer-name">{name}</span></Html>}
    </group>;
  })}</group>;
}
