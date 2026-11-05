"use client";
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {validateCloudRow,type CloudSave} from './cloudProtocol';
import type {SaveData} from './game';
import {withCloudDeadline} from './cloudStartup';
// Publishable browser key. Never put a service-role key in this file or NEXT_PUBLIC_.
export const CLOUD_READY=process.env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED==='true';
const URL=process.env.NEXT_PUBLIC_SUPABASE_URL??'https://mgqwzaizkllkqqqbbcna.supabase.co';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??'sb_publishable_nBJrSlD-qcQg26UIhVCWkQ_d9_fZCPc';
let client:SupabaseClient|undefined;
export function cloudClient(){if(!CLOUD_READY)throw Error('A sincronização ainda não foi ativada.');if(!client)client=createClient(URL,KEY,{auth:{storageKey:'lions-cave-auth-v1',flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true},global:{fetch:async(input,options)=>{const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),15000);const cancel=()=>abort.abort();options?.signal?.addEventListener('abort',cancel,{once:true});if(options?.signal?.aborted)abort.abort();try{return await fetch(input,{...options,signal:abort.signal});}finally{clearTimeout(timeout);options?.signal?.removeEventListener('abort',cancel);}}}});return client;}
export class CloudConflict extends Error{}
const DEVICE='lions-cave-device-v1';
export function deviceSecret(){let secret=localStorage.getItem(DEVICE);if(!secret){secret=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem(DEVICE,secret);}return secret;}
interface DeviceReply {vault:string;revision:number;state:SaveData|null;updated_at:string}
export async function deviceRequest(action:'open'|'read'|'write'|'pair'|'redeem',payload:Record<string,unknown>={}):Promise<DeviceReply>{
 let token:string|undefined;
 if(action==='open'&&localStorage.getItem('lions-cave-auth-v1')){
  // Existing sessions are used only to migrate the old cloud save; never displayed as accounts.
  const result=await withCloudDeadline(cloudClient().auth.getSession());if(result.error)throw Error('Não foi possível preservar a nuvem antiga. Tente novamente.');token=result.data.session?.access_token;
 }
 const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),15000);
 try{const response=await fetch(URL+'/functions/v1/lions-cave-devices',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({action,device:deviceSecret(),...payload}),signal:abort.signal});const data=await response.json();if(response.status===409)throw new CloudConflict(data.error);if(!response.ok||data.error)throw Error(data.error??'Não foi possível acessar a nuvem. Sua cópia local foi preservada.');if(typeof data.vault!=='string')throw Error('Resposta da nuvem inválida.');return data;}finally{clearTimeout(timeout);}
}
export async function readCloud():Promise<CloudSave|null>{const data=await deviceRequest('read');return data.state?validateCloudRow(data):null;}
export async function writeCloud(state:SaveData,revision:number,backup=false):Promise<CloudSave>{return validateCloudRow(await deviceRequest('write',{state,revision,backup}));}
