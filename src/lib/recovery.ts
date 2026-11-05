export function recoverResources(current:{hp:number;mp:number;stamina:number},limits:{maxHp:number;maxMp:number;maxStamina:number},seconds:number,blocked:boolean){
 const dt=Number.isFinite(seconds)?Math.max(0,Math.min(5,seconds)):0;
 if(blocked||!dt)return current;
 return {hp:Math.min(limits.maxHp,current.hp+limits.maxHp*.015*dt),mp:Math.min(limits.maxMp,current.mp+limits.maxMp*.02*dt),stamina:Math.min(limits.maxStamina,current.stamina+8*dt)};
}
