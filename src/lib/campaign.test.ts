import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {freshSave,migrateSave,ITEMS} from './game';
import {MONSTERS,NULLARION_SCALE,regionRequirement,monsterRequirement} from './campaign';
import {MAIN_ORDER,AI_COURSE,aiRequirement,questMarker,travelerFor} from './journey';
import {ORE_VEINS,PICKAXE_ID} from './mining';
import {findPath} from './navigation';
import {battleRewards} from './combat';
import {COURSE_GUIDES} from './courseGuides';
const mem=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>mem.get(k)??null,setItem:(k:string,v:string)=>mem.set(k,v)}});
import {useGame} from './store';
function reset(){useGame.setState({...freshSave(),challenge:null,encounter:null,cooldowns:{},effects:[],lastAttack:0});useGame.getState().createCharacter('Campanha','paladin','normal');}
test('campanha tem cinco chefes distintos, incluindo chefe mestre nível 60',()=>{const bosses=MONSTERS.filter(m=>m.boss&&!m.instance);assert.equal(bosses.length,5);assert.equal(new Set(bosses.map(m=>m.id)).size,5);assert.equal(bosses.at(-1)?.id,'boss-master');assert.equal(bosses.at(-1)?.level,60);assert.ok(new Set(MONSTERS.map(m=>m.kind)).size>=6);});
test('região seguinte exige chefe anterior e etapa de programação',()=>{const s=freshSave();s.hero.level=60;assert.match(regionRequirement(s.hero,s.education,'ruins')!,/chefe/);s.hero.defeatedBosses=['boss-mines'];assert.match(regionRequirement(s.hero,s.education,'ruins')!,/programação/);s.education.completed=['functions'];assert.equal(regionRequirement(s.hero,s.education,'ruins'),undefined);});
test('minas exigem chefe da floresta e chefe mestre exige projeto final',()=>{const s=freshSave();s.hero.level=60;s.education.completed=[...MAIN_ORDER];assert.ok(monsterRequirement(s.hero,s.education,'boss-mines'));s.hero.defeatedBosses=['boss-forest'];assert.equal(monsterRequirement(s.hero,s.education,'boss-mines'),undefined);s.hero.region='heart';assert.ok(monsterRequirement(s.hero,s.education,'boss-master'));s.education.reviewedProjects=[14];assert.match(monsterRequirement(s.hero,s.education,'boss-master')!,/história principal/);s.education.deliveries=MAIN_ORDER.map(id=>'main:'+id);assert.equal(monsterRequirement(s.hero,s.education,'boss-master'),undefined);});
test('combate exige proximidade e usa nível real do chefe',()=>{reset();useGame.setState(s=>({hero:{...s.hero,level:60},education:{...s.education,completed:[...MAIN_ORDER]}}));useGame.getState().startEncounter(true,1,'boss-forest');assert.equal(useGame.getState().encounter,null);useGame.setState(s=>({hero:{...s.hero,position:[3.5,-19]}}));useGame.getState().startEncounter(true,1,'boss-forest');assert.equal(useGame.getState().encounter?.level,5);});
test('vitória de chefe registra desbloqueio uma vez',()=>{reset();useGame.setState(s=>({hero:{...s.hero,level:60,hp:1000,stamina:100},encounter:{id:'boss-test',name:'Brutamato',hp:1,maxHp:1,power:1,reward:1,elite:true,level:5,bossId:'boss-forest'}}));useGame.getState().attack();assert.deepEqual(useGame.getState().hero.defeatedBosses,['boss-forest']);const xp=useGame.getState().hero.xp;useGame.getState().attack();assert.equal(useGame.getState().hero.xp,xp);});
test('teleporte exige desbloqueio e proximidade do portal',()=>{reset();useGame.setState(s=>({hero:{...s.hero,level:30,defeatedBosses:['boss-mines']},education:{...s.education,completed:['functions']}}));useGame.getState().travelRegion('ruins');assert.equal(useGame.getState().hero.region,'aurora');useGame.setState(s=>({hero:{...s.hero,position:[25,-18]}}));useGame.getState().travelRegion('ruins');assert.equal(useGame.getState().hero.region,'ruins');assert.deepEqual(useGame.getState().hero.position,[0,7]);});
test('marcadores distinguem disponível e pronto para entregar sem repetir XP',()=>{reset();const s=useGame.getState();assert.equal(questMarker(s.hero,s.education,'main'),'!');useGame.getState().solve('variables','let nivel=1;');const done=useGame.getState();assert.equal(questMarker(done.hero,done.education,'main'),'?');const xp=done.hero.xp;useGame.setState(s=>({hero:{...s.hero,position:[5,-5]}}));useGame.getState().deliverQuest('main');assert.equal(useGame.getState().hero.xp,xp);assert.ok(useGame.getState().education.deliveries.includes('main:variables'));assert.equal(questMarker(useGame.getState().hero,useGame.getState().education,'main'),'!');});
test('missões de IA seguem três cursos independentes e entrega ao NPC',()=>{const s=freshSave();assert.equal(AI_COURSE.length,30);assert.equal(aiRequirement(s.hero,s.education,'code-0'),undefined);assert.equal(aiRequirement(s.hero,s.education,'cowork-0'),undefined);s.hero.level=60;assert.ok(aiRequirement(s.hero,s.education,'cowork-1'));s.education.aiCompleted=['cowork-0'];assert.ok(aiRequirement(s.hero,s.education,'cowork-1'));s.education.deliveries=['ai:cowork-0'];assert.equal(aiRequirement(s.hero,s.education,'cowork-1'),undefined);assert.ok(Number.isFinite(travelerFor(s.hero.id).x));});
test('quinze capítulos de programação têm explicação, prática guiada, exemplo e verificação',()=>{assert.equal(COURSE_GUIDES.length,15);for(const c of COURSE_GUIDES){assert.ok(c.lesson.length>180);assert.ok(c.steps.length>=4);assert.ok(c.example.length>40);assert.ok(c.practice.length>40);assert.ok(c.check.length>40);}});
test('migração antiga preserva cursos concluídos como entregues e restauração conserva chefes',()=>{const old={hero:{...freshSave().hero},education:{completed:['variables'],aiCompleted:['ai-0']}};const next=migrateSave(old);assert.deepEqual(next.education.deliveries,['main:variables','ai:ai-0']);reset();useGame.setState(s=>({hero:{...s.hero,defeatedBosses:['boss-forest']}}));const previous=freshSave();previous.hero.id=useGame.getState().hero.id;useGame.getState().restore(JSON.stringify({state:previous,version:3}));assert.deepEqual(useGame.getState().hero.defeatedBosses,['boss-forest']);});

