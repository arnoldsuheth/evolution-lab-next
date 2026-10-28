import test from 'node:test';import assert from 'node:assert/strict';
import {createTutorHandler} from '../supabase/functions/lion-tutor/handler.mjs';
const request=body=>new Request('https://fixture.invalid/',{method:'POST',headers:{authorization:'Bearer fake','Content-Type':'application/json',Origin:'https://arnoldsuheth.github.io'},body:JSON.stringify(body)});
test('missing server secret is an explicit 503 and does not spend quota',async()=>{
 let calls=0;const handler=createTutorHandler({env:k=>k==='OPENAI_API_KEY'?'':'https://fixture.invalid',fetcher:async()=>{calls++;return new Response('{}');}});const response=await handler(request({question:'test'}));assert.equal(response.status,503);assert.equal(calls,1);assert.match((await response.json()).error_description,/instalação segura/);
});
test('tutor rejects foreign origin and missing authentication',async()=>{
 const handler=createTutorHandler({env:()=>'',fetcher:()=>{throw Error('must not fetch');}});
 assert.equal((await handler(new Request('https://fixture.invalid',{method:'POST',headers:{Origin:'https://evil.invalid'}}))).status,403);
 assert.equal((await handler(new Request('https://fixture.invalid',{method:'POST'}))).status,401);
});
test('only bounded lesson and question reach OpenAI; no stored response or private fields',async()=>{
 let payload;const handler=createTutorHandler({env:k=>k==='OPENAI_API_KEY'?'fake-key':'https://fixture.invalid',fetcher:async(url,options)=>{
 if(url.endsWith('/user'))return new Response('{}');if(url.includes('/rpc/'))return new Response('1');payload=JSON.parse(options.body);return new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:'Uma pista.'}]}]}));}});
 const response=await handler(request({question:'Como funciona?',lesson:{title:'Funções',text:'a'.repeat(10000)},books:'private',grades:'private'}));assert.equal(response.status,200);assert.equal((await response.json()).answer,'Uma pista.');assert.equal(payload.store,false);assert.equal(payload.max_output_tokens,800);assert.equal(JSON.parse(payload.input).lesson.text.length,8000);assert.ok(!payload.input.includes('private'));assert.ok(!payload.input.includes('fake-key'));
});
test('quota rejection prevents model request',async()=>{let count=0;const handler=createTutorHandler({env:()=> 'configured',fetcher:async()=>{count++;return new Response('{}',{status:count===1?200:400});}});assert.equal((await handler(request({question:'a'}))).status,429);assert.equal(count,2);});
