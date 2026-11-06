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

/** A tecla 1 é sempre Atacar. A barra salva continua igual; sua posição 0 aparece na tecla 2, a 1 na tecla 3… até a 8 na tecla 0. */
export const ATTACK_SLOT = 0, BAR_SLOTS = HOTBAR_SIZE - 1;
export const keyForBar = (index: number) => HOTBAR_KEYS[index + 1];
export const barForKey = (key: string) => { const i = hotbarIndex(key); return i > 0 ? i - 1 : -1; };
