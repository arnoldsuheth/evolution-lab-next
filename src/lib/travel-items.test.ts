import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {freshSave} from './game';
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{}}});
import {useGame} from './store';
import {mountSpeed} from './adventure';
function reset(){useGame.setState({...freshSave(),mounted:false,relocation:0,encounter:null,challenge:null,cooldowns:{}});useGame.getState().createCharacter('Viajante','paladin','normal');}
test('pergaminho é fabricado e consumido uma vez sem perder progresso',()=>{
 reset();useGame.setState(s=>({hero:{...s.hero,gold:100,inventory:['mat-crystal-1','mat-crystal-1','mat-cloth-1'],region:'ruins',position:[10,-10]},education:{...s.education,completed:['variables','arithmetic']}}));
 useGame.getState().craft('scroll-aurora');assert.deepEqual(useGame.getState().hero.inventory,['scroll-aurora']);assert.equal(useGame.getState().hero.gold,90);
 useGame.getState().useItem('scroll-aurora');assert.equal(useGame.getState().hero.region,'aurora');assert.deepEqual(useGame.getState().hero.position,[0,5]);assert.deepEqual(useGame.getState().hero.inventory,[]);assert.deepEqual(useGame.getState().education.completed,['variables','arithmetic']);assert.equal(useGame.getState().relocation,1);
 useGame.getState().useItem('scroll-aurora');assert.equal(useGame.getState().relocation,1);
});
test('teleporte durante combate não consome o pergaminho',()=>{
 reset();useGame.setState(s=>({hero:{...s.hero,inventory:['scroll-aurora']},encounter:{id:'test',name:'Teste',hp:100,maxHp:100,power:1,reward:1,elite:false}}));useGame.getState().useItem('scroll-aurora');assert.deepEqual(useGame.getState().hero.inventory,['scroll-aurora']);assert.equal(useGame.getState().relocation,0);
});
test('montarias Lovelace: lobo no 15, javali no 25, grifo no 50; combate desmonta',()=>{
 reset();useGame.setState(s=>({hero:{...s.hero,level:14}}));useGame.getState().toggleMount();assert.equal(useGame.getState().mounted,false);
 useGame.setState(s=>({hero:{...s.hero,level:15}}));useGame.getState().toggleMount();assert.equal(useGame.getState().mounted,true);assert.equal(mountSpeed(useGame.getState().hero),1.35);useGame.getState().toggleMount();assert.equal(useGame.getState().mounted,false);
 useGame.setState(s=>({hero:{...s.hero,level:25,inventory:[],equipped:[]}}));assert.equal(mountSpeed(useGame.getState().hero),1.5);useGame.setState(s=>({hero:{...s.hero,level:50}}));assert.equal(mountSpeed(useGame.getState().hero),1.8);
 useGame.setState(s=>({hero:{...s.hero,level:30,inventory:['mount-boar'],equipped:[]}}));assert.equal(mountSpeed(useGame.getState().hero),1.5);
 useGame.getState().equip('mount-boar');assert.equal(mountSpeed(useGame.getState().hero),1.5);useGame.getState().toggleMount();assert.equal(useGame.getState().mounted,true);
 useGame.setState(s=>({hero:{...s.hero,position:[-4,-18]},education:{...s.education,completed:['variables']}}));useGame.getState().startEncounter(false,2,'forest-wolf');assert.ok(useGame.getState().encounter);assert.equal(useGame.getState().mounted,false);
});
