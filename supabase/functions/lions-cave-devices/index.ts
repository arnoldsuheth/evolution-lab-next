// Public endpoint authenticates with a 256-bit device capability, never a public database key.
export {};
declare const Deno:{env:{get:(name:string)=>string|undefined};serve:(handler:(req:Request)=>Promise<Response>)=>void};
const cors={'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')??'';
 const allowed=origin==='https://arnoldsuheth.github.io'||/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
 const headers={...cors,...(allowed?{'Access-Control-Allow-Origin':origin}:{}),'Vary':'Origin'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(origin&&!allowed)return reply({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const raw=await req.text();if(raw.length>8100000)return reply({error:'Salvamento muito grande.'},413);
  const body=JSON.parse(raw),secret=body.device;
  if(typeof secret!=='string'||!/^\w{64}$/.test(secret))return reply({error:'Aparelho inválido.'},401);
  if(!['open','read','write','pair','redeem'].includes(body.action))return reply({error:'Ação inválida.'},400);
  const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  let legacy:string|null=null;
  // Only the Auth server can attest the old owner. Never trust a user ID in the body.
  const authorization=req.headers.get('authorization');
  if(body.action==='open'&&authorization){const res=await fetch(url+'/auth/v1/user',{headers:{apikey:key,authorization}});if(res.ok){const user=await res.json();legacy=user.id;}}
  const code=typeof body.code==='string'?body.code.replace(/[^A-Za-z0-9]/g,'').toUpperCase():'';
  if(['pair','redeem'].includes(body.action)&&!/^[A-F0-9]{20}$/.test(code))return reply({error:'Confira os 20 caracteres do código.'},400);
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';
  const res=await fetch(url+'/rest/v1/rpc/lions_cave_device_api',{method:'POST',headers:{apikey:key,authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_action:body.action,p_device:await hash(secret),p_ip:await hash(key+ip),p_code:code?await hash(code):null,p_legacy:legacy,p_state:body.action==='write'?body.state:null,p_revision:body.revision??0,p_backup:body.backup===true})});
  const data=await res.json();
  if(!res.ok)return reply({error:data.code==='PT409'?'Outro aparelho salvou uma versão mais recente.':'Não foi possível consultar a nuvem. Sua cópia local foi preservada.',conflict:data.code==='PT409'},data.code==='PT409'?409:400);
  if(data.error)return reply(data,400);
  return reply(data);
 }catch{return reply({error:'Não foi possível acessar a nuvem. Sua cópia local foi preservada.'},503);}
});
