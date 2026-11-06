import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {freshSave,stats} from './game';
import {resolveCombat} from './combat';
import {autoAttackStep} from './controls';
import {savedState,useGame,SAVE_KEY} from './store';
test('crítico aumenta o dano real em 50%, sem multiplicar sangramento, e respeita recursos',()=>{
 const hero={...freshSave().hero,stamina:100,hp:1000},enemy={id:'alvo',name:'Alvo',hp:9999,maxHp:9999,power:1,reward:1,elite:false,bleed:{damage:10,turns:2}};
 const normal=resolveCombat(hero,enemy,{criticalRoll:1}),critical=resolveCombat(hero,enemy,{criticalRoll:0});
 assert.equal(normal.critical,false);assert.equal(critical.critical,true);
 assert.equal(critical.damage,Math.round(stats(hero).attack*1.5+10));assert.equal(critical.enemy.hp,enemy.hp-critical.damage);
 assert.equal(critical.hero.stamina,normal.hero.stamina);
 assert.equal(resolveCombat({...hero,stamina:0},enemy,{criticalRoll:0}).damage,0);
});
test('automático para sem alvo, em outro alvo, morto, oculto ou sem estamina e não reinicia aproximação',()=>{
 const state={identity:'lobo',dead:false,stamina:100,encounter:true,queued:false,hidden:false};
 assert.equal(autoAttackStep(state,'lobo'),'attack');
 assert.equal(autoAttackStep({...state,encounter:false},'lobo'),'approach');
 assert.equal(autoAttackStep({...state,encounter:false,queued:true},'lobo'),'wait');
 for(const change of [{identity:null},{identity:'outro'},{dead:true},{hidden:true},{stamina:8}])assert.equal(autoAttackStep({...state,...change},'lobo'),'stop');
});
test('relógio e feedback não regravem campanhas ou recriam personagem sem mudança, mas vida alterada é salva',()=>{
 const memory=new Map<string,string>();let writes=0;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{writes++;memory.set(k,v);},removeItem:()=>{}}});
 const original=useGame.getState(),save=freshSave(),hero={...save.hero,created:true};Object.assign(hero,{hp:stats(hero).maxHp,mp:stats(hero).maxMp,stamina:stats(hero).maxStamina});
 try{
 useGame.setState({...save,hero,encounter:null,lastAttack:0,effects:[],buff:0});
 const first=useGame.getState().hero,before=writes,snapshot=savedState(useGame.getState());
 for(let i=0;i<100;i++)useGame.getState().tick(1);
 assert.equal(useGame.getState().hero,first);assert.equal(writes,before);assert.equal(savedState(useGame.getState()),snapshot);
 useGame.setState({hero:{...first,hp:first.hp-10}});assert.ok(writes>before);assert.equal(JSON.parse(memory.get(SAVE_KEY)!).state.hero.hp,first.hp-10);
 }finally{useGame.setState(original,true);}
});
test('derrota normal limpa alvo e aproximação para não reiniciar ataque após o resgate',()=>{
 const original=useGame.getState();try{useGame.setState({...freshSave(),hero:{...freshSave().hero,created:true,hp:1,stamina:100},target:'fake-wolf',queued:{kind:'attack'},lastAttack:0,encounter:{id:'fake',monsterId:'fake-wolf',name:'Lobo',hp:99999,maxHp:99999,power:99999,reward:0,elite:false}});useGame.getState().attack();assert.equal(useGame.getState().encounter,null);assert.equal(useGame.getState().target,null);assert.equal(useGame.getState().queued,null);assert.ok(useGame.getState().hero.hp>0);}finally{useGame.setState(original,true);}
});
