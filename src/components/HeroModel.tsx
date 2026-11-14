"use client";
import {Suspense,useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {useGLTF,useAnimations} from '@react-three/drei';
import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {ClassId,Race} from '@/lib/game';
import {HEAD_MESH,OFFHAND_MESH,WEAPON_MESH,headLook,BODY_WIDTH,BODY_HEIGHT,HERO_BASE_FILES,HERO_HAT_MESHES,HERO_HIT,HERO_PARTS,HERO_PUNCH,HERO_STYLE,HERO_WALK,HERO_WEAPON_MESHES,heroDress,heroProportions,recolorAtlas,type HeroBase,type HeroGear,type RecolorOptions} from '@/lib/heroModels';
import {useGame} from '@/lib/store';
import {buildFaceKit,RACE_EARS,RACE_HEAD_SHAPE,type FaceOptions} from '@/lib/faceKit';
import {trimHead,type TrimParts} from '@/lib/headTrim';
import {gearLook,rarityTier} from '@/lib/gearPieces';
import {BorrowedPiece,SimpleWeapon} from './HeroGear';
import {attachGearPieces,GearAura} from './GearPieces';

const base=(process.env.NEXT_PUBLIC_BASE_PATH??'');
export const heroModelUrl=(model:HeroBase)=>`${base}/models/heroes/${HERO_BASE_FILES[model]}`;
// Baixa todos os modelos uma vez: trocar raça ou classe no criador não mostra o boneco antigo enquanto carrega.
if(typeof window!=='undefined')for(const model of Object.keys(HERO_BASE_FILES) as HeroBase[])useGLTF.preload(heroModelUrl(model));
/** Altura do herói no mesmo referencial do avatar procedural (antes da escala .74 do mundo). */
const HUMAN_HEIGHT=3;
/** Ossos que definem as pernas compactas do anão. */
const COMPACT_LEGS = new Set(["upperleg.l", "upperleg.r", "lowerleg.l", "lowerleg.r"]);
const NOT_BODY=(name:string)=>HERO_HAT_MESHES.includes(name)||(HERO_WEAPON_MESHES as readonly string[]).includes(name)||name.endsWith('_Cape');
const NO_FACE:FaceOptions['look']={beard:0,moustache:0,brows:0,nose:0,ears:0,scar:0,tattoo:0,accessory:0};
/** Preserva as proporções raciais quando as animações definem a escala dos ossos. */
const clipCache=new WeakMap<THREE.AnimationClip[],THREE.AnimationClip[]>();
function headFreeClips(clips:THREE.AnimationClip[]){let out=clipCache.get(clips);if(!out){out=clips.map(c=>{const k=c.clone();k.tracks=k.tracks.filter(t=>!t.name.endsWith('.scale'));return k;});clipCache.set(clips,out);}return out;}
/** Capuz (armadura): só a cor muda com a raridade. */
const HOOD_TINT:Record<string,string|undefined>={common:undefined,epic:'#7a52c9',mythic:'#d9a531'};
const materials=new Map<string,THREE.Material>();
/** Arma Épica brilha em lilás; Mítica, em dourado. */
const GLOW:Record<string,string>={'Épico':'#9b6bff','Mítico':'#ffc23a'};
function glowing(source:THREE.Material,rarity:string){const color=GLOW[rarity];if(!color||!(source instanceof THREE.MeshStandardMaterial))return source;const key=source.uuid+'|glow|'+rarity;let m=materials.get(key);if(!m){const g=source.clone();g.emissive=new THREE.Color(color);g.emissiveIntensity=rarity==='Mítico'?.9:.6;m=g;materials.set(key,m);}return m;}

function recolored(source:THREE.MeshStandardMaterial,key:string,classId:ClassId,skin:string,options:RecolorOptions,tint?:string){
 const cached=materials.get(key);if(cached)return cached;
 const image=source.map?.image as CanvasImageSource&{width:number;height:number}|undefined;
 if(!image||typeof document==='undefined')return source;
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return source;
 context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height);
 // tint: capuz com a cor da raridade (só o pano; pele e cabelo seguem as próprias regras).
 const style=tint?{...HERO_STYLE[classId],recolor:HERO_STYLE[classId].recolor.map(r=>({...r,to:tint}))}:HERO_STYLE[classId];
 recolorAtlas(pixels.data,style,skin,options);context.putImageData(pixels,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const material=source.clone();material.map=texture;material.needsUpdate=true;materials.set(key,material);return material;
}

/** Cabeça (penteado ou capuz) vinda de outro corpo-base; todos usam o mesmo esqueleto. */
function ForeignHead({from,host,classId,skin,hair,eyes,tint,trim}:{from:HeroBase;host:THREE.SkinnedMesh;classId:ClassId;skin:string;hair:string;eyes?:string;tint?:string;trim:string}){
 const gltf=useGLTF(heroModelUrl(from));
 useLayoutEffect(()=>{
  let source:THREE.SkinnedMesh|undefined;gltf.scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh&&o.name===HERO_PARTS[from].head)source=o;});
  const parent=host.parent;if(!source||!parent)return;
  const material=source.material instanceof THREE.MeshStandardMaterial?recolored(source.material,`${from}|${classId}|${skin}|head|${hair}|${eyes}|${tint??''}`,classId,skin,{hair:{base:from,color:hair},eyes},tint):source.material;
  const head=new THREE.SkinnedMesh(trimHead(source.geometry,JSON.parse(trim) as TrimParts),material);head.name='foreign-head';head.castShadow=true;
  head.position.copy(host.position);head.quaternion.copy(host.quaternion);head.scale.copy(host.scale);
  head.bind(host.skeleton,source.bindMatrix);parent.add(head);
  return()=>{head.removeFromParent();};
 },[gltf.scene,from,host,classId,skin,hair,eyes,tint,trim]);
 return null;
}

