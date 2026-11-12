import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { freshSave, NPCS_LIVE } from './game';
import { cityPortal, GODDARD_BOOLE, goddardExit, trainerPosition } from './kingdomCities';
import { currentMainObjective, guideStop, regionPins, routeToPoint } from './questNavigation';
import { useGame } from './store';

test('missão exibe a runa pendente e há rota da praça até Boole para entregá-la', () => {
  const save = freshSave();
  save.hero = { ...save.hero, created: true, level: 3 };
  save.education.completed = ['variables'];
  assert.deepEqual(currentMainObjective(save.hero, save.education), { lesson: 'variables', stage: 'deliver' });

  const boole = NPCS_LIVE.find(npc => npc.id === 'eldrin')!;
  const stop = guideStop(save.hero, { npc: 'eldrin' })!;
  assert.deepEqual(stop.point, [boole.x, boole.z]);
  const route = routeToPoint(save.hero.position, stop.point, save.hero);
  assert.ok(route.length);
  useGame.setState({ ...save, hero: { ...save.hero, position: route.at(-1)! } });
  useGame.getState().deliverQuest('main');
  assert.deepEqual(currentMainObjective(save.hero, useGame.getState().education), { lesson: 'arithmetic', stage: 'start' });
});

test('guia do Hunter usa as posições da casa, do portal e de Boole em Goddard', () => {
  const hero = { ...freshSave().hero, created: true, race: 'elf', classId: 'hunter', region: 'bosque' } as const;
  const trainer = guideStop(hero, { trainer: 'hunter' })!;
  assert.equal(trainer.name, 'Mestre de Hunter');
  assert.deepEqual(trainer.point, trainerPosition('bosque', 0));
  assert.ok(routeToPoint(hero.position, trainer.point, hero).length);

  const exit = guideStop(hero, { npc: 'eldrin' })!;
  assert.deepEqual(exit.point, cityPortal('bosque'));
  assert.equal(exit.portal, 'goddard');
  const goddard = { ...hero, region: 'goddard' } as const;
  assert.deepEqual(guideStop(goddard, { npc: 'eldrin' })?.point, GODDARD_BOOLE);
  assert.deepEqual(guideStop(goddard, { trainer: 'hunter' })?.point, goddardExit('bosque'));
  assert.deepEqual(regionPins('aurora').filter(pin=>'npc' in pin.target).map(pin => pin.point), NPCS_LIVE.map(npc => [npc.x, npc.z]));
});

test('prova de classe, caça, coleta e expedições guiam aos alvos disponíveis', () => {
  const save=freshSave(),world={education:save.education,now:100};
  const elf={...save.hero,region:'bosque' as const,race:'elf' as const,classId:'hunter' as const};
  const trial=guideStop(elf,{objective:'trial'},world)!;
  assert.ok(trial.monster && trial.monster.startsWith('bosque-'));
  assert.ok(routeToPoint(elf.position,trial.point,elf).length);
  const collection={objective:{type:'collect',node:'herb',count:5,label:'Ervas'}} as const;
  const first=guideStop(save.hero,collection,world)!;
  assert.ok(first.gather);
  const second=guideStop(save.hero,collection,{...world,gathered:{[first.gather!]:200}})!;
  assert.notEqual(second.gather,first.gather);
  const iron={...save.hero,region:'iron-forge' as const};
  assert.equal(guideStop(iron,{instance:'frost-cave'},world)?.enterInstance,'frost-cave');
  assert.equal(guideStop({...iron,instance:'frost-cave'},{instance:'frost-cave'},world),undefined);
});

test('rota para Nullarion avança pelos portais da campanha sem voltar em círculo', () => {
  const save=freshSave();
  const completed=['variables','arithmetic','conditions','loops','functions','arrays','objects','debug'];
  const education={...save.education,completed,deliveries:completed.map(id=>'main:'+id),reviewedProjects:[14]};
  const hero={...save.hero,level:60,defeatedBosses:['boss-forest','boss-mines','boss-ruins','boss-frontier']};
  const target={monster:'boss-master'};
  assert.equal(guideStop(hero,target,{education})?.campaign,'ruins');
  assert.equal(guideStop({...hero,region:'ruins'},target,{education})?.campaign,'frontier');
  assert.equal(guideStop({...hero,region:'frontier'},target,{education})?.campaign,'heart');
  assert.equal(guideStop({...hero,region:'heart'},target,{education})?.monster,'boss-master');
});
