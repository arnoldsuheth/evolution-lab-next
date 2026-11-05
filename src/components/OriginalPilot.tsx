"use client";
import {useMemo} from 'react';import {useGLTF} from '@react-three/drei';import * as THREE from 'three';
const base=process.env.NEXT_PUBLIC_GITHUB_PAGES==='true'?'/evolution-lab-next':'';
export default function OriginalPilot(){const gltf=useGLTF(`${base}/models/lions-cave/paladin-approved.glb`);const model=useMemo(()=>{const clone=gltf.scene.clone(true);clone.rotation.y=-Math.PI/2;const box=new THREE.Box3().setFromObject(clone),height=box.max.y-box.min.y;clone.scale.setScalar(2.7/height);clone.position.y=-box.min.y*2.7/height;clone.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});return clone;},[gltf.scene]);return <primitive object={model}/>;}