export default function HeroModel({classId,race,skin,hair='#825235',eyes,hairStyle=0,body:bodyShape=2,face=NO_FACE,showHelmet=true,weaponRarity='Comum',gearItems=[],gear,armed,shielded,walking=false,animated=true,combatant=false,preview=false,feminine=false,celestial=false}:{feminine?:boolean;celestial?:boolean;classId:ClassId;race:Race;skin:string;hair?:string;eyes?:string;hairStyle?:number;body?:number;face?:FaceOptions['look'];showHelmet?:boolean;weaponRarity?:string;gearItems?:{slot:string;rarity:string;visual?:string;classId?:ClassId}[];gear:HeroGear;armed:boolean;shielded:boolean;walking?:boolean;animated?:boolean;combatant?:boolean;preview?:boolean}){
 const style=HERO_STYLE[classId],gltf=useGLTF(heroModelUrl(style.base));
 const eventTime=useGame(s=>combatant?s.battleEvent?.time??0:0),hurtTime=useGame(s=>combatant&&s.battleEvent?.received?s.battleEvent.time:0);
 const punch=useGame(s=>combatant&&s.battleEvent?.basicEffect==='punch');
 const gearKey=gearItems.map(i=>`${i.slot}:${i.rarity}`).join('|'),equipmentLook=useMemo(()=>gearLook(gearKey?gearKey.split('|').map(e=>{const [slot,rarity]=e.split(':');return {slot,rarity};}):[]),[gearKey]);
 const dress=heroDress(classId,gear,hairStyle,showHelmet,race),{outfit,cape,head,extra,covered}=dress,faceKey=JSON.stringify(face);
 // 5.0: peças originais que saem da malha quando o jogador escolhe outra (não ficam mais uma por cima da outra).
 // Moicano e raspado: o cabelo do modelo vira couro cabeludo (pele um pouco mais escura) e a crista vem por cima.
 const scalp=extra==='mohawk'||extra==='shaved',headHair=scalp?'#'+new THREE.Color(skin).lerp(new THREE.Color('#3a2a20'),.3).getHexString():hair;
 const trimKey=JSON.stringify({brows:!covered&&(face.brows>0||scalp),nose:face.nose>0||race==='dwarf',ears:!covered&&(face.ears||RACE_EARS[race])>0});
 // Item equipado manda: arma, escudo e elmo aparecem iguais ao ícone (peças nativas da classe só sem item).
 const weaponItem=gearItems.find(i=>i.slot==='weapon'||i.slot==='twohand'),offItem=gearItems.find(i=>i.slot==='offhand'),headItem=gearItems.find(i=>i.slot==='head');
 const headKind=headItem?headLook(headItem.classId??classId):null,wornHat=!!(dress.hat||dress.covered)&&headKind!==null&&headKind!=='hood'?HEAD_MESH[headKind]:null;
 const hat=wornHat?null:dress.hat,ownWeapon=!!weaponItem,ownOffhand=!!offItem;
 const {scene,host}=useMemo(()=>{
  const model=clone(gltf.scene) as THREE.Group,show=new Set([...(armed&&!ownWeapon?style.weapon:[]),...(shielded&&!ownOffhand?style.offhand:[])]),parts=HERO_PARTS[style.base];let host:THREE.SkinnedMesh|null=null;
  model.traverse(o=>{if(!(o instanceof THREE.Mesh))return;o.castShadow=true;o.receiveShadow=!preview;
   const weapon=(HERO_WEAPON_MESHES as readonly string[]).includes(o.name);
   if(weapon)o.visible=show.has(o.name);
   else if(HERO_HAT_MESHES.includes(o.name))o.visible=o.name===hat;
   else if(o.name===parts.cape)o.visible=cape;
   if(!(o.material instanceof THREE.MeshStandardMaterial))return;
   if(o.name===parts.head){if(o instanceof THREE.SkinnedMesh)host=o;o.visible=head===style.base;const mesh=o as THREE.Mesh;mesh.userData.baseGeometry??=mesh.geometry;mesh.geometry=trimHead(mesh.userData.baseGeometry,JSON.parse(trimKey) as TrimParts);o.material=recolored(o.material,`${style.base}|${classId}|${skin}|head|${headHair}|${eyes}`,classId,skin,{hair:{base:style.base,color:headHair},eyes});}
   else{const rags=outfit==='rags'&&!weapon;o.material=recolored(o.material,`${style.base}|${classId}|${skin}|${rags?'rags':'class'}`,classId,skin,{rags});if(weapon&&o.visible)o.material=glowing(o.material,weaponRarity);}});
  // Peças de rosto presas ao osso da cabeça, no mesmo referencial em que a malha foi modelada.
  const headBone=host?(host as THREE.SkinnedMesh).skeleton.bones.find(b=>b.name==='head'):undefined;
  if(host&&headBone){const skeleton=(host as THREE.SkinnedMesh).skeleton,index=skeleton.bones.indexOf(headBone),kit=buildFaceKit({look:{...JSON.parse(faceKey),...(scalp&&!face.brows?{brows:1}:{})},race,covered,extra,hair,skin,feminine,dwarfHair:race==='dwarf'?hairStyle:undefined});
   const anchor=new THREE.Group();anchor.name='face-anchor';anchor.matrixAutoUpdate=false;anchor.matrix.copy(skeleton.boneInverses[index]);anchor.add(kit);if(classId==='prophet'&&!covered){const halo=new THREE.Mesh(new THREE.TorusGeometry(.5,.035,8,40),new THREE.MeshStandardMaterial({color:'#f2c75c',emissive:'#a8741c',emissiveIntensity:.6,metalness:.7,roughness:.35}));halo.name='prophet-halo';halo.position.set(0,1.82,-.42);kit.add(halo);}
   // Celestiais de Goddard (robôs de IA): auréola deitada sobre a cabeça e um ponto de luz na testa.
   if(celestial){const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.04,8,40),new THREE.MeshStandardMaterial({color:'#ffe7a3',emissive:'#ffc94a',emissiveIntensity:1.4,metalness:.5,roughness:.3}));ring.name='celestial-halo';ring.rotation.x=Math.PI/2;ring.position.set(0,2.62,-.04);ring.raycast=()=>null;kit.add(ring);
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.05),new THREE.MeshStandardMaterial({color:'#bff6ff',emissive:'#38d6ff',emissiveIntensity:1.6}));gem.position.set(0,1.98,.5);gem.raycast=()=>null;kit.add(gem);}headBone.add(anchor);
   const [headWidth,headHeight,headDepth]=RACE_HEAD_SHAPE[race];
   headBone.scale.set(headWidth*.91,headHeight*.9,headDepth*.93);}
  if(race==='dwarf')model.traverse(node=>{if(node instanceof THREE.Bone&&COMPACT_LEGS.has(node.name))node.scale.y*=.78;});
  // Corpo feminino: ombros e tronco mais estreitos, quadril um pouco mais largo e silhueta mais esguia.
  if(feminine){const bones:Record<string,THREE.Bone>={};model.traverse(n=>{if(n instanceof THREE.Bone)bones[n.name]=n;});
   bones.spine?.scale.multiply(new THREE.Vector3(.94,1,.96));bones.chest?.scale.multiply(new THREE.Vector3(.86,1,.92));
   for(const arm of ['upperarm.l','upperarm.r'])bones[arm]?.scale.multiply(new THREE.Vector3(1/.84*.9,1,1/.9*.92));
   bones.head?.scale.multiply(new THREE.Vector3(1/.84*.96,.98,1/.9*.97));
   bones.hips?.scale.multiply(new THREE.Vector3(1.06,1,1.02));
   for(const leg of ['upperleg.l','upperleg.r'])bones[leg]?.scale.multiply(new THREE.Vector3(1/1.06*.94,1,1/1.02*.95));}
  model.updateMatrixWorld(true);
  model.traverse(node=>{if(node instanceof THREE.SkinnedMesh)node.skeleton.update();});
  const body=new THREE.Box3();model.updateMatrixWorld(true);model.traverse(o=>{if(o instanceof THREE.Mesh&&!NOT_BODY(o.name)){if(o instanceof THREE.SkinnedMesh)o.computeBoundingBox();body.expandByObject(o);}});
  const form=heroProportions(race),width=form.width*(BODY_WIDTH[bodyShape]??1),scale=HUMAN_HEIGHT*form.height/Math.max(.01,body.max.y-body.min.y);
  const tall=BODY_HEIGHT[bodyShape]??1;model.scale.set(scale*width,scale*tall,scale*width);model.position.y=-(body.isEmpty()?0:body.min.y)*scale*tall;
  attachGearPieces(model,equipmentLook.slots);
  return {scene:model,host};
 },[equipmentLook,gltf.scene,style,classId,race,skin,hair,eyes,bodyShape,armed,shielded,preview,outfit,hat,cape,head,extra,covered,faceKey,hairStyle,weaponRarity,ownWeapon,ownOffhand,trimKey,headHair,feminine,scalp,face.brows,celestial]);
 const wv=weaponItem?.visual??'',ov=offItem?.visual??'';
 const bow=wv==='bow';
 const twoHandMelee=weaponItem?.slot==='twohand'&&['greatsword','axe','hammer'].includes(wv);
 const oneHand=weaponItem?.slot==='weapon'&&style.idle==='2H_Melee_Idle';
 const singleBlade=!!weaponItem&&!offItem&&style.attack.startsWith('Dualwield');
 const idle=armed?(twoHandMelee?'2H_Melee_Idle':oneHand?'Idle':style.idle):'Idle';
 const move=walking?HERO_WALK:idle;
 const attack=punch?HERO_PUNCH:twoHandMelee?'2H_Melee_Attack_Chop':oneHand||singleBlade?'1H_Melee_Attack_Chop':style.attack;
 const mainMesh=twoHandMelee&&wv==='axe'?{mesh:'2H_Axe',base:'barbarian'} as const:WEAPON_MESH[wv];
 return <group>
  <GearAura tier={weaponItem&&rarityTier(weaponItem.rarity)==='mythic'?'mythic':'common'} animated={animated}/>
  <Rig key={scene.uuid} scene={scene} clips={headFreeClips(gltf.animations)} move={move} walking={walking} animated={animated} attack={attack} eventTime={eventTime} hurtTime={hurtTime}/>
  {weaponItem&&(mainMesh?<Suspense fallback={null}><BorrowedPiece piece={mainMesh} bone="handslot.r" scene={scene} rarity={weaponItem.rarity} kind="weapon"/></Suspense>:wv&&<SimpleWeapon visual={wv} bone={bow?'handslot.l':'handslot.r'} scene={scene} rarity={weaponItem.rarity}/>)}
  {offItem&&(OFFHAND_MESH[ov]?<Suspense fallback={null}><BorrowedPiece piece={OFFHAND_MESH[ov]} bone="handslot.l" scene={scene} rarity={offItem.rarity} kind="weapon"/></Suspense>:ov&&<SimpleWeapon visual={ov} bone="handslot.l" scene={scene} rarity={offItem.rarity} small/>)}
  {wornHat&&headItem&&<Suspense fallback={null}><BorrowedPiece piece={wornHat} bone="head" scene={scene} rarity={headItem.rarity} kind="armor"/></Suspense>}
  {host&&head!==style.base&&<Suspense fallback={null}><ForeignHead from={head} host={host} classId={classId} skin={skin} hair={headHair} eyes={eyes} trim={trimKey} tint={headKind==='hood'&&headItem?HOOD_TINT[rarityTier(headItem.rarity)]:undefined}/></Suspense>}
 </group>;
}

