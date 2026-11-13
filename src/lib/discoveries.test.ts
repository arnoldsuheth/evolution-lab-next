import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { DISCOVERIES, discoveryIn } from './discoveries';
import { MONSTERS, isAggressive } from './campaign';
import { freshSave, migrateSave } from './game';
import { findPath, walkable } from './navigation';
import { scenicTrail } from './scenicTrails';
import { monsterPoint } from './patrols';
import { guideStop } from './questNavigation';
import { useGame } from './store';

test('os oito baús podem ser alcançados e o desvio do Bosque sai da trilha depois da ponte',()=>{
  for(const site of DISCOVERIES)assert.ok(findPath([0,5],site.point,site.region).length,site.id);
  const camp=discoveryIn('bosque')!;
  const route=scenicTrail('bosque')!.route;
  const bridge=route.findIndex(([x,z])=>x===32&&z===14);
  const branch=route.findIndex(([x,z])=>x===camp.branch![0]&&z===camp.branch![1]);
  assert.ok(bridge>0&&branch>bridge);
  assert.ok(findPath(camp.branch!,camp.point,camp.region).length);
});

test('o acampamento aparece ao se aproximar, exige derrotar o vigia e paga uma única vez mesmo após carregar',()=>{
  const save=freshSave(),camp=discoveryIn('bosque')!,guard=MONSTERS.find(m=>m.id===camp.guard)!;
  assert.ok(isAggressive(guard));
  const hero={...save.hero,region:camp.region};
  const target={discovery:camp.id};
  useGame.setState({...save,hero,encounter:null,challenge:null,slain:{},effects:[],restPending:0});
  assert.equal(guideStop(hero,target),undefined);
  useGame.getState().move(camp.point);
  const discovered=useGame.getState().hero;
  assert.equal(discovered.adventure?.discoveries[camp.id],'seen');
  assert.deepEqual(guideStop(discovered,target)?.point,camp.point);
  useGame.getState().openDiscovery();
  assert.equal(useGame.getState().hero.gold,discovered.gold);

  useGame.getState().move([guard.x,guard.z]);
  useGame.getState().startEncounter(false,guard.level,guard.id);
  const fight=useGame.getState().encounter;
  assert.ok(fight);
  useGame.setState({encounter:{...fight,hp:1}});
  useGame.getState().attack();
  assert.equal(useGame.getState().hero.adventure?.discoveries[camp.id],'cleared');
  useGame.getState().move(camp.point);
  const before=useGame.getState().hero;
  useGame.getState().openDiscovery();
  const opened=useGame.getState().hero;
  assert.equal(opened.gold,before.gold+camp.bronze);
  assert.equal(opened.xp,before.xp+camp.xp);
  const reloaded=migrateSave({...save,hero:opened});
  assert.equal(reloaded.hero.adventure?.discoveries[camp.id],'claimed');
  useGame.setState({...reloaded,encounter:null,challenge:null});
  useGame.getState().openDiscovery();
  assert.equal(useGame.getState().hero.gold,opened.gold);
  assert.equal(guideStop(reloaded.hero,target),undefined);
});

test('cervo se afasta em terreno livre e os lobos da margem mantêm o grupo',()=>{
  const stag=MONSTERS.find(m=>m.id==='wild-bosque-river-stag-0')!;
  const time=2000, [x,z]=monsterPoint(stag,time);
  const hero:[number,number]=[x-2,z];
  const fled=monsterPoint(stag,time,hero);
  assert.ok(fled[0]>x);
  assert.ok(walkable(...fled,stag.region));
  const pack=MONSTERS.filter(m=>m.id.startsWith('wild-bosque-river-wolf-'));
  const spacing=(time:number)=>pack.slice(1).map(m=>{
    const [x,z]=monsterPoint(pack[0],time),[a,b]=monsterPoint(m,time);
    return Math.hypot(x-a,z-b);
  });
  for(const [i,value] of spacing(4000).entries())assert.ok(Math.abs(value-spacing(2000)[i])<1e-8);
});
