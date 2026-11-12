import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {freshSave,migrateSave} from './game';import {MONSTERS,monsterRequirement} from './campaign';import {battleRewards} from './combat';import {INSTANCES,instanceRequirement} from './instances';import {findPath,walkable} from './navigation';import {useGame} from './store';
function reset(){useGame.setState({...freshSave(),encounter:null,challenge:null,relocation:0,lastAttack:0,effects:[],cooldowns:{}});useGame.getState().createCharacter('Explorador','paladin','normal');}
test('entrada exige nível, capítulo e proximidade; saída preserva inventário',()=>{reset();useGame.getState().enterInstance('cavern');assert.equal(useGame.getState().hero.instance,null);useGame.setState(s=>({hero:{...s.hero,level:8,inventory:['sword']},education:{...s.education,completed:['variables']}}));useGame.getState().enterInstance('cavern');assert.equal(useGame.getState().hero.instance,null);useGame.setState(s=>({hero:{...s.hero,position:[INSTANCES.cavern.x,INSTANCES.cavern.z]}}));useGame.getState().enterInstance('cavern');assert.equal(useGame.getState().hero.instance,'cavern');assert.deepEqual(migrateSave(useGame.getState()).hero.instance,'cavern');useGame.getState().leaveInstance();assert.equal(useGame.getState().hero.instance,null);assert.deepEqual(useGame.getState().hero.inventory,['sword']);assert.deepEqual(useGame.getState().hero.position,[INSTANCES.cavern.x,INSTANCES.cavern.z+2]);});
test('instâncias isolam os encontros e exigem guardiões antes do chefe',()=>{const s=freshSave();s.hero.level=30;s.education.completed=['variables','conditions','functions'];assert.ok(monsterRequirement(s.hero,s.education,'cavern-spider'));s.hero.instance='cavern';assert.equal(monsterRequirement(s.hero,s.education,'cavern-spider'),undefined);assert.ok(monsterRequirement(s.hero,s.education,'forest-wolf'));assert.ok(monsterRequirement(s.hero,s.education,'cavern-guardian'));s.hero.instanceProgress=['cavern-spider','cavern-golem'];assert.equal(monsterRequirement(s.hero,s.education,'cavern-guardian'),undefined);assert.ok(monsterRequirement(s.hero,s.education,'cavern-spider'));});
test('XP dobra apenas dentro da instância e material especial não cai fora dela',()=>{const s=freshSave();s.hero.level=10;const enemy={id:'test',name:'Teste',hp:0,maxHp:100,power:1,reward:1,elite:false,level:10};const base=battleRewards(s.hero,enemy);s.hero.instance='cavern';const inside=battleRewards(s.hero,{...enemy,instanceId:'cavern'});assert.equal(inside.xp,base.xp*2);assert.ok(inside.drops.includes('instance-crystal'));assert.ok(!base.drops.includes('instance-crystal'));});
test('entradas, saídas e criaturas cabem em pontos navegáveis',()=>{for(const place of Object.values(INSTANCES)){assert.equal(walkable(place.x,place.z, place.region),true);assert.equal(walkable(place.x,place.z+2, place.region),true);}for(const m of MONSTERS.filter(m=>m.instance))assert.equal(walkable(m.x,m.z, 'instance'),true);assert.equal(walkable(13,0, 'instance'),false);});

test('a caverna pode ser alcançada a pé, mas a entrada exige a primeira runa',()=>{
 const cave=INSTANCES.cavern, hero={...freshSave().hero,level:cave.level};
 assert.ok(cave.z < -28);
 assert.ok(findPath([0,5],[cave.x,cave.z+2]).length>0);
 assert.ok(instanceRequirement(hero,[],'cavern'));
 assert.equal(instanceRequirement(hero,['variables'],'cavern'),undefined);
});

test('recuar da Gruta da Geada retorna à entrada em Iron Forge',()=>{
  reset();
  const place=INSTANCES['frost-cave'];
  useGame.setState(s=>({hero:{...s.hero,region:place.region,position:[place.x,place.z]}}));
  useGame.getState().enterInstance('frost-cave');
  useGame.getState().move([-5,1]);
  useGame.getState().startEncounter(false,1,'frost-cave-spider');
  assert.equal(useGame.getState().encounter?.kind,'wolf');
  useGame.getState().flee();
  const {hero,encounter}=useGame.getState();
  assert.equal(encounter,null);
  assert.equal(hero.instance,null);
  assert.equal(hero.region,place.region);
  assert.deepEqual(hero.position,[place.x,place.z+2]);
});
