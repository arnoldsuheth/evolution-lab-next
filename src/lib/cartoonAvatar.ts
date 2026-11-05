import * as THREE from 'three';
import type {ClassId,Look,Race} from './game';
import {skinColor} from './visual';
import {BODY_TRAITS,FACE_TRAITS,NOSE_TRAITS} from './characterTraits';
type V3=[number,number,number];
export const CLASS_STYLE:Record<ClassId,{cloth:string;trim:string;shape:'plate'|'leather'|'robe'|'apron';emblem:string}>={
 paladin:{cloth:'#3565bc',trim:'#f8ca59',shape:'plate',emblem:'shield'},warrior:{cloth:'#a73c42',trim:'#9293a5',shape:'leather',emblem:'blade'},hunter:{cloth:'#5c8a36',trim:'#c49458',shape:'leather',emblem:'arrow'},engineer:{cloth:'#219da3',trim:'#ecad3b',shape:'apron',emblem:'gear'},mage:{cloth:'#6750b4',trim:'#ddac53',shape:'robe',emblem:'rune'},hacker:{cloth:'#41375d',trim:'#44bcba',shape:'leather',emblem:'dagger'},prophet:{cloth:'#eee0ba',trim:'#df7d63',shape:'robe',emblem:'sun'},duelist:{cloth:'#933a67',trim:'#dfb558',shape:'leather',emblem:'sabre'},shaman:{cloth:'#2d9e9c',trim:'#dcc69a',shape:'robe',emblem:'spirit'},
};
/** Lightweight sculpted cartoon rig; all saved appearance indices remain unchanged. */
export function buildCartoonAvatar({race,classId,look,hairColor,eyeColor,skinOverride,gear}:{race:Race;classId:ClassId;look:Look;hairColor:string;eyeColor:string;skinOverride?:string;gear:Set<string>}){
 const root=new THREE.Group(),style=CLASS_STYLE[classId];root.name='cartoon-avatar';
 const materials=new Map<string,THREE.MeshStandardMaterial>();
 const mat=(color:string)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:0}));return materials.get(color)!;};
 const skin=skinOverride??skinColor(race,look.skin),dark='#283047',leather='#815337',gold=style.trim;
 const cloth=new THREE.Color(style.cloth).lerp(new THREE.Color(['#f2c58b','#519a9e','#b35865','#65a85d','#9465b9','#d5b66a'][look.cloth]??style.cloth),.12).getStyle();
 const sphereGeometry=new THREE.SphereGeometry(1,20,14),capsuleGeometry=new THREE.CapsuleGeometry(1,1,4,12),skinSphere=sphereGeometry.clone(),skinVertices=skinSphere.getAttribute('position'),skinColors=new Float32Array(skinVertices.count*3);
 for(let i=0;i<skinVertices.count;i++){const shade=.88+(skinVertices.getY(i)+1)*.065;skinColors.set([shade,shade,shade],i*3);}skinSphere.setAttribute('color',new THREE.BufferAttribute(skinColors,3));
 const skinMaterial=mat(skin);skinMaterial.vertexColors=true;
 function ell(parent:THREE.Object3D,p:V3,size:V3,color:string,name=''){const mesh=new THREE.Mesh(color===skin?skinSphere:sphereGeometry,mat(color));mesh.position.set(...p);mesh.scale.set(...size);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);return mesh;}
 function box(parent:THREE.Object3D,p:V3,size:V3,color:string){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color));mesh.position.set(...p);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function capsule(parent:THREE.Object3D,p:V3,size:V3,color:string){const mesh=new THREE.Mesh(capsuleGeometry,mat(color));mesh.position.set(...p);mesh.scale.set(...size);mesh.castShadow=true;parent.add(mesh);return mesh;}
 function cone(parent:THREE.Object3D,p:V3,r:number,height:number,color:string){const mesh=new THREE.Mesh(new THREE.ConeGeometry(r,height,12),mat(color));mesh.position.set(...p);mesh.castShadow=true;parent.add(mesh);return mesh;}
 const proportions={human:[1,1],orc:[1.18,1.04],dwarf:[1.1,.85],elf:[.89,1.08],gnome:[.83,.77]}[race];
 const build=BODY_TRAITS[look.body]??BODY_TRAITS[0];
 const width=proportions[0]*build.shoulders;
 root.scale.set(width,proportions[1]*build.height,build.waist);
 const torso=new THREE.Group();torso.name='torso';root.add(torso);
 ell(torso,[0,1.43,0],[.43,.58,.3],cloth);
 if(style.shape==='plate'){ell(torso,[0,1.51,.05],[.44,.48,.31],gear.has('chest')?'#dbe5f2':'#b9c8de');box(torso,[0,1.42,.345],[.1,.56,.035],gold);}
 if(style.shape==='robe'){const robe=cone(torso,[0,.93,0],.51,1.35,cloth);robe.rotation.z=Math.PI;box(torso,[0,1.25,.32],[.17,.9,.05],gold);}
 if(style.shape==='apron'){ell(torso,[0,1.34,.27],[.36,.46,.075],gold);box(torso,[0,1.12,.33],[.5,.28,.08],leather);}
 // Recognizable collar, belt and a broad, readable class insignia.
 ell(torso,[0,1.91,0],[.4,.13,.31],gold);
 box(torso,[0,1.12,.06],[.88,.15,.63],leather);box(torso,[0,1.12,.402],[.21,.2,.07],gold);
 const badge=new THREE.Mesh(new THREE.OctahedronGeometry(.12),mat(gold));badge.position.set(0,1.65,.342);badge.scale.y=classId==='paladin'?1.4:1;torso.add(badge);
 if(['hunter','hacker','mage','prophet','shaman'].includes(classId)||gear.has('back')){const cape=cone(torso,[0,1.23,-.27],.48,1.4,cloth);cape.rotation.z=Math.PI;cape.scale.z=.38;}
 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.name=side<0?'legLeft':'legRight';leg.position.set(side*.23,.97,0);root.add(leg);
  capsule(leg,[0,-.3,0],[.16,.19,.18],dark);ell(leg,[0,-.76,.12],[.23,.19,.34],leather);ell(leg,[0,-.53,.015],[.2,.17,.22],gear.has('feet')?gold:leather);
  const arm=new THREE.Group();arm.name=side<0?'armLeft':'armRight';arm.position.set(side*.5,1.76,0);arm.rotation.z=side*.12;root.add(arm);
  ell(arm,[0,-.09,0],[.23,.28,.24],style.shape==='plate'?'#dbe5f2':cloth);
  if(gear.has('shoulders')||classId==='paladin'||classId==='warrior')ell(arm,[0,.03,0],[.29,.2,.28],classId==='paladin'?'#dbe5f2':'#9b8d94');
  capsule(arm,[0,-.39,.015],[.14,.13,.15],skin);ell(arm,[0,-.65,.04],[.18,.2,.19],gear.has('hands')?leather:skin);
  if(classId==='engineer'&&side>0){ell(arm,[0,-.58,.025],[.25,.28,.25],gold);box(arm,[0,-.58,.25],[.19,.15,.09],'#59d9dc');}
  const anchor=new THREE.Group();anchor.name=side>0?'weaponAnchor':'offhandAnchor';anchor.position.set(0,-.64,.12);anchor.rotation.x=.16;arm.add(anchor);
 }
 const head=new THREE.Group();head.name='head';head.position.set(0,2.48,0);root.add(head);
 const face=FACE_TRAITS[look.face]??FACE_TRAITS[0],nose=NOSE_TRAITS[look.nose]??NOSE_TRAITS[0];
 ell(head,[0,0,0],[.54*face.width,.57*face.height,.44],skin,'face');
 ell(head,[0,-.22,-.01],[.44*face.jaw,.3,.37],skin,'jaw');
 for(const side of [-1,1]){
  const ear=ell(head,[side*.53,0,0],[race==='elf'?.25:race==='gnome'?.2:.13,race==='elf'?.1:.17,.12],skin);ear.rotation.z=side*.25;
  ell(head,[side*.205,.08,.373],[.175,.235,.095],'#fff8e9');ell(head,[side*.205,.065,.458],[.077,.12,.031],eyeColor);ell(head,[side*.205,.065,.481],[.047,.083,.016],dark);ell(head,[side*.18,.12,.496],[.026,.036,.011],'#ffffff');
  const brow=capsule(head,[side*.2,.34,.4],[.055,.09,.05],hairColor);brow.rotation.z=side*(1.1+(look.brows%3)*.13);
 }
 ell(head,[0,-.08,.46],[.08+nose.width*.2,.07+nose.bridge*.2,.08+nose.depth*.3],skin,'nose');
 ell(head,[0,-.27,.398],[.19,.075,.04],'#6c3f3f');box(head,[0,-.24,.435],[.24,.04,.013],'#fff1d5');
 if(race==='orc')for(const side of [-1,1])cone(head,[side*.18,-.25,.45],.055,.19,'#fff3c5');
 const hair=new THREE.Group();hair.name='hair';head.add(hair);
 if(look.hair>0){ell(hair,[0,.43,-.07],[.55,.22+(look.hair%3)*.025,.43],hairColor);for(let i=0;i<4;i++){const tuft=ell(hair,[-.36+i*.22,.47+Math.sin(i+look.hair)*.06,.13],[.23,.18,.27],hairColor);tuft.rotation.z=look.hair===2?-.55:.15;}
  if(look.hair===3)for(let i=0;i<4;i++)cone(hair,[0,.61,-.25+i*.14],.13,.25,hairColor);
  if(look.hair===4){ell(hair,[.45,-.05,-.21],[.18,.5,.2],hairColor);ell(hair,[-.45,-.05,-.21],[.18,.5,.2],hairColor);}if(look.hair===5){ell(hair,[0,.12,-.48],[.2,.35,.22],hairColor);ell(hair,[0,.28,-.49],[.22,.055,.22],gold);}
 }
 if(look.beard>0){ell(head,[0,-.37,.26],[.36,.22+(look.beard>1?.16:0),.21],hairColor);if(look.beard>=3)for(const side of [-1,1]){capsule(head,[side*.16,-.54,.3],[.1,.11,.1],hairColor);ell(head,[side*.16,-.69,.3],[.1,.045,.1],gold);}}
 if(look.moustache>0)for(const side of [-1,1]){const moustache=ell(head,[side*.12,-.17,.46],[.17,.07,.06],hairColor);moustache.rotation.z=side*.2;}
 if(look.scar>0){const scar=box(head,[.34,.02,.37],[.025,.24,.014],'#a46760');scar.rotation.z=-.35;}
 if(look.tattoo>0)ell(head,[-.36,-.1,.34],[.055,.11,.018],style.trim);
 if(classId==='engineer')for(const side of [-1,1]){ell(head,[side*.22,.45,.3],[.2,.16,.085],gold);ell(head,[side*.22,.45,.37],[.14,.11,.02],'#58bbc5');}
 if(classId==='mage'){const hat=cone(head,[0,.66,-.05],.52,.6,cloth);hat.rotation.z=-.2;ell(head,[0,.43,0],[.63,.065,.49],cloth);}
 if(classId==='hunter'||classId==='hacker'){ell(head,[0,.04,-.15],[.6,.64,.38],cloth);}
 if(classId==='prophet')ell(head,[0,.43,-.1],[.53,.22,.42],'#eee1c9');
 if(classId==='shaman'){for(const side of [-1,1]){capsule(head,[side*.46,-.28,.05],[.09,.21,.09],hairColor);ell(head,[side*.46,-.47,.05],[.1,.06,.1],gold);}ell(head,[0,.4,0],[.57,.07,.44],gold);}
 if(gear.has('head')){ell(head,[0,.43,-.07],[.58,.2,.45],style.shape==='plate'?'#c2d0e3':leather);}
 if(look.accessory>0)ell(head,[.54,-.12,.02],[.04,.08,.04],gold);
 root.userData={style:'cartoon-3d',classId,race,appearance:{...look},emblem:style.emblem};return root;
}
