import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {freshSave,migrateSave,stats,withXp} from './game';
import {attributePoints,cleanAttributes} from './attributes';
import {equipmentForSlot} from './equipment';
import {ITEMS} from './game';
import {useGame} from './store';
test('pontos retroativos e saltos de nível são derivados do nível sem crédito duplicado',()=>{
 const old={...freshSave(),hero:{...freshSave().hero,level:5,xp:1600,gold:500,inventory:['sword'],equipped:['sword']}};
 const migrated=migrateSave(old);assert.equal(attributePoints(migrated.hero),12);
 const again=migrateSave(migrated);assert.equal(attributePoints(again.hero),12);
 assert.equal(again.hero.xp,1600);assert.equal(again.hero.gold,500);assert.deepEqual(again.hero.inventory,['sword']);assert.deepEqual(again.hero.equipped,['sword']);
 const advanced=withXp(freshSave().hero,900);assert.equal(advanced.level,4);assert.equal(attributePoints(advanced),9);
 assert.equal(attributePoints(withXp(advanced,0)),9);
});
test('alocação persiste, altera atributos reais e não excede o orçamento',()=>{
 const save=freshSave();const base={...save.hero,level:5};
 const hero={...base,attributeAllocation:{defense:2,intelligence:3,strength:1}};
 const after=migrateSave({...save,hero}).hero;assert.equal(attributePoints(after),6);
 assert.equal(stats(after).defense,stats(base).defense+2);assert.equal(stats(after).maxHp,stats(base).maxHp+4);
 assert.equal(stats(after).maxMp,stats(base).maxMp+15);assert.equal(stats(after).attack,stats(base).attack+.5);
 assert.deepEqual(cleanAttributes({attack:999,defense:-3,intelligence:Infinity,wrong:22},2),{strength:0,attack:3,defense:0,agility:0,dexterity:0,intelligence:0});
});
test('distribuição não gasta duas vezes e é bloqueada em combate',()=>{
 const original=useGame.getState();try{
 useGame.setState({...freshSave(),hero:{...freshSave().hero,level:2},encounter:null,challenge:null});
 for(let i=0;i<8;i++)useGame.getState().allocateAttribute('attack');
 assert.equal(useGame.getState().hero.attributeAllocation?.attack,3);assert.equal(attributePoints(useGame.getState().hero),0);
 useGame.setState({hero:{...useGame.getState().hero,level:3},encounter:{id:'dummy',name:'Alvo',hp:100,maxHp:100,power:10,reward:1,elite:false}});
 useGame.getState().allocateAttribute('defense');assert.equal(useGame.getState().hero.attributeAllocation?.defense,0);
 }finally{useGame.setState(original,true);}
});
test('slot oferece apenas equipamento da mochila compatível com classe, nível e mão',()=>{
 const hero={...freshSave().hero,inventory:['sword','sword','shield','staff','paladin-head-60','tunic','potion'],equipped:['sword']};
 assert.deepEqual(equipmentForSlot(hero,'weapon',ITEMS).map(i=>i.id),[]);
 assert.deepEqual(equipmentForSlot(hero,'offhand',ITEMS).map(i=>i.id),['shield']);
 assert.deepEqual(equipmentForSlot(hero,'chest',ITEMS).map(i=>i.id),['tunic']);
 assert.deepEqual(equipmentForSlot(hero,'head',ITEMS).map(i=>i.id),[]);
 const mage={...hero,classId:'mage' as const,race:'elf' as const,equipped:[]};
 assert.deepEqual(equipmentForSlot(mage,'weapon',ITEMS).map(i=>i.id),['staff']);
});
