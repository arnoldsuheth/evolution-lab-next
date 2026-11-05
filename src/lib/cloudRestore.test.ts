import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {freshSave} from './game';
const storage=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)}});
import {useGame,SAVE_KEY,replaceFromCloud} from './store';
test('troca explícita para a nuvem guarda o original e não mistura contas',()=>{const local=freshSave();local.hero.created=true;local.hero.gold=999;local.education.completed=['variables'];useGame.setState(local);const original=storage.get(SAVE_KEY)!;const cloud=freshSave();cloud.hero.created=true;cloud.hero.name='Outra jornada';cloud.hero.gold=25;cloud.hero.inventory=['potion'];replaceFromCloud(cloud,true);const loaded=useGame.getState();assert.equal(loaded.hero.name,'Outra jornada');assert.equal(loaded.hero.gold,25);assert.deepEqual(loaded.education.completed,[]);assert.ok([...storage.entries()].some(([key,value])=>key.startsWith(SAVE_KEY+'-before-cloud-')&&value===original));});
test('dados sem personagem são rejeitados sem alterar a jornada',()=>{const before=JSON.stringify(useGame.getState().hero);assert.throws(()=>replaceFromCloud({hero:null} as never,true));assert.equal(JSON.stringify(useGame.getState().hero),before);});
