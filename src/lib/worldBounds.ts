export const WORLD_BOUNDS={x:78,minZ:-82,maxZ:67} as const;

export function insideWorld(x:number,z:number) {
  return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<=WORLD_BOUNDS.x&&z>=WORLD_BOUNDS.minZ&&z<=WORLD_BOUNDS.maxZ;
}

export function worldViewBox() {
  return `${-WORLD_BOUNDS.x} ${WORLD_BOUNDS.minZ} ${WORLD_BOUNDS.x*2} ${WORLD_BOUNDS.maxZ-WORLD_BOUNDS.minZ}`;
}
