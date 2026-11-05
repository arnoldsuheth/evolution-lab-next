import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const target=new URL('../public/models/pilot/knight.glb',import.meta.url);
const expected='60428e3abc09ba83e595d256e3af8c5c976b46cdae599f0802fc82b4a3445168';
const digest=data=>createHash('sha256').update(data).digest('hex');
try{if(digest(await readFile(target))===expected){console.log('Licensed pilot: pinned asset verified.');process.exit(0);}}catch{}
const response=await fetch('https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/672074b73ba276876a19e8816ecdc5241817ab47/addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb',{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error('Pilot asset download failed: '+response.status);
const data=Buffer.from(await response.arrayBuffer());if(digest(data)!==expected)throw Error('Pilot asset checksum mismatch; refusing changed content.');
await mkdir(new URL('../public/models/pilot/',import.meta.url),{recursive:true});await writeFile(target,data);console.log('Licensed pilot downloaded and verified (CC0).');
