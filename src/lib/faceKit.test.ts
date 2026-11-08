import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {faceParts,buildFaceKit,DWARF_BEARDS,DWARF_HAIR,RACE_HEAD_SHAPE,BEARDS,MOUSTACHES,BROWS,NOSES,EARS,SCARS,PAINTS,ACCESSORIES,RACE_EARS} from './faceKit';
import {migrateSave,freshSave,DEFAULT_LOOK} from './game';
const none={beard:0,moustache:0,brows:0,nose:0,ears:0,scar:0,tattoo:0,accessory:0};
test('humano sem escolhas não ganha peças: o rosto original fica intacto',()=>{assert.equal(faceParts({look:none,race:'human',covered:false}).length,0);});
test('raça traz suas marcas: orelha de elfo, presas de orc e orelhas grandes de gnomo',()=>{
 const parts=(race:'elf'|'orc'|'gnome'|'dwarf')=>faceParts({look:none,race,covered:false}).map(p=>p.part);
 assert.equal(parts('elf').filter(p=>p==='ear').length,2);assert.equal(parts('orc').filter(p=>p==='tusk').length,2);assert.equal(parts('gnome').filter(p=>p==='ear').length,2);assert.equal(parts('dwarf').filter(p=>p==='nose').length,1);assert.ok(parts('dwarf').includes('brow-ridge'));assert.ok(parts('dwarf').filter(p=>p==='beard').length>=3,'anão sempre tem barba');
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

test('anão tem barbas e cabelos próprios, diferentes do humano',()=>{
 const beards=DWARF_BEARDS.map((_,i)=>JSON.stringify(faceParts({look:{...none,beard:i},race:'dwarf',covered:false}).filter(p=>p.part==='beard')));
 assert.equal(new Set(beards).size,6,'cada barba de anão é diferente');
 const human=JSON.stringify(faceParts({look:{...none,beard:2},race:'human',covered:false}).filter(p=>p.part==='beard'));
 assert.ok(!beards.includes(human),'nenhuma barba de anão igual à do humano');
 assert.equal(DWARF_HAIR.length,6);
 const hair=(i:number,covered=false)=>faceParts({look:none,race:'dwarf',covered,dwarfHair:i}).filter(p=>p.part==='hair').length;
 assert.ok(hair(1)>0&&hair(2)>0&&hair(3)>0,'coroa, moicano e tranças');assert.equal(hair(1,true),0,'elmo esconde o penteado');
 assert.ok(RACE_HEAD_SHAPE.dwarf[0]>RACE_HEAD_SHAPE.dwarf[1],'rosto de anão é mais largo que alto');
});
