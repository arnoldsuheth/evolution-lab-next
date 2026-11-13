import {isCaster,BASIC_ATTACK_COST} from './attributes';
import {NULLARION_SCALE,type MonsterKind} from './campaign';
import {INSTANCES,type InstanceId} from './instances';
import { ITEMS,stats, type HeroData } from './game';
import { activeEquipment, removeItems } from './equipment';
import { bandFor,forgeId,HUNTER_ARROW,LEVEL_BANDS } from './catalogue';
import { SKILLS,classPowerRequirement,effectiveSkillRank } from './skills';
import { ATTACK_RANGE, type CombatAction } from './combatEffects';
import { specOf, SPEC_EFFECT } from './adventure';
export function enemyVitals(kind:MonsterKind,level:number,boss=false){
 const resource=kind==='wraith'||kind==='dragon'?'mp' as const:'stamina' as const;
 const resourceMax=Math.round((resource==='mp'?70+level*5:90+level*2)*(boss?1.5:1));
 return {maxHp:Math.round((80+level*28+Math.floor(level/5)*35)*(boss?1.8:1)),resource,resourceCurrent:resourceMax,resourceMax};
}
/** Poderes dos monstros: aplicados no herói por algumas rodadas. */
export type HeroStatus={kind:'poison'|'slow'|'freeze'|'burn';turns:number;damage:number};
export const MONSTER_POWER:Record<MonsterKind,{name:string;kind:HeroStatus['kind']|'charge';every:number}>={spider:{name:'Picada venenosa',kind:'poison',every:3},wolf:{name:'Mordida que atrasa',kind:'slow',every:3},golem:{name:'Golpe de pedra',kind:'slow',every:4},wraith:{name:'Toque congelante',kind:'freeze',every:3},dragon:{name:'Sopro de fogo',kind:'burn',every:3},boar:{name:'Investida',kind:'charge',every:3},stag:{name:'Golpe de galhada',kind:'charge',every:4},frostcat:{name:'Garras da geada',kind:'freeze',every:4},beetle:{name:'Mordida corrosiva',kind:'poison',every:4},basilisk:{name:'Olhar petrificante',kind:'slow',every:3}};
export const STATUS_NAMES:Record<HeroStatus['kind'],string>={poison:'Envenenado',slow:'Lento',freeze:'Congelado',burn:'Queimando'};
export interface EnemyState{kind?:MonsterKind;turn?:number;heroStatus?:HeroStatus;resource?:'mp'|'stamina';resourceCurrent?:number;resourceMax?:number;instanceId?:InstanceId;id:string;name:string;hp:number;maxHp:number;power:number;reward:number;elite:boolean;level?:number;monsterId?:string;position?:[number,number];bossId?:string;bleed?:{damage:number;turns:number};phase?:2;rare?:number}
export function basicAttack(hero: HeroData) {
 const gear=activeEquipment(hero,ITEMS);
 const weapon=gear.find(item=>item.slot==='weapon'||item.slot==='twohand');
 const bow=weapon?.visual==='bow';
 const caster=!!weapon&&isCaster(hero.classId)&&!classPowerRequirement(hero);
 const ranged=caster||hero.classId==='hunter'&&!!weapon;
 const resource=caster?'mp':'stamina';
 return { weapon,bow,range:ranged?ATTACK_RANGE[hero.classId]:4,resource,cost:BASIC_ATTACK_COST[resource] } as const;
}
export function attackRange(hero: HeroData, action?: CombatAction) {
 return action?.kind==='power'&&!classPowerRequirement(hero)
  || action?.kind==='skill'&&action.skill&&effectiveSkillRank(hero,action.skill)>0
  ? ATTACK_RANGE[hero.classId] : basicAttack(hero).range;
}
export function resolveCombat(hero:HeroData,enemy:EnemyState,options:{skillId?:string;starter?:boolean;attackBuff?:number;defenseBuff?:number;criticalRoll?:number}={}){
 const st=stats(hero),skill=options.skillId?SKILLS[options.skillId]:undefined;const rank=skill?effectiveSkillRank(hero,skill.id):1;
 if(options.skillId&&(!skill||skill.classId!==hero.classId||skill.kind!=='active'||!rank||hero.level<skill.minLevel))return{hero,enemy,error:'Habilidade indisponível',won:false,dead:false,damage:0,received:0};
 const powerLock=options.starter?classPowerRequirement(hero):undefined;
 if(powerLock)return{hero,enemy,error:powerLock,won:false,dead:false,damage:0,received:0};
 const basic=basicAttack(hero),normal=!skill&&!options.starter;
 const resource=skill?.resource??(options.starter?'mp':basic.resource);
 const cost=skill?.cost??(options.starter?18:basic.cost);
 const inventory=normal&&basic.bow?removeItems(hero.inventory,{[HUNTER_ARROW]:1}):hero.inventory;
 if(!inventory)return{hero,enemy,error:'Sem flechas. Reponha a munição ou desequipe o arco.',won:false,dead:false,damage:0,received:0};
 if(hero[resource]<cost)return{hero,enemy,error:resource==='mp'?'MP insuficiente':'Estamina insuficiente',won:false,dead:false,damage:0,received:0};
 const power=st.attack+(options.attackBuff??0);const scale=1+(rank-1)*.14;
 const pet=st.companion;
 const dot=enemy.bleed&&enemy.bleed.turns>0?enemy.bleed.damage:0;
 // Lento ou congelado: o herói bate mais fraco enquanto o efeito durar.
 const status=enemy.heroStatus&&enemy.heroStatus.turns>0?enemy.heroStatus:undefined,weaken=status?.kind==='freeze'?.5:status?.kind==='slow'?.75:1;
 const spec=specOf(hero),specFx=spec?SPEC_EFFECT[spec.style]:undefined;
 const critical=(options.criticalRoll??1)<Math.min(.25,.05+st.dexterity*.002);
 const damage=Math.max(0,Math.round((power*(skill?skill.damage*scale:options.starter?1.8*(specFx?.powerDamage??1):1)+pet)*weaken*(critical?1.5:1)+dot));
 const hp=Math.max(0,enemy.hp-damage);
 const next={...hero,inventory,[resource]:hero[resource]-cost};
 const heal=(skill?Math.round(st.maxHp*skill.heal*scale):options.starter&&['paladin','prophet','shaman'].includes(hero.classId)?Math.round(st.maxHp*(hero.classId==='paladin'?.07:.24)):0)+(options.starter&&specFx?Math.round(st.maxHp*specFx.powerHeal):0);
 // Chefes e raros têm duas fases: abaixo da metade da vida, ficam furiosos (batem 30% mais e usam o poder mais vezes).
 const enraged=enemy.phase===2,phaseChange=!!enemy.elite&&!enraged&&hp>0&&hp<=enemy.maxHp/2;
 const steal=Math.floor(damage*st.lifesteal/100);
 const raw=Math.max(3,Math.round((enraged?1.3:1)*enemy.power-st.defense*.5-(options.defenseBuff??0)-(options.starter&&hero.classId==='hacker'?6:0)));
 const reacts=hp>0&&!skill?.stun;
 const reactionCost=enemy.resource==='mp'?12:8;
 const hasReserve=enemy.resourceCurrent===undefined||enemy.resourceCurrent>=reactionCost;
 const resourceCurrent=!reacts||enemy.resourceCurrent===undefined?enemy.resourceCurrent:hasReserve?enemy.resourceCurrent-reactionCost:Math.min(enemy.resourceMax??100,enemy.resourceCurrent+reactionCost*2);
 // A cada algumas reações, se tiver reserva, o monstro usa o poder da espécie.
 const turn=(enemy.turn??0)+(reacts?1:0),power2=enemy.kind?MONSTER_POWER[enemy.kind]:undefined,special=!!(reacts&&power2&&hasReserve&&turn%(enraged?2:power2.every)===0);
 const ticking=status&&(status.kind==='poison'||status.kind==='burn')?status.damage:0;
 const received=(!reacts?0:Math.max(0,Math.round(raw*(hasReserve?1:.65)*(1-(skill?.guard??0))*(special&&power2?.kind==='charge'?1.6:1))))+ticking;
 const heroStatus:HeroStatus|undefined=special&&power2&&power2.kind!=='charge'?{kind:power2.kind,turns:power2.kind==='freeze'?1:power2.kind==='slow'?2:3,damage:power2.kind==='burn'?Math.max(3,Math.round(raw*.45)):power2.kind==='poison'?Math.max(2,Math.round(raw*.3)):0}:status&&status.turns>1?{...status,turns:status.turns-1}:undefined;
 next.hp=Math.min(st.maxHp,Math.max(0,next.hp+heal+steal-received));
 if(skill?.restore){next.mp=Math.min(st.maxMp,next.mp+Math.floor(st.maxMp*skill.restore));next.stamina=Math.min(st.maxStamina,next.stamina+Math.floor(st.maxStamina*skill.restore));}
 const bleed=skill?.bleed?{damage:Math.max(1,Math.round(power*skill.bleed*scale)),turns:2}:enemy.bleed&&enemy.bleed.turns>1?{...enemy.bleed,turns:enemy.bleed.turns-1}:undefined;
 return{hero:next,companionStrike:pet>0,basicEffect:normal?(basic.bow?'arrow':basic.weapon?'slash':'punch') as 'arrow'|'slash'|'punch':undefined,enemy:{...enemy,hp,bleed,resourceCurrent,turn,heroStatus:hp>0?heroStatus:undefined,...(enraged||phaseChange?{phase:2 as const}:{})},phaseChange,error:undefined,won:hp===0,dead:next.hp===0,damage,received,critical,enemySkill:special&&power2?power2.name:undefined,enemyPower:special&&power2?power2.kind:undefined};
}
/** QA26: chance de o equipamento que cai vir Épico ou Mítico. Elite, raro e chefe dão chances maiores. */
export const DROP_RARITY={normal:{mitico:.01,epico:.1},elite:{mitico:.05,epico:.3},boss:{mitico:.15,epico:.6}} as const;
export function dropRarity(enemy:Pick<EnemyState,'elite'|'bossId'|'rare'>,roll:number):'comum'|'epico'|'mitico'{
 const odds=DROP_RARITY[enemy.bossId?'boss':enemy.elite||enemy.rare!==undefined?'elite':'normal'];
 return roll<odds.mitico?'mitico':roll<odds.epico?'epico':'comum';
}
/** Versão do item na raridade sorteada (as versões Épica e Mítica são as mesmas do ferreiro). */
export function withRarity(id:string,tier:'comum'|'epico'|'mitico'){return tier!=='comum'&&ITEMS[forgeId(id,tier)]?forgeId(id,tier):id;}
/** Melhor raridade entre os itens recebidos, para o feixe de luz e o aviso de loot. */
export function lootHighlight(items:string[]):'epico'|'mitico'|null{const r=items.map(id=>ITEMS[id]?.rarity);return r.includes('Mítico')?'mitico':r.includes('Épico')?'epico':null;}
export function battleRewards(hero:HeroData,enemy:EnemyState,rarityRoll=1){
 const level=enemy.level??hero.level;const tier=bandFor(level),band=LEVEL_BANDS[tier];const drops:string[]=[];
 for(const kind of ['ore','wood','leather','cloth','crystal','parts']){const count=kind==='ore'||kind==='crystal'?enemy.elite?3:1:((hero.kills+tier)%3===0?1:0);for(let i=0;i<count;i++)drops.push(`mat-${kind}-${band}`);}
 if(hero.classId==='hunter')drops.push(...Array<string>(4).fill(HUNTER_ARROW));
 if(enemy.elite||hero.kills%4===3){const pool=Object.values(ITEMS).filter(i=>i.minLevel<=level&&i.minLevel>=band&&i.source!=='trophy'&&i.source!=='chest'&&i.source!=='forge'&&i.category!=='material'&&i.slot!=='consumable'&&(!i.classId||i.classId===hero.classId)&&(!i.classes||i.classes.includes(hero.classId)));if(pool.length)drops.push(withRarity(pool[hero.kills%pool.length].id,dropRarity(enemy,rarityRoll)));}
 if(enemy.bossId==='boss-master'&&!hero.inventory.includes(NULLARION_SCALE))drops.push(NULLARION_SCALE);
 if(enemy.elite)drops.push(`trophy-${Math.min(7,Math.floor((level-1)/7))}`);
 if(enemy.instanceId&&enemy.instanceId===hero.instance)drops.push(INSTANCES[enemy.instanceId].material);
 const instanceBonus=enemy.instanceId&&enemy.instanceId===hero.instance?2:1;const penalty=level<hero.level-5?.2:1;
 return{xp:Math.max(1,Math.round((25+level*18)*(enemy.elite?2.2:1)*penalty*instanceBonus)),gold:Math.max(1,Math.round((30+level*12)*(enemy.elite?2:1)*penalty)),fragments:enemy.elite?3:1,drops};
}

