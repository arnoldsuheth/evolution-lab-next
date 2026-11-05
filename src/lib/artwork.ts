import type {Item} from './catalogue';
import type {ClassId} from './game';
export const ART_BASE=process.env.NEXT_PUBLIC_GITHUB_PAGES==='true'?'/evolution-lab-next':'';
export type ArtCrop={sheet:'items'|'equipment'|'classes';x:number;y:number;w:number;h:number};
const itemCrop=(index:number):ArtCrop=>({sheet:'items',x:index%6*256+15,y:[108,331,552,774][Math.floor(index/6)],w:226,h:185});
const equipment=(x:number,y:number,w:number,h:number):ArtCrop=>({sheet:'equipment',x,y,w,h});
const armor:Record<ClassId,ArtCrop>={paladin:equipment(18,125,195,230),warrior:equipment(423,135,200,211),hunter:equipment(818,134,179,220),engineer:equipment(18,512,194,237),mage:equipment(433,575,205,198),hacker:equipment(815,543,191,213),prophet:equipment(20,929,199,221),duelist:equipment(426,927,199,218),shaman:equipment(815,951,203,207)};
const weapons:Record<string,ArtCrop>={sword:equipment(194,218,75,186),greatsword:equipment(704,149,91,238),dagger:equipment(1083,612,75,177),hammer:equipment(212,567,119,178),tool:equipment(308,579,85,170),axe:equipment(212,567,119,178),bow:equipment(1019,126,180,149),crossbow:equipment(1011,240,184,78),gun:equipment(999,331,202,74),staff:equipment(633,489,103,295),wand:equipment(720,578,77,207),shield:equipment(267,224,130,173)};
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
 if(item.slot==='head')return equipment(item.classId==='mage'?425:item.classId==='hacker'?1008:228,item.classId==='mage'?491:item.classId==='hacker'?505:112,160,144);
 if(item.slot==='feet')return equipment(27,336,164,78);
 return undefined;
}
export const CLASS_CROPS:Record<ClassId,ArtCrop>=Object.fromEntries((['paladin','warrior','hunter','engineer','mage','hacker','prophet','duelist','shaman'] as ClassId[]).map((id,i)=>[id,{sheet:'classes',x:[95,500,900][i%3],y:[128,520,935][Math.floor(i/3)],w:210,h:210}])) as Record<ClassId,ArtCrop>;