test('portão final exige que todas as runas sejam entregues',()=>{
 const s=freshSave();s.hero.level=60;s.hero.defeatedBosses=['boss-frontier'];s.education.completed=[...MAIN_ORDER];
 assert.match(regionRequirement(s.hero,s.education,'heart')!,/história principal/);
 s.education.deliveries=MAIN_ORDER.map(id=>'main:'+id);
 assert.equal(regionRequirement(s.hero,s.education,'heart'),undefined);
});
test('só Nullarion entrega a escama exclusiva e ela não se duplica',()=>{
 const hero=freshSave().hero;
 const enemy={id:'dragon',name:'Nullarion',hp:0,maxHp:1,power:1,reward:1,elite:true,level:60};
 assert.ok(!battleRewards(hero,enemy).drops.includes(NULLARION_SCALE));
 assert.ok(battleRewards(hero,{...enemy,bossId:'boss-master'}).drops.includes(NULLARION_SCALE));
 hero.inventory.push(NULLARION_SCALE);
 assert.ok(!battleRewards(hero,{...enemy,bossId:'boss-master'}).drops.includes(NULLARION_SCALE));
 assert.equal(ITEMS[NULLARION_SCALE].sellPrice,0);
});

test('mineração exige picareta e proximidade e respeita a recarga',()=>{
 reset();
 const vein=ORE_VEINS[0];
 const game=()=>useGame.getState();
 assert.ok(findPath([0,5],[vein.x,vein.z],false,false).length);
 game().gather(vein.id);
 assert.ok(!game().hero.inventory.includes(vein.item));
 useGame.setState(s=>({hero:{...s.hero,position:[vein.x,vein.z],gold:100}}));
 game().gather(vein.id);
 assert.match(game().notice,/picareta/);
 game().buy(PICKAXE_ID);
 game().gather(vein.id);
 game().gather(vein.id);
 assert.equal(game().hero.inventory.filter(id=>id===vein.item).length,2);
});
