/** Never synchronize a fresh store before its local save has been read. */
export async function withCloudDeadline<T>(task:Promise<T>,timeoutMs=15000):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([task,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('A conexão demorou. Sua jornada foi preservada; tente sincronizar novamente.')),timeoutMs);})]);}
 finally{if(timer)clearTimeout(timer);}
}
export async function waitForLocalSave(ready:()=>boolean,active:()=>boolean,timeoutMs=15000){
 const deadline=Date.now()+timeoutMs;
 while(active()){
  if(ready())return true;
  if(Date.now()>=deadline)throw Error('O salvamento local demorou para carregar. Tente sincronizar novamente; sua jornada foi preservada.');
  await new Promise(resolve=>setTimeout(resolve,50));
 }
 return false;
}
