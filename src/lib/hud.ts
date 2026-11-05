export type HudPosition={x:number;y:number;scale:number};
export function clampHud(x:number,y:number,width:number,height:number,viewportWidth:number,viewportHeight:number) {
  return {x:Math.max(8,Math.min(x,Math.max(8,viewportWidth-width-8))),y:Math.max(8,Math.min(y,Math.max(8,viewportHeight-height-8)))};
}
export function cleanHud(value:unknown):Record<string,HudPosition>{
  if(!value||typeof value!=='object')return {};
  const result:Record<string,HudPosition>={};
  for(const id of Object.keys(value)){
    if(!/^(hero|quests|map|skills|menus)(-(portrait|landscape|desktop))?$/.test(id))continue;
    const p=(value as Record<string,HudPosition>)[id];
    if(p&&[p.x,p.y,p.scale].every(Number.isFinite))result[id]={x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y)),scale:Math.max(.7,Math.min(1.3,p.scale))};
  }
  return result;
}
