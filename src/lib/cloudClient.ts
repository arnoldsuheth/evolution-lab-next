"use client";
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {validateCloudRow,type CloudSave} from './cloudProtocol';
import type {SaveData} from './game';
// Publishable browser key. Never put a service-role key in this file or NEXT_PUBLIC_.
export const CLOUD_READY=process.env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED==='true';
const URL=process.env.NEXT_PUBLIC_SUPABASE_URL??'https://mgqwzaizkllkqqqbbcna.supabase.co';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??'sb_publishable_nBJrSlD-qcQg26UIhVCWkQ_d9_fZCPc';
let client:SupabaseClient|undefined;
export function cloudClient(){if(!CLOUD_READY)throw Error('A sincronização ainda não foi ativada.');if(!client)client=createClient(URL,KEY,{auth:{storageKey:'lions-cave-auth-v1',flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true},global:{fetch:async(input,options)=>{const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),15000);const cancel=()=>abort.abort();options?.signal?.addEventListener('abort',cancel,{once:true});if(options?.signal?.aborted)abort.abort();try{return await fetch(input,{...options,signal:abort.signal});}finally{clearTimeout(timeout);options?.signal?.removeEventListener('abort',cancel);}}}});return client;}
export class CloudConflict extends Error{}
export async function readCloud():Promise<CloudSave|null>{const {data,error}=await cloudClient().from('lions_cave_saves').select('revision,state,updated_at').maybeSingle();if(error)throw Error('Não foi possível consultar sua jornada online. Sua cópia local está preservada.');return data?validateCloudRow(data):null;}
export async function writeCloud(state:SaveData,revision:number,backup=false):Promise<CloudSave>{const {data,error}=await cloudClient().rpc('lions_cave_save',{p_state:state,p_expected_revision:revision,p_backup:backup});if(error){if(error.code==='PT409'||error.code==='23505')throw new CloudConflict('Outro aparelho salvou uma versão mais recente.');throw Error('Não foi possível salvar na conta. A jornada continua guardada neste aparelho.');}return validateCloudRow(data);}
