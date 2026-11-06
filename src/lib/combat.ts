import type {MonsterKind} from './campaign';
import {INSTANCES} from './instances';
import { ITEMS,stats, type HeroData } from './game';
import { activeEquipment } from './equipment';
import { bandFor,LEVEL_BANDS } from './catalogue';
import { SKILLS,effectiveSkillRank } from './skills';
export function enemyVitals(kind:MonsterKind,level:number,boss=false){
 const resource=kind==='wraith'||kind==='dragon'?'mp' as const:'stamina' as const;
 const resourceMax=Math.round((resource==='mp'?70+level*5:90+level*2)*(boss?1.5:1));
 return {maxHp:Math.round((80+level*28+Math.floor(level/5)*35)*(boss?1.8:1)),resource,resourceCurrent:resourceMax,resourceMax};
}
export interface EnemyState{resource?:'mp'|'stamina';resourceCurrent?:number;resourceMax?:number;instanceId?:"cavern"|"monastery";id:string;name:string;hp:number;maxHp:number;power:number;reward:number;elite:boolean;level?:number;monsterId?:string;bossId?:string;bleed?:{damage:number;turns:number}}
export function resolveCombat(hero:HeroData,enemy:EnemyState,options:{skillId?:string;starter?:boolean;attackBuff?:number;defenseBuff?:number}={}){
 const st=stats(hero),skill=options.skillId?SKILLS[options.skillId]:undefined;const rank=skill?effectiveSkillRank(hero,skill.id):1;
 if(options.skillId&&(!skill||skill.classId!==hero.classId||skill.kind!=='active'||!rank||hero.level<skill.minLevel))return{hero,enemy,error:'Habilidade indisponível',won:false,dead:false,damage:0,received:0};
 const resource=skill?.resource??(options.starter?'mp':'stamina');const cost=skill?.cost??(options.starter?18:9);
 if(hero[resource]<cost)return{hero,enemy,error:resource==='mp'?'MP insuficiente':'Estamina insuficiente',won:false,dead:false,damage:0,received:0};
 const power=st.attack+(options.attackBuff??0);const scale=1+(rank-1)*.14;
 const ranged=hero.classId==='hunter'&&activeEquipment(hero,ITEMS).some(i=>i.category==='weapon');
 const pet=ranged?Math.max(5,st.companion):0;
 const dot=enemy.bleed&&enemy.bleed.turns>0?enemy.bleed.damage:0;
 const damage=Math.max(0,Math.round(power*(skill?skill.damage*scale:options.starter?1.8:1)+pet+dot));
 const hp=Math.max(0,enemy.hp-damage);
 const next={...hero,[resource]:hero[resource]-cost};
 const heal=skill?Math.round(st.maxHp*skill.heal*scale):options.starter&&['paladin','prophet','shaman'].includes(hero.classId)?Math.round(st.maxHp*(hero.classId==='paladin'?.07:.24)):0;
 const steal=Math.floor(damage*st.lifesteal/100);
 const raw=Math.max(3,Math.round(enemy.power-st.defense*.5-(options.defenseBuff??0)-(options.starter&&hero.classId==='hacker'?6:0)));
 const reacts=hp>0&&!skill?.stun;
 const reactionCost=enemy.resource==='mp'?12:8;
 const hasReserve=enemy.resourceCurrent===undefined||enemy.resourceCurrent>=reactionCost;
 const resourceCurrent=!reacts||enemy.resourceCurrent===undefined?enemy.resourceCurrent:hasReserve?enemy.resourceCurrent-reactionCost:Math.min(enemy.resourceMax??100,enemy.resourceCurrent+reactionCost*2);
 const received=!reacts?0:Math.max(0,Math.round(raw*(hasReserve?1:.65)*(1-(skill?.guard??0))));
 next.hp=Math.min(st.maxHp,Math.max(0,next.hp+heal+steal-received));
 if(skill?.restore){next.mp=Math.min(st.maxMp,next.mp+Math.floor(st.maxMp*skill.restore));next.stamina=Math.min(st.maxStamina,next.stamina+Math.floor(st.maxStamina*skill.restore));}
 const bleed=skill?.bleed?{damage:Math.max(1,Math.round(power*skill.bleed*scale)),turns:2}:enemy.bleed&&enemy.bleed.turns>1?{...enemy.bleed,turns:enemy.bleed.turns-1}:undefined;
 return{hero:next,enemy:{...enemy,hp,bleed,resourceCurrent},error:undefined,won:hp===0,dead:next.hp===0,damage,received};
}
export function battleRewards(hero:HeroData,enemy:EnemyState){
 const level=enemy.level??hero.level;const tier=bandFor(level),band=LEVEL_BANDS[tier];const drops:string[]=[];
 for(const kind of ['ore','wood','leather','cloth','crystal','parts']){const count=kind==='ore'||kind==='crystal'?enemy.elite?3:1:((hero.kills+tier)%3===0?1:0);for(let i=0;i<count;i++)drops.push(`mat-${kind}-${band}`);}
 if(enemy.elite||hero.kills%4===3){const pool=Object.values(ITEMS).filter(i=>i.minLevel<=level&&i.minLevel>=band&&i.source!=='trophy'&&i.source!=='chest'&&i.category!=='material'&&i.slot!=='consumable'&&(!i.classId||i.classId===hero.classId)&&(!i.classes||i.classes.includes(hero.classId)));if(pool.length)drops.push(pool[hero.kills%pool.length].id);}
 if(enemy.elite)drops.push(`trophy-${Math.min(7,Math.floor((level-1)/7))}`);
 if(enemy.instanceId&&enemy.instanceId===hero.instance)drops.push(INSTANCES[enemy.instanceId].material);
 const instanceBonus=enemy.instanceId&&enemy.instanceId===hero.instance?2:1;const penalty=level<hero.level-5?.2:1;
 return{xp:Math.max(1,Math.round((25+level*18)*(enemy.elite?2.2:1)*penalty*instanceBonus)),gold:Math.max(1,Math.round((8+level*3)*(enemy.elite?2:1)*penalty)),fragments:enemy.elite?3:1,drops};
}

