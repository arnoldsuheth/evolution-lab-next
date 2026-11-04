import * as THREE from 'three';
// Each component owns its geometry, so colour changes cannot recolour another character.
export function skinGeometry(color: string, shape = 'sphere'): THREE.BufferGeometry {
  const geometry = shape === 'box' ? new THREE.SphereGeometry(0.5,24,18) : shape === 'cylinder' ? new THREE.CylinderGeometry(0.5,0.5,1,12,5) : shape === 'cone' ? new THREE.ConeGeometry(0.5,1,12,5) : new THREE.SphereGeometry(0.5,24,18);
  const position = geometry.getAttribute('position');
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
