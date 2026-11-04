import * as THREE from 'three';
import type {Look,Race} from './game';
import {BODY_TRAITS,FACE_TRAITS,NOSE_TRAITS} from './characterTraits';
import {RACE_FORM,skinColor} from './visual';

type V3=[number,number,number];
type Ring=[number,number,number,number?];
export type AvatarOptions={race:Race;look:Look;hairColor:string;eyeColor:string;clothColor:string;accent:string;skinOverride?:string;gear?:{chest?:boolean;head?:boolean;shoulders?:boolean;hands?:boolean;legs?:boolean;feet?:boolean;back?:boolean}};
/** Continuous elliptical rings: limbs are tapered meshes, not stacks of spheres. */
export function ringMesh(rings:Ring[],segments=28):THREE.BufferGeometry{
 if(rings.length>3){const profile=new THREE.CatmullRomCurve3(rings.map(([y,rx,rz])=>new THREE.Vector3(rx,y,rz)),false,'centripetal');const source=rings;const points=profile.getPoints(Math.max(20,rings.length*4));rings=points.map(p=>{let j=source.findIndex(r=>r[0]>=p.y);if(j<1)j=1;const a=source[j-1],b=source[j],t=Math.max(0,Math.min(1,(p.y-a[0])/(b[0]-a[0]||1)));return[p.y,Math.max(.001,p.x),Math.max(.001,p.z),(a[3]??0)*(1-t)+(b[3]??0)*t] as Ring;});}
 const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
 const min=rings[0][0],max=rings.at(-1)![0];
 rings.forEach(([y,rx,rz,zc=0],row)=>{for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;vertices.push(Math.sin(a+Math.PI)*rx,y,Math.cos(a+Math.PI)*rz+zc);uv.push(j/segments,(y-min)/(max-min||1));if(row<rings.length-1&&j<segments){const a=row*(segments+1)+j,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}}});
 const bottom=vertices.length/3;vertices.push(0,min,rings[0][3]??0);uv.push(.5,0);const top=vertices.length/3;vertices.push(0,max,rings.at(-1)![3]??0);uv.push(.5,1);
 for(let j=0;j<segments;j++){indices.push(bottom,j+1,j);const last=(rings.length-1)*(segments+1);indices.push(top,last+j,last+j+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function material(color:string,metal=false){return new THREE.MeshStandardMaterial({color,roughness:metal?.46:.88,metalness:metal?.5:0});}
function addMesh(parent:THREE.Object3D,geometry:THREE.BufferGeometry,mat:THREE.Material,position:V3=[0,0,0],scale:V3=[1,1,1],rotation:V3=[0,0,0]){const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(...position);mesh.scale.set(...scale);mesh.rotation.set(...rotation);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function curve(parent:THREE.Object3D,points:V3[],radius:number,mat:THREE.Material){return addMesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(8,points.length*4),radius,5,false),mat);}

function tintSkin(g:THREE.BufferGeometry,color:string){const p=g.getAttribute('position'),colors=new Float32Array(p.count*3),base=new THREE.Color(color),c=new THREE.Color();g.computeBoundingBox();const box=g.boundingBox!,range=box.max.y-box.min.y||1;for(let i=0;i<p.count;i++){const t=(p.getY(i)-box.min.y)/range;c.copy(base).multiplyScalar(.93+t*.07);c.toArray(colors,i*3);}g.setAttribute('color',new THREE.BufferAttribute(colors,3));return g;}
export function sculptedHead(look:Look,race:Race):THREE.BufferGeometry{
 const face=FACE_TRAITS[look.face]??FACE_TRAITS[0],nose=NOSE_TRAITS[look.nose]??NOSE_TRAITS[0];
 const g=new THREE.SphereGeometry(1,64,48),p=g.getAttribute('position');
 const bump=(x:number,y:number,cx:number,cy:number,sx:number,sy:number)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
 for(let i=0;i<p.count;i++){
   const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i);let x=nx*.155*face.width,z=nz*.17;const y=ny*.245*face.height;
   const jawBlend=Math.max(0,Math.min(1,(-ny-.12)/.6));x*=1+(face.jaw-1)*jawBlend*.7;
   if(nz>0){const front=Math.min(1,nz*3);let d=0;
     d+=.011*face.cheeks*(bump(x,y,.085,-.015,.045,.065)+bump(x,y,-.085,-.015,.045,.065));
     d-=.017*(bump(x,y,.064,.044,.038,.023)+bump(x,y,-.064,.044,.038,.023));
     d+=.011*(bump(x,y,.064,.078,.046,.014)+bump(x,y,-.064,.078,.046,.014));
     d+=(.018+nose.bridge*.06)*bump(x,y,0,.004,nose.width*.1+.012,nose.bridge*.28);
     d+=(.026+nose.depth*.12)*bump(x,y,0,-.058,nose.width*.12+.014,.023);
     d+=.01*(bump(x,y,nose.width*.13,-.071,.013,.012)+bump(x,y,-nose.width*.13,-.071,.013,.012));
     d+=.009*bump(x,y,0,-.107,.047,.014)+.014*face.chin*bump(x,y,0,-.174,.06,.04);
     z+=front*d+(race==='orc'?.02*jawBlend:0);
   }
   if(ny>.25)x*=1+(face.temples-1)*.4;
   p.setXYZ(i,x,y,z);
 }
 // Race silhouette comes from the root and a modest head ratio, not swollen face parts.
 g.computeVertexNormals();return g;
}
function scalp(hairStyle:number){const g=new THREE.BufferGeometry(),v:number[]=[],idx:number[]=[];const rows=14,cols=40;for(let r=0;r<=rows;r++)for(let j=0;j<=cols;j++){const a=j/cols*Math.PI*2;const front=(Math.cos(a)+1)/2;const limit=1.75-front*.65;const theta=(r/rows)*limit;const wave=1+.015*Math.sin(a*7+r*.7);v.push(Math.sin(theta)*Math.sin(a)*.167*wave,Math.cos(theta)*.252,Math.sin(theta)*Math.cos(a)*.184);if(r<rows&&j<cols){const n=r*(cols+1)+j;idx.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}}g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();if(hairStyle===3)g.scale(.97,1,1);return g;}
function eye(parent:THREE.Group,side:number,eyeColor:string,skin:THREE.Material,hair:THREE.Material,brows:number){
 const x=side*.065,y=.043,z=.151;const shape=new THREE.Shape();shape.moveTo(-.031,0);shape.quadraticCurveTo(0,.017,.031,0);shape.quadraticCurveTo(0,-.012,-.031,0);addMesh(parent,new THREE.ShapeGeometry(shape,12),material('#c9c8ba'),[x,y,z]);
 addMesh(parent,new THREE.CircleGeometry(.0105,20),material(eyeColor),[x,y,z+.001]);addMesh(parent,new THREE.CircleGeometry(.0047,16),material('#18232b'),[x,y,z+.002]);addMesh(parent,new THREE.CircleGeometry(.0018,8),material('#dddccc'),[x-.003,y+.004,z+.003]);
 curve(parent,[[x-.031,y,z],[x,y+.011,z+.001],[x+.031,y,z]],.0026,skin);curve(parent,[[x-.03,y,z],[x,y-.008,z],[x+.03,y,z]],.0018,skin);
 const lift=[0,.008,0,-.005,.004,.01][brows]??0;curve(parent,[[x-side*.033,.082-lift,.147],[x,.089+lift,.151],[x+side*.029,.079+lift,.137]],brows===2?.0048:brows===4?.0023:.0034,hair);
}
function faceHair(parent:THREE.Group,look:Look,mat:THREE.Material){
 if(look.beard>0){const beard=look.beard===1?.012:look.beard===2?.055:.065;const rows=8,cols=28,v:number[]=[],indices:number[]=[];for(let r=0;r<=rows;r++)for(let j=0;j<=cols;j++){const u=j/cols*2-1,phase=j/cols*Math.PI;const y=-.065-.025*Math.sin(phase)-r/rows*(.14+beard)*Math.sin(phase);const x=u*(.12-r/rows*.05),z=Math.sqrt(Math.max(.015,1-(x/.155)**2-(Math.max(-.23,y)/.245)**2))*.17+.006+.009*Math.exp(-(((y+.17)/.05)**2));v.push(x,y,z);if(r<rows&&j<cols){const n=r*(cols+1)+j;indices.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();const mesh=addMesh(parent,g,mat);mesh.material=(mat as THREE.MeshStandardMaterial).clone();(mesh.material as THREE.Material).side=THREE.DoubleSide;
   if(look.beard>=3){const count=look.beard===3?1:look.beard===4?2:4;for(let i=0;i<count;i++){const x=(i-(count-1)/2)*.035;curve(parent,[[x,-.22,.105],[x+.005,-.285,.085],[x,-.34,.065]],.012,mat);}}
 }
 if(look.moustache>0){for(const side of [-1,1])curve(parent,[[0,-.084,.19],[side*.024,-.087,.18],[side*(.037+look.moustache*.004),-.098-look.moustache*.001,.16]],.0035+look.moustache*.001,mat);}
}
function ear(parent:THREE.Group,race:Race,side:number,mat:THREE.Material){const s=new THREE.Shape();s.moveTo(0,-.038);s.quadraticCurveTo(.045,-.055,.055,-.012);s.quadraticCurveTo(race==='elf'?.16:.07,race==='elf'?.075:.065,.025,.06);s.quadraticCurveTo(-.01,.055,0,-.038);const g=new THREE.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:2,steps:1});addMesh(parent,g,mat,[side*.145,-.005,-.004],[side,1,1],[0,side*.2,0]);}
function clothTexture(){const size=48,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const n=(Math.sin(x*12.989+y*78.233)*43758.5453)%1;const value=Math.max(0,Math.min(255,216+n*12+(x%3===0?-13:0)+(y%3===0?-8:0)));const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(7,9);t.needsUpdate=true;return t;}
export function buildAvatar(options:AvatarOptions):THREE.Group{
 const {race,look}=options,form=RACE_FORM[race],build=BODY_TRAITS[look.body]??BODY_TRAITS[1],gear=options.gear??{};const root=new THREE.Group();root.name='avatar';root.scale.set(form.width,form.height*build.height,form.depth);
 const skinColorValue=options.skinOverride??skinColor(race,look.skin);const skin=material(skinColorValue),skinVertex=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.84});const hair=material(options.hairColor);const fabric=material(options.clothColor);fabric.map=clothTexture();const trousers=material('#4b493e'),leather=material('#4c3d2d'),stitch=material('#a59b7b'),metal=material('#a99b75',true);
 const torsoRings:Ring[]=[[1.44,.29,.18],[1.5,.31,.19],[1.68,.28*build.waist,.17],[1.86,.27*build.waist,.17],[2.03,.30,.18],[2.19,.35,.20],[2.35,.41*build.shoulders,.21],[2.5,.44*build.shoulders,.19],[2.59,.35*build.shoulders,.16],[2.66,.15,.105]];
 addMesh(root,ringMesh(torsoRings),fabric);
 addMesh(root,ringMesh([[1.35,.265,.165],[1.48,.285,.175],[1.61,.28,.17]]),trousers);
 addMesh(root,ringMesh([[1.736,.282*build.waist,.178],[1.785,.281*build.waist,.178]]),leather);addMesh(root,new THREE.BoxGeometry(.06,.055,.012),metal,[.018,1.76,.184]);
 curve(root,[[-.29,1.455,.07],[-.21,1.45,.145],[0,1.445,.185],[.21,1.45,.145],[.29,1.455,.07]],.003,stitch);
 curve(root,[[-.10,2.65,.11],[0,2.48,.198],[.10,2.65,.11]],.004,stitch);
 if(!gear.chest){addMesh(root,new THREE.PlaneGeometry(.105,.14),material('#8b8064'),[.17,2.04,.182],[1,1,1],[0,-.15,.08]);for(const x of [.12,.22])curve(root,[[x,1.98,.187],[x,2.10,.184]],.002,stitch);}
 addMesh(root,tintSkin(ringMesh([[2.57,.12,.11],[2.7,.105,.1],[2.82,.095,.1]]),skinColorValue),skinVertex);
 const headGroup=new THREE.Group();headGroup.name='head';headGroup.position.set(0,3.015,0);const headFactor=race==='gnome'?1.4:race==='dwarf'?1.28:race==='orc'?1.17:1.12;headGroup.scale.set(form.head[0]*headFactor,form.head[1]*headFactor,form.head[2]*headFactor);root.add(headGroup);
 addMesh(headGroup,tintSkin(sculptedHead(look,race),skinColorValue),skinVertex);
 for(const side of [-1,1]){eye(headGroup,side,options.eyeColor,skin,hair,look.brows);ear(headGroup,race,side,skin);if(race==='orc'){addMesh(headGroup,ringMesh([[0,.014,.014],[.045,.011,.01],[.08,.001,.001]],12),material('#ddd2ae'),[side*.055,-.13,.16]);}}
 curve(headGroup,[[-.041,-.113,.157],[0,-.117,.177],[.041,-.113,.157]],.0019,material(race==='orc'?'#4b5d42':'#815d54'));
 if(look.hair>0){const cap=addMesh(headGroup,scalp(look.hair),hair);cap.name='hair';
   for(let i=0;i<9;i++){const x=(i-4)*.031;curve(headGroup,[[x,.13,.142],[x*.8,.235,.05],[x*.7,.21,-.13]],.0025,material(new THREE.Color(options.hairColor).multiplyScalar(.75+i%2*.12).getStyle()));}
   if(look.hair===2)for(let i=0;i<4;i++)curve(headGroup,[[-.13+i*.022,.16,.13],[.015,.255,.10],[.13,.20,.0]],.011,hair);
   if(look.hair===3)for(let i=0;i<4;i++)curve(headGroup,[[0,.24,-.12+i*.065],[0,.31,-.10+i*.065],[0,.28,-.07+i*.065]],.018,hair);
   if(look.hair===4)for(const side of [-1,1])for(let i=0;i<4;i++)curve(headGroup,[[side*(.13-i*.01),.12,-.08],[side*.15,-.06,-.14],[side*(.17+i*.005),-.31,-.11]],.025,hair);
   if(look.hair===5)curve(headGroup,[[0,.1,-.18],[0,-.07,-.26],[.03,-.30,-.22]],.045,hair);
 }
 faceHair(headGroup,look,look.beard===1?material(new THREE.Color(options.hairColor).lerp(new THREE.Color(skinColorValue),.7).getStyle()):hair);
 if(look.scar>0)curve(headGroup,[[.10,.084,.13],[.08,.018,.16],[.062,-.044,.17]],.0018+look.scar*.00025,material('#a37a68'));
 if(look.tattoo>0){const ink=material(['#36546a','#624a73','#3a6652','#875447','#4a4540'][look.tattoo-1]);for(let i=0;i<look.tattoo;i++)curve(headGroup,[[-.1+i*.009,-.025,.141],[-.08+i*.009,-.05,.151]],.002,ink);}
 if(look.accessory>0){const hoop=new THREE.TorusGeometry(.018+look.accessory*.001,.003,6,16);addMesh(headGroup,hoop,metal,[.19,-.035,.01]);}
 if(gear.head)addMesh(headGroup,scalp(1),material('#8d999c',true),[0,.01,0],[1.07,1.04,1.05]);
 for(const side of [-1,1]){
   const arm=new THREE.Group();arm.name=side===-1?'armLeft':'armRight';arm.position.set(side*.435*build.shoulders,2.5,0);arm.rotation.z=side*.065;root.add(arm);
   const armRings:Ring[]=[[-1.31,.055,.036],[-1.23,.07,.041],[-1.13,.06,.05],[-1.1,.064,.065],[-1.02,.074,.075],[-.88,.092,.082],[-.72,.103,.091],[-.59,.083,.077],[-.50,.087,.082],[-.31,.113*build.arms,.108],[-.12,.125*build.arms,.115],[.025,.1,.10]];
   addMesh(arm,tintSkin(ringMesh(armRings,24),skinColorValue),skinVertex);
   addMesh(arm,ringMesh([[-.32,.12*build.arms,.119],[-.27,.123*build.arms,.12],[-.10,.145*build.arms,.13],[.035,.14*build.arms,.125],[.09,.105*build.arms,.1],[.13,.025,.03]],24),fabric);
   curve(arm,[[-.12,-.315,0],[-.08,-.32,.095],[0,-.32,.12],[.08,-.32,.095],[.12,-.315,0]],.002,stitch);
   if(gear.hands)addMesh(arm,ringMesh([[-1.31,.058,.04],[-1.23,.076,.045],[-1.13,.068,.054],[-1.09,.068,.055]],16),leather);
   for(let f=0;f<4;f++){const x=(f-1.5)*.031,length=.105+(f===1||f===2?.025:0);addMesh(arm,ringMesh([[-length,.009,.011],[-length*.5,.012,.013],[0,.013,.014]],10),skin,[x,-1.30,.007]);}
   curve(arm,[[-side*.058,-1.19,.015],[-side*.085,-1.25,.024],[-side*.079,-1.30,.03]],.017,skin);
   if(gear.shoulders)addMesh(arm,ringMesh([[-.2,.16,.15],[0,.18,.16],[.07,.12,.12]],20),material(options.accent,true));
   const anchor=new THREE.Group();anchor.name=side===1?'weaponAnchor':'offhandAnchor';anchor.position.set(0,-1.22,.025);arm.add(anchor);
   const leg=new THREE.Group();leg.name=side===-1?'legLeft':'legRight';leg.position.set(side*.17*(build.stance/.24),1.51,0);root.add(leg);
   addMesh(leg,ringMesh([[-1.38,.07,.075],[-1.18,.078,.085],[-1.04,.10*build.legs,.108],[-.83,.105*build.legs,.115],[-.68,.092,.101],[-.53,.12*build.legs,.125],[-.28,.15*build.legs,.14],[-.05,.162*build.legs,.152],[.055,.15,.14]],24),gear.legs?material(options.accent):trousers);
   addMesh(leg,ringMesh([[-1.48,.105,.188,.066],[-1.42,.112,.2,.066],[-1.34,.105,.18,.05],[-1.26,.085,.11,.014],[gear.feet?-1.04:-1.23,gear.feet?.124:.097,gear.feet?.126:.107,0]],24),leather);
   curve(leg,[[-.10,-1.41,.14],[0,-1.42,.26],[.1,-1.41,.14]],.003,stitch);
 }
 if(gear.back){const points:V3[]=[[-.32,2.55,-.18],[.32,2.55,-.18],[.4,1.35,-.24],[-.4,1.35,-.24]];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const m=material(options.accent);m.side=THREE.DoubleSide;addMesh(root,g,m);}
 root.userData={anatomyVersion:2,headCount:race==='human'?6.6:race==='elf'?7:race==='gnome'?4.9:5.7};return root;
}
export function disposeAvatar(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);const map=(m as THREE.MeshStandardMaterial).map;if(map)textures.add(map);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
