"use client";
import {useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {useGame} from '@/lib/store';
import {effectFor,EFFECT_SECONDS,ENEMY_POWER_EFFECT,type EffectKind} from '@/lib/combatEffects';

/** Material brilhante e transparente, somado à cena (luz de magia). Guardado para reaproveitar entre golpes. */
const cache=new Map<string,THREE.Material|THREE.BufferGeometry>();
const glow=(color:string)=>{const key='m'+color;let m=cache.get(key) as THREE.MeshBasicMaterial|undefined;if(!m){m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});cache.set(key,m);}return m;};
const shape=<T extends THREE.BufferGeometry>(key:string,make:()=>T)=>{let g=cache.get('g'+key) as T|undefined;if(!g){g=make();cache.set('g'+key,g);}return g;};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;

/** Monta as peças do efeito (fora da renderização: são criadas quando o efeito aparece). */
function buildParts(kind:EffectKind,color:string){
  const m=glow(color),white=glow('#ffffff'),list:{mesh:THREE.Mesh;role:string;i:number}[]=[];
  const add=(geometry:THREE.BufferGeometry,role:string,material=m,i=0)=>{const mesh=new THREE.Mesh(geometry,material);mesh.raycast=()=>null;mesh.userData={role,i};list.push({mesh,role,i});};
  switch(kind){
   case 'slash':add(shape('TorusGeometry:.9,.07,6,24,Math.PI*.9',()=>new THREE.TorusGeometry(.9,.07,6,24,Math.PI*.9)),'arc',white);for(let i=0;i<6;i++)add(shape('OctahedronGeometry:.07',()=>new THREE.OctahedronGeometry(.07)),'spark',m,i);break;
   case 'holy':add(shape('CylinderGeometry:.7,.9,7,20,1,true',()=>new THREE.CylinderGeometry(.7,.9,7,20,1,true)),'pillar');add(shape('RingGeometry:.6,.85,32',()=>new THREE.RingGeometry(.6,.85,32)),'ring');for(let i=0;i<10;i++)add(shape('OctahedronGeometry:.1',()=>new THREE.OctahedronGeometry(.1)),'fall',white,i);break;
   case 'shock':for(let i=0;i<3;i++)add(shape('RingGeometry:.7,1,40',()=>new THREE.RingGeometry(.7,1,40)),'wave',m,i);for(let i=0;i<7;i++)add(shape('DodecahedronGeometry:.16',()=>new THREE.DodecahedronGeometry(.16)),'rock',glow('#e8b48a'),i);break;
   case 'arrow':add(shape('CylinderGeometry:.04,.04,1.1,6',()=>new THREE.CylinderGeometry(.04,.04,1.1,6)),'shaft',white);add(shape('ConeGeometry:.12,.3,6',()=>new THREE.ConeGeometry(.12,.3,6)),'head');for(let i=0;i<8;i++)add(shape('OctahedronGeometry:.09',()=>new THREE.OctahedronGeometry(.09)),'spark',m,i);break;
   case 'gear':add(shape('TorusGeometry:.6,.12,6,20',()=>new THREE.TorusGeometry(.6,.12,6,20)),'gear');for(let i=0;i<8;i++)add(shape('BoxGeometry:.18,.18,.18',()=>new THREE.BoxGeometry(.18,.18,.18)),'tooth',m,i);for(let i=0;i<8;i++)add(shape('OctahedronGeometry:.07',()=>new THREE.OctahedronGeometry(.07)),'spark',glow('#ffd27a'),i);break;
   case 'star':add(shape('OctahedronGeometry:.35',()=>new THREE.OctahedronGeometry(.35)),'bolt');add(shape('SphereGeometry:1,20,14',()=>new THREE.SphereGeometry(1,20,14)),'burst');for(let i=0;i<8;i++)add(shape('OctahedronGeometry:.09',()=>new THREE.OctahedronGeometry(.09)),'spark',white,i);break;
   case 'shadow':for(let i=0;i<7;i++)add(shape('SphereGeometry:.4,12,10',()=>new THREE.SphereGeometry(.4,12,10)),'puff',glow(i%2?color:'#24384a'),i);break;
   case 'heal':add(shape('RingGeometry:.7,.95,32',()=>new THREE.RingGeometry(.7,.95,32)),'selfring');for(let i=0;i<12;i++)add(shape('OctahedronGeometry:.1',()=>new THREE.OctahedronGeometry(.1)),'rise',i%2?white:m,i);break;
   case 'cross':add(shape('TorusGeometry:.9,.07,6,24,Math.PI*.8',()=>new THREE.TorusGeometry(.9,.07,6,24,Math.PI*.8)),'x1',white);add(shape('TorusGeometry:.9,.07,6,24,Math.PI*.8',()=>new THREE.TorusGeometry(.9,.07,6,24,Math.PI*.8)),'x2',m);break;
   case 'storm':for(let i=0;i<5;i++)add(shape('BoxGeometry:.12,1.4,.12',()=>new THREE.BoxGeometry(.12,1.4,.12)),'bolt',white,i);add(shape('TorusGeometry:.9,.08,6,28',()=>new THREE.TorusGeometry(.9,.08,6,28)),'swirl');add(shape('RingGeometry:.6,.9,32',()=>new THREE.RingGeometry(.6,.9,32)),'ring');break;
  }
  return list.map(p=>p.mesh);
}
function Effect({kind,color,from,to,time,delay=0}:{kind:EffectKind;color:string;from:[number,number];to:[number,number];time:number;delay?:number}){
 const root=useRef<THREE.Group>(null),start=useRef(0),live=useRef<THREE.Mesh[]>([]);
 useFrame(()=>{
  const g=root.current;if(!g)return;
  if(!start.current){start.current=performance.now()-Math.max(0,Date.now()-time)+delay*1000;live.current=buildParts(kind,color);live.current.forEach(mesh=>g.add(mesh));}const age=(performance.now()-start.current)/1000,t=Math.min(1,age/EFFECT_SECONDS);if(age<0){live.current.forEach(mesh=>{mesh.visible=false;});return;}if(t>=1){live.current.forEach(mesh=>{mesh.visible=false;});return;}
  const [hx,hz]=from,[tx,tz]=to,fade=1-t,travel=Math.min(1,age/.32);
  for(const mesh of live.current){const {role,i}=mesh.userData as {role:string;i:number},mat=mesh.material as THREE.MeshBasicMaterial;mesh.visible=true;mat.opacity=fade;mesh.rotation.set(0,0,0);mesh.scale.setScalar(1);
   const at=(x:number,y:number,z:number)=>mesh.position.set(x,y,z);
   switch(role){
    case 'arc':case 'x1':case 'x2':{at(tx,1.3,tz);mesh.rotation.set(0,Math.atan2(hx-tx,hz-tz),(role==='x2'?-1:1)*(.7+age*6));mesh.scale.setScalar(.8+t*.6);break;}
    case 'spark':{const a=i*1.05,r=.3+t*1.4;at(tx+Math.cos(a)*r,1.2+Math.sin(i)*.4+t*.4,tz+Math.sin(a)*r);break;}
    case 'pillar':{at(tx,3.5,tz);mesh.scale.set(1-t*.4,1,1-t*.4);mat.opacity=fade*.55;break;}
    case 'ring':case 'wave':{at(tx,.08,tz);mesh.rotation.x=-Math.PI/2;const d=role==='wave'?Math.max(0,t-i*.12):t;mesh.scale.setScalar(.6+d*3.2);mat.opacity=role==='wave'?Math.max(0,1-d*1.3):fade;break;}
    case 'fall':{const a=i*.63;at(tx+Math.cos(a)*.8,5-t*4.6-(i%3)*.4,tz+Math.sin(a)*.8);break;}
    case 'rock':{const a=i*.9,up=Math.sin(Math.min(1,t*1.6)*Math.PI)*1.1;at(tx+Math.cos(a)*(.5+t*1.6),.2+up,tz+Math.sin(a)*(.5+t*1.6));mesh.rotation.set(age*5,age*4,0);break;}
    case 'shaft':case 'head':case 'bolt':{if(role==='bolt'&&kind==='storm'){at(tx+(i%2?.18:-.18),.7+i*1.3,tz);mesh.rotation.z=i%2?.35:-.35;mat.opacity=age<.5?(Math.sin(age*60)>0?1:.4):fade;break;}
     const x=lerp(hx,tx,travel),z=lerp(hz,tz,travel),y=1.3+Math.sin(travel*Math.PI)*(kind==='star'?1.2:.3);at(x,y,z);mesh.visible=travel<1;
     mesh.rotation.set(Math.PI/2,0,0);mesh.lookAt(tx,1.3,tz);if(role!=='bolt')mesh.rotateX(Math.PI/2);if(role==='head'){mesh.translateY(.6);}if(role==='bolt')mesh.rotation.set(age*8,age*6,0);break;}
    case 'burst':{at(tx,1.2,tz);const k=Math.max(0,(age-.32)/(EFFECT_SECONDS-.32));mesh.visible=age>.32;mesh.scale.setScalar(.2+k*1.3);mat.opacity=(1-k)*.5;break;}
    case 'gear':{at(tx,1.4,tz);mesh.rotation.set(0,Math.atan2(hx-tx,hz-tz),age*8);mesh.scale.setScalar(.6+t*.5);break;}
    case 'tooth':{const a=i/8*Math.PI*2+age*8,r=(.6+t*.5)*1.15;at(tx+Math.cos(a)*r*Math.cos(Math.atan2(hx-tx,hz-tz)),1.4+Math.sin(a)*r,tz-Math.cos(a)*r*Math.sin(Math.atan2(hx-tx,hz-tz)));mesh.rotation.z=a;break;}
    case 'puff':{const a=i*.9;at(tx+Math.cos(a)*(.3+t*1.2),.6+t*1.6+(i%3)*.2,tz+Math.sin(a)*(.3+t*1.2));mesh.scale.setScalar(.5+t*1.3);mat.opacity=fade*.7;break;}
    case 'selfring':{at(hx,.08,hz);mesh.rotation.x=-Math.PI/2;mesh.scale.setScalar(.8+t*1.6);break;}
    case 'rise':{const a=i*.52+age*2;at(hx+Math.cos(a)*.7,.3+t*3+(i%4)*.25,hz+Math.sin(a)*.7);break;}
    case 'swirl':{at(tx,.4+t*2,tz);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=age*7;mesh.scale.setScalar(.6+t);break;}
   }
  }
 });
 return <group ref={root}/>;
}

