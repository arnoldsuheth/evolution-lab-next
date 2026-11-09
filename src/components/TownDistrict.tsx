"use client";
import {useLayoutEffect,useMemo,useRef,type ReactNode} from 'react';
import {useFrame,type ThreeEvent} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {useGame} from '@/lib/store';
import {CITADEL_SECTORS,FENCES,PROPS,ROADS,type Prop} from '@/lib/town';

const ROAD='#a5adba',TRAIL='#c4a36e',WOOD='#9a6a40',WOOD_DARK='#6e4a2c',STONE='#b9b4a2',ROOF=['#d9644f','#3f86b8','#e1a73b'];
const std=(color:string,extra:Partial<THREE.MeshStandardMaterialParameters>={})=><meshStandardMaterial color={color} roughness={.85} {...extra}/>;

/** Estradas e trilhas: faixas planas com pontas arredondadas, clicáveis para andar. */
function Roads({onClick}:{onClick:(e:ThreeEvent<MouseEvent>)=>void}){
 return <group>{ROADS.map(r=>{const [ax,az]=r.a,[bx,bz]=r.b,len=Math.hypot(bx-ax,bz-az),angle=Math.atan2(bx-ax,bz-az),color=r.kind==='road'?ROAD:TRAIL,y=r.kind==='road'?.022:.02;
  return <group key={r.id}><mesh position={[(ax+bx)/2,y,(az+bz)/2]} rotation={[-Math.PI/2,0,angle]} onClick={onClick} receiveShadow><planeGeometry args={[r.width,len]}/>{std(color,{roughness:.9})}</mesh>
   {[r.a,r.b].map((p,i)=><mesh key={i} position={[p[0],y-.001,p[1]]} rotation={[-Math.PI/2,0,0]} onClick={onClick} receiveShadow><circleGeometry args={[r.width/2,20]}/>{std(color,{roughness:.9})}</mesh>)}</group>;})}</group>;
}
/** Todos os postes da cidade num só desenho por peça (poste, lanterna, tampa e brilho): bem mais leve. */
const LAMP_PARTS:{y:number;geo:THREE.BufferGeometry;lit?:boolean}[]=[
 {y:1.1,geo:new THREE.CylinderGeometry(.07,.1,2.2,8)},{y:2.3,geo:new THREE.BoxGeometry(.32,.4,.32),lit:true},{y:2.58,geo:new THREE.ConeGeometry(.28,.22,4)}];
