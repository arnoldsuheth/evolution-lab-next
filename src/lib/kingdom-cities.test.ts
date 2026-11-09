import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {freshSave,migrateSave,withXp} from './game';
import {MONSTERS,NULLARION_SCALE} from './campaign';
import {mountOf} from './adventure';
import {cityForRace,CITY_PORTAL,goddardExit,trainerPosition} from './kingdomCities';
import {findPath,walkable} from './navigation';
import {useGame} from './store';

test('Iron Forge tem três grupos iniciais e caminho até o treinador e a gruta',()=>{
  assert.equal(cityForRace('dwarf'),'iron-forge');
  const trainer=trainerPosition('iron-forge',3)!;
  assert.ok(findPath([0,5],[...trainer],true,true,'iron-forge').length);
  assert.ok(findPath([0,5],[17,-7],true,true,'iron-forge').length);
  assert.deepEqual([...new Set(MONSTERS.filter(m=>m.region==='iron-forge'&&!m.instance).map(m=>m.level))],[1,2,3]);
  assert.equal(walkable(25,0,true,true,'goddard'),false);
});
test('um anão nasce em Iron Forge, inicia treinamento e viaja por Goddard',()=>{
  useGame.setState({...freshSave(),encounter:null,challenge:null});
  useGame.getState().createCharacter('Dorin','engineer','normal','dwarf');
  const game=()=>useGame.getState();
  assert.equal(game().hero.region,'iron-forge');
  assert.equal(game().hero.classInitiated,false);
  useGame.setState(s=>({hero:{...s.hero,position:[...trainerPosition('iron-forge',3)!]}}));
  game().trainClass('engineer');
  assert.deepEqual(game().hero.classTrial,{id:'engineer',kills:0});
  useGame.setState(s=>({hero:{...s.hero,classTrial:{id:'engineer',kills:3},position:[...trainerPosition('iron-forge',3)!]}}));
  game().trainClass('engineer');
  assert.equal(game().hero.classInitiated,true);
  game().skyTravel('goddard');
  assert.equal(game().hero.region,'iron-forge');
  useGame.setState(s=>({hero:{...s.hero,position:[...CITY_PORTAL]}}));
  game().skyTravel('goddard');
  assert.equal(migrateSave({hero:game().hero}).hero.region,'goddard');
  useGame.setState(s=>({hero:{...s.hero,position:[...goddardExit('iron-forge')]}}));
  game().skyTravel('iron-forge');
  assert.equal(game().hero.region,'iron-forge');
});
test('dragão requer nível 80 e escama, e o nível 80 é pós-campanha',()=>{
  const hero=freshSave().hero;
  assert.equal(withXp(hero,1000000).level,60);
  const veteran=withXp({...hero,defeatedBosses:['boss-master']},1000000);
  assert.equal(veteran.level,80);
  assert.notEqual(mountOf(veteran)?.id,'dragon');
  assert.equal(mountOf({...veteran,inventory:[NULLARION_SCALE]})?.id,'dragon');
});
