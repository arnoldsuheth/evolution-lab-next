import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForLocalSave} from './cloudStartup';
import {freshSave} from './game';
import {useGame,SAVE_KEY} from './store';

test('direct route startup restores the saved character without mounting the game page',async()=>{
 const saved=freshSave();saved.hero.name='Jornada preservada';saved.hero.gold=742;
 const values=new Map([[SAVE_KEY,JSON.stringify({state:saved,version:4})]]);
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)}});
 await useGame.getState().hydrate();
 assert.equal(useGame.getState().ready,true);
 assert.equal(useGame.getState().hero.gold,742);
 assert.equal(useGame.getState().hero.name,'Jornada preservada');
 await useGame.getState().hydrate();
 assert.equal(useGame.getState().hero.gold,742);
});

test('cloud startup waits for the saved journey before allowing synchronization',async()=>{
 let ready=false;
 const pending=waitForLocalSave(()=>ready,()=>true);
 ready=true;
 assert.equal(await pending,true);
});
test('an unread local save times out instead of waiting forever',async()=>{
 await assert.rejects(waitForLocalSave(()=>false,()=>true,0),/preservada/);
});
test('a cancelled account cannot continue synchronization',async()=>{
 assert.equal(await waitForLocalSave(()=>true,()=>false),false);
});
