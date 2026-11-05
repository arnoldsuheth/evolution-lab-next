export const WORLD_BOUNDS={x:42,minZ:-48,maxZ:24} as const;
export const insideWorld=(x:number,z:number)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<=WORLD_BOUNDS.x&&z>=WORLD_BOUNDS.minZ&&z<=WORLD_BOUNDS.maxZ;
