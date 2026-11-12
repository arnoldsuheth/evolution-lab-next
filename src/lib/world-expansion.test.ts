import { adventureOf } from "./adventure";
import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {MONSTERS,monsterRequirement} from './campaign';import {walkable} from './navigation';import {freshSave} from './game';import {cleanBindings,DEFAULT_BINDINGS} from './keybindings';
import {findPath} from './navigation';import {NPCS_LIVE,migrateSave} from './game';
test('postos raciais têm caminho até o vendedor e posições expandidas sobrevivem ao save',()=>{for(const id of ['elara','dorin']){const npc=NPCS_LIVE.find(n=>n.id===id)!;const target:[number,number]=[npc.x,npc.z-1];assert.equal(walkable(...target),true);assert.ok(findPath([0,5],target).length>0,id);const save=freshSave();save.hero.position=target;assert.deepEqual(migrateSave(save).hero.position,target);}assert.equal(walkable(43,0),true);assert.equal(walkable(0,-49),true);assert.equal(walkable(79,0),false);assert.equal(walkable(0,-83),false);});
test('há encontros iniciantes antes da floresta e faixas intermediárias por região',()=>{const s=freshSave();for(const id of ['village-boar','village-spider']){const m=MONSTERS.find(m=>m.id===id)!;assert.equal(m.level,1);assert.equal(monsterRequirement(s.hero,s.education,id),undefined);assert.equal(walkable(m.x,m.z),true);}for(const region of ['ruins','frontier','heart'])assert.ok(MONSTERS.filter(m=>m.region===region&&!m.boss).length>=3);});
test('atalhos normalizados não colidem e entradas inválidas mantêm controles utilizáveis',()=>{assert.deepEqual(cleanBindings(null),DEFAULT_BINDINGS);const b=cleanBindings({bag:'m',journal:'m',character:'w',map:'g'});assert.equal(b.bag,'m');assert.notEqual(b.journal,'m');assert.notEqual(b.character,'w');assert.equal(new Set(Object.values(b)).size,6);});

test('novas espécies ocupam áreas alcançáveis e os contadores sobrevivem ao save',()=>{
  const kinds=['stag','frostcat','beetle','basilisk'] as const;
  const save=freshSave();
  save.hero.adventure={...adventureOf(save.hero),kinds:Object.fromEntries(kinds.map(kind=>[kind,2]))};
  assert.deepEqual(migrateSave(save).hero.adventure?.kinds,save.hero.adventure.kinds);
  for(const kind of kinds){
    const mobs=MONSTERS.filter(monster=>monster.kind===kind);
    assert.ok(mobs.length>0);
    for(const monster of mobs)assert.ok(findPath([0,5],[monster.x,monster.z],monster.region).length,monster.name);
  }
});
