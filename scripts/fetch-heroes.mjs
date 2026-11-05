import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// KayKit Character Pack: Adventures 1.0 — CC0 (Kay Lousberg). Commit e hashes fixos: conteúdo alterado é recusado.
const commit='672074b73ba276876a19e8816ecdc5241817ab47';
const files={
 'Knight.glb':'60428e3abc09ba83e595d256e3af8c5c976b46cdae599f0802fc82b4a3445168',
 'Barbarian.glb':'cefc311a0e10c7858b6141f5ada7e33268727564fb8ac1347aab97d000669cc6',
 'Mage.glb':'cf898585da33fab50c724d31605fb931eb2912e6d2280092141e98ca81ad507d',
 'Rogue.glb':'e825437cd4d2ee9c1960b517a74a69101e33eb409ae7fa8cedc7134a998fbb7d',
 'Rogue_Hooded.glb':'93e6e25213009952276d9cf34f5d96a243767334c66f280db0433ddfabb91545',
};
const digest=data=>createHash('sha256').update(data).digest('hex');
const dir=new URL('../public/models/heroes/',import.meta.url);
await mkdir(dir,{recursive:true});
for(const [name,expected] of Object.entries(files)){
 const target=new URL(name,dir);
 try{if(digest(await readFile(target))===expected)continue;}catch{}
 let data;
 try{data=await readFile(new URL('../public/models/pilot/knight.glb',import.meta.url));if(name!=='Knight.glb'||digest(data)!==expected)data=undefined;}catch{}
 if(!data){
  const response=await fetch(`https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/${commit}/addons/kaykit_character_pack_adventures/Characters/gltf/${name}`,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw Error(`Falha ao baixar ${name}: ${response.status}`);
  data=Buffer.from(await response.arrayBuffer());
 }
 if(digest(data)!==expected)throw Error(`Hash inesperado em ${name}; conteúdo recusado.`);
 await writeFile(target,data);console.log(`Modelo ${name} verificado (CC0).`);
}
console.log('Modelos dos heróis prontos.');
