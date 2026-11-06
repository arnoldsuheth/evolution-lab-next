import type {Item} from './catalogue';
import type {ClassId} from './game';
export const ART_BASE=process.env.NEXT_PUBLIC_GITHUB_PAGES==='true'?'/evolution-lab-next':'';
export type ArtCrop={sheet:'items'|'equipment'|'classes';x:number;y:number;w:number;h:number;outline?:string};
const itemCrop=(index:number):ArtCrop=>({sheet:'items',x:index%6*256+15,y:[94,345,551,754][Math.floor(index/6)],w:226,h:[202,166,166,178][Math.floor(index/6)]});
const equipment=(x:number,y:number,w:number,h:number):ArtCrop=>({sheet:'equipment',x,y,w,h});
const armor:Record<ClassId,ArtCrop>={paladin:equipment(10,140,205,215),warrior:equipment(415,140,215,207),hunter:equipment(800,108,190,238),engineer:equipment(10,497,215,246),mage:equipment(420,566,198,198),hacker:equipment(806,504,207,244),prophet:equipment(10,885,230,258),duelist:equipment(412,885,202,253),shaman:equipment(800,865,202,288)};
const weapons:Record<string,ArtCrop>={sword:{...equipment(200,190,80,226),outline:'218,190 263,190 263,316 278,316 278,354 261,354 261,416 218,416 218,354 202,354 202,316 218,316'},greatsword:equipment(677,113,82,306),dagger:equipment(1015,610,92,182),hammer:equipment(218,558,95,184),tool:equipment(300,567,78,146),axe:equipment(218,558,95,184),bow:equipment(1018,116,154,177),crossbow:equipment(1050,242,160,92),gun:equipment(965,330,244,90),staff:{...equipment(604,473,92,314),outline:'604,473 696,473 696,600 672,600 672,787 625,787 625,600 604,600'},wand:{...equipment(670,543,75,146),outline:'716,543 745,543 745,580 704,689 670,689 670,651 710,573'},shield:{...equipment(265,224,123,190),outline:'265,246 314,224 388,247 383,337 354,388 337,414 301,385 276,344 265,290'}};
export function artworkForItem(item:Item):ArtCrop|undefined{
 const id=item.id,v=item.visual;
 if(id==='tea')return itemCrop(5);
 if(item.category==='consumable')return itemCrop(id.includes('mana')?1:id.includes('energy')?2:id.includes('guard')?3:id.includes('fury')?4:0);
 if(item.category==='food')return itemCrop(id.includes('stew')?7:id.includes('fruit')?8:6);
 const material={ore:9,wood:10,leather:11,cloth:12,crystal:13,parts:14};
 if(item.category==='material'&&v in material)return itemCrop(material[v as keyof typeof material]);
 if(item.category==='trophy')return itemCrop(20);
 if(item.category==='tool')return itemCrop(19);
 if(id.startsWith('cache-'))return itemCrop(23);
 if(v==='focus')return itemCrop(21);if(v==='gadget')return itemCrop(22);
 if(v==='charm')return itemCrop(15);if(v==='ring')return itemCrop(16);if(v==='trinket')return itemCrop(17);if(v==='back')return itemCrop(18);
 if(weapons[v])return weapons[v];
 if(item.category==='armor'&&item.slot==='chest')return armor[item.classId??'warrior'];
 if(item.slot==='head')return item.classId==='mage'?equipment(415,470,170,98):item.classId==='hacker'?equipment(1020,478,147,127):equipment(208,99,139,123);
 if(item.slot==='feet')return equipment(18,337,85,91);
 return undefined;
}
export const CLASS_CROPS:Record<ClassId,ArtCrop>=Object.fromEntries((['paladin','warrior','hunter','engineer','mage','hacker','prophet','duelist','shaman'] as ClassId[]).map((id,i)=>[id,{sheet:'classes',x:[95,500,900][i%3],y:[128,520,935][Math.floor(i/3)],w:210,h:210}])) as Record<ClassId,ArtCrop>;

