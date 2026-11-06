import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {resolveCombat,enemyVitals,MONSTER_POWER,type EnemyState} from './combat';
import {freshSave} from './game';
import {MONSTERS,isAggressive} from './campaign';
const hero=()=>({...freshSave().hero,created:true,level:5,hp:400,stamina:999,mp:999});
const enemy=(kind:'spider'|'wolf'|'wraith'|'dragon'|'boar'):EnemyState=>({...enemyVitals(kind,5),kind,turn:0,id:'e',name:'Alvo',hp:99999,maxHp:99999,power:30,reward:1,elite:false,level:5});
test('cada espécie usa seu poder de tempos em tempos e o herói sente o efeito',()=>{
 for(const kind of ['spider','wolf','wraith','dragon'] as const){let h=hero(),e=enemy(kind),used:string|undefined;for(let i=0;i<MONSTER_POWER[kind].every;i++){const r=resolveCombat(h,e);h=r.hero;e=r.enemy;used=r.enemySkill??used;}
  assert.equal(used,MONSTER_POWER[kind].name,kind);assert.equal(e.heroStatus?.kind,MONSTER_POWER[kind].kind,kind);}
});
test('veneno e fogo tiram vida por rodadas; lentidão e congelamento enfraquecem o golpe',()=>{
 const base=resolveCombat(hero(),enemy('wolf'));
 const slowed=resolveCombat(hero(),{...enemy('wolf'),heroStatus:{kind:'slow',turns:2,damage:0}});assert.ok(slowed.damage<base.damage,'lento bate mais fraco');
 const frozen=resolveCombat(hero(),{...enemy('wolf'),heroStatus:{kind:'freeze',turns:1,damage:0}});assert.ok(frozen.damage<slowed.damage,'congelado bate ainda mais fraco');
 const poisoned=resolveCombat(hero(),{...enemy('spider'),heroStatus:{kind:'poison',turns:3,damage:7}});const clean=resolveCombat(hero(),enemy('spider'));assert.equal(poisoned.received-clean.received,7);assert.equal(poisoned.enemy.heroStatus?.turns,2);
 const charge=(()=>{let h=hero(),e=enemy('boar'),last=0;for(let i=0;i<3;i++){const r=resolveCombat(h,e);h=r.hero;e=r.enemy;last=r.received;}return last;})();assert.ok(charge>clean.received,'investida do javali bate mais forte');
});
test('iniciantes são pacíficos; a partir do nível 3 os monstros atacam quem chega perto',()=>{
 for(const m of MONSTERS.filter(m=>m.region==='aurora'&&m.level<=2))assert.equal(isAggressive(m),false,m.id);
 assert.ok(MONSTERS.filter(m=>m.region==='aurora'&&!m.instance).some(m=>isAggressive(m)));assert.ok(MONSTERS.filter(m=>m.region!=='aurora').every(isAggressive));
});
