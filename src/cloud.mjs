import {COLLECTIONS,clone} from './core.mjs?v=0.5.1';
export const CLOUD={url:'https://mgqwzaizkllkqqqbbcna.supabase.co',key:'sb_publishable_nBJrSlD-qcQg26UIhVCWkQ_d9_fZCPc'};
const PREFIX='evolab-next:cloud:',same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function decision(local,remote,base){
 if(!local)return remote?'pull':'none';
 if(!remote)return base?'conflict':'push';
 if(same(local.value,remote.value))return 'adopt';
 if(!base)return 'conflict';
 const l=local.version!==base.localVersion,r=remote.revision!==base.remoteRevision;
 return l&&r?'conflict':r?'pull':l?'push':'none';
}
export function createCloud({storage,repository,fetcher=fetch,onChange=()=>{}}){
 let session=null,refreshing=null,busy=false,conflicts=[],message='Nuvem desconectada',lastSync='',enabled=false;
 const read=k=>{try{return JSON.parse(storage.getItem(PREFIX+k)||'null');}catch{return null;}};
 session=read('session');
 function persist(){if(session)storage.setItem(PREFIX+'session',JSON.stringify(session));else storage.removeItem(PREFIX+'session');}
 const notify=()=>onChange();
 async function request(path,{body,method='GET',authenticated=true,headers={}}={}){
  if(authenticated)await token();
  let res;try{res=await fetcher(CLOUD.url+path,{method,headers:{apikey:CLOUD.key,...(authenticated?{Authorization:'Bearer '+session.access_token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000),cache:'no-store',redirect:'error'});}catch{throw Error('Sem conexão com a nuvem. Seus registros continuam neste aparelho.');}
  let data;try{data=await res.json();}catch{data=null;}
  if(!res.ok){if(data?.code==='40001')throw Object.assign(Error('Esta atividade mudou em outro aparelho. Nenhuma versão foi sobrescrita.'),{code:'conflict'});throw Error(res.status===401?'Entre novamente para sincronizar.':res.status===429?'Aguarde um pouco antes de tentar novamente.':data?.error_code==='email_not_confirmed'?'Confirme seu e-mail antes de entrar.':data?.msg||data?.error_description||'Não foi possível concluir a operação na nuvem.');}
  return data;
 }
 async function token(){
  if(!session)throw Error('Entre na sua conta para continuar.');
  if(session.expires_at*1000>Date.now()+60000)return;
  if(!refreshing)refreshing=(async()=>{const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},authenticated:false});session={...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in};persist();})().finally(()=>refreshing=null);
  await refreshing;
 }
 function state(){const user=session?.user;return {user:user?{id:user.id,email:user.email}:null,busy,conflicts:clone(conflicts),message,lastSync,enabled,otherAccount:!!(user&&read('owner')&&read('owner')!==user.id)};}
 async function login(email,password,signup=false){
  const data=await request(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},authenticated:false});
  if(!data?.access_token){message='Confira o e-mail de confirmação. Depois volte aqui e entre com sua senha.';notify();return;}
  session={...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in};persist();enabled=false;message='Conta conectada. Ative a sincronização para conferir os registros.';notify();
 }
 async function initialize(){if(!session)return;try{const user=await request('/auth/v1/user');session.user=user;persist();enabled=read('owner')===user.id&&read('enabled')===true;message=enabled?'Nuvem conectada · sincronização disponível':'Conta conectada · sincronização pausada';notify();}catch{message='Nuvem desconectada · entre novamente';notify();}}
 async function logout(){if(busy)throw Error('Espere a sincronização terminar antes de sair.');try{if(session)await request('/auth/v1/logout',{method:'POST'});}finally{session=null;enabled=false;persist();message='Conta desconectada. Os registros locais continuam neste aparelho.';notify();}}
 async function sync({activate=false}={}){
  if(busy)return;if(!repository)throw Error('O armazenamento local está indisponível.');
  await token();const user=await request('/auth/v1/user');
  const owner=read('owner');if(owner&&owner!==user.id)throw Error('Este aparelho está vinculado a outra conta. Use outro perfil de navegador para separar os registros.');
  if(!enabled&&!activate) return;
  storage.setItem(PREFIX+'owner',JSON.stringify(user.id));storage.setItem(PREFIX+'enabled','true');enabled=true;
  busy=true;conflicts=[];message='Sincronizando…';notify();
  let pulled=0,pushed=0;
  try{
   const remote=[];for(let offset=0;offset<=10000;offset+=500){const page=await request('/rest/v1/next_records?select=collection,record_id,value,revision,updated_at&order=collection,record_id&limit=500&offset='+offset);if(!Array.isArray(page))throw Error('Resposta incompatível da nuvem.');remote.push(...page);if(page.length<500)break;if(offset===10000)throw Error('Muitos registros para esta versão. Nada foi sobrescrito.');}
   const byRemote=new Map(remote.filter(r=>COLLECTIONS.includes(r.collection)&&/^[-\w:.]{1,120}$/.test(r.record_id)&&!['__proto__','constructor','prototype'].includes(r.record_id)&&Number.isSafeInteger(r.revision)).map(r=>[r.collection+':'+r.record_id,r]));
   const local=new Map(repository.inventory().map(r=>[r.collection+':'+r.id,r]));
   for(const key of new Set([...local.keys(),...byRemote.keys()])){
    const l=local.get(key),r=byRemote.get(key),b=read('base:'+user.id+':'+key),action=decision(l,r,b),collection=l?.collection||r.collection,id=l?.id||r.record_id;
    const remember=(lv,rv)=>storage.setItem(PREFIX+'base:'+user.id+':'+key,JSON.stringify({localVersion:lv,remoteRevision:rv}));
    if(action==='conflict'){conflicts.push({collection,id,local:l?.value??null,remote:r?.value??null,remoteRevision:r?.revision||0});continue;}
    try{
     if(action==='pull'){const current=repository.get(collection,id);if(current.version!==(l?.version||0)){conflicts.push({collection,id,local:current.value,remote:r.value,remoteRevision:r.revision});continue;}const updated=repository.set(collection,id,r.value,current.version);remember(updated.version,r.revision);pulled++;}
     else if(action==='push'){const result=await request('/rest/v1/rpc/next_write',{method:'POST',body:{p_collection:collection,p_id:id,p_value:l.value,p_expected:r?.revision||0}});const row=result?.[0];if(!row?.revision)throw Error('A nuvem não confirmou a gravação.');remember(l.version,row.revision);pushed++;}
     else if(action==='adopt')remember(l.version,r.revision);
    }catch(e){if(e.code==='conflict'||e.name==='ConflictError'){conflicts.push({collection,id,local:l?.value??null,remote:r?.value??null,remoteRevision:r?.revision||0});}else throw e;}
   }
   lastSync=new Date().toISOString();message=conflicts.length?`${conflicts.length} conflito(s) preservado(s). Confira antes de continuar.`:`Sincronizado · ${pushed} enviado(s), ${pulled} recebido(s)`;
  }catch(e){message=e.message;throw e;}finally{busy=false;notify();}
 }
 async function resolveConflict(index,choice){
  const conflict=conflicts[index];if(!conflict||!session||busy)throw Error('Confira o conflito novamente.');
  await token();const user=await request('/auth/v1/user');if(read('owner')!==user.id)throw Error('Conta diferente da conta vinculada.');
  const {collection,id}=conflict,local=repository.get(collection,id);
  if(choice==='remote'){const next=repository.set(collection,id,conflict.remote,local.version);storage.setItem(PREFIX+'base:'+user.id+':'+collection+':'+id,JSON.stringify({localVersion:next.version,remoteRevision:conflict.remoteRevision}));}
  else if(choice==='local'){storage.setItem(PREFIX+'base:'+user.id+':'+collection+':'+id,JSON.stringify({localVersion:-1,remoteRevision:conflict.remoteRevision}));}
  else throw Error('Escolha uma versão.');
  conflicts.splice(index,1);notify();await sync();
 }
 async function tutor(question,lesson){return request('/functions/v1/lion-tutor',{method:'POST',body:{question,lesson}});}
 function consumeCallback(fragment){
  const p=new URLSearchParams(fragment.replace(/^#/,''));
  if(!p.has('access_token')&&!p.has('error'))return false;
  const access=p.get('access_token'),refresh=p.get('refresh_token'),seconds=Number(p.get('expires_in'));
  if(access&&refresh&&access.length<12000&&refresh.length<12000&&seconds>0&&seconds<=86400){session={access_token:access,refresh_token:refresh,expires_at:Math.floor(Date.now()/1000)+seconds};persist();message='Confirmando sua conta…';}
  else message='O link expirou ou não pôde ser confirmado. Entre com sua conta ou solicite um novo link.';
  return true;
 }
 return {state,login,initialize,logout,sync,resolveConflict,tutor,consumeCallback};
}
