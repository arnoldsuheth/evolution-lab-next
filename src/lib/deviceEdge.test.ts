import test from 'node:test';
import assert from 'node:assert/strict';
let handler:(req:Request)=>Promise<Response>;
Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:(name:string)=>name==='SUPABASE_URL'?'https://fixture.invalid':'server-secret-fixture'},serve:(fn:typeof handler)=>{handler=fn;}}});
const ready=import('../../supabase/functions/lions-cave-devices/index');
const request=(body:unknown,headers:Record<string,string>={})=>new Request('https://fixture.invalid',{method:'POST',headers:{origin:'https://arnoldsuheth.github.io',...headers},body:JSON.stringify(body)});
test('device endpoint rejects invalid capabilities and unapproved browser origins',async()=>{
 await ready;
 assert.equal((await handler(request({action:'read',device:'short'}))).status,401);
 assert.equal((await handler(request({action:'read',device:'a'.repeat(64)},{origin:'https://other.invalid'}))).status,403);
});
test('device endpoint hashes capabilities and never trusts a claimed legacy owner',async()=>{
 await ready;const original=globalThis.fetch;let parameters:Record<string,unknown>={};
 globalThis.fetch=async(_input,options)=>{parameters=JSON.parse(String(options?.body));return Response.json({vault:'fixture',revision:0,state:null,updated_at:'2026-01-01'});};
 try{const response=await handler(request({action:'open',device:'a'.repeat(64),legacy:'attacker-claimed-owner'}));assert.equal(response.status,200);assert.equal(parameters.p_legacy,null);assert.notEqual(parameters.p_device,'a'.repeat(64));assert.equal(String(parameters.p_device).length,64);assert.ok(!(await response.text()).includes('server-secret-fixture'));}finally{globalThis.fetch=original;}
});
test('legacy migration requires the Auth server to verify the existing session',async()=>{
 await ready;const original=globalThis.fetch;let parameters:Record<string,unknown>={};
 globalThis.fetch=async(input,options)=>{if(String(input).endsWith('/user'))return Response.json({id:'verified-owner'});parameters=JSON.parse(String(options?.body));return Response.json({vault:'fixture',revision:1,state:{hero:{}},updated_at:'2026-01-01'});};
 try{assert.equal((await handler(request({action:'open',device:'b'.repeat(64)},{authorization:'Bearer fixture-session'}))).status,200);assert.equal(parameters.p_legacy,'verified-owner');}finally{globalThis.fetch=original;}
});
test('a stale save returns a conflict instead of reporting success',async()=>{
 await ready;const original=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({code:'PT409'},{status:400});
 try{const response=await handler(request({action:'write',device:'b'.repeat(64),state:{hero:{}}}));assert.equal(response.status,409);assert.equal((await response.json()).conflict,true);}finally{globalThis.fetch=original;}
});
