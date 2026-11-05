import {test} from 'node:test';import {strict as assert} from 'node:assert';import {readFileSync} from 'node:fs';
import * as THREE from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
test('amostra profissional carrega esqueleto e executa os clipes usados na prévia',async()=>{
 const bytes=readFileSync('public/models/pilot/knight.glb');assert.equal(bytes.readUInt32LE(0),0x46546c67);const length=bytes.readUInt32LE(12),data=JSON.parse(bytes.subarray(20,20+length).toString()),offset=20+length;
 // Node verifies geometry/rig/clips; PNG decoding and final appearance require browser QA.
 data.buffers[0].uri='data:application/octet-stream;base64,'+bytes.subarray(offset+8,offset+8+bytes.readUInt32LE(offset)).toString('base64');data.images=[];data.textures=[];data.materials=data.materials.map(()=>({pbrMetallicRoughness:{baseColorFactor:[1,1,1,1]}}));
 if(!globalThis.ProgressEvent)Object.defineProperty(globalThis,'ProgressEvent',{configurable:true,value:class extends Event{constructor(type:string){super(type);}}});
 const gltf=await new GLTFLoader().parseAsync(JSON.stringify(data),'');let skinned=0;gltf.scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh){skinned++;assert.ok(o.skeleton.bones.length>10);}});assert.ok(skinned>0);
 const mixer=new THREE.AnimationMixer(gltf.scene);for(const name of ['Idle','Walking_A','Running_A','1H_Melee_Attack_Chop','Spellcast_Raise','Cheer']){const clip=gltf.animations.find(a=>a.name===name);assert.ok(clip,name);assert.ok(clip.duration>0);mixer.stopAllAction();mixer.clipAction(clip).play();mixer.update(.3);gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),name));}mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);
});
