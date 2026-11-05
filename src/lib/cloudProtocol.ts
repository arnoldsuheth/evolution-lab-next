import {characterSlots} from './characterSlots';
import {migrateSave,type SaveData} from './game';
export interface CloudSave {revision:number;state:SaveData;updated_at:string}
export interface SyncBase {revision:number;hash:string}
export type SyncDecision='upload'|'download'|'same'|'choose'|'conflict';
export function canonical(value:unknown):string {
 if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical((value as Record<string,unknown>)[key])).join(',')+'}';
}
export async function fingerprint(state:SaveData){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(state)));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
export function validateCloudState(value:unknown):SaveData{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('O salvamento da conta não pôde ser reconhecido.');
 const s=value as Partial<SaveData>;
 if(!s.hero||typeof s.hero.id!=='string'||typeof s.hero.name!=='string'||typeof s.hero.created!=='boolean'||!s.education||!s.look||!s.settings||!Array.isArray(s.ancestors))throw Error('O salvamento da conta está incompleto. A cópia local foi mantida.');
 if(new TextEncoder().encode(JSON.stringify(value)).byteLength>8000000)throw Error('O salvamento ultrapassou o limite de 8 MB.');
 return migrateSave(value);
}
export function hasJourney(state:SaveData){return characterSlots(state).slots.some(s=>s&&(s.hero.created||s.hero.xp>0||s.hero.inventory.length>0||s.education.completed.length>0||Object.keys(s.education.projects).length>0));}
export function decideSync({base,localHash,remoteHash,remoteRevision,owned,meaningful}:{base:SyncBase|null;localHash:string;remoteHash:string|null;remoteRevision:number;owned:boolean;meaningful:boolean}):SyncDecision{
 if(remoteHash===localHash)return'same';
 if(!meaningful&&remoteHash!==null)return'download';
 if(!owned||!base)return'choose';
 if(remoteHash===null)return base.revision===0?'upload':'conflict';
 const localChanged=base.hash!==localHash,remoteChanged=base.revision!==remoteRevision;
 if(localChanged&&remoteChanged)return'conflict';
 return remoteChanged?'download':localChanged?'upload':'same';
}
export function validateCloudRow(value:unknown):CloudSave{
 const row=value as Partial<CloudSave>|null;
 if(!row||!Number.isSafeInteger(row.revision)||row.revision!<1||typeof row.updated_at!=='string')throw Error('Resposta de salvamento inválida.');
 return{revision:row.revision!,state:validateCloudState(row.state),updated_at:row.updated_at};
}
