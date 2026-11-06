import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {ITEMS,freshSave} from './game';
import {forgeStep,forgeId,bandFor,LEVEL_BANDS} from './catalogue';
import {forgeCost} from './economy';
import {useGame} from './store';
test('cada equipamento de loja tem versão Épica e Mítica, mais forte e mais cara',()=>{
 const base=ITEMS['paladin-chest-5'],epic=ITEMS[forgeId(base.id,'epico')],myth=ITEMS[forgeId(base.id,'mitico')];
 assert.equal(base.rarity,'Comum');assert.equal(epic.rarity,'Épico');assert.equal(myth.rarity,'Mítico');
 assert.ok(epic.defense>base.defense&&myth.defense>epic.defense);assert.ok(epic.price>base.price&&myth.price>epic.price);
 assert.equal(epic.source,'forge');assert.equal(epic.ingredients,undefined);assert.equal(forgeStep(myth.id),null);
 const rarities=new Set(Object.values(ITEMS).map(i=>i.rarity));for(const r of rarities)assert.ok(['Comum','Épico','Mítico'].includes(r),r);
});
test('ferreiro aprimora um item uma vez, cobrando moedas, fragmentos e cristais',()=>{
 const base=ITEMS['paladin-chest-5'],next=ITEMS[forgeId(base.id,'epico')],band=LEVEL_BANDS[bandFor(base.minLevel)],cost=forgeCost(base,next,'epico',band);
 const mats=Object.entries(cost.materials).flatMap(([id,n])=>Array(n).fill(id) as string[]);
 const save=freshSave();useGame.setState({...save,hero:{...save.hero,created:true,level:5,position:[-7,0],gold:cost.gold+5,materials:cost.fragments,inventory:[base.id,...mats],equipped:[base.id]},encounter:null});
 useGame.getState().upgradeItem(base.id);const h=useGame.getState().hero;
 assert.deepEqual(h.inventory,[next.id]);assert.deepEqual(h.equipped,[next.id]);assert.equal(h.gold,5);assert.equal(h.materials,0);
 useGame.getState().upgradeItem(next.id);assert.deepEqual(useGame.getState().hero.inventory,[next.id],'sem recursos, nada muda');
});
