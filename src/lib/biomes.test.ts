import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { biomeOf, flightRelief, isWater } from './biomes';
import { MONSTERS, REGIONS, isAggressive, type RegionId } from './campaign';
import { findPath, walkable } from './navigation';
import { insideCity, overlandRoads } from './overland';

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
