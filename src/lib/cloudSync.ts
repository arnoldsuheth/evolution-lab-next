"use client";
import {create} from 'zustand';
import {CLOUD_READY,cloudClient,readCloud,writeCloud,CloudConflict} from './cloudClient';
import {canonical,decideSync,fingerprint,hasJourney,type CloudSave,type SyncBase} from './cloudProtocol';
import {savedState,useGame,SAVE_KEY,replaceFromCloud} from './store';
type Status='disabled'|'local'|'loading'|'synced'|'pending'|'offline'|'choose'|'conflict'|'error';
interface CloudStatus {status:Status;userId:string|null;email:string;message:string;remote:CloudSave|null;lastSaved:string;reload:number}
export const useCloud=create<CloudStatus>(()=>({status:CLOUD_READY?'local':'disabled',userId:null,email:'',message:'',remote:null,lastSaved:'',reload:0}));
let generation=0,busy=false,applying=false,owner:string|null=null,base:SyncBase|null=null,timer:ReturnType<typeof setTimeout>|null=null,maximum:ReturnType<typeof setTimeout>|null=null;
const OWNER='lions-cave-cloud-owner',metaKey=(uid:string)=>'lions-cave-cloud-base-'+uid;
function clearTimers(){if(timer)clearTimeout(timer);if(maximum)clearTimeout(maximum);timer=null;maximum=null;}
function readBase(uid:string){try{const p=JSON.parse(localStorage.getItem(metaKey(uid))??'null');return p&&Number.isSafeInteger(p.revision)&&typeof p.hash==='string'?p as SyncBase:null;}catch{return null;}}
function acknowledge(uid:string,row:CloudSave,hash:string){localStorage.setItem(metaKey(uid),JSON.stringify({revision:row.revision,hash}));localStorage.setItem(OWNER,uid);base={revision:row.revision,hash};owner=uid;useCloud.setState({status:'synced',message:'Jornada salva na conta.',remote:null,lastSaved:row.updated_at});}
function backupLocal(){const raw=localStorage.getItem(SAVE_KEY);if(raw)localStorage.setItem(SAVE_KEY+'-before-cloud-'+Date.now(),raw);}
async function pull(uid:string,row:CloudSave,gen:number,backup:boolean,expectedLocal?:string){const hash=await fingerprint(row.state);if(gen!==generation)return;if(expectedLocal&&canonical(savedState(useGame.getState()))!==expectedLocal){useCloud.setState({status:'conflict',remote:row,message:'Sua jornada mudou enquanto a conta era consultada. Escolha qual continuar.'});return;}applying=true;try{replaceFromCloud(row.state,backup);acknowledge(uid,row,hash);useCloud.setState(s=>({reload:s.reload+1}));}finally{applying=false;}}
async function reconcile(initial=false){
 const {userId:uid,status}=useCloud.getState();if(!uid||busy||(!initial&&['choose','conflict','loading','disabled'].includes(status)))return;
 const gen=generation;busy=true;clearTimers();
 try{
  const local=savedState(useGame.getState()),localHash=await fingerprint(local),remote=await readCloud();if(gen!==generation)return;
  const remoteHash=remote?await fingerprint(remote.state):null;if(gen!==generation)return;
  if(useGame.getState().saveError){useCloud.setState({status:'choose',remote,message:'A cópia local precisa de recuperação. Ela será preservada antes de carregar a conta.'});return;}
  const decision=decideSync({base,localHash,remoteHash,remoteRevision:remote?.revision??0,owned:owner===uid,meaningful:hasJourney(local)});
  if(decision==='choose'||decision==='conflict'){useCloud.setState({status:decision,remote,message:decision==='conflict'?'Os dois aparelhos têm alterações. Escolha qual jornada continuar.':'Escolha a jornada que deseja usar nesta conta.'});return;}
  if(decision==='download'&&remote){if(!initial&&(useGame.getState().encounter||useGame.getState().challenge)){useCloud.setState({status:'conflict',remote,message:'A conta foi atualizada em outro aparelho. Termine ou revise sua jornada antes de continuar.'});return;}await pull(uid,remote,gen,false,canonical(local));}
  else if(decision==='upload'){const posted=await writeCloud(local,base?.revision??0);if(gen!==generation)return;acknowledge(uid,posted,localHash);}
  else if(remote){acknowledge(uid,remote,localHash);}
  else useCloud.setState({status:'choose',remote:null,message:'Vincule a jornada deste aparelho à sua conta.'});
 }catch(error){if(gen!==generation)return;if(error instanceof CloudConflict){useCloud.setState({status:'conflict',message:error.message});try{const remote=await readCloud();if(gen===generation)useCloud.setState({remote});}catch{}}else useCloud.setState({status:navigator.onLine?'error':'offline',message:error instanceof Error?error.message:'Falha na sincronização. Sua cópia local está preservada.'});}
 finally{busy=false;if(gen===generation&&useCloud.getState().status==='synced'&&base){const known=base.hash;void fingerprint(savedState(useGame.getState())).then(hash=>{if(gen===generation&&hash!==known&&useCloud.getState().status==='synced')schedule();});}}
}
export function syncNow(){return reconcile();}
export async function chooseJourney(choice:'local'|'cloud'){
 const {userId:uid}=useCloud.getState();if(!uid||busy)return;const gen=generation;busy=true;useCloud.setState({status:'loading'});clearTimers();
 try{const remote=await readCloud();if(gen!==generation)return;
  // Re-read before replacing anything. A new remote revision requires a new explicit choice.
  const offered=useCloud.getState().remote;if((remote?.revision??0)!==(offered?.revision??0)){useCloud.setState({status:'conflict',remote,message:'A jornada online mudou novamente. Confira a versão antes de escolher.'});return;}
  if(choice==='cloud'){if(!remote)throw Error('Nenhuma jornada foi encontrada na conta.');await pull(uid,remote,gen,true);}
  else{if(useGame.getState().saveError)throw Error('Recupere ou exporte o salvamento local antes de enviá-lo à conta.');backupLocal();const local=savedState(useGame.getState()),hash=await fingerprint(local);const posted=await writeCloud(local,remote?.revision??0,true);if(gen!==generation)return;acknowledge(uid,posted,hash);}
 }catch(error){if(gen===generation)useCloud.setState({status:error instanceof CloudConflict?'conflict':'error',message:error instanceof Error?error.message:'Não foi possível concluir. As jornadas foram preservadas.'});}finally{busy=false;}
}
function schedule(){const s=useCloud.getState();if(applying||!s.userId||['choose','conflict','loading','disabled'].includes(s.status))return;useCloud.setState({status:navigator.onLine?'pending':'offline',message:'Alterações guardadas neste aparelho.'});if(timer)clearTimeout(timer);timer=setTimeout(()=>void reconcile(),1800);if(!maximum)maximum=setTimeout(()=>void reconcile(),20000);}
export async function loginWithPassword(email:string,password:string,create=false){
 if(!CLOUD_READY)throw Error('A sincronização ainda não foi ativada.');
 const result=create?await cloudClient().auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+window.location.pathname}}):await cloudClient().auth.signInWithPassword({email,password});
 if(result.error)throw Error(create?'Não foi possível criar a conta. Confira o e-mail e use uma senha com pelo menos 8 caracteres.':'Não foi possível entrar. Confira o e-mail e a senha.');
 localStorage.setItem('lions-cave-login-email',email);window.dispatchEvent(new Event('lions-cave-login-email'));
 if(create&&!result.data.session)useCloud.setState({message:'Confira seu e-mail para confirmar a conta. Depois entre com sua senha.'});
}
export async function disconnectCloud(){const gen=++generation;clearTimers();useCloud.setState({status:'loading',message:'Desconectando a conta…'});try{const {error}=await cloudClient().auth.signOut({scope:'local'});if(error)throw error;if(gen===generation){base=null;owner=null;useCloud.setState({status:'local',userId:null,email:'',remote:null,message:'Conta desconectada. A cópia deste aparelho foi mantida.'});}}catch{if(gen===generation)useCloud.setState({status:'error',message:'Não foi possível desconectar. Tente novamente; sua cópia local foi mantida.'});}}
export function startCloudSync(){
 if(!CLOUD_READY)return()=>{};let alive=true,initializedUid:string|null|undefined=undefined;
 async function session(uid:string|null,email=''){if(!alive||uid===initializedUid)return;initializedUid=uid;const gen=++generation;clearTimers();base=null;owner=null;if(!uid){useCloud.setState({status:'local',userId:null,email:'',remote:null});return;}try{owner=localStorage.getItem(OWNER);base=readBase(uid);useCloud.setState({status:'loading',userId:uid,email,remote:null,message:'Conferindo sua jornada na conta…'});while((!useGame.getState().ready||busy)&&alive&&gen===generation)await new Promise(resolve=>setTimeout(resolve,50));if(alive&&gen===generation)await reconcile(true);}catch{if(alive&&gen===generation)useCloud.setState({status:'error',message:'Armazenamento indisponível. Sua jornada não foi enviada.'});}}
 const {data:{subscription}}=cloudClient().auth.onAuthStateChange((_event,s)=>{setTimeout(()=>void session(s?.user.id??null,s?.user.email??''),0);});
 void cloudClient().auth.getSession().then(({data,error})=>{if(!alive)return;if(error)useCloud.setState({status:'error',message:'Não foi possível verificar sua conta.'});else void session(data.session?.user.id??null,data.session?.user.email??'');});
 const unsubscribe=useGame.subscribe((state,previous)=>{if(state.ready&&(state.hero!==previous.hero||state.look!==previous.look||state.education!==previous.education||state.ancestors!==previous.ancestors||state.settings!==previous.settings))schedule();});
 const refresh=()=>{if(document.visibilityState==='visible')void reconcile();};const interval=setInterval(refresh,30000);window.addEventListener('online',refresh);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
 return()=>{alive=false;generation++;clearTimers();unsubscribe();subscription.unsubscribe();clearInterval(interval);window.removeEventListener('online',refresh);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
}
