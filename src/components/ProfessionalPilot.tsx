"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useGLTF,useAnimations} from '@react-three/drei';
import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
const base=process.env.NEXT_PUBLIC_GITHUB_PAGES==='true'?'/evolution-lab-next':'';
export default function ProfessionalPilot({animation='Idle'}:{animation?:string}){
 const gltf=useGLTF(`${base}/models/pilot/knight.glb`),root=useRef<THREE.Group>(null);
 const scene=useMemo(()=>{const model=clone(gltf.scene);model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(['1H_Sword_Offhand','Rectangle_Shield','Round_Shield','Spike_Shield','2H_Sword'].includes(o.name))o.visible=false;}});const box=new THREE.Box3().setFromObject(model),height=box.max.y-box.min.y;model.scale.setScalar(2.7/height);model.position.y=-box.min.y*2.7/height;return model;},[gltf.scene]);
 const {actions}=useAnimations(gltf.animations,root);
 useEffect(()=>()=>{scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose();});},[scene]);
 useEffect(()=>{const action=actions[animation]??actions.Idle;action?.reset().fadeIn(.2).play();return()=>{action?.fadeOut(.2);};},[actions,animation]);
 return <group ref={root}><primitive object={scene}/></group>;
}
