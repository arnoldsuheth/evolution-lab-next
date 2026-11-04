import type { HeroData } from './game';
import type { Item } from './catalogue';
type EquipmentActor=Pick<HeroData,'classId'|'level'|'dead'>;
export const isEquipment=(item:Item)=>!['consumable','food','material','trophy'].includes(item.category);
export function itemRequirement(hero:EquipmentActor,item:Item):string|undefined{
 if(hero.dead)return'Personagem encerrado';
 if(hero.level<item.minLevel)return`Requer nível ${item.minLevel}`;
 if(item.classId&&item.classId!==hero.classId||item.classes&&!item.classes.includes(hero.classId))return'Incompatível com sua classe';
 return undefined;
}
export function activeEquipment(hero:EquipmentActor&{equipped:string[];inventory?:string[]},catalogue:Record<string,Item>):Item[]{
 const result:Item[]=[];const occupied=new Set<string>();
 for(const id of hero.equipped){const item=catalogue[id];if(!item||hero.inventory&&!hero.inventory.includes(id)||!isEquipment(item)||itemRequirement({...hero,dead:false},item))continue;
 const slots=item.slot==='twohand'?['weapon','offhand']:item.slot==='weapon'?['weapon']:[item.slot];
 if(slots.some(slot=>occupied.has(slot)))continue;slots.forEach(slot=>occupied.add(slot));result.push(item);
 }return result;
}
export function countItem(inventory:string[],id:string){return inventory.reduce((n,item)=>n+Number(item===id),0);}
export function removeItems(inventory:string[],requirements:Record<string,number>):string[]|null{
 for(const [id,quantity]of Object.entries(requirements))if(!Number.isInteger(quantity)||quantity<0||countItem(inventory,id)<quantity)return null;
 const remaining={...requirements};return inventory.filter(id=>{if((remaining[id]??0)>0){remaining[id]--;return false;}return true;});
}
