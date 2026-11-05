import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {HERO_STYLE,HERO_BASE_FILES,heroProportions,recolorAtlas,isAtlasSkin} from './heroModels';
import {CLASSES} from './game';
test('cada classe tem corpo animado, arma e paleta próprias',()=>{
 const ids=Object.keys(CLASSES) as (keyof typeof CLASSES)[];assert.equal(ids.length,9);
 for(const id of ids){const s=HERO_STYLE[id];assert.ok(HERO_BASE_FILES[s.base],id);assert.ok(s.weapon.length>0,id);assert.ok(s.recolor.length>0,id);}
 const signatures=new Set(ids.map(id=>{const s=HERO_STYLE[id];return [s.base,s.weapon.join(),s.offhand.join(),s.recolor.map(r=>r.to).join()].join('|');}));
 assert.equal(signatures.size,ids.length,'duas classes não podem ser idênticas');
});
test('raças mantêm proporções diferentes',()=>{assert.ok(heroProportions('gnome').height<heroProportions('dwarf').height);assert.ok(heroProportions('dwarf').height<heroProportions('human').height);assert.ok(heroProportions('elf').height>heroProportions('human').height);});
test('recoloração troca a pele e a roupa sem mexer no restante',()=>{
 const px=new Uint8ClampedArray([245,193,155,255, 76,104,130,255, 20,24,28,255]);
 assert.ok(isAtlasSkin(23,.37,.96));
 recolorAtlas(px,HERO_STYLE.warrior,'#5e874e');
 assert.ok(px[1]>px[0]&&px[1]>px[2],'pele do orc fica verde');
 assert.ok(px[4]>px[6],'roupa azul vira vermelha no guerreiro');
 assert.deepEqual([...px.slice(8,12)],[20,24,28,255],'olhos escuros preservados');
});