const LAMP_GLOW=new THREE.SphereGeometry(.55,12,10);
function InstancedParts({points,geo,y,children}:{points:{x:number;z:number}[];geo:THREE.BufferGeometry;y:number;children:ReactNode}){
 const ref=useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(()=>{const m=ref.current;if(!m)return;const o=new THREE.Object3D();points.forEach((p,i)=>{o.position.set(p.x,y,p.z);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();},[points,y]);
 return <instancedMesh ref={ref} args={[geo,undefined,points.length]} raycast={()=>null}>{children}</instancedMesh>;
}
function LampPosts({lit}:{lit:boolean}){
 const points=useMemo(()=>PROPS.filter(p=>p.kind==='lamp'),[]);
 return <group>{LAMP_PARTS.map((part,i)=><InstancedParts key={i} points={points} geo={part.geo} y={part.y}>{part.lit?std(lit?'#ffe08a':'#6c6f74',{emissive:lit?'#ffb43a':'#000000',emissiveIntensity:lit?1.6:0}):std('#3d4350',i===0?{metalness:.4}:{})}</InstancedParts>)}
  {lit&&<InstancedParts points={points} geo={LAMP_GLOW} y={2.3}><meshBasicMaterial color="#ffd36b" transparent opacity={.22} depthWrite={false}/></InstancedParts>}</group>;
}
function Stall({open,index}:{open:boolean;index:number}){
 const goods=['#e05d4f','#f2c14e','#7fbf5a','#7a8fe0','#e58fc0'];
 return <group><mesh position={[0,.55,0]} castShadow receiveShadow><boxGeometry args={[2,1.1,1]}/>{std(WOOD)}</mesh>
  {[-.9,.9].map(x=><mesh key={x} position={[x,1.3,-.4]}><cylinderGeometry args={[.06,.06,2.6,6]}/>{std(WOOD_DARK)}</mesh>)}
  <mesh position={[0,2.55,0]} rotation={[.25,0,0]} castShadow><boxGeometry args={[2.3,.08,1.5]}/>{std(open?ROOF[index%3]:'#8c8577')}</mesh>
  {open?goods.map((c,i)=><mesh key={i} position={[-.75+i*.37,1.22,0]} castShadow><sphereGeometry args={[.15,10,8]}/>{std(c)}</mesh>):<mesh position={[0,1.35,.05]}><boxGeometry args={[2,.5,.9]}/>{std('#a89a80')}</mesh>}</group>;
}
function Well({flowing}:{flowing:boolean}){
 const water=useRef<THREE.Mesh>(null);
 useFrame(({clock})=>{if(water.current)water.current.position.y=.72+Math.sin(clock.elapsedTime*2)*.02;});
 return <group><mesh position={[0,.4,0]} castShadow receiveShadow><cylinderGeometry args={[.85,.95,.8,16]}/>{std(STONE)}</mesh>
  <mesh ref={water} position={[0,.72,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.7,20]}/>{std(flowing?'#5fc3e8':'#6b6355',{emissive:flowing?'#2a8fbf':'#000000',emissiveIntensity:flowing?.4:0})}</mesh>
  {[-.75,.75].map(x=><mesh key={x} position={[x,1.3,0]}><cylinderGeometry args={[.06,.06,1.8,6]}/>{std(WOOD_DARK)}</mesh>)}
  <mesh position={[0,2.25,0]} rotation={[0,0,Math.PI/2]}><coneGeometry args={[.9,1.9,4]}/>{std('#c55b45')}</mesh>
  {flowing&&<mesh position={[0,1.05,0]}><sphereGeometry args={[.16,10,8]}/><meshBasicMaterial color="#bdeeff" transparent opacity={.6}/></mesh>}</group>;
}
function Beacon({lit}:{lit:boolean}){
 const flame=useRef<THREE.Mesh>(null);
 useFrame(({clock})=>{if(flame.current&&lit){flame.current.scale.y=1+Math.sin(clock.elapsedTime*6)*.12;flame.current.rotation.y=clock.elapsedTime;}});
 return <group><mesh position={[0,1.6,0]} castShadow><cylinderGeometry args={[.7,.95,3.2,8]}/>{std(STONE)}</mesh><mesh position={[0,3.3,0]}><cylinderGeometry args={[1,1,.25,8]}/>{std(WOOD_DARK)}</mesh>
  {lit?<mesh ref={flame} position={[0,3.85,0]}><coneGeometry args={[.45,1,7]}/><meshStandardMaterial color="#ffb347" emissive="#ff7a1a" emissiveIntensity={2}/></mesh>:<mesh position={[0,3.55,0]}><boxGeometry args={[.6,.25,.6]}/>{std('#5b5248')}</mesh>}</group>;
}
function Floodgate({open}:{open:boolean}){
 const gate=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{if(gate.current)gate.current.position.y=THREE.MathUtils.damp(gate.current.position.y,open?2.7:0,3,dt);});
 return <group><mesh position={[0,1.7,-1.9]} castShadow><boxGeometry args={[.5,3.4,.5]}/>{std(STONE)}</mesh><mesh position={[0,1.7,1.9]} castShadow><boxGeometry args={[.5,3.4,.5]}/>{std(STONE)}</mesh><mesh position={[0,3.5,0]}><boxGeometry args={[.6,.4,4.3]}/>{std(STONE)}</mesh>
  <group ref={gate}>{[-1.2,-.4,.4,1.2].map(z=><mesh key={z} position={[0,1.2,z]}><boxGeometry args={[.12,2.3,.14]}/>{std('#4b4f57',{metalness:.5})}</mesh>)}</group></group>;
}
function NearbySign({prop}:{prop:Prop}){
 const nearby=useGame(s=>Math.hypot(s.hero.position[0]-prop.x,s.hero.position[1]-prop.z)<7);
 return nearby?<Html zIndexRange={[5,0]} position={[0,2.05,0]} center style={{pointerEvents:'none'}}><span className="town-sign">{prop.label}</span></Html>:null;
}

function PropModel({prop,unlocked}:{prop:Prop;unlocked:boolean}){
 switch(prop.kind){
  case 'lamp':return null; // desenhados juntos em LampPosts
  case 'stall':return <Stall open={unlocked} index={Number(prop.id.slice(-1))}/>;
  case 'well':return <Well flowing={unlocked}/>;
  case 'beacon':return <Beacon lit={unlocked}/>;
  case 'floodgate':return <Floodgate open={unlocked}/>;
  case 'crate':return <group>{(unlocked?[[0,0,0],[.7,0,.2],[.3,.6,.1],[-.6,0,-.3],[-.2,.6,-.2],[.1,1.2,0]]:[[0,0,0]]).map(([x,y,z],i)=><mesh key={i} position={[x,.3+y,z]} rotation={[0,i*.4,0]} castShadow><boxGeometry args={[.6,.6,.6]}/>{std(i%2?'#b07d48':'#c08d55')}</mesh>)}</group>;
  case 'barrel':return <group>{[[0,0],[.6,.3],[.2,-.5]].map(([x,z],i)=><mesh key={i} position={[x,.4,z]} castShadow><cylinderGeometry args={[.3,.27,.8,10]}/>{std('#8a5a33')}</mesh>)}</group>;
  case 'cart':return <group><mesh position={[0,.75,0]} castShadow><boxGeometry args={[1.8,.5,1.1]}/>{std(WOOD)}</mesh>{[[-.6,.6],[.6,.6],[-.6,-.6],[.6,-.6]].map(([x,z],i)=><mesh key={i} position={[x,.35,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.35,.35,.12,12]}/>{std(WOOD_DARK)}</mesh>)}<mesh position={[0,1.15,0]}><sphereGeometry args={[.35,10,8]}/>{std('#e7c25a')}</mesh></group>;
  case 'bench':return <group><mesh position={[0,.45,0]} castShadow><boxGeometry args={[1.4,.12,.45]}/>{std(WOOD)}</mesh>{[-.55,.55].map(x=><mesh key={x} position={[x,.22,0]}><boxGeometry args={[.1,.45,.4]}/>{std(WOOD_DARK)}</mesh>)}</group>;
  case 'sign':return <group><mesh position={[0,.9,0]}><cylinderGeometry args={[.06,.07,1.8,6]}/>{std(WOOD_DARK)}</mesh><mesh position={[0,1.6,0]}><boxGeometry args={[1.3,.36,.08]}/>{std(WOOD)}</mesh><NearbySign prop={prop}/></group>;
  case 'gate':return <group>{[-3.1,3.1].map(x=><mesh key={x} position={[x,1.7,0]} castShadow><boxGeometry args={[.7,3.4,.7]}/>{std(STONE)}</mesh>)}<mesh position={[0,3.55,0]} castShadow><boxGeometry args={[7,.5,.8]}/>{std(WOOD)}</mesh><mesh position={[0,4.05,0]}><boxGeometry args={[2.6,.5,.12]}/>{std('#2f5d7e')}</mesh></group>;
  case 'board':return <group><mesh position={[0,1.2,0]} castShadow><boxGeometry args={[1.4,1,.12]}/>{std(WOOD)}</mesh>{[-.6,.6].map(x=><mesh key={x} position={[x,.6,0]}><boxGeometry args={[.1,1.2,.1]}/>{std(WOOD_DARK)}</mesh>)}{unlocked&&[[-.35,1.3],[.05,1.15],[.4,1.3]].map(([x,y],i)=><mesh key={i} position={[x,y,.07]}><planeGeometry args={[.3,.38]}/>{std(['#fff4d6','#f6e3a8','#e9f1ff'][i])}</mesh>)}</group>;
  case 'statue':return <group><mesh position={[0,.4,0]} castShadow><boxGeometry args={[1.3,.8,1.3]}/>{std(STONE)}</mesh><mesh position={[0,1.5,0]} castShadow><octahedronGeometry args={[.6]}/><meshStandardMaterial color="#9fdbe6" emissive="#3fa9b8" emissiveIntensity={.5} metalness={.3} roughness={.3}/></mesh></group>;
  case 'garden':return null;
  default:return null;
 }
}
/** Horta cercada: cerca baixa com canteiros coloridos. */
function Garden({x,z,w,d}:{x:number;z:number;w:number;d:number}){
 const posts=useMemo(()=>{const list:[number,number][]=[];for(let i=-w;i<=w+.01;i+=.55){list.push([i,-d],[i,d]);}for(let j=-d+.55;j<d;j+=.55){list.push([-w,j],[w,j]);}return list;},[w,d]);
 const points=useMemo(()=>posts.map(([px,pz])=>({x:px,z:pz})),[posts]),post=useMemo(()=>new THREE.BoxGeometry(.09,.7,.09),[]);
 return <group position={[x,0,z]}><InstancedParts points={points} geo={post} y={.35}>{std(WOOD)}</InstancedParts>
  {[-1,1].map(s=><mesh key={s} position={[0,.5,s*d]}><boxGeometry args={[w*2,.07,.06]}/>{std(WOOD)}</mesh>)}{[-1,1].map(s=><mesh key={s} position={[s*w,.5,0]}><boxGeometry args={[.06,.07,d*2]}/>{std(WOOD)}</mesh>)}
  {[-1,0,1].map(i=><group key={i}><mesh position={[i*w*.6,.08,0]}><boxGeometry args={[w*.5,.14,d*1.6]}/>{std('#7a5236',{roughness:1})}</mesh>{[-.5,0,.5].map(j=><mesh key={j} position={[i*w*.6,.28,j*d]}><sphereGeometry args={[.16,8,6]}/>{std(['#7cc45a','#e7774f','#f3d35a'][i+1])}</mesh>)}</group>)}</group>;
}

export default function TownDistrict({onGroundClick}:{onGroundClick:(e:ThreeEvent<MouseEvent>)=>void}){
 const completed=useGame(s=>s.education.completed);
 return <group><Roads onClick={onGroundClick}/><LampPosts lit={completed.includes('variables')}/>
  {PROPS.map(p=><group key={p.id} position={[p.x,0,p.z]} rotation={[0,p.turn??(p.kind==='floodgate'?0:0),0]}><PropModel prop={p} unlocked={!p.unlock||completed.includes(p.unlock)}/></group>)}
  {FENCES.map(f=><Garden key={f.id} {...f}/>)}<CitadelSigns/></group>;
}

/** Lovelace (prévia 4): placas com o nome de cada prédio e um poste de setas na entrada da praça. */
const SIGNPOST:[number,number]=[3.4,9.2];
const SECTOR_ICON:Record<string,string>={Biblioteca:'📖',Arquivo:'📜',Oficina:'⚙',Academia:'🎓','Pátio':'✦'};
function CitadelSigns(){
 const near=useGame(s=>Math.hypot(s.hero.position[0],s.hero.position[1])<26&&s.hero.region==='aurora'&&!s.hero.instance);
 return <group>
  <group position={[SIGNPOST[0],0,SIGNPOST[1]]}>
   <mesh position={[0,1.35,0]} castShadow><cylinderGeometry args={[.08,.1,2.7,8]}/>{std('#2a2f45')}</mesh>
   <mesh position={[0,2.78,0]}><sphereGeometry args={[.13,10,8]}/>{std('#d6b06a',{metalness:.6,roughness:.4})}</mesh>
   {CITADEL_SECTORS.slice(0,4).map((sec,i)=>{const turn=Math.atan2(-(sec.z-SIGNPOST[1]),sec.x-SIGNPOST[0]);
    return <group key={sec.name} position={[0,2.35-i*.38,0]} rotation={[0,turn,0]}><mesh position={[.55,0,0]}><boxGeometry args={[1.1,.3,.06]}/>{std('#1d2a4a')}</mesh><mesh position={[1.14,0,0]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[.21,.21,.06]}/>{std('#1d2a4a')}</mesh></group>;})}
   {near&&<Html zIndexRange={[5,0]} position={[0,3.1,0]} center style={{pointerEvents:'none'}}><div className="citadel-signpost">{CITADEL_SECTORS.slice(0,4).map(sec=><span key={sec.name}><i>{SECTOR_ICON[sec.short]}</i>{sec.short}</span>)}</div></Html>}
  </group>
  {near&&CITADEL_SECTORS.map(sec=><Html key={sec.name} zIndexRange={[4,0]} position={[sec.x,4.3,sec.z]} center style={{pointerEvents:'none'}}><span className="citadel-plaque"><i>{SECTOR_ICON[sec.short]}</i>{sec.short.toUpperCase()}</span></Html>)}
 </group>;
}
