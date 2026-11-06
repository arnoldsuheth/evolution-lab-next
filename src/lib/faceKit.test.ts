import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {faceParts,buildFaceKit,BEARDS,MOUSTACHES,BROWS,NOSES,EARS,SCARS,PAINTS,ACCESSORIES,RACE_EARS} from './faceKit';
import {migrateSave,freshSave,DEFAULT_LOOK} from './game';
const none={beard:0,moustache:0,brows:0,nose:0,ears:0,scar:0,tattoo:0,accessory:0};
test('humano sem escolhas não ganha peças: o rosto original fica intacto',()=>{assert.equal(faceParts({look:none,race:'human',covered:false}).length,0);});
test('raça traz suas marcas: orelha de elfo, presas de orc e orelhas grandes de gnomo',()=>{
 const parts=(race:'elf'|'orc'|'gnome'|'dwarf')=>faceParts({look:none,race,covered:false}).map(p=>p.part);
 assert.equal(parts('elf').filter(p=>p==='ear').length,2);assert.equal(parts('orc').filter(p=>p==='tusk').length,2);assert.equal(parts('gnome').filter(p=>p==='ear').length,2);assert.equal(parts('dwarf').length,0);
 assert.equal(RACE_EARS.elf,4);
});
test('cada opção do menu cria peças e o elmo esconde só o que fica por baixo dele',()=>{
 for(const [key,list] of [['beard',BEARDS],['moustache',MOUSTACHES],['brows',BROWS],['nose',NOSES],['ears',EARS],['scar',SCARS],['tattoo',PAINTS],['accessory',ACCESSORIES]] as const){assert.equal(list.length,6,key);for(let i=1;i<6;i++)assert.ok(faceParts({look:{...none,[key]:i},race:'human',covered:false}).length>0,`${key} ${i}`);}
 const helm=faceParts({look:{...none,beard:2,ears:4,brows:2,accessory:4},race:'elf',covered:true}).map(p=>p.part);
 assert.ok(helm.includes('beard'),'barba aparece sob o elmo');assert.ok(!helm.includes('ear')&&!helm.includes('brow')&&!helm.includes('accessory'));
 assert.equal(buildFaceKit({look:{...none,beard:5},race:'dwarf',covered:false,hair:'#825235',skin:'#e7bd9e'}).children.length,faceParts({look:{...none,beard:5},race:'dwarf',covered:false}).length);
});
test('saves antigos mantêm o herói como era; novos começam sem barba e com o rosto do modelo',()=>{
 const old=freshSave();const {ears:_ears,...lookWithoutEars}={...old.look,beard:3,nose:2,brows:1,eyes:4,hair:2,skin:3};void _ears;
 const migrated=migrateSave({...old,look:lookWithoutEars}).look;
 assert.deepEqual([migrated.beard,migrated.nose,migrated.brows,migrated.eyes],[0,0,0,0]);assert.equal(migrated.hair,2);assert.equal(migrated.skin,3);
 const current=migrateSave({...old,look:{...old.look,beard:3,ears:1}}).look;assert.equal(current.beard,3,'escolha feita na versão nova é mantida');
 assert.deepEqual([DEFAULT_LOOK.beard,DEFAULT_LOOK.nose,DEFAULT_LOOK.brows],[0,0,0]);
});
