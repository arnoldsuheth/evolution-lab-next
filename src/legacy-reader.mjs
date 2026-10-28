// Read-only bridge. Credentials stay in this call's memory; no legacy session is read or saved.
const VAULT='https://arnoldsuheth.github.io/evolution-lab/cofre.json';
const API='https://api.github.com';
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function json(response,max=4_000_000){if(!response.ok)throw Error('Não consegui consultar o progresso original. Confira a conexão e o acesso do Lab original.');const raw=await response.text();if(raw.length>max)throw Error('O arquivo ultrapassa o limite de leitura direta. Use uma cópia JSON exportada.');try{return JSON.parse(raw);}catch{throw Error('A resposta do original está incompleta. Nenhum dado foi importado.');}}
async function decrypt(key,box){if(!box||typeof box.iv!=='string'||typeof box.ct!=='string')throw Error('Arquivo criptografado incompatível.');const data=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(box.iv)},key,bytes(box.ct));return JSON.parse(new TextDecoder().decode(data));}
export async function readOriginal(password,fetcher=fetch){
 if(typeof password!=='string'||!password||password.length>1024)throw Error('Informe a senha do Lab original no campo seguro.');
 const vault=await json(await fetcher(VAULT,{cache:'no-store',redirect:'error',credentials:'omit'}),100000);
 if(vault.v!==1||typeof vault.salt!=='string'||!Number.isSafeInteger(vault.iter||250000)||(vault.iter||250000)<100000||(vault.iter||250000)>1000000)throw Error('Formato do cofre original incompatível.');
 const salt=bytes(vault.salt),iterations=vault.iter||250000,base=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
 let access;try{access=await decrypt(key,vault.box);}catch{throw Error('Não consegui abrir o original. Confira a senha.');}password='';
 if(typeof access.token!=='string'||!access.token||!/^[-a-fA-F0-9]{16,64}$/.test(access.gist))throw Error('A configuração de acesso do original está incompleta.');
 let gist;try{gist=await json(await fetcher(API+'/gists/'+access.gist,{method:'GET',cache:'no-store',redirect:'error',credentials:'omit',headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+access.token}}));}finally{access.token='';access=null;}
 const file=gist.files?.['progresso.json'];if(!file||file.truncated||typeof file.content!=='string')throw Error('O progresso precisa de uma cópia JSON completa para ser importado.');
 let envelope;try{envelope=JSON.parse(file.content);}catch{throw Error('O arquivo de progresso original está ilegível.');}gist=null;
 const state=await decrypt(key,envelope.box);if(!state||state.v!==1)throw Error('Versão do progresso original não reconhecida.');
 return {state,encryptedBackup:{kind:'EvolutionLabEncryptedProgress',schemaVersion:1,exportedAt:new Date().toISOString(),salt:vault.salt,iterations,progress:{v:envelope.v,at:envelope.at,box:envelope.box}}};
}
