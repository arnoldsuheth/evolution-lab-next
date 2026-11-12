import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {freshSave,migrateSave,RACE_CLASSES,withXp} from './game';
import {MONSTERS,NULLARION_SCALE} from './campaign';
import {mountOf} from './adventure';
import {cityForRace,CITY_PORTAL,goddardExit,RACIAL_CITIES,trainerHouses,trainerPosition} from './kingdomCities';
import {findPath,walkable} from './navigation';
import {useGame} from './store';
import {guideStop} from './questNavigation';

test('Iron Forge tem três grupos iniciais e caminho até o treinador e a gruta',()=>{
  assert.equal(cityForRace('dwarf'),'iron-forge');
  const trainer=trainerPosition('iron-forge',3)!;
  assert.ok(findPath([0,5],[...trainer], 'iron-forge').length);
  assert.ok(findPath([0,5],[33,-17], 'iron-forge').length);
  assert.deepEqual([...new Set(MONSTERS.filter(m=>m.region==='iron-forge'&&!m.instance&&m.level<=3).map(m=>m.level))],[1,2,3]);
  assert.equal(walkable(25,0, 'goddard'),false);
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

test('montaria terrestre pode ser escolhida e permanece após carregar o save',()=>{
 const save=freshSave();
 const hero={...save.hero,level:50,created:true};
 useGame.setState({...save,hero,encounter:null,challenge:null});
 assert.equal(mountOf(hero)?.id,'boar');
 useGame.getState().chooseMount('griffin');
 assert.equal(useGame.getState().hero.selectedMount,undefined);
 useGame.getState().chooseMount('wolf');
 const loaded=migrateSave({...save,hero:useGame.getState().hero});
 assert.equal(mountOf(loaded.hero)?.id,'wolf');
});

test('cada classe tem casa e acesso pelo mapa da cidade da sua raça', () => {
  for (const [city, {race}] of Object.entries(RACIAL_CITIES)) {
    const region=cityForRace(race);
    const classes=RACE_CLASSES[race];
    assert.equal(trainerHouses(region).length,classes.length,city);
    for (const [index, id] of classes.entries()) {
      const home=trainerHouses(region)[index];
      const point=[...trainerPosition(region,index)!] as [number,number];
      assert.ok(findPath([0,5],point, region).length,`${city} · ${id}`);
      assert.equal(walkable(home.x+home.w,home.z, region),false);
      assert.deepEqual(guideStop({...freshSave().hero,race,region},{trainer:id})?.point,point);
    }
  }
});
