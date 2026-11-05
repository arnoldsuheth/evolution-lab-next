import {freshSave,migrateSave,type SaveData} from './game';
export const SLOT_COUNT=5;
export interface CharacterSlots {active:number;slots:(SaveData|null)[]}
function snapshot(s:SaveData):SaveData{const legacy={...s.legacy};delete legacy.characterSlots;return{hero:s.hero,look:s.look,education:s.education,ancestors:s.ancestors,settings:s.settings,legacy};}
export function characterSlots(s:SaveData):CharacterSlots{
 const raw=s.legacy.characterSlots as Partial<CharacterSlots>|undefined;
 const active=Number.isInteger(raw?.active)&&raw!.active!>=0&&raw!.active!<SLOT_COUNT?raw!.active!:0;
 const slots=Array.from({length:SLOT_COUNT},(_,i)=>{const value=raw?.slots?.[i];return value?.hero&&value.look&&value.education?snapshot(migrateSave(snapshot(value))):null;});
 slots[active]=snapshot(s);
 return{active,slots};
}
export function packCharacters(s:SaveData):SaveData{return{...snapshot(s),legacy:{...s.legacy,characterSlots:characterSlots(s)}};}
export function selectCharacter(s:SaveData,index:number):SaveData{
 if(!Number.isInteger(index)||index<0||index>=SLOT_COUNT)throw Error('Slot inválido.');
 const roster=characterSlots(s),next=roster.slots[index]??freshSave();
 roster.active=index;
 return{...next,settings:s.settings,legacy:{...s.legacy,...next.legacy,characterSlots:roster}};
}
