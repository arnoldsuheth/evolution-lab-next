import type {HeroData} from './game';
export const ATTRIBUTE_KEYS=['strength','attack','defense','agility','dexterity','intelligence'] as const;
export type AttributeKey=typeof ATTRIBUTE_KEYS[number];
export const POINTS_PER_LEVEL=3;
export const ATTRIBUTE_INFO:Record<AttributeKey,{name:string;label:string;effect:string}>={
 strength:{name:'Força',label:'FOR',effect:'+1 FOR e +0,5 ATQ.'},
 attack:{name:'Ataque',label:'ATQ',effect:'+1 ATQ.'},
 defense:{name:'Defesa',label:'DEF',effect:'+1 DEF e +2 HP máximo.'},
 agility:{name:'Agilidade',label:'AGI',effect:'+1 AGI e +1 estamina máxima.'},
 dexterity:{name:'Destreza',label:'DEX',effect:'+1 DEX e +0,25 ATQ.'},
 intelligence:{name:'Inteligência',label:'INT',effect:'+1 INT e +5 MP máximo; +0,5 ATQ para Mago, Profeta e Shaman.'},
};
export function attributeBudget(level:number){return (Math.max(1,Math.min(60,Math.floor(Number.isFinite(level)?level:1)))-1)*POINTS_PER_LEVEL;}
export function cleanAttributes(value:unknown,level:number){
 const input=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 let remaining=attributeBudget(level);
 return Object.fromEntries(ATTRIBUTE_KEYS.map(key=>{const v=input[key],amount=typeof v==='number'&&Number.isFinite(v)?Math.min(remaining,Math.max(0,Math.floor(v))):0;remaining-=amount;return [key,amount];})) as Record<AttributeKey,number>;
}
export function attributePoints(hero:Pick<HeroData,'level'|'attributeAllocation'>){return attributeBudget(hero.level)-Object.values(cleanAttributes(hero.attributeAllocation,hero.level)).reduce((a,b)=>a+b,0);}
