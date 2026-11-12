import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { biomeOf, flightRelief, isWater } from './biomes';
import { MONSTERS, REGIONS, isAggressive, type RegionId } from './campaign';
import { findPath, walkable } from './navigation';
import { insideCity, overlandRoads } from './overland';
import { monsterPoint } from './patrols';
import { scenicTrail } from './scenicTrails';
import { waterwayOf, waterwaySegments } from './waterways';

test('relevo e água ocupam o terreno, mas o voo contorna a altura dos picos',()=>{
  for(const region of Object.keys(REGIONS).filter(id=>id!=='goddard') as RegionId[]){
    const biome=biomeOf(region)!;
    assert.ok(biome.landmarks.length>=4,region);
    for(const mark of biome.landmarks){
      assert.equal(walkable(mark.x,mark.z,region),false,mark.name);
      assert.equal(walkable(mark.x,mark.z,region,true),true,mark.name);
      assert.equal(isWater(mark)?flightRelief(region,mark.x,mark.z)===0:flightRelief(region,mark.x,mark.z)>mark.height,true,mark.name);
    }
    for(const road of overlandRoads(region))for(const point of road.points){
      assert.equal(walkable(...point,region),true,region+' · '+point.join(','));
    }
  }
});

test('os novos grupos são alcançáveis e os hostis ficam fora das cidades',()=>{
  const camps=MONSTERS.filter(m=>m.id.startsWith('wild-'));
  assert.equal(new Set(camps.map(m=>m.id)).size,camps.length);
  for(const region of Object.keys(REGIONS).filter(id=>id!=='goddard') as RegionId[]){
    const local=camps.filter(m=>m.region===region);
    assert.ok(local.some(isAggressive)&&local.some(m=>!isAggressive(m)),region);
    for(const m of local){
      assert.ok(!insideCity(region,m.x,m.z),m.id);
      assert.ok(findPath([0,5],[m.x,m.z],region).length,m.id);
    }
  }
});

test('cada trilha termina em solo acessível e cada ponte liga as duas margens',()=>{
  for(const region of Object.keys(REGIONS).filter(id=>id!=='goddard')){
    const trail=scenicTrail(region);
    assert.ok(trail&&trail.points.length>=2,region);
    for(const point of trail.points)assert.ok(walkable(...point,region),trail.name);

    const river=waterwayOf(region);
    assert.ok(river,region);
    const segments=waterwaySegments(river);
    const openWater=segments.find(segment=>!segment.bridge);
    assert.ok(openWater,river.name);
    assert.equal(walkable(openWater.cx,openWater.cz,region),false,river.name);
    assert.equal(walkable(openWater.cx,openWater.cz,region,true),true,river.name);

    for(const bridge of segments.filter(segment=>segment.bridge)){
      const bank=river.width/2+.8;
      for(const side of [-1,0,1]){
        const x=bridge.cx-bridge.uz*side*bank,z=bridge.cz+bridge.ux*side*bank;
        assert.ok(walkable(x,z,region),river.name);
      }
    }
  }
});

test('criaturas patrulham em terreno transitável e chefes mantêm sua posição',()=>{
  for(const m of MONSTERS.filter(monster=>monster.id.startsWith('wild-'))){
    const positions=Array.from({length:25},(_,index)=>monsterPoint(m,index*500));
    assert.deepEqual(positions[0],monsterPoint(m,0),m.id);
    for(const position of positions)assert.ok(walkable(...position,m.region),m.id);
    assert.ok(new Set(positions.map(point=>point.join(','))).size>1,m.id);
  }
  const boss=MONSTERS.find(m=>m.boss)!;
  assert.deepEqual(monsterPoint(boss,4000),[boss.x,boss.z]);
});
