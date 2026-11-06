import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {chargeNexus,nexusGoal,cleanNexus,NEXUS_SECONDS} from './nexus';
import {freshSave,withXp,stats} from './game';
import {useGame} from './store';
test('XP carrega o Nexus até a meta, que cresce com o nível (leve a médio)',()=>{
 assert.ok(nexusGoal(2)>=400&&nexusGoal(2)<=700,'começo: cerca de 10–15 lutas');assert.ok(nexusGoal(30)>nexusGoal(2));
 assert.equal(chargeNexus({charge:0,aura:0},50,2).charge,50);assert.equal(chargeNexus({charge:500,aura:0},999,2).charge,nexusGoal(2));
 assert.equal(chargeNexus({charge:10,aura:100},50,2).charge,10,'não carrega com a aura ativa');assert.deepEqual(cleanNexus({charge:-5,aura:9999}),{charge:0,aura:NEXUS_SECONDS});
 const h=withXp({...freshSave().hero,created:true},120);assert.equal(h.nexus?.charge,120);
});
test('aura cheia é recebida no cristal, dá bônus e acaba com o tempo de jogo',()=>{
 const save=freshSave(),hero={...save.hero,created:true,level:2,position:[0,4] as [number,number],nexus:{charge:nexusGoal(2),aura:0}};
 useGame.setState({...save,hero,encounter:null});const before=stats(useGame.getState().hero);
 useGame.getState().claimNexus();const after=useGame.getState().hero;assert.equal(after.nexus?.aura,NEXUS_SECONDS);assert.equal(after.nexus?.charge,0);
 assert.ok(stats(after).attack>before.attack&&stats(after).maxHp>before.maxHp);
 useGame.getState().tick(0);assert.equal(useGame.getState().hero.nexus?.aura,NEXUS_SECONDS,'menu aberto: o tempo não corre');
 useGame.getState().tick(NEXUS_SECONDS);assert.equal(useGame.getState().hero.nexus?.aura,0);
});
