"use client";
import * as THREE from 'three';
export const rarityTone=(rarity:string)=>({Comum:'#bcc2b7',Incomum:'#a3bc8d',Raro:'#8cbbd2','Épico':'#bb9bd8','Lendário':'#e0be73','Mítico':'#f2c14e'}[rarity]??'#bcc2b7');
function Box({p,s,color,rotation=[0,0,0]}:{p:[number,number,number];s:[number,number,number];color:string;rotation?:[number,number,number]}){return <mesh position={p} rotation={rotation} castShadow><boxGeometry args={s}/><meshStandardMaterial color={color} metalness={.4} roughness={.65}/></mesh>;}
// O centro do punho é a origem. A corda fica atrás do corpo do arco.
const bowCurve = new THREE.CatmullRomCurve3([
  [-.38, -.63], [-.22, -.52], [-.07, -.32], [0, -.09],
  [0, .09], [-.07, .32], [-.22, .52], [-.38, .63],
].map(([x,y])=>new THREE.Vector3(x,y,0)));

export default function EquipmentVisual({visual,tone,small=false}:{visual:string;tone:string;small?:boolean}){const wood='#66503a';return <group scale={small?.7:1}>
 {['sword','greatsword','dagger'].includes(visual)&&<><Box p={[0,.02,0]} s={[.075,.32,.075]} color={wood}/><Box p={[0,.18,0]} s={[visual==='dagger'?.22:.34,.06,.09]} color={tone}/><mesh position={[0,visual==='dagger'?.4:visual==='greatsword'?.83:.65,0]} castShadow><coneGeometry args={[visual==='greatsword'?.12:.075,visual==='dagger'?.45:visual==='greatsword'?1.3:.92,4]}/><meshStandardMaterial color={tone} metalness={.65} roughness={.35}/></mesh></>}
 {['hammer','tool','axe'].includes(visual)&&<><Box p={[0,.2,0]} s={[.09,.85,.09]} color={wood}/><Box p={[visual==='axe'?.15:0,.62,0]} s={visual==='hammer'?[.55,.3,.28]:visual==='axe'?[.42,.45,.1]:[.36,.15,.13]} color={tone}/>{visual==='tool'&&[-1,1].map(n=><Box key={n} p={[n*.15,.75,0]} s={[.08,.26,.13]} color={tone}/>)}</>}
 {visual==='staff'&&<><Box p={[0,.25,0]} s={[.09,1.65,.09]} color={wood}/><mesh position={[0,1.13,0]} castShadow><octahedronGeometry args={[.23]}/><meshStandardMaterial color={tone} emissive={tone} emissiveIntensity={.18} metalness={.2}/></mesh></>}
 {visual==='wand'&&<><Box p={[0,.2,0]} s={[.065,.65,.065]} color={wood}/><mesh position={[0,.57,0]}><sphereGeometry args={[.09,8,6]}/><meshStandardMaterial color={tone} emissive={tone} emissiveIntensity={.25}/></mesh></>}
 {visual==='bow'&&<><mesh castShadow><tubeGeometry args={[bowCurve,24,.038,7,false]}/><meshStandardMaterial color={wood}/></mesh><Box p={[-.38,0,0]} s={[.012,1.26,.012]} color='#e9d7ab'/><Box p={[0,0,0]} s={[.105,.24,.105]} color='#a68553'/></>}
 {visual==='crossbow'&&<><Box p={[0,.1,.15]} s={[.15,.16,.72]} color={wood}/><Box p={[0,.2,.43]} s={[.72,.075,.12]} color={tone}/><Box p={[0,-.04,0]} s={[.1,.35,.14]} color={wood}/></>}
 {visual==='gun'&&<><Box p={[0,.15,.1]} s={[.17,.22,.55]} color={wood}/><mesh position={[0,.21,.58]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.065,.075,.62,8]}/><meshStandardMaterial color={tone} metalness={.65} roughness={.4}/></mesh><Box p={[0,-.03,0]} s={[.1,.3,.12]} color={wood}/></>}
 {visual==='shield'&&<group rotation={[0,0,Math.PI/2]}><mesh castShadow><cylinderGeometry args={[.48,.43,.12,10]}/><meshStandardMaterial color={wood}/></mesh><mesh position={[0,.075,0]}><cylinderGeometry args={[.15,.18,.07,8]}/><meshStandardMaterial color={tone} metalness={.6}/></mesh></group>}
 {visual==='focus'&&<><Box p={[0,.04,0]} s={[.07,.23,.07]} color={wood}/><mesh position={[0,.24,0]} castShadow><octahedronGeometry args={[.18]}/><meshStandardMaterial color={tone} emissive={tone} emissiveIntensity={.2} roughness={.3}/></mesh></>}
 {visual==='gadget'&&<><Box p={[0,.02,0]} s={[.09,.22,.09]} color={wood}/><Box p={[0,.25,0]} s={[.35,.27,.24]} color={tone}/><mesh position={[0,.25,.14]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.1,.025,6,10]}/><meshStandardMaterial color='#b29455' side={THREE.DoubleSide}/></mesh></>}
 </group>;}