/** Número de dano + efeito do golpe. Cada classe tem a sua magia; ataques normais mostram um corte. */
export default function CombatFeedback(){
 const event=useGame(s=>s.battleEvent),label=useRef<HTMLDivElement>(null),labelRoot=useRef<THREE.Group>(null),start=useRef(0);
 useEffect(()=>{if(event)start.current=performance.now()-Math.max(0,Date.now()-event.time);},[event]);
 useFrame(()=>{if(!labelRoot.current)return;const age=event&&start.current?(performance.now()-start.current)/1000:2;labelRoot.current.visible=age<.95;if(label.current){label.current.style.opacity=String(Math.max(0,1-age));label.current.style.translate='0 '+(-age*35)+'px';}});
 if(!event)return null;
 const kind=effectFor(event.kind,event.classId);
 return <group><Effect key={event.time} kind={kind} color={event.tone} from={[event.hx??event.x,event.hz??event.z]} to={[event.x,event.z]} time={event.time}/>{event.enemyPower&&ENEMY_POWER_EFFECT[event.enemyPower]&&<Effect key={'e'+event.time} kind={ENEMY_POWER_EFFECT[event.enemyPower].kind} color={ENEMY_POWER_EFFECT[event.enemyPower].color} from={[event.x,event.z]} to={[event.hx,event.hz]} time={event.time} delay={.35}/>}
  <group ref={labelRoot} position={[event.x,0,event.z]}><Html center position={[0,2.8,0]} zIndexRange={[9,0]} style={{pointerEvents:'none'}}><div ref={label} className="damage-number" style={{color:event.tone}}>{event.damage?'-'+event.damage:''}{event.received?<small>Você recebeu {event.received}</small>:null}</div></Html></group></group>;
}
