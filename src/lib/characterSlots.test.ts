import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,migrateSave} from './game';
import {characterSlots,packCharacters,selectCharacter} from './characterSlots';
import {fingerprint,hasJourney} from './cloudProtocol';
test('existing journey occupies slot one without losing progress or legacy',()=>{
 const original=freshSave();original.hero.created=true;original.hero.gold=923;original.education.completed=['variables'];original.legacy.kept='original';
 const packed=packCharacters(original),slots=characterSlots(packed);
 assert.equal(slots.slots.length,5);assert.equal(slots.slots[0]?.hero.gold,923);assert.equal(slots.slots.filter(Boolean).length,1);assert.equal(packed.legacy.kept,'original');
});
test('five independent characters retain equipment, learning, appearance and money',()=>{
 let state=freshSave();
 for(let i=0;i<5;i++){state=selectCharacter(state,i);state.hero={...state.hero,created:true,name:'Hero '+i,gold:50+i,inventory:i===2?['potion']:[],position:[i,5]};state.look={...state.look,hair:i};state.education={...state.education,completed:i===1?['variables']:[]};state=packCharacters(state);}
 state=migrateSave(JSON.parse(JSON.stringify(state)));
 for(let i=0;i<5;i++){state=selectCharacter(state,i);assert.equal(state.hero.name,'Hero '+i);assert.equal(state.hero.gold,50+i);assert.equal(state.look.hair,i);assert.deepEqual(state.education.completed,i===1?['variables']:[]);assert.deepEqual(state.hero.inventory,i===2?['potion']:[]);}
 assert.throws(()=>selectCharacter(state,5));assert.throws(()=>selectCharacter(state,-1));
});
test('repeated saves do not recursively embed the character roster',async()=>{
 let state=packCharacters(freshSave());const initial=JSON.stringify(state).length;
 for(let i=0;i<25;i++)state=packCharacters(state);
 assert.equal(JSON.stringify(state).length,initial);assert.equal(await fingerprint(state),await fingerprint(packCharacters(migrateSave(state))));
});
test('an empty active slot never hides meaningful campaigns from sync protection',()=>{
 const state=freshSave();state.hero.created=true;
 const next=selectCharacter(state,3);
 assert.equal(next.hero.created,false);assert.equal(hasJourney(next),true);
});
import {deleteCharacter as removeSlot} from './characterSlots';
test('excluir personagem esvazia só aquele espaço e mantém as configurações',()=>{
 const base=freshSave();base.hero={...base.hero,created:true,name:'Primeiro'};base.settings={...base.settings,volume:.7};
 const two=selectCharacter(base,1);two.hero={...two.hero,created:true,name:'Segundo'};
 const afterOther=removeSlot(two,0);assert.equal(characterSlots(afterOther).slots[0],null);assert.equal(afterOther.hero.name,'Segundo','o ativo continua');
 const afterActive=removeSlot(two,1);assert.equal(afterActive.hero.created,false,'o ativo vira espaço vazio');assert.equal(characterSlots(afterActive).slots[0]?.hero.name,'Primeiro');assert.equal(afterActive.settings.volume,.7);
 assert.throws(()=>removeSlot(two,9));
});
