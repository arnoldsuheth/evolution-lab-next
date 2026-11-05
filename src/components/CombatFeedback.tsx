"use client";
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {useGame} from '@/lib/store';
export default function CombatFeedback(){
 const event=useGame(s=>s.battleEvent),root=useRef<THREE.Group>(null),ring=useRef<THREE.Mesh>(null),label=useRef<HTMLDivElement>(null);
 useFrame(()=>{if(!root.current)return;const age=event?(Date.now()-event.time)/1000:2;root.current.visible=age<.85;if(age>=.85)return;root.current.position.set(event!.x,0,event!.z);if(ring.current){ring.current.scale.setScalar(.45+age*2.6);(ring.current.material as THREE.MeshBasicMaterial).opacity=Math.max(0,.7-age);}if(label.current){label.current.style.opacity=String(Math.max(0,1-age));label.current.style.translate='0 '+(-age*35)+'px';}});
 return <group ref={root} visible={false}><mesh ref={ring} rotation={[-Math.PI/2,0,0]} position={[0,.09,0]}><ringGeometry args={[.65,.78,32]}/><meshBasicMaterial color={event?.tone??'#edcf8a'} transparent opacity={0} depthWrite={false}/></mesh><Html center position={[0,2.8,0]} zIndexRange={[9,0]} style={{pointerEvents:'none'}}><div ref={label} className="damage-number" style={{color:event?.tone}}>{event?.damage?'-'+event.damage:''}{event?.received? <small>Você recebeu {event.received}</small>:null}</div></Html></group>;
}
