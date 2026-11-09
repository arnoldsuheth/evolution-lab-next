"use client";

import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { CLASSES, RACE_CLASSES, type ClassId } from "@/lib/game";
import { cityBuildings, cityPortal, goddardExit, CITY_BANK, GODDARD_BOOLE, CITY_FORGE, CITY_WAGON, RACIAL_CITIES, type NewCity } from "@/lib/kingdomCities";
import { useGame } from "@/lib/store";
import { cursorOn } from "@/lib/cursor";
import Character from "./Character";
import { DEFAULT_LOOK } from "@/lib/game";

const STYLE = {
  "iron-forge": ["#728996","#b1cad2","#64737e"],
  gnomolandia: ["#577981","#b27450","#c1975d"],
  bosque: ["#977554","#365e46","#86a475"],
  ogrimmar: ["#955a44","#573630","#ca8762"],
  goddard: ["#b9b7ae","#5b6999","#e2b779"],
} as const;

type Service = "bank" | "wagon" | "academy" | "codex" | "mounts" | "journey" | "workshop";
export default function RacialCity({ city, paused, approach, openService, openStory }: {
  city: NewCity;
  paused: boolean;
  approach: (x: number, z: number, action: () => void) => void;
  openService: (id: Service) => void;
  openStory: () => void;
}) {
  const hero = useGame(s => s.hero);
  const [wall,roof,trim] = STYLE[city];
  const origin = city === "goddard" ? undefined : RACIAL_CITIES[city];
  const classes = origin ? RACE_CLASSES[origin.race] : [];
  const structures = cityBuildings(city);
  const [px,pz] = cityPortal(city);
  function activate(e: ThreeEvent<MouseEvent>, x: number, z: number, action: () => void) {
    if (paused || e.delta > 6 || e.button !== 0) return;
    e.stopPropagation();
    approach(x,z,action);
  }
  const landmark = (id:string,label:string,x:number,z:number,action:()=>void,portal=false) =>
    <group key={id} position={[x,0,z]} {...cursorOn("point")} onClick={e=>activate(e,x,z,action)}>
      {portal ? <mesh position={[0,1.35,0]}><torusGeometry args={[1,.16,7,24]}/><meshStandardMaterial color="#d4b9ed" emissive="#7056ac" emissiveIntensity={.7}/></mesh>
        : <mesh position={[0,.6,0]}><boxGeometry args={[1.65,1.2,.7]}/><meshStandardMaterial color={trim}/></mesh>}
      {Math.hypot(hero.position[0]-x,hero.position[1]-z)<11 && <Html center position={[0,2.7,0]} style={{pointerEvents:"none"}}><span className="town-sign">{label}</span></Html>}
    </group>;
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.018,-2]}><planeGeometry args={[city==="goddard"?37:5,city==="goddard"?27:25]}/><meshStandardMaterial color={city==="goddard"?"#a7adc1":trim}/></mesh>
    {city==="goddard" && [-17,17].flatMap(x=>[-16,9].map(z=><group key={x+":"+z} position={[x,0,z]}>
      <mesh position={[0,2.1,0]}><cylinderGeometry args={[1.05,1.25,4.2,8]}/><meshStandardMaterial color={wall}/></mesh>
      <mesh position={[0,4.7,0]}><coneGeometry args={[1.27,1.7,8]}/><meshStandardMaterial color={roof}/></mesh>
    </group>))}
    {structures.map((b,i)=><group key={b.x+":"+b.z} position={[b.x,0,b.z]}>
      {city!=="goddard"&&i>=2?<group>
        <mesh position={[0,.03,0]} receiveShadow><boxGeometry args={[b.w*2,.06,b.d*2]}/><meshStandardMaterial color={trim}/></mesh>
        <mesh position={[0,1.15,-b.d]}><boxGeometry args={[b.w*2,2.3,.25]}/><meshStandardMaterial color={wall}/></mesh>
        {[-1,1].map(side=><group key={side}>
          <mesh position={[side*b.w,1.1,0]}><boxGeometry args={[.28,2.2,b.d*2]}/><meshStandardMaterial color={wall}/></mesh>
          <mesh position={[side*(b.w+.88)/2,1.1,b.d]}><boxGeometry args={[b.w-.88,2.2,.25]}/><meshStandardMaterial color={wall}/></mesh>
        </group>)}
      </group>:<mesh position={[0,1.2,0]} castShadow><boxGeometry args={[b.w*2,2.4,b.d*2]}/><meshStandardMaterial color={wall}/></mesh>}
      {(i<2||city==="goddard")&&(city==="iron-forge" ? <mesh position={[0,2.65,-.35]}><dodecahedronGeometry args={[2.25,0]}/><meshStandardMaterial color={roof} flatShading/></mesh>
        : <mesh position={[0,city==="bosque"?3.45:2.95,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[Math.max(b.w,b.d)*1.52,1.35,4]}/><meshStandardMaterial color={roof}/></mesh>)}
      {(i<2||city==="goddard")&&<mesh position={[0,1,b.d+.035]}><boxGeometry args={[.93,1.75,.09]}/><meshStandardMaterial color={trim}/></mesh>}
      {city==="gnomolandia"&&<mesh position={[b.w-.3,2.7,-.4]}><cylinderGeometry args={[.3,.45,3,8]}/><meshStandardMaterial color={trim}/></mesh>}
      {city==="bosque"&&<mesh position={[0,.65,0]}><cylinderGeometry args={[.32,.55,1.4,7]}/><meshStandardMaterial color="#584437"/></mesh>}
      {i===0&&city==="goddard"&&<mesh position={[0,4.1,0]}><octahedronGeometry args={[.45]}/><meshStandardMaterial color="#d5bcff" emissive="#754bb0" emissiveIntensity={.8}/></mesh>}
    </group>)}
    {origin && <>
      {classes.map((classId:ClassId,i)=>{
        const b=structures[i+2],x=b.x,z=b.z+.4;
        const near=Math.hypot(hero.position[0]-x,hero.position[1]-z)<9;
        return <group key={classId} position={[x,0,z]} {...cursorOn("point")} onClick={e=>activate(e,x,z,()=>{const h=useGame.getState().hero;if(h.classInitiated===false)useGame.getState().trainClass(classId);else openService("journey");})}>
          <Character race={origin.race} classId={classId} organic look={{...DEFAULT_LOOK,body:1+i%4,hair:i%5,hairColor:i%5,beard:i%2?0:2,skin:i%5}} />
          {near&&<Html center position={[0,2.55,0]} style={{pointerEvents:"none"}}><span className="town-sign">{i%2?"Mestra":"Mestre"} de {CLASSES[classId].name}</span></Html>}
        </group>;
      })}
      {landmark("bank","Banco",...CITY_BANK,()=>openService("bank"))}
      {landmark("forge","Mercado e forja",...CITY_FORGE,()=>openService("workshop"))}
      {landmark("stable","Estábulo",9,5,()=>openService("mounts"))}
      {landmark("wagon","Carroça",...CITY_WAGON,()=>openService("wagon"))}
      {landmark("sky","Portal para Goddard",px,pz,()=>useGame.getState().skyTravel("goddard"),true)}
    </>}
    {city==="goddard"&&<>
      {landmark("codex","Salão dos Precursores",4,-10.7,()=>openService("codex"))}
      <group position={[GODDARD_BOOLE[0],0,GODDARD_BOOLE[1]]} {...cursorOn("point")} onClick={e=>activate(e,...GODDARD_BOOLE,openStory)}>
        <Character classId="mage" race="human" organic look={{...DEFAULT_LOOK,beard:2,hairColor:4}} />
        <Html center position={[0,2.8,0]} style={{pointerEvents:"none"}}><span className="town-sign">Boole · História principal</span></Html>
      </group>
      {landmark("academy","Estudos",-9,-3,()=>openService("academy"))}
      {landmark("mounts","Montarias",9,-3,()=>openService("mounts"))}
      {Object.entries(RACIAL_CITIES).map(([id,destination])=>{
        const region=id as keyof typeof RACIAL_CITIES;
        const [x,z]=goddardExit(region);
        return landmark(id,destination.name,x,z,()=>useGame.getState().skyTravel(region),true);
      })}
    </>}
  </group>;
}
