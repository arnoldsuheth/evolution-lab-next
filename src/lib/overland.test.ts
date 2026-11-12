import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { RACIAL_CITIES, type RacialCity } from './kingdomCities';
import { cityDefences, cityWallBlocks, oppositeGateSide, overlandRoads, roadArrival, roadAt, roadItinerary } from './overland';
import { findPath, followRoadPath, walkable } from './navigation';
import { freshSave } from './game';
import { useGame } from './store';
import { INSTANCES, instanceRequirement } from './instances';
import { MONSTERS } from './campaign';
import { guideStop } from "./questNavigation";

test('todas as cidades terrestres têm portões atravessáveis e estradas nos dois sentidos',()=>{
  for (const city of Object.keys(RACIAL_CITIES) as RacialCity[]) {
    const {walls,gates}=cityDefences(city);
    for(const {a,b} of walls) {
      assert.ok(cityWallBlocks(city,(a[0]+b[0])/2,(a[1]+b[1])/2),city);
    }
    for(const gate of gates){
      assert.ok(!cityWallBlocks(city,...gate.point),city+' '+gate.name);
      const target=oppositeGateSide(gate,[0,0]);
      assert.ok(findPath([0,5],target, city).length,city+' '+gate.name);
    }
    for(const road of overlandRoads(city)){
      assert.ok(findPath([0,5],road.end, city).length,city+' -> '+road.to);
      assert.equal(roadAt(city,...road.end)?.to,road.to);
      const arrival=roadArrival(city,road.to)!;
      assert.ok(walkable(...arrival,road.to),'Chegada livre em '+road.to);
      assert.equal(roadAt(road.to,...arrival),undefined,'Sem retorno imediato');
    }
  }
});

test('voo passa sobre a muralha e a floresta pode ser explorada',()=>{
  assert.equal(walkable(-23,3, 'aurora'),false);
  assert.equal(walkable(-23,3, 'aurora',true),true);
  assert.equal(walkable(0,-15, 'aurora',true),true);
  const save=freshSave();
  useGame.setState({...save,hero:{...save.hero,position:[-23,3],level:50,flyingMount:'griffin'},mounted:true,encounter:null,challenge:null});
  useGame.getState().toggleMount();
  assert.equal(useGame.getState().mounted,true);
  useGame.getState().move([-25,3]);
  useGame.getState().toggleMount();
  assert.equal(useGame.getState().mounted,false);
});

test('a estrada só muda de região no limite e conserva a montaria',()=>{
  const save=freshSave();
  useGame.setState({...save,hero:{...save.hero,created:true,level:15},mounted:true,encounter:null,challenge:null});
  useGame.getState().overlandTravel('bosque');
  assert.equal(useGame.getState().hero.region,'aurora');
  const road=overlandRoads('aurora').find(r=>r.to==='bosque')!;
  useGame.getState().move(road.end);
  useGame.getState().overlandTravel('bosque');
  assert.equal(useGame.getState().hero.region,'bosque');
  assert.equal(useGame.getState().mounted,true);
  assert.deepEqual(useGame.getState().hero.position,roadArrival('aurora','bosque'));
});

test('novas expedições têm acesso, nível e guardião próprios',()=>{
  for(const id of ['gear-cave','eclipse-rift'] as const){
    const site=INSTANCES[id];
    const hero={...freshSave().hero,region:site.region,level:site.level};
    assert.ok(instanceRequirement({...hero,level:site.level-1},['arrays'],id));
    assert.equal(instanceRequirement(hero,['arrays'],id),undefined);
    assert.ok(MONSTERS.some(m=>m.instance===id&&m.boss&&m.region===site.region));
    assert.ok(findPath([0,5],[site.x,site.z], site.region).length);
  }
});

test('o atlas oferece estrada e portal para sair do Bosque sem bloquear a exploração',()=>{
  const save=freshSave();
  const hero={...save.hero,region:'bosque' as const,position:[40,10] as [number,number]};
  useGame.setState({...save,hero,encounter:null,challenge:null,mounted:false});
  const road=guideStop(hero,{region:'aurora'})!;
  assert.ok(road.overland);
  assert.ok(findPath(hero.position,road.point,'bosque').length);
  const [x,z]=road.point;
  useGame.getState().move([x+2,z]);
  useGame.getState().overlandTravel('aurora');
  assert.equal(useGame.getState().hero.region,'aurora');

  const arrived=useGame.getState().hero;
  const first=guideStop(arrived,{region:'bosque',via:'portal'})!;
  assert.equal(first.portal,'goddard');
  useGame.getState().move(first.point);
  useGame.getState().skyTravel('goddard');
  const second=guideStop(useGame.getState().hero,{region:'bosque',via:'portal'})!;
  assert.equal(second.portal,'bosque');
  useGame.getState().move(second.point);
  useGame.getState().skyTravel('bosque');
  assert.equal(useGame.getState().hero.region,'bosque');
});


test('o trajeto guiado usa portões e liga cada cidade terrestre pelos mesmos trechos do atlas',()=>{
  const save=freshSave();
  const cities=Object.keys(RACIAL_CITIES) as RacialCity[];
  for(const from of cities)for(const destination of cities.filter(city=>city!==from)){
    const itinerary=roadItinerary(from,destination);
    assert.equal(itinerary[0],from);
    assert.equal(itinerary.at(-1),destination);
    let hero={...save.hero,region:from,position:[0,5] as [number,number],level:15};
    for(const next of itinerary.slice(1)){
      const stop=guideStop(hero,{region:destination});
      assert.ok(stop?.overland);
      const road=roadAt(hero.region,...stop.point);
      assert.equal(road?.to,next);
      assert.ok(road);
      const path=followRoadPath(hero.position,road,hero.region);
      assert.deepEqual(path.at(-1),road.end);
      for(const point of path){
        const exit=roadAt(hero.region,...point);
        assert.ok(!exit||exit.to===next);
      }
      if(hero.region===from){
        const [x,z]=road.points[0];
        assert.ok(path.some(([px,pz])=>Math.abs(px-x)<.6&&Math.abs(pz-z)<.6),from);
      }
      hero={...hero,region:next,position:roadArrival(hero.region,next)!};
    }
    assert.equal(guideStop(hero,{region:destination}),undefined);
  }
  assert.deepEqual(roadItinerary('goddard','bosque'),[]);
});
