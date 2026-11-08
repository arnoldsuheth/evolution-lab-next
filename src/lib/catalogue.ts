import {equipmentValue} from "./economy";
import type { ClassId } from './game';
/**
 * Tabela de preços (em bronze: 100 bronze = 1 prata, 100 prata = 1 ouro).
 * Quanto maior o nível e a raridade, mais caro. Armas a partir de 8 prata, peças de armadura a partir de 3 prata,
 * joias a partir de 5 prata. Consumíveis e insumos ficam acessíveis, mas não de graça.
 */
export const PRICE={
 weapon:(level:number,weight:number,q:number)=>Math.round((800+level*140)*(.85+.15*weight)*q),
 armor:(level:number,weight:number,q:number)=>Math.round((300+level*60)*(1+Math.max(0,weight-.45)*.6)*q),
 offhand:(level:number,q:number)=>Math.round((450+level*80)*q),
 jewel:(level:number,q:number)=>Math.round((500+level*90)*q),
 potion:(level:number)=>30+level*6,
 food:(level:number)=>15+level*3,
 material:(level:number)=>12+level*5,
};
export type Category='weapon'|'armor'|'accessory'|'consumable'|'food'|'material'|'companion'|'tool'|'trophy';
export type Slot='weapon'|'twohand'|'offhand'|'head'|'chest'|'shoulders'|'hands'|'legs'|'feet'|'belt'|'charm'|'ring'|'trinket'|'back'|'pet'|'consumable'|'material'|'trophy';
export type Item={id:string;name:string;price:number;sellPrice:number;slot:Slot;category:Category;minLevel:number;power:number;defense:number;rarity:string;classId?:ClassId;classes?:ClassId[];recipe?:number;ingredients?:Record<string,number>;craftGold?:number;description:string;visual:string;armor?:string;source:'shop'|'craft'|'loot'|'trophy'|'chest'|'forge';maxStack:number;hp?:number;mp?:number;stamina?:number;companion?:number;mount?:boolean;profession?:string;effect?:{teleport?:boolean;hp?:number;mp?:number;stamina?:number;buff?:'attack'|'defense'|'regen';amount?:number;duration?:number}};
export const LEVEL_BANDS=[1,5,10,15,20,25,30,35,40,45,50,55,60] as const;
export const CATEGORY_NAMES:Record<Category,string>={weapon:'Armas',armor:'Armaduras',accessory:'Acessórios',consumable:'Poções e elixires',food:'Alimentos',material:'Materiais',companion:'Companheiros',tool:'Ferramentas',trophy:'Troféus'};
export const SLOT_NAMES:Record<Slot,string>={weapon:'Mão principal',twohand:'Duas mãos',offhand:'Mão secundária',head:'Cabeça',chest:'Torso',shoulders:'Ombros',hands:'Mãos',legs:'Pernas',feet:'Pés',belt:'Cintura',charm:'Amuleto',ring:'Anel',trinket:'Relíquia',back:'Capa',pet:'Companheiro',consumable:'Consumível',material:'Material',trophy:'Troféu'};
const ERAS=['da Aurora','do Caminhante','do Bosque','da Vigília','das Profundezas','das Runas','da Tempestade','do Eclipse','do Cristal','da Cidadela','do Código Antigo','da Ascensão','do Legado'];
const classes:ClassId[]=['paladin','warrior','hunter','engineer','mage','hacker','prophet','duelist','shaman'];
const armorType:Record<ClassId,string>={paladin:'Pesada',warrior:'Leve',hunter:'Couro',engineer:'Reforçada',mage:'Tecido',hacker:'Couro',prophet:'Tecido',duelist:'Couro',shaman:'Couro'};
const materialKinds=['ore','wood','leather','cloth','crystal','parts'] as const;
const materialNames={ore:'Minério',wood:'Madeira',leather:'Couro',cloth:'Tecido',crystal:'Cristal',parts:'Componentes'};
/** Itens de loja e de saque são Comuns; Épico e Mítico são aprimoramentos feitos no ferreiro. */
const rarity=(level:number)=>level>0?'Comum':'Comum';
const quality=(level:number)=>level<5?1:level<15?1.08:level<30?1.18:level<50?1.32:1.5;
export const bandFor=(level:number)=>Math.max(0,LEVEL_BANDS.findLastIndex(l=>l<=level));
function make(id:string,overrides:Partial<Item>&Pick<Item,'name'|'slot'|'category'>):Item{const item:Item={id,price:0,sellPrice:0,minLevel:1,power:0,defense:0,rarity:'Comum',description:'',visual:overrides.category,source:'shop',maxStack:1,...overrides};if(!('sellPrice'in overrides))item.sellPrice=Math.floor(item.price*0.28);return item;}
const items:Record<string,Item>={};
const add=(item:Item)=>{if(items[item.id])throw new Error('ID duplicado: '+item.id);items[item.id]=item;};
const weaponFamilies:Record<ClassId,{name:string;visual:string;slot:Slot;weight:number}[]>={
 paladin:[{name:'Espada',visual:'sword',slot:'weapon',weight:1},{name:'Lâmina Consagrada',visual:'sword',slot:'weapon',weight:1.08}],
 warrior:[{name:'Espada de Batalha',visual:'sword',slot:'weapon',weight:1},{name:'Montante',visual:'greatsword',slot:'twohand',weight:1.25}],
 hunter:[{name:'Arco',visual:'bow',slot:'twohand',weight:1.05},{name:'Besta',visual:'crossbow',slot:'twohand',weight:1.12},{name:'Espingarda',visual:'gun',slot:'twohand',weight:1.2}],
 engineer:[{name:'Martelo de Forja',visual:'hammer',slot:'weapon',weight:1},{name:'Chave de Engenho',visual:'tool',slot:'weapon',weight:0.9}],
 mage:[{name:'Bastão',visual:'staff',slot:'twohand',weight:1.18},{name:'Varinha',visual:'wand',slot:'weapon',weight:0.94}],
 hacker:[{name:'Adaga',visual:'dagger',slot:'weapon',weight:1},{name:'Estilete',visual:'dagger',slot:'weapon',weight:1.08}],
 prophet:[{name:'Cajado de Prece',visual:'staff',slot:'twohand',weight:1.1},{name:'Cetro Sagrado',visual:'wand',slot:'weapon',weight:.95}],
 duelist:[{name:'Sabre',visual:'sword',slot:'weapon',weight:1.05},{name:'Lâmina de Duelo',visual:'dagger',slot:'weapon',weight:1.1}],
 shaman:[{name:'Bastão Ancestral',visual:'staff',slot:'twohand',weight:1.15},{name:'Martelo Tribal',visual:'hammer',slot:'weapon',weight:1}],
};
// Every band has real slot/class/stat/resource differences; IDs are deterministic.
LEVEL_BANDS.forEach((level,tier)=>{
 const era=ERAS[tier],q=quality(level);const r=rarity(level);const source=level>=50?'loot' as const:'shop' as const;
 materialKinds.forEach(kind=>add(make(`mat-${kind}-${level}`,{name:`${materialNames[kind]} ${era}`,slot:'material',category:'material',minLevel:level,price:PRICE.material(level),maxStack:999,visual:kind,rarity:r,description:`Insumo de grau ${tier+1}. Obtido em encontros dessa faixa e na oficina.`})));
 for(const classId of classes){
  const primary=['mage','prophet'].includes(classId)?'cloth':classId==='paladin'?'ore':classId==='engineer'?'parts':'leather';
  const recipe=(kind:string)=>({[`mat-${primary}-${level}`]:2+tier,[`mat-${kind}-${level}`]:1+Math.floor(tier/2)});
  const armorSlots:{slot:Slot;name:string;weight:number}[]=[{slot:'head',name:['mage','prophet'].includes(classId)?'Capuz':'Elmo',weight:.65},{slot:'chest',name:['mage','prophet'].includes(classId)?'Manto':'Traje',weight:1.2},{slot:'shoulders',name:'Ombreiras',weight:.6},{slot:'hands',name:'Luvas',weight:.45},{slot:'legs',name:'Calças',weight:.9},{slot:'feet',name:'Botas',weight:.5},{slot:'belt',name:'Cinto',weight:.35}];
  armorSlots.forEach(a=>{const defense=Math.max(1,Math.round((2+level*.48)*a.weight*q*(classId==='paladin'?1.25:['mage','prophet'].includes(classId)?.65:1)));const price=PRICE.armor(level,a.weight,q);add(make(`${classId}-${a.slot}-${level}`,{name:`${a.name} ${era} · ${armorType[classId]}`,slot:a.slot,category:'armor',classId,minLevel:level,price,defense,rarity:r,armor:armorType[classId],visual:a.slot,hp:Math.round(level*a.weight*.55),mp:['mage','prophet','shaman'].includes(classId)?Math.round(level*a.weight*.4):0,description:`Peça de ${armorType[classId].toLowerCase()}, grau ${tier+1}. Requer a classe e o nível indicados.`,source,ingredients:recipe('crystal'),craftGold:Math.round(price*.4)}));});
  weaponFamilies[classId].forEach((w,index)=>{const price=PRICE.weapon(level,w.weight,q);add(make(`${classId}-weapon${index}-${level}`,{name:`${w.name} ${era}`,slot:w.slot,category:'weapon',classId,minLevel:level,price,power:Math.round((5+level*1.3)*q*w.weight),defense:w.visual==='tool'?Math.ceil(level*.06):0,rarity:r,visual:w.visual,source,ingredients:recipe(w.visual==='bow'?'wood':'crystal'),craftGold:Math.round(price*.4),description:`${w.slot==='twohand'?'Ocupa as duas mãos.':'Permite mão secundária compatível.'} Arma de grau ${tier+1}.`}));});
  if(['paladin','mage','engineer','hacker','prophet','shaman','duelist'].includes(classId)){const visual=classId==='paladin'?'shield':['mage','prophet','shaman'].includes(classId)?'focus':classId==='engineer'?'gadget':classId==='duelist'?'sword':'dagger';const name=classId==='paladin'?'Escudo':['mage','prophet','shaman'].includes(classId)?'Foco Ritual':classId==='engineer'?'Módulo Auxiliar':classId==='duelist'?'Espada Secundária':'Adaga Secundária';const price=PRICE.offhand(level,q);add(make(`${classId}-offhand-${level}`,{name:`${name} ${era}`,slot:'offhand',category:classId==='paladin'?'armor':'accessory',classId,minLevel:level,price,power:classId==='paladin'?0:Math.ceil(level*.3*q),defense:Math.ceil((2+level*.35)*q*(classId==='paladin'?1.2:.45)),rarity:r,visual,source,ingredients:recipe('crystal'),craftGold:Math.round(price*.4),description:'Incompatível com armas de duas mãos.'}));}
 }
 const accessorySlots:{slot:Slot;name:string}[]=[{slot:'charm',name:'Amuleto'},{slot:'ring',name:'Anel'},{slot:'trinket',name:'Relíquia'},{slot:'back',name:'Capa'}];
 accessorySlots.forEach(a=>[0,1].forEach(v=>{const price=PRICE.jewel(level,q);add(make(`access-${a.slot}-${v}-${level}`,{name:`${a.name} ${v?'da Guarda':'do Ímpeto'} ${era}`,category:'accessory',slot:a.slot,minLevel:level,price,power:v?0:Math.ceil(level*.2*q),defense:v?Math.ceil(level*.2*q):0,hp:v?level*2:0,mp:v?0:level,rarity:r,visual:a.slot,source,ingredients:{[`mat-crystal-${level}`]:2+tier,[`mat-parts-${level}`]:1+tier},craftGold:Math.round(price*.4),description:v?'Favorece resistência e vida máxima.':'Favorece ataque e reserva de mana.'}));}));
 const consumables=[{key:'life',name:'Poção de Vida',effect:{hp:40+level*8}},{key:'mana',name:'Poção de Mana',effect:{mp:25+level*5}},{key:'energy',name:'Tônico de Estamina',effect:{stamina:40+level*3}},{key:'guard',name:'Elixir de Proteção',effect:{buff:'defense' as const,amount:3+Math.ceil(level*.2),duration:60}},{key:'fury',name:'Elixir de Ímpeto',effect:{buff:'attack' as const,amount:3+Math.ceil(level*.2),duration:60}}];
 consumables.forEach(c=>add(make(`consume-${c.key}-${level}`,{name:`${c.name} ${era}`,slot:'consumable',category:'consumable',minLevel:level,price:PRICE.potion(level),maxStack:99,rarity:r,visual:'potion',effect:c.effect,description:c.effect.hp?`Restaura ${c.effect.hp} HP.`:c.effect.mp?`Restaura ${c.effect.mp} MP.`:c.effect.stamina?`Restaura ${c.effect.stamina} EST.`:`Bônus de ${c.effect.amount} por 60 segundos de jogo.`})));
 [{key:'bread',name:'Pão Rústico',effect:{stamina:25+level*3,mp:10+level}},{key:'stew',name:'Ensopado do Viajante',effect:{hp:20+level*5,stamina:20+level*2}},{key:'fruit',name:'Frutas do Bosque',effect:{hp:15+level*2,mp:15+level*2}}].forEach(f=>add(make(`food-${f.key}-${level}`,{name:`${f.name} ${era}`,slot:'consumable',category:'food',minLevel:level,price:PRICE.food(level),maxStack:99,visual:'food',rarity:r,effect:f.effect,description:Object.entries(f.effect).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(' · ')})));
});
const pets=[['wolf','Lobo Cinzento'],['fox','Raposa da Aurora'],['owl','Coruja das Runas'],['boar','Javali do Vale'],['lynx','Lince da Vigília'],['crystal','Filhote Cristalino']];
pets.forEach(([key,name],i)=>add(make(`pet-${key}`,{name,slot:'pet',category:'companion',classes:['hunter'],minLevel:1+i*5,price:50+i*140,companion:4+i*3,hp:i*8,rarity:i<4?'Comum':'Épico',visual:key,source:i>3?'loot':'shop',description:'Companheiro Hunter: participa do dano e ocupa o slot de pet. IA e modelos individuais ainda simplificados.'})));
['Kit de Ferreiro','Ferramentas de Tecelagem','Estojo de Alquimia','Instrumentos de Coureiro','Lupa de Engenho','Bússola do Explorador'].forEach((name,i)=>add(make(`toolkit-${i}`,{name,slot:'trinket',category:'tool',minLevel:1+i*5,price:40+i*80,defense:i+1,rarity:'Comum',visual:'gadget',description:'Ferramenta equipada no slot relíquia. Concede a defesa indicada; não desbloqueia profissões adicionais.'})));
['Selo da Aurora','Fragmento do Guardião','Insígnia do Bosque','Runa da Comporta','Medalhão do Eclipse','Cristal da Cidadela','Marca da Ascensão','Emblema do Código Perdido'].forEach((name,i)=>add(make(`trophy-${i}`,{name,slot:'trophy',category:'trophy',minLevel:1+i*7,rarity:i<3?'Épico':'Mítico',source:'trophy',visual:'trophy',description:'Troféu de encontro com chefe. Colecionável sem bônus de combate.'})));
export function buildCatalogue(legacy:Record<string,{name:string;price:number;slot:string;power:number;defense:number;rarity:string;classId?:ClassId;recipe?:number;description:string}>):Record<string,Item>{
 const result={...items};
 for(const [id,name]of [['instance-crystal','Cristal Profundo da Caverna'],['instance-seal','Selo do Monastério']] as const)result[id]=make(id,{name,slot:'material',category:'material',source:'loot',rarity:'Épico',visual:'crystal',maxStack:999,description:'Material exclusivo de criaturas da instância correspondente. Não é vendido em lojas.'});
 result['instance-charm']=make('instance-charm',{name:'Amuleto da Memória Profunda',slot:'charm',category:'accessory',source:'craft',minLevel:25,price:800,sellPrice:80,craftGold:150,power:9,defense:9,hp:50,rarity:'Épico',visual:'charm',ingredients:{'instance-crystal':3,'instance-seal':3},description:'Reúne materiais exclusivos da caverna e do monastério.'});
 const apprentice=[['blacksmith','Broquel do Aprendiz','offhand','armor','shield'],['weaponsmith','Lâmina do Aprendiz','weapon','weapon','sword'],['tailor','Manto do Aprendiz','chest','armor','chest'],['leatherworker','Botas do Aprendiz','feet','armor','feet'],['alchemist','Tônico do Aprendiz','consumable','consumable','potion']] as const;
 for(const [profession,name,slot,category,visual] of apprentice)result['apprentice-'+profession]=make('apprentice-'+profession,{name,slot,category,visual,profession,source:'craft',minLevel:1,price:30,sellPrice:3,craftGold:5,ingredients:profession==='alchemist'?{'mat-crystal-1':2}:{['mat-'+(profession==='tailor'?'cloth':profession==='leatherworker'?'leather':'ore')+'-1']:3},maxStack:profession==='alchemist'?20:1,power:profession==='weaponsmith'?5:0,defense:category==='armor'?3:0,effect:profession==='alchemist'?{hp:30,stamina:20}:undefined,description:'Receita de aprendiz. Requer o ofício correspondente aprendido com Borin.'});
 result['scroll-aurora']=make('scroll-aurora',{name:'Pergaminho de Retorno à Aurora',slot:'consumable',category:'consumable',price:50,sellPrice:2,source:'craft',maxStack:20,visual:'charm',ingredients:{'mat-crystal-1':2,'mat-cloth-1':1},craftGold:10,effect:{teleport:true},description:'Fabricado com Borin. Consuma fora de combate para voltar à praça da Aurora. Não abre regiões bloqueadas.'});
 result['mount-boar']=make('mount-boar',{name:'Javali de Montaria da Aurora',slot:'pet',category:'companion',minLevel:30,price:1800,visual:'boar',mount:true,rarity:'Épico',description:'Montaria para todas as classes a partir do nível 30. Equipe como companheiro e escolha Montar. Caminha 50% mais rápido; desmonta ao iniciar combate.'});
 for(const [id,name,level] of [['cache-dawn','Lembrança da Primeira Runa',1],['cache-forest','Medalhão do Bosque Oculto',10],['cache-rune','Relíquia da Chave Perdida',20]] as const)result[id]=make(id,{name,slot:'trinket',category:'accessory',minLevel:level,rarity:'Épico',power:3+Math.ceil(level*.3),defense:2+Math.ceil(level*.2),hp:8+level,source:'chest',visual:'charm',description:'Tesouro de um baú oculto, aberto por uma chave de conhecimento.'});
 for(const [id,old]of Object.entries(legacy)){const consumable=old.slot==='consumable';const category:Category=consumable?(id==='food'?'food':'consumable'):['helmet','shield','tunic'].includes(id)?'armor':id==='runic'?'accessory':'weapon';result[id]=make(id,{...old,slot:old.slot as Slot,category,minLevel:id==='runic'?5:1,visual:{axe:'axe',shield:'shield',helmet:'head',sword:'sword',greatsword:'greatsword',bow:'bow',tool:'hammer',staff:'staff',dagger:'dagger',tunic:'chest',runic:'charm',potion:'potion',food:'food',tea:'potion'}[id]??'gadget',classes:id==='axe'?['warrior','engineer']:id==='shield'?['paladin']:undefined,armor:id==='helmet'?'Leve':id==='tunic'?'Leve':undefined,maxStack:consumable?99:1,effect:id==='potion'?{hp:45}:id==='food'?{mp:30,stamina:100}:id==='tea'?{buff:'defense',amount:5,duration:60}:undefined});}
 for(const item of Object.values(result))if(item.rarity==='Incomum'||item.rarity==='Raro')item.rarity='Comum';else if(item.rarity==='Lendário')item.rarity='Mítico';
 for(const item of Object.values(result)){if(Object.hasOwn(legacy,item.id)||!["weapon","armor","accessory","companion"].includes(item.category)||item.source==="craft"||item.source==="chest"||item.source==="trophy")continue;item.price=equipmentValue(item);item.sellPrice=Math.floor(item.price*.28);if(item.ingredients)item.craftGold=Math.max(item.sellPrice+1,Math.ceil(item.price*.4));}
 // Ferreiro: cada equipamento tem versão Épica (+30%) e Mítica (+70%), com preço pelo novo valor.
 for(const item of Object.values(result)){if(!FORGE_CATEGORIES.includes(item.category)||!(item.source==='shop'||item.source==='loot')||Object.hasOwn(legacy,item.id)||item.slot==='pet')continue;
  for(const step of FORGE_STEPS){const up=(n:number|undefined)=>n?Math.max(n+1,Math.round(n*step.boost)):n;
   const id=forgeId(item.id,step.key),next=make(id,{...item,id,name:`${item.name} · ${step.rarity}`,rarity:step.rarity,power:up(item.power)??0,defense:up(item.defense)??0,hp:up(item.hp),mp:up(item.mp),source:'forge',description:`${item.description} Aprimorado no ferreiro (${step.rarity}).`});
   delete next.ingredients;delete next.craftGold;delete next.recipe;delete next.profession;next.price=equipmentValue(next);next.sellPrice=Math.floor(next.price*.28);result[next.id]=next;}}
 return result;
}
export const FORGE_CATEGORIES:Category[]=['weapon','armor','accessory'];
export const FORGE_STEPS=[{key:'epico',rarity:'Épico',boost:1.3},{key:'mitico',rarity:'Mítico',boost:1.7}] as const;
export const forgeId=(id:string,step:'epico'|'mitico')=>`${id}+${step}`;
/** Item base (Comum) e próximo passo do ferreiro para um item: Comum → Épico → Mítico. */
export function forgeStep(id:string){const [base,tier]=id.split('+');return tier==='mitico'?null:{base,from:tier??'comum',to:(tier==='epico'?'mitico':'epico') as 'epico'|'mitico'};}
export const EQUIPMENT_SLOTS:Slot[]=['weapon','offhand','head','chest','shoulders','hands','legs','feet','belt','charm','ring','trinket','back','pet'];
