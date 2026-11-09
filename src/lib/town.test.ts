import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {INTERIORS,PROPS,ROADS,WORLD_UNLOCKS,onRoad,townBlocked} from './town';
import {walkable,findPath,BUILDINGS} from './navigation';
import {MONSTERS} from './campaign';
import {NPCS_LIVE,LESSONS} from './game';
import {travelerFor,CHESTS} from './journey';
import {isClearGround} from './scenery';
const reach=(x:number,z:number,forest=true,mines=true)=>[0,1,2,3,4,5,6,7].some(i=>{const a=i*Math.PI/4,p:[number,number]=[x+Math.cos(a)*2.7,z+Math.sin(a)*2.7];return walkable(p[0],p[1],forest,mines)&&findPath([0,5],p,forest,mines).length>0;});
test('objetos da cidade não ficam em cima de pessoas, baús nem casas',()=>{
 const spots=[...NPCS_LIVE.map(n=>({id:n.id,x:n.x,z:n.z})),...CHESTS.map(c=>({id:c.id,x:c.x,z:c.z})),...['a','b','c'].map(seed=>{const t=travelerFor(seed);return {id:t.name,x:t.x,z:t.z};})];
 for(const p of PROPS.filter(p=>p.radius>0))for(const s of spots)assert.ok(Math.hypot(p.x-s.x,p.z-s.z)>=1.6,`${p.id} perto de ${s.id}`);
 for(const p of PROPS)assert.ok(!BUILDINGS.some(b=>Math.abs(p.x-b.x)<b.w&&Math.abs(p.z-b.z)<b.d),`${p.id} dentro de casa`);
});
test('estradas são caminháveis e ligam as portas, os postos e os campos de caça',()=>{
 for(const r of ROADS)for(const t of [.1,.5,.9]){const x=r.a[0]+(r.b[0]-r.a[0])*t,z=r.a[1]+(r.b[1]-r.a[1])*t;assert.ok(onRoad(x,z),r.id);if(!townBlocked(x,z))assert.ok(walkable(x,z,true,true),`${r.id} bloqueada em ${x.toFixed(1)},${z.toFixed(1)}`);}
 assert.ok(!isClearGround(0,12)&&!isClearGround(-20,12),'grama não nasce no meio da avenida');
});
test('monstros ficam em acampamentos fora da cidade e todos podem ser alcançados',()=>{
 const town=MONSTERS.filter(m=>m.region==='aurora'&&!m.instance);
 for(const m of town){assert.ok(Math.hypot(m.x,m.z)>12,`${m.id} dentro da vila`);assert.ok(reach(m.x,m.z),`${m.id} sem caminho`);}
 for(const m of town.filter(m=>m.level<=2&&m.z>-12&&m.x<=15))assert.ok(reach(m.x,m.z,false,false),`${m.id} precisa ser alcançável antes da floresta`);
 const camps=(kind:string,minLevel:number,maxLevel:number)=>town.filter(m=>m.kind===kind&&m.level>=minLevel&&m.level<=maxLevel&&!m.boss).length;
 assert.ok(camps('boar',1,2)>=3&&camps('spider',1,2)>=3&&camps('wolf',3,4)>=3,'grupos de iniciantes');
});
test('cada uma das oito runas muda algo no mapa',()=>{assert.deepEqual(WORLD_UNLOCKS.map(u=>u.lesson),LESSONS.map(l=>l.id));for(const u of WORLD_UNLOCKS)assert.ok(u.lesson==='loops'||PROPS.some(p=>p.unlock===u.lesson),u.lesson);});

test('interiores podem ser alcançados pela porta e têm paredes e balcões sólidos',()=>{
 for(const {id,x,z} of INTERIORS){
  assert.ok(findPath([0,5],[x,z],false,false).length,id);
  assert.ok(findPath([x,z],[x,z+4],false,false).length,id);
  assert.equal(walkable(x+2,z,true,true),false,id);
  assert.equal(walkable(x,z-2,true,true),false,id);
  assert.equal(walkable(x+1,z+2,true,true),false,id);
  assert.equal(walkable(x,z-1,true,true),false,id);
 }
});
