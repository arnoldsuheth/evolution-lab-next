import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {freshSave} from './game';
import {bagCount} from './equipment';
import {enemyVitals,resolveCombat} from './combat';
test('equipar oculta só a cópia usada e desequipar devolve à mochila sem remover propriedade',()=>{
 const inventory=['sword','sword','food'],equipped=['sword'];
 assert.equal(bagCount({inventory,equipped},'sword'),1);
 assert.equal(bagCount({inventory,equipped:[]},'sword'),2);
 assert.equal(bagCount({inventory,equipped},'food'),1);
 assert.deepEqual(inventory,['sword','sword','food']);assert.deepEqual(equipped,['sword']);
 assert.equal(bagCount({inventory:[],equipped:['sword']},'sword'),0);
});
test('criaturas mágicas têm MP e criaturas físicas têm estamina',()=>{
 for(const kind of ['wraith','dragon'] as const)assert.equal(enemyVitals(kind,5).resource,'mp');
 for(const kind of ['wolf','boar','spider','golem'] as const)assert.equal(enemyVitals(kind,5).resource,'stamina');
 assert.equal(enemyVitals('wolf',5).maxHp,255);assert.equal(enemyVitals('dragon',5,true).maxHp,459);
});
test('reação consome recurso real e exaustão reduz dano enquanto recupera reserva',()=>{
 const hero={...freshSave().hero,hp:1000,stamina:100};
 const enemy={...enemyVitals('wolf',8),id:'test',name:'Lobo',hp:1000,maxHp:1000,power:40,reward:25,elite:false};
 const normal=resolveCombat(hero,enemy),tired=resolveCombat(hero,{...enemy,resourceCurrent:0});
 assert.equal(normal.enemy.resourceCurrent,enemy.resourceCurrent-8);
 assert.equal(tired.enemy.resourceCurrent,16);assert.ok(tired.received<normal.received);
 const won=resolveCombat(hero,{...enemy,hp:1});assert.equal(won.enemy.resourceCurrent,enemy.resourceCurrent);
});
