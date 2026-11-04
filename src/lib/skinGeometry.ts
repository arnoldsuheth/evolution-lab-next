import * as THREE from 'three';
import { FACE_TRAITS } from './characterTraits';
// Each component owns its geometry, so colour changes cannot recolour another character.
export function skinGeometry(color: string, shape = 'sphere'): THREE.BufferGeometry {
  const geometry = shape === 'box' ? new THREE.SphereGeometry(0.5,24,18) : shape === 'cylinder' ? new THREE.CylinderGeometry(0.5,0.5,1,12,5) : shape === 'cone' ? new THREE.ConeGeometry(0.5,1,12,5) : new THREE.SphereGeometry(0.5,24,18);
  const position = geometry.getAttribute('position');
  if(shape.startsWith('head-')) {
    const face=FACE_TRAITS[Number(shape.slice(5))]??FACE_TRAITS[0];
    for(let i=0;i<position.count;i++) {
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
      const jaw=y<-.1?face.jaw:1,cheek=y>=-.15&&y<.1?face.cheeks:1,temple=y>.15?face.temples:1;
      position.setXYZ(i,x*face.width*jaw*cheek*temple,y*face.height,z*(y<-.2?face.chin:1));
    }
    geometry.computeVertexNormals();
  }
  const base = new THREE.Color(color); const dark = base.clone().multiplyScalar(0.68); const light = base.clone().lerp(new THREE.Color('#e5edcf'),0.14);
  const colors = new Float32Array(position.count*3); const tint = new THREE.Color();
  for(let i=0;i<position.count;i++) {
    const y = Math.max(0,Math.min(1,position.getY(i)+0.5));
    tint.copy(dark).lerp(base,Math.min(1,y*1.75));
    if(y>0.6) tint.lerp(light,(y-0.6)*1.8);
    tint.toArray(colors,i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  return geometry;
}
