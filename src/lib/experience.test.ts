import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {experienceProgress} from './experience';
test('barra usa a mesma curva cumulativa do jogo antes e depois de subir de nível',()=>{
 assert.deepEqual(experienceProgress(50,1),{total:50,level:1,nextLevel:2,earned:50,required:100,remaining:50,percent:50});
 const p=experienceProgress(250,2);assert.equal(p.earned,150);assert.equal(p.required,300);assert.equal(p.remaining,150);assert.equal(p.percent,50);
 const next=experienceProgress(400,3);assert.equal(next.earned,0);assert.equal(next.remaining,500);assert.equal(next.percent,0);
});
test('nível máximo e save antigo com nível maior que o XP nunca geram progresso negativo',()=>{
 const capped=experienceProgress(500000,60);assert.equal(capped.nextLevel,null);assert.equal(capped.remaining,0);assert.equal(capped.percent,100);
 const old=experienceProgress(0,5);assert.equal(old.percent,0);assert.equal(old.remaining,2500);
});
