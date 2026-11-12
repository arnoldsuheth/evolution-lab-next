import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {type QuestLog,QUESTS,GATHER_NODES,emptyLog,cleanLog,acceptQuest,progressQuests,turnInQuest,questStatus,npcMarker,goal} from './quests';
import {NPCS_LIVE} from './game';
import {MONSTERS} from './campaign';
import {walkable,findPath} from './navigation';
import {useGame} from './store';
import {freshSave} from './game';
test('missões secundárias são todas de clique (falar, caçar, coletar) e cada uma tem quem entrega',()=>{
 for(const q of QUESTS){assert.ok(NPCS_LIVE.some(n=>n.id===q.giver),q.id);for(const o of q.objectives){assert.ok(['talk','kill','collect'].includes(o.type));if(o.type==='kill'){const targets=MONSTERS.filter(m=>m.region==='aurora'&&!m.instance&&(o.ids?o.ids.includes(m.id):o.kinds!.includes(m.kind)));assert.ok(targets.length>=(o.ids?1:Math.min(o.count,3)),`${q.id}: poucos alvos`);}if(o.type==='collect')assert.ok(GATHER_NODES.filter(n=>n.node===o.node).length>=o.count,`${q.id}: poucos pontos`);}if(q.after)assert.ok(QUESTS.some(p=>p.id===q.after));}
});
test('pontos de coleta ficam em lugares caminháveis e alcançáveis',()=>{for(const n of GATHER_NODES){assert.ok(walkable(n.x,n.z),n.id);assert.ok(findPath([0,5],[Math.round(n.x),Math.round(n.z)]).length>0,n.id+' sem caminho');}});
test('ciclo completo: aceitar, progredir, entregar e não repetir',()=>{
 let log=emptyLog();const q=QUESTS.find(q=>q.id==='q-boas-vindas')!;
 assert.equal(questStatus(log,q,1,[]),'available');assert.equal(npcMarker(log,'lovelace',1,[]),'!');
 log=acceptQuest(log,q.id,1,[]);assert.equal(questStatus(log,q,1,[]),'active');
 for(const npc of ['eldrin','borin','eldrin','mira'] as const)log=progressQuests(log,{type:'talk',npc}).log;
 assert.deepEqual(log.active[q.id],[1,1,1],'falar duas vezes não conta em dobro');assert.equal(npcMarker(log,'lovelace',1,[]),'?');
 const done=turnInQuest(log,q.id);assert.deepEqual(done.reward,q.reward);assert.equal(questStatus(done.log,q,1,[]),'done');assert.equal(turnInQuest(done.log,q.id).reward,undefined);
 assert.equal(questStatus(done.log,QUESTS.find(q=>q.id==='q-couro')!,1,[]),'available','libera a próxima');
 assert.equal(questStatus(done.log,QUESTS.find(q=>q.id==='q-cristais')!,5,[]),'locked','exige a primeira runa');
});
test('caçada conta por tipo de monstro e chefe conta pelo nome',()=>{
 let log:QuestLog={active:{'q-couro':[0],'q-senhor-bosque':[0]},done:[]};
 log=progressQuests(log,{type:'kill',kind:'boar',id:'village-boar'}).log;log=progressQuests(log,{type:'kill',kind:'wolf',id:'field-wolf'}).log;
 assert.deepEqual(log.active['q-couro'],[1]);assert.deepEqual(log.active['q-senhor-bosque'],[0]);
 log=progressQuests(log,{type:'kill',kind:'boar',id:'boss-forest'}).log;assert.deepEqual(log.active['q-senhor-bosque'],[1]);
 assert.equal(goal(QUESTS[1].objectives[0]),3);
});
test('diário salvo é limpo: missões desconhecidas e números inválidos são descartados',()=>{
 const log=cleanLog({active:{'q-couro':[99],'inventada':[1]},done:['q-boas-vindas','q-boas-vindas','falsa']});
 assert.deepEqual(log,{active:{'q-couro':[3]},done:['q-boas-vindas']});assert.deepEqual(cleanLog(null),emptyLog());
});
test('loja: coletar só funciona perto e quando a missão precisa; erva some e volta',()=>{
 const save=freshSave();useGame.setState({...save,hero:{...save.hero,created:true,quests:{active:{'q-ervas':[0]},done:['q-boas-vindas']},position:[-18,6]},gathered:{},slain:{}});
 useGame.getState().gather('herb-0');assert.deepEqual(useGame.getState().hero.quests?.active['q-ervas'],[1]);assert.ok((useGame.getState().gathered['herb-0']??0)>Date.now());
 useGame.getState().gather('herb-0');assert.deepEqual(useGame.getState().hero.quests?.active['q-ervas'],[1],'mesma erva não conta duas vezes');
 useGame.getState().gather('herb-3');assert.deepEqual(useGame.getState().hero.quests?.active['q-ervas'],[1],'longe demais');
});
