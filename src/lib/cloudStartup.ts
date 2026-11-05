/** Never synchronize a fresh store before its local save has been read. */
export async function waitForLocalSave(ready:()=>boolean,active:()=>boolean,timeoutMs=15000){
 const deadline=Date.now()+timeoutMs;
 while(active()){
  if(ready())return true;
  if(Date.now()>=deadline)throw Error('O salvamento local demorou para carregar. Tente sincronizar novamente; sua jornada foi preservada.');
  await new Promise(resolve=>setTimeout(resolve,50));
 }
 return false;
}