/** Animações presas a uma montagem do modelo; trocar roupa ou arma cria uma montagem nova (sem pose em T). */
function Rig({scene,clips,move,walking,animated,attack,eventTime,hurtTime=0}:{scene:THREE.Group;clips:THREE.AnimationClip[];move:string;walking:boolean;animated:boolean;attack:string;eventTime:number;hurtTime?:number}){
 const root=useRef<THREE.Group>(null),first=useRef(true),{actions,mixer}=useAnimations(clips,root);
 useEffect(()=>()=>{scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose();});mixer.stopAllAction();mixer.uncacheRoot(scene);},[scene,mixer]);
 // Antes do primeiro quadro: aplica a pose de descanso para não piscar a pose em T.
 useLayoutEffect(()=>{const action=actions[move]??actions.Idle;if(!action)return;action.reset().setEffectiveTimeScale(animated?(walking?1.35:1):0).fadeIn(animated&&!first.current?.18:0).play();mixer.update(0);first.current=false;return()=>{action.fadeOut(.18);};},[actions,mixer,move,walking,animated]);
 useEffect(()=>{if(!eventTime||!animated)return;const action=actions[attack];if(!action)return;
  action.reset().setLoop(THREE.LoopOnce,1).setEffectiveWeight(1).fadeIn(.08).play();
  const timer=setTimeout(()=>action.fadeOut(.2),Math.max(250,action.getClip().duration*1000-200));return()=>clearTimeout(timer);
 },[eventTime,actions,attack,animated]);
 // Levou golpe: depois do próprio ataque, o herói recua (animação de impacto).
 useEffect(()=>{if(!hurtTime||!animated)return;const action=actions[HERO_HIT];if(!action)return;const start=setTimeout(()=>{action.reset().setLoop(THREE.LoopOnce,1).setEffectiveWeight(1).fadeIn(.06).play();},420);const stop=setTimeout(()=>action.fadeOut(.2),420+Math.max(200,action.getClip().duration*1000-150));return()=>{clearTimeout(start);clearTimeout(stop);};},[hurtTime,actions,animated]);
 return <group ref={root}><primitive object={scene}/></group>;
}
