import * as THREE from 'three';
import { BODY_TRAITS } from './characterTraits';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** A smooth original silhouette, shared by the editor and the world. */
export function bodyGeometry(shape: string): THREE.BufferGeometry {
  if(shape === 'box') return new RoundedBoxGeometry(1,1,1,3,0.13);
  if(shape.startsWith('torso')) {
    const build=BODY_TRAITS[Number(shape.split('-')[1])]??BODY_TRAITS[1];
    const profile = [[0,-0.5],[0.32,-0.49],[0.43,-0.42],[0.37,-0.2],[0.4,0.04],[0.49,0.27],[0.46,0.38],[0.3,0.46],[0.2,0.5],[0,0.51]];
    const curve = new THREE.SplineCurve(profile.map(([r,y])=>new THREE.Vector2(r*(y>.12?build.shoulders:y<-.3?(build.waist+1)/2:build.waist),y)));
    return new THREE.LatheGeometry(curve.getPoints(36).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),24);
  }
  if(shape === 'capsule') return new THREE.CapsuleGeometry(0.5,0.65,6,16).scale(1,1/1.65,1);
  if(shape === 'cone') return new THREE.ConeGeometry(0.5,1,16);
  if(shape === 'cylinder') return new THREE.CylinderGeometry(0.5,0.5,1,20);
  return new THREE.SphereGeometry(0.5,24,18);
}
