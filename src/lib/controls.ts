export const HOTBAR_SIZE = 10;
export const HOTBAR_KEYS = ['1','2','3','4','5','6','7','8','9','0'] as const;
export function hotbarIndex(key:string) { return HOTBAR_KEYS.indexOf(key as typeof HOTBAR_KEYS[number]); }
export function isEditingTarget(target:EventTarget|null) {
  return target instanceof HTMLElement && !!target.closest('input,textarea,select,button,a,[contenteditable="true"],[role="dialog"]');
}
export function normalizeHotbar(value:unknown,valid:(id:string)=>boolean):string[] {
  if(!Array.isArray(value))return [];
  const seen=new Set<string>();
  return Array.from({length:Math.min(HOTBAR_SIZE,value.length)},(_,i)=>{
    const id=value[i];if(typeof id!=='string'||!valid(id)||seen.has(id))return '';
    seen.add(id);return id;
  });
}
export function advanceJump(height:number,velocity:number,dt:number) {
  const nextVelocity=velocity-18*dt;
  const nextHeight=height+(velocity+nextVelocity)*.5*dt;
  return nextHeight<=0?{height:0,velocity:0}:{height:nextHeight,velocity:nextVelocity};
}
