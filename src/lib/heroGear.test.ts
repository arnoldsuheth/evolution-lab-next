import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {existsSync,readFileSync} from 'node:fs';
import {HEAD_MESH,HERO_BASE_FILES,OFFHAND_MESH,WEAPON_MESH,headLook} from './heroModels';
import {artworkForItem} from './artwork';
import {ITEMS} from './game';

/** Nomes das malhas dentro de um .glb (lê só o cabeçalho JSON). */
function meshes(file:string){const b=readFileSync(`public/models/heroes/${file}`);const n=b.readUInt32LE(12);const j=JSON.parse(b.subarray(20,20+n).toString());return new Set((j.nodes as {name:string;mesh?:number}[]).filter(x=>x.mesh!==undefined).map(x=>x.name));}

test('cada peça 3D usada para mostrar um item existe no arquivo do corpo-base indicado',t=>{
 // Os .glb são baixados no "prebuild" (scripts/fetch-heroes.mjs); no servidor os testes rodam antes disso.
 if(!Object.values(HERO_BASE_FILES).every(f=>existsSync(`public/models/heroes/${f}`)))return t.skip('modelos 3D ainda não baixados');
 for(const piece of [...Object.values(WEAPON_MESH),...Object.values(OFFHAND_MESH),...Object.values(HEAD_MESH)])
  assert.ok(meshes(HERO_BASE_FILES[piece.base]).has(piece.mesh),`${piece.mesh} em ${piece.base}`);
});

test('elmo no boneco segue a mesma regra do ícone',()=>{
 const crops={mage_hat:415,hood:1020,helmet:208};
 for(const item of Object.values(ITEMS).filter(i=>i.slot==='head')){const crop=artworkForItem(item);assert.equal(crop?.x,crops[headLook(item.classId)],item.id);}
});

test('toda arma do catálogo tem como aparecer no boneco',()=>{
 const simple=new Set(['hammer','tool','bow','gun','focus','gadget','sword','greatsword','dagger','axe','staff','wand','crossbow','shield']);
 for(const item of Object.values(ITEMS).filter(i=>['weapon','twohand','offhand'].includes(i.slot)))
  assert.ok(WEAPON_MESH[item.visual]||OFFHAND_MESH[item.visual]||simple.has(item.visual),`${item.id}: ${item.visual}`);
});
