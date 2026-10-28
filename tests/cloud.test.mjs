import test from 'node:test';
import assert from 'node:assert/strict';
import {decision,createCloud} from '../src/cloud.mjs';
import {createRepository} from '../src/core.mjs';
const storage=()=>{const m=new Map();return {get length(){return m.size;},getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]};};
const value=n=>({version:n,value:{title:'v'+n}});
test('merge preserves simultaneous changes and distinguishes tombstones',()=>{
 assert.equal(decision(value(2),{revision:2,value:{title:'remote'}},{localVersion:1,remoteRevision:1}),'conflict');
 assert.equal(decision(value(1),{revision:2,value:{title:'remote'}},{localVersion:1,remoteRevision:1}),'pull');
 assert.equal(decision(value(2),{revision:1,value:{title:'remote'}},{localVersion:1,remoteRevision:1}),'push');
 assert.equal(decision({version:2,value:null},{revision:1,value:{}},{localVersion:1,remoteRevision:1}),'push');
 assert.equal(decision(value(1),{revision:2,value:null},{localVersion:1,remoteRevision:1}),'pull');
 assert.equal(decision(value(1),undefined,{localVersion:1,remoteRevision:1}),'conflict');
 assert.equal(decision(value(1),{revision:1,value:{title:'different'}},null),'conflict');
});
function fixture(){const rows=new Map();let writes=0,identity='user-a',failWrite=false;
 const fetcher=async(url,options={})=>{const path=new URL(url).pathname,body=options.body?JSON.parse(options.body):null;let result;
  if(path==='/auth/v1/token')result={access_token:'fake',refresh_token:'fake-refresh',expires_in:3600,user:{id:identity,email:'fixture@example.invalid'}};
  else if(path==='/auth/v1/user')result={id:identity,email:'fixture@example.invalid'};
  else if(path==='/rest/v1/next_records')result=[...rows.values()];
  else if(path==='/rest/v1/rpc/next_write'){writes++;const key=body.p_collection+':'+body.p_id,old=rows.get(key);if(failWrite||(old?.revision||0)!==body.p_expected)return new Response(JSON.stringify({code:'40001'}),{status:400});const next={collection:body.p_collection,record_id:body.p_id,revision:(old?.revision||0)+1,value:body.p_value};rows.set(key,next);result=[next];}
  else if(path==='/auth/v1/logout')result={};else throw Error('Unexpected request '+url);
  return new Response(JSON.stringify(result),{status:200});
 };
 const device=()=>{const local=storage(),repository=createRepository(local),cloud=createCloud({storage:local,repository,fetcher});return {local,repository,cloud};};
 return {rows,device,writes:()=>writes,identity:x=>identity=x,failWrite:x=>failWrite=x};
}
test('two devices push, pull, preserve conflicting edits, and resolve explicitly',async()=>{
 const f=fixture(),a=f.device(),b=f.device();await a.cloud.login('a','password');await b.cloud.login('a','password');
 a.repository.set('books','book',{title:'first'},0);await a.cloud.sync({activate:true});await b.cloud.sync({activate:true});assert.equal(b.repository.get('books','book').value.title,'first');
 a.repository.set('books','book',{title:'device a'},1);b.repository.set('books','book',{title:'device b'},1);
 await a.cloud.sync();await b.cloud.sync();assert.equal(b.cloud.state().conflicts.length,1);assert.equal(b.repository.get('books','book').value.title,'device b');assert.equal(f.rows.get('books:book').value.title,'device a');
 await b.cloud.resolveConflict(0,'local');assert.equal(f.rows.get('books:book').value.title,'device b');await a.cloud.sync();assert.equal(a.repository.get('books','book').value.title,'device b');
 const av=a.repository.get('books','book').version;a.repository.set('books','book',null,av);await a.cloud.sync();await b.cloud.sync();assert.equal(b.repository.get('books','book').value,null);assert.ok(b.repository.get('books','book').history.length);
});
test('failed CAS never overwrites the remote record or marks it synchronized',async()=>{
 const f=fixture(),a=f.device();await a.cloud.login('a','password');a.repository.set('tasks','t',{title:'college'},0);f.failWrite(true);await a.cloud.sync({activate:true});assert.equal(a.cloud.state().conflicts.length,1);assert.equal(f.rows.size,0);assert.equal(a.repository.get('tasks','t').value.title,'college');
 f.failWrite(false);await a.cloud.sync();assert.equal(f.rows.get('tasks:t').value.title,'college');
});
test('second account cannot upload the previous account data',async()=>{
 const f=fixture(),a=f.device();await a.cloud.login('a','password');a.repository.set('books','b',{title:'private'},0);await a.cloud.sync({activate:true});await a.cloud.logout();f.identity('user-b');await a.cloud.login('b','password');await assert.rejects(a.cloud.sync({activate:true}),/outra conta/);assert.equal(f.writes(),1);
});
test('local edits during a remote fetch are preserved',async()=>{
 const local=storage(),repository=createRepository(local);repository.set('tasks','t',{title:'before'},0);
 local.setItem('evolab-next:cloud:base:user-a:tasks:t',JSON.stringify({localVersion:1,remoteRevision:1}));
 const cloud=createCloud({storage:local,repository,fetcher:async(url)=>{const p=new URL(url).pathname;const data=p==='/auth/v1/token'?{access_token:'fake',expires_in:3600,user:{id:'user-a'}}:p==='/auth/v1/user'?{id:'user-a'}: [{collection:'tasks',record_id:'t',revision:2,value:{title:'remote'}}];if(p==='/rest/v1/next_records')repository.set('tasks','t',{title:'typing'},1);return new Response(JSON.stringify(data));}});
 await cloud.login('a','b');await cloud.sync({activate:true});assert.equal(repository.get('tasks','t').value.title,'typing');assert.equal(cloud.state().conflicts.length,1);
});
