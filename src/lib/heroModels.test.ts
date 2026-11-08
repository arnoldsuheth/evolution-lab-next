import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {HERO_STYLE,HERO_BASE_FILES,heroProportions,recolorAtlas,isAtlasSkin} from './heroModels';
import {CLASSES} from './game';
test('cada classe tem corpo animado, arma e paleta próprias',()=>{
 const ids=Object.keys(CLASSES) as (keyof typeof CLASSES)[];assert.equal(ids.length,9);
 for(const id of ids){const s=HERO_STYLE[id];assert.ok(HERO_BASE_FILES[s.base],id);assert.ok(s.weapon.length>0,id);assert.ok(s.recolor.length>0,id);}
 const signatures=new Set(ids.map(id=>{const s=HERO_STYLE[id];return [s.base,s.weapon.join(),s.offhand.join(),s.recolor.map(r=>r.to).join()].join('|');}));
 assert.equal(signatures.size,ids.length,'duas classes não podem ser idênticas');
});
test('humano, elfo e orc têm a mesma altura; anão menor; gnomo menor que o anão',()=>{const h=(r:Parameters<typeof heroProportions>[0])=>heroProportions(r).height;assert.equal(h('elf'),h('human'));assert.equal(h('orc'),h('human'));assert.ok(h('dwarf')<h('human'));assert.ok(h('gnome')<h('dwarf'));assert.equal(h('dwarf'),.68);assert.equal(h('gnome'),.5);assert.ok(heroProportions('dwarf').width>=1.5,'silhueta anã larga e compacta');});
test('recoloração troca a pele e a roupa sem mexer no restante',()=>{
 const px=new Uint8ClampedArray([245,193,155,255, 76,104,130,255, 20,24,28,255]);
 assert.ok(isAtlasSkin(23,.37,.96));
 recolorAtlas(px,HERO_STYLE.warrior,'#5e874e');
 assert.ok(px[1]>px[0]&&px[1]>px[2],'pele do orc fica verde');
 assert.ok(px[4]>px[6],'roupa azul vira vermelha no guerreiro');
 assert.deepEqual([...px.slice(8,12)],[20,24,28,255],'olhos escuros preservados');
});
import {HERO_ANIMATIONS,HERO_HAIRSTYLES,HERO_PARTS,heroDress} from './heroModels';
import {KEEP_ANIMATIONS,pruneAnimations,readGlb,writeGlb} from '../../scripts/glb-prune.mjs';
test('arquivos publicados mantêm todas as animações usadas pelo jogo',()=>{assert.deepEqual([...KEEP_ANIMATIONS].sort(),[...HERO_ANIMATIONS].sort());});
test('iniciante usa roupas remendadas, sem elmo e sem capa',()=>{
 for(const id of Object.keys(CLASSES) as (keyof typeof CLASSES)[]){const d=heroDress(id,{head:false,chest:false,back:false},0,true);assert.equal(d.outfit,'rags',id);assert.equal(d.hat,null,id);assert.equal(d.cape,false,id);assert.equal(d.head,HERO_STYLE[id].base,id);}
});
test('equipamento conquistado aparece no modelo e o elmo pode ser escondido',()=>{
 const full={head:true,chest:true,back:false};
 assert.deepEqual(heroDress('paladin',full,0,true),{outfit:'class',hat:'Knight_Helmet',cape:true,head:'knight',covered:true});
 assert.equal(heroDress('paladin',full,0,false).hat,null,'jogador escolheu esconder o elmo');
 assert.equal(heroDress('hunter',full,0,true).head,'rogue_hooded','capuz substitui a cabeça');
 assert.equal(heroDress('hunter',full,0,false).head,'rogue');
 assert.equal(heroDress('mage',{head:false,chest:false,back:true},0,true).cape,true,'item de costas mostra a capa');
});
test('penteado escolhe a cabeça de outro corpo-base, exceto sob o elmo',()=>{
 assert.equal(HERO_HAIRSTYLES[0].base,null);
 HERO_HAIRSTYLES.slice(1).forEach((style,i)=>{assert.ok(style.base&&HERO_PARTS[style.base].head);assert.equal(heroDress('paladin',{head:false,chest:false,back:false},i+1,true).head,style.base);});
 assert.equal(heroDress('paladin',{head:true,chest:true,back:false},3,true).head,'knight');
 assert.equal(heroDress('paladin',{head:false,chest:false,back:false},99,true).head,'knight','índice inválido volta ao padrão');
});
test('roupas remendadas ficam em tons de tecido e o cabelo recebe a cor escolhida',()=>{
 const cape=new Uint8ClampedArray([230,40,46,255]);recolorAtlas(cape,HERO_STYLE.paladin,'#e7bd9e',{rags:true});
 assert.ok(cape[0]>=cape[1]&&cape[1]>=cape[2]&&cape[0]-cape[2]<120,'vermelho vivo vira tecido marrom');
 const blond=new Uint8ClampedArray([227,188,130,255]);recolorAtlas(blond,HERO_STYLE.paladin,'#e7bd9e',{hair:{base:'knight',color:'#30251f'}});
 assert.ok(blond[0]<120,'cabelo loiro fica escuro');
 const skin=new Uint8ClampedArray([245,193,155,255]);recolorAtlas(skin,HERO_STYLE.paladin,'#e7bd9e',{rags:true,hair:{base:'knight',color:'#30251f'}});
 assert.ok(skin[0]>200,'pele não é tratada como roupa nem cabelo');
});
test('poda de animações preserva malhas e animações mantidas',()=>{
 const bin=Buffer.alloc(36);for(let i=0;i<9;i++)bin.writeFloatLE(i+1,i*4);
 const json={asset:{version:'2.0'},buffers:[{byteLength:36}],bufferViews:[{buffer:0,byteOffset:0,byteLength:12},{buffer:0,byteOffset:12,byteLength:12},{buffer:0,byteOffset:24,byteLength:12}],
  accessors:[{bufferView:0,componentType:5126,count:1,type:'VEC3'},{bufferView:1,componentType:5126,count:3,type:'SCALAR'},{bufferView:2,componentType:5126,count:3,type:'SCALAR'}],
  meshes:[{primitives:[{attributes:{POSITION:0}}]}],nodes:[{name:'Body',mesh:0}],
  animations:[{name:'Dance',samplers:[{input:1,output:1}],channels:[{sampler:0,target:{node:0,path:'translation'}}]},{name:'Idle',samplers:[{input:2,output:2}],channels:[{sampler:0,target:{node:0,path:'translation'}}]}]};
 const {json:out,bin:data}=readGlb(pruneAnimations(writeGlb(json,bin),['Idle']));
 const anims=out.animations as {name:string;samplers:{input:number}[]}[],accessors=out.accessors as {bufferView:number}[],views=out.bufferViews as {byteOffset:number}[];
 assert.deepEqual(anims.map(a=>a.name),['Idle']);assert.equal(accessors.length,2);
 const view=views[accessors[anims[0].samplers[0].input].bufferView];assert.equal(data.readFloatLE(view.byteOffset),7,'dados da animação mantida intactos');
 assert.equal(data.readFloatLE(views[accessors[0].bufferView].byteOffset),1,'malha intacta');
 assert.throws(()=>pruneAnimations(writeGlb(json,bin),['Voar']),/ausentes/);
});

test('anão usa penteados próprios',()=>{
 const naked={head:false,chest:false,back:false};
 assert.equal(heroDress('paladin',naked,0,true,'dwarf').head,'barbarian','careca de forja');
 assert.equal(heroDress('paladin',naked,5,true,'dwarf').head,'rogue','juba longa');
 assert.equal(heroDress('paladin',naked,4,true,'dwarf').extra,'bun');
 assert.equal(heroDress('paladin',naked,0,true,'human').head,'knight','humano continua igual');
});
