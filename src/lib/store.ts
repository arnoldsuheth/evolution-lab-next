"use client";
import { cityMarket, marketOpen, marketStocks, type MarketStall } from './cityMarket';
import {FLYING_MOUNTS,FLYING_MOUNT_PRICE,MOUNT_VENDOR,type FlyingMountId} from "./flyingMounts";
import {RACE_CLASSES} from "./game";
import {isNewCity,isRacialCity,CITY_BANK,GODDARD_BOOLE,CITY_FORGE,CITY_WAGON,CITY_SPAWN,RACIAL_CITIES,trainerPosition,cityForRace,goddardExit,cityPortal,type RacialCity} from "./kingdomCities";
import { discoveryIn, discoveryDistance, DISCOVERY_OPEN_RANGE, DISCOVERY_REVEAL_RANGE } from "./discoveries";
import {monsterPoint} from "./patrols";
import {walkable} from "./navigation";
import { roadArrival, roadAt } from "./overland";
import { ORE_VEINS, PICKAXE_ID } from './mining';
import { canStoreInventory } from './bags';
import "./testNamespace";
import { CHAMBER_CHALLENGE, cleanLovelaceProgress, evaluateLovelace, hasAllArtifacts, LOVELACE_POSITION } from "./precursors";
import { CHAMBER_POSITION, PRECURSORS, type PrecursorId } from "./precursorCatalog";
import { dogFood, feedDog as feedDogRule, TREAT_PRICE, hasDogJoy, DOG_NAME } from './dog';
import {ATTRIBUTE_KEYS,attributePoints,cleanAttributes,type AttributeKey} from "./attributes";
import {packCharacters,selectCharacter,deleteCharacter} from './characterSlots';
import {INSTANCES,instanceRequirement,type InstanceId} from "./instances";
import {PROFESSIONS,repairCost,forgeCost,currency,type Profession} from "./economy";
import {forgeStep,forgeId,bandFor,LEVEL_BANDS} from "./catalogue";
import {recoverResources} from "./recovery";
import { HOTBAR_SIZE } from './controls';
import {MONSTERS,REGIONS,SAFE_TOWN_RADIUS,campaignGate,regionRequirement,monsterRequirement,type RegionId} from "./campaign";
import { specOf, SPEC_FX, WOLF_FORM_LEVEL, adventureOf, ensureDaily, progressDaily, dailyWants, dailyReward, DAILY_POOL, HEARTH_MS, accrueRest, restBonus, addRep, factionOf, repPercent, discounted, newAchievements, unlockedPets, SPECS, SPEC_LEVEL, specChangeCost, rareNow, MOUNT_LEVEL, MOUNTS, mountAvailable, mountOf, type MountId, type PetId } from "./adventure";
import { DOORS, doorBetween, tryDoor } from "./dungeon";
import { CODE_SPOTS, spotAvailable } from "./codeSpots";
import { friendlyLock } from "./apprentice";
import { AI_COURSE, CHESTS, aiRequirement, travelerFor, pendingDelivery, makeChallenge, mainRequirement, projectRequirement, promotionRequirement, promotionRank, type Challenge } from "./journey";
import { create } from "zustand";
import { deposit as bankDeposit, withdraw as bankWithdraw } from "./bank";
import { WAGON_PRICE, WAGON_STOP_RADIUS } from "./wagon";
import { PRACTICE_CONCEPTS, nextMastery, BLITZ_PASS, dayKey, blitzReward, battleBuff, BATTLE_COOLDOWN_MS, BATTLE_MISS_COOLDOWN_MS, BATTLE_BUFF_SECONDS } from "./practice";
import { persist } from "zustand/middleware";
import { SKILLS, classPowerRequirement, skillRank, skillRequirement, passiveBonuses } from "./skills";
import { isEquipment, itemRequirement, removeItems, countItem } from "./equipment";
import { attackRange, enemyVitals, resolveCombat, battleRewards, STATUS_NAMES, COMBO_WINDOW_MS, COMBO_BONUS, SUPREMO_MAX, SUPREMO_MULT, supremoGain, type EnemyState } from "./combat";
import { hitWeight, type HitTier } from "./impact";
import { type CombatAction, type EffectKind } from "./combatEffects";
import { NEXUS_SECONDS, cleanNexus, nexusFull } from "./nexus";
import { QUESTS, GATHER_NODES, GATHER_RESPAWN_MS, MONSTER_RESPAWN_MS, acceptQuest as acceptLog, progressQuests, turnInQuest as turnInLog, cleanLog, goal, type QuestEvent } from "./quests";
import { CLASSES, ITEMS, LESSONS, evaluateLesson, freshHero, freshSave, grantStarterGear, migrateSave, stats, withXp, type SaveData, type ClassId, type Look, type Settings, type Race, validRaceClass, raceForClass } from "./game";
/** Serviços da vila (banco, carroça): só dentro da Pedra da Aurora, fora de masmorra. */
const atForge=(hero:{instance?:string|null;region:RegionId;position:[number,number]})=>!hero.instance&&(hero.region==='aurora'
  ?Math.hypot(hero.position[0]+7,hero.position[1])<=8
  :isRacialCity(hero.region)&&Math.hypot(hero.position[0]-CITY_FORGE[0],hero.position[1]-CITY_FORGE[1])<=4);
const atTownService=(hero:{region:string;instance?:string|null;position:[number,number]})=>!hero.instance&&(hero.region==='aurora'?Math.hypot(...hero.position)<=SAFE_TOWN_RADIUS+4:isNewCity(hero.region)&&hero.region!=='goddard'&&Math.hypot(hero.position[0]-CITY_BANK[0],hero.position[1]-CITY_BANK[1])<=4);
/** Sentar multiplica a recuperação natural fora de combate. */
export const SIT_REGEN=3;
export const SAVE_KEY = "genesis-reborn-rpg-v3";
export const BACKUP_KEY = SAVE_KEY + "-before-lions-cave-1.3.1";
let blocked = false; let storageIssue = ""; let snapshotAt = 0;
export function checkEnvelope(raw: string): { state: unknown; version: number } {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || !("state" in value)) throw new Error("Formato desconhecido. O original foi preservado.");
  const e = value as { state: unknown; version?: number };
  if (![0, 1, 2, 3, 4].includes(e.version ?? 0)) throw new Error("Save de versão diferente. Exporte o original para recuperação.");
  if (!e.state || typeof e.state !== "object" || !("hero" in e.state)) throw new Error("Personagem inválido. O original foi preservado.");
  const hero = (e.state as { hero: unknown }).hero;
  if (!hero || typeof hero !== "object" || Array.isArray(hero)) throw new Error("Estrutura do personagem inválida. O original foi preservado.");
  return { state: e.state, version: e.version ?? 0 };
}
const guardedStorage = {
  getItem: (name: string) => {
    try { const raw = localStorage.getItem(name); if (raw) { const envelope=checkEnvelope(raw); const priorKey=SAVE_KEY+"-before-1.4.0"; if(envelope.version<3&&!localStorage.getItem(priorKey))localStorage.setItem(priorKey,raw); const upgradeKey=SAVE_KEY+"-before-1.5.0"; if(envelope.version<4&&!localStorage.getItem(upgradeKey))localStorage.setItem(upgradeKey,raw); if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, raw); } return raw; }
    catch (e) { blocked = true; storageIssue = e instanceof Error ? e.message : "Armazenamento indisponível."; throw e; }
  },
  setItem: (name: string, value: string) => {
    if (blocked) return;
    try { if (Date.now() - snapshotAt > 60000) { const old = localStorage.getItem(name); if (old) localStorage.setItem(name + "-recovery", old); snapshotAt = Date.now(); } localStorage.setItem(name, value); }
    catch { blocked = true; storageIssue = "Armazenamento cheio ou indisponível. Exporte sua jornada antes de sair."; }
  },
  removeItem: () => { throw new Error("Exclusão automática de saves desativada."); },
};
export type Encounter = EnemyState;
interface GameStore extends SaveData {
  enterInstance:(id:InstanceId)=>void;leaveInstance:()=>void; repair:()=>void;learnProfession:(id:Profession)=>void; bindAction:(id:string,slot:number)=>void; relocation:number; mounted:boolean; /** Sentado: recupera HP, MP e vigor 3x mais rápido fora de combate. */ sitting:boolean; /** Caminhar (mais devagar) em vez de correr. */ walking:boolean; toggleSit:()=>void; toggleWalk:()=>void; toggleMount:()=>void; /** Shaman nível 10+: forma de lobo espiritual (corre mais rápido). */ wolfForm:boolean; toggleWolf:()=>void; chooseMount:(id:MountId)=>void; buyFlyingMount:(id:FlyingMountId)=>void; trainClass:(id:ClassId)=>void;
  ready: boolean; saveError: string; notice: string; encounter: Encounter | null; buff: number; lastAttack: number; cooldowns: Record<string,number>; now: number; effects: {kind:string;amount:number;remaining:number}[];
  openDiscovery:()=>void;
  /** 5.0: barra do Golpe Supremo (0–100, só na sessão) e a última habilidade usada (para o Combo). */
  supremo:number; lastSkill:{id:string;time:number}|null;
  lootEvent?:{time:number;xp:number;gold:number;items:string[]};
  battleEvent:{combo?:boolean;supremo?:boolean;weight?:HitTier;critical?:boolean;companionStrike?:boolean;time:number;damage:number;received:number;x:number;z:number;tone:string;kind:"attack"|"power"|"skill";basicEffect?:EffectKind;classId:ClassId;skill?:string;hx:number;hz:number;won?:boolean;enemySkill?:string;enemyPower?:string}|null;
  /** Monstros vencidos voltam depois de um tempo; pontos de coleta também (só durante a sessão). */
  slain:Record<string,number>; gathered:Record<string,number>;
  /** Monstro selecionado com um clique e a ação esperando o herói chegar ao alcance. */
  submitPrecursor: (id: PrecursorId, step: number, answer: number) => string | null;
  submitChamber: (answer: number) => string | null;
  submitLovelace: (step: number, submission: string | number) => string | null;
  deleteCharacter:(slot:number)=>boolean; upgradeItem:(id:string)=>void; claimNexus:()=>void;
  target:string|null; queued:CombatAction|null; setTarget:(id:string|null)=>void; act:(action:CombatAction)=>void;
  acceptQuest:(id:string)=>void; turnInQuest:(id:string)=>void; questEvent:(event:QuestEvent)=>void; gather:(id:string)=>void;
  challenge: Challenge|null;
  /** 1.10: missões do dia, pedra de retorno, especialização, títulos, mascotes e portas de código. */
  claimDaily:(index:number)=>void; buildSpot:(id:string)=>{ok:boolean;message:string}; feedDog:(kind:'food'|'treat')=>{ok:boolean;message:string}; hearth:()=>void; chooseSpec:(id:string)=>void; setTitle:(id:string)=>void; setPet:(id:string)=>void; openDoor:(id:string,code:string)=>ReturnType<typeof tryDoor>; rareSeen:number;restPending:number;
  beginPromotion:()=>void; beginChest:(id:string)=>void; beginAI:(id:string)=>void; answerChallenge:(answer:string)=>void; cancelChallenge:()=>void;
  deliverQuest:(kind:"main"|"ai")=>void;
  draftAI:(id:string,code:string)=>void; reviewProject:(index:number)=>void;
  hydrate: () => Promise<void>;
  selectCharacter: (slot:number)=>boolean;
  createCharacter: (name: string, classId: ClassId, mode: "normal" | "hardcore", race?: Race) => void;
  customize: (look: Partial<Look>) => void; chooseClass: (id: ClassId, race?: Race) => void; move: (p: [number, number]) => void;
  /** Treino rápido (missão relâmpago e perguntas de batalha). */
  bankDeposit:(amount:number)=>void; bankWithdraw:(amount:number)=>void; wagonTravel:(region:RegionId)=>void; skyTravel:(region:RacialCity|"goddard")=>void; overlandTravel:(region:RacialCity)=>void;
  practiceAnswer:(concept:string,correct:boolean)=>void; finishBlitz:(concept:string,score:number)=>{xp:number;gold:number}|null; battleInsight:(correct:boolean)=>void;
  draft: (id: string, code: string) => void; solve: (id: string, code: string) => ReturnType<typeof evaluateLesson>; project: (id: string, code: string) => void;
  allocateAttribute:(key:AttributeKey)=>void;
  buy: (id: string, market?: MarketStall) => void; equip: (id: string) => void; useItem: (id: string) => void; craft: (id: string) => void; talent: (branch: number) => void;
  startEncounter: (elite?: boolean, level?: number, monsterId?:string, action?:CombatAction) => void; travelRegion:(region:RegionId)=>void; attack: (skill?: boolean) => void; flee: () => void; rest: () => void; tick: (seconds: number) => void;
  sell: (id: string) => void; learnSkill: (id:string) => void; bindSkill: (id:string,slot?:number) => void; respec: () => void; castSkill: (id:string) => void;
  setting: (v: Partial<Settings>) => void; restore: (raw: string) => void; clearNotice: () => void;
}
let saveInputs:unknown[]=[];let cachedSave:SaveData|undefined;
export function savedState(s:SaveData):SaveData{const inputs=[s.hero,s.look,s.education,s.ancestors,s.settings,s.legacy];if(cachedSave&&inputs.every((v,i)=>v===saveInputs[i]))return cachedSave;saveInputs=inputs;cachedSave={hero:s.hero,look:s.look,education:s.education,ancestors:s.ancestors,settings:s.settings,legacy:packCharacters(s).legacy};return cachedSave;}
let lastWritten:SaveData|undefined;
const optimizedStorage={getItem:(name:string)=>{const raw=guardedStorage.getItem(name);return raw?JSON.parse(raw):null;},setItem:(name:string,value:{state:SaveData;version?:number})=>{if(value.state===lastWritten)return;guardedStorage.setItem(name,JSON.stringify(value));if(!blocked)lastWritten=value.state;},removeItem:()=>guardedStorage.removeItem()};
/** Cloud replaces a chosen snapshot. Unlike file import, it must not merge different accounts. */
export function replaceFromCloud(snapshot:SaveData,backup:boolean){
 const raw=JSON.stringify({state:snapshot,version:4});checkEnvelope(raw);
 const next=migrateSave(snapshot);
 if(backup){const previous=localStorage.getItem(SAVE_KEY);if(previous)localStorage.setItem(SAVE_KEY+'-before-cloud-'+Date.now(),previous);}
 blocked=false;storageIssue='';
 useGame.setState({...next,ready:true,encounter:null,challenge:null,battleEvent:null,supremo:0,lastSkill:null,cooldowns:{},lastAttack:0,effects:[],buff:0,saveError:''});
 if(blocked)throw Error(storageIssue);
}
function executeBattle(id:string|undefined,starter:boolean,set:(value:Partial<GameStore>)=>void,get:()=>GameStore){
 const s=get(),enemy=s.encounter!,t0=Date.now();
 // 5.0: Combo = habilidade diferente da anterior dentro da janela; Supremo = poder com a barra cheia.
 const combo=!!id&&!!s.lastSkill&&s.lastSkill.id!==id&&t0-s.lastSkill.time<=COMBO_WINDOW_MS,supremo=starter&&s.supremo>=SUPREMO_MAX;
 const result=resolveCombat(s.hero,enemy,{skillId:id,starter,damageMult:(combo?COMBO_BONUS:1)*(supremo?SUPREMO_MULT:1),criticalRoll:Math.random(),attackBuff:s.effects.filter(e=>e.kind==='attack').reduce((n,e)=>n+e.amount,0),defenseBuff:(s.buff>0?5:0)+s.effects.filter(e=>e.kind==='defense').reduce((n,e)=>n+e.amount,0)});
 if(result.error){set({notice:result.error});return;}
 result.hero={...result.hero,durability:{...result.hero.durability,...Object.fromEntries(s.hero.equipped.filter(id=>ITEMS[id]&&ITEMS[id].slot!=="pet").map(id=>[id,Math.max(0,(s.hero.durability?.[id]??100)-1)]))}};
 const target=MONSTERS.find(m=>m.id===enemy.monsterId);
 const kindNow=(id?'skill':starter?'power':'attack') as 'attack'|'power'|'skill',supremoNext=supremo?0:Math.min(SUPREMO_MAX,s.supremo+supremoGain(kindNow,!!result.critical));
 const specElement=specOf(s.hero)?.element,specFx=specElement?SPEC_FX[specElement]:undefined;
 const feedback={supremo:supremoNext,lastSkill:id?{id,time:t0}:s.lastSkill,battleEvent:{combo,supremo,weight:hitWeight({damage:result.damage,maxHp:enemy.maxHp,critical:!!result.critical,kind:id?'skill':starter?'power':'attack',won:result.won}),critical:!!result.critical,companionStrike:!!target&&result.companionStrike,time:Date.now(),damage:result.damage,received:result.received,x:enemy.position?.[0]??target?.x??s.hero.position[0],z:enemy.position?.[1]??target?.z??s.hero.position[1],tone:starter&&specFx?specFx.tone:id||starter?CLASSES[s.hero.classId].color:'#efd49a',kind:(id?'skill':starter?'power':'attack') as 'attack'|'power'|'skill',classId:s.hero.classId,basicEffect:starter&&specFx?specFx.effect:result.basicEffect,skill:id,hx:s.hero.position[0],hz:s.hero.position[1],won:result.won,enemySkill:result.enemySkill,enemyPower:result.enemyPower}};
 const skillBuff=id?SKILLS[id].buff:undefined;
 const effects=skillBuff?[...s.effects.filter(e=>e.kind!==skillBuff.kind),{kind:skillBuff.kind,amount:Math.round(skillBuff.amount*(1+(skillRank(s.hero,id!)-1)*.14)),remaining:skillBuff.duration}]:s.effects;
 const now=Date.now(),cooldowns={...s.cooldowns,...(id?{[id]:now+SKILLS[id].cooldown*1000}:{})};
 if(result.won){const reward=battleRewards(s.hero,enemy,Math.random());let adv=accrueRest(currentAdventure(s),s.hero.level,s.restPending);const site=discoveryIn(s.hero.region);if(site?.guard&&site.guard===target?.id&&adv.discoveries[site.id]!=='claimed')adv={...adv,discoveries:{...adv.discoveries,[site.id]:'cleared'}};const kind=target?.kind??enemy.kind;if(kind)adv=progressDaily({...adv,kinds:{...adv.kinds,[kind]:(adv.kinds[kind]??0)+1}},{type:'kill',kind});const rested=restBonus(adv,reward.xp),rare=enemy.rare!==undefined,gold=reward.gold*(rare?2:1);adv={...adv,rested:adv.rested-rested,...(rare?{rares:adv.rares+1,rareDone:enemy.rare}:{})};const hunted=target?progressQuests(cleanLog(s.hero.quests),{type:'kill',kind:target.kind,id:target.id}):null;const questNote=hunted?.changed.map(qid=>{const q=QUESTS.find(q=>q.id===qid)!,p=hunted.log.active[qid];return q.objectives.map((o,i)=>o.type==='kill'?` · ${o.label}: ${p[i]}/${goal(o)}`:'').join('');}).join('')??'';const slain=target&&!target.boss&&!target.instance?{...s.slain,[target.id]:Date.now()+MONSTER_RESPAWN_MS}:s.slain;const trial=s.hero.classTrial;const classTrial=trial&&target&&!target.instance&&target.level<=3&&target.region===cityForRace(s.hero.race)?{...trial,kills:Math.min(3,trial.kills+1)}:trial;const inventory=[...result.hero.inventory],accepted:string[]=[];for(const drop of reward.drops){const item=ITEMS[drop];if(item&&countItem(inventory,drop)<item.maxStack){inventory.push(drop);accepted.push(drop);}}set({...feedback,lootEvent:{time:now,xp:reward.xp+rested,gold,items:accepted},hero:{...withXp(result.hero,reward.xp+rested),classTrial,gold:result.hero.gold+gold,materials:result.hero.materials+reward.fragments+(rare?4:0),instanceProgress:enemy.instanceId?[...new Set([...(result.hero.instanceProgress??[]),enemy.monsterId!])]:result.hero.instanceProgress,kills:result.hero.kills+1,defeatedBosses:enemy.bossId?[...new Set([...result.hero.defeatedBosses,enemy.bossId])]:result.hero.defeatedBosses,inventory,quests:hunted?.log??result.hero.quests,adventure:adv},slain,restPending:0,target:null,queued:null,encounter:null,cooldowns,effects,now,lastAttack:now,notice:`${rare?'✦ Monstro raro vencido! ':''}${rested?`💤 XP descansado: +${rested}. `:''}${questNote}`.trim()});return;}
 if(result.dead&&s.hero.mode==='hardcore'){const h=result.hero;const ancestor={id:h.id,name:h.name,classId:h.classId,level:h.level,diedAt:now,cause:enemy.name,legacy:Math.min(100,Math.max(0,Math.floor((h.xp-h.inherited)*.15))),claimed:false};set({...feedback,target:null,queued:null,hero:{...h,hp:0,dead:true},ancestors:s.ancestors.some(a=>a.id===h.id)?s.ancestors:[...s.ancestors,ancestor],encounter:null,cooldowns,effects,now,lastAttack:now,notice:'Aventura encerrada. Educação e portfólio preservados.'});return;}
 if(result.dead){if(hasDogJoy(result.hero)){set({...feedback,target:null,queued:null,hero:{...result.hero,hp:Math.round(stats(result.hero).maxHp*.5)},encounter:null,cooldowns,effects,now,lastAttack:now,notice:`🐕 ${DOG_NAME} latiu e te pôs de pé! Alegria do Caramelo: você voltou aqui mesmo.`});return;}set({...feedback,target:null,queued:null,hero:{...result.hero,hp:Math.round(stats(result.hero).maxHp*.6),instance:null,region:"aurora",position:[0,5]},encounter:null,cooldowns,effects,now,lastAttack:now,notice:'Lion levou você à vila. Seu progresso foi preservado.'});return;}
 set({...feedback,hero:result.hero,encounter:result.enemy,cooldowns,effects,now,lastAttack:now,notice:('phaseChange' in result&&result.phaseChange?`⚠ Fase 2! ${enemy.name} ficou furioso: bate mais forte e usa o poder mais vezes. `:'')+(result.enemySkill?`${enemy.name} usou ${result.enemySkill}!${result.enemy.heroStatus?` Você está ${STATUS_NAMES[result.enemy.heroStatus.kind].toLowerCase()}.`:''}`:'')});
}
/** Aventura com as missões de hoje já sorteadas (sem gravar nada a cada segundo). */
export const currentAdventure=(s:{hero:SaveData["hero"];education:{completed:string[]}})=>ensureDaily(adventureOf(s.hero),Date.now(),s.hero.id,s.hero.level,s.education.completed);
function nearLegacySite(state: GameStore, site: { x: number; z: number }) {
  const { hero } = state;
  return state.ready && !state.saveError && !hero.dead && !state.encounter && !state.challenge
    && !hero.instance && hero.region === "aurora"
    && Math.hypot(hero.position[0] - site.x, hero.position[1] - site.z) <= 3.7;
}
export const useGame = create<GameStore>()(persist<GameStore, [], [], SaveData>((set, get) => ({
  ...freshSave(), rareSeen:0, restPending:0, relocation:0,mounted:false,wolfForm:false,sitting:false,walking:false, battleEvent:null, supremo:0, lastSkill:null, slain:{}, gathered:{}, target:null, queued:null, challenge:null, ready: false, saveError: "", notice: "", encounter: null, buff: 0, lastAttack: 0, cooldowns: {}, now: 0, effects: [],
  enterInstance:id=>{const s=get();if(s.encounter||s.challenge||s.hero.instance)return;const reason=instanceRequirement(s.hero,s.education.completed,id);if(reason){set({notice:reason});return;}const place=INSTANCES[id];if(Math.hypot(s.hero.position[0]-place.x,s.hero.position[1]-place.z)>4.5){set({notice:'Aproxime-se da entrada para entrar.'});return;}set({mounted:false,relocation:s.relocation+1,hero:{...s.hero,instance:id,instanceProgress:[],position:[0,8]},notice:place.name+' · inimigos mais fortes, XP dobrado. Use a saída ao sul para retornar.'});},
  leaveInstance:()=>{const s=get(),id=s.hero.instance;if(!id||s.encounter||s.challenge||s.hero.dead)return;if(Math.hypot(s.hero.position[0],s.hero.position[1]-10)>4.5){set({notice:'A saída fica ao sul da instância.'});return;}const place=INSTANCES[id];set({mounted:false,relocation:s.relocation+1,hero:{...s.hero,instance:null,position:[place.x,place.z+2]},notice:'Você retornou da expedição.'});},
  repair:()=>{const s=get();if(s.hero.dead||s.encounter||!atForge(s.hero)){set({notice:'Procure Babbage na vila para reparar.'});return;}const fee=discounted(repairCost(s.hero.equipped,s.hero.durability??{},ITEMS),repPercent(adventureOf(s.hero),'ferreiros'));if(!fee||s.hero.gold<fee)return;set({hero:{...s.hero,gold:s.hero.gold-fee,durability:{...s.hero.durability,...Object.fromEntries(s.hero.equipped.map(id=>[id,100]))}},notice:'Equipamento reparado.'});},
  learnProfession:id=>{const s=get();if(!Object.hasOwn(PROFESSIONS,id)||s.hero.dead||s.encounter||s.hero.gold<20||s.hero.professions?.[id]||!atForge(s.hero))return;set({hero:{...s.hero,gold:s.hero.gold-20,professions:{...s.hero.professions,[id]:1}},notice:'Ofício aprendido: '+PROFESSIONS[id]});},
  trainClass:id=>{
    const s=get(),h=s.hero,city=h.region;
    if(h.dead||h.instance||s.encounter||s.challenge||!isRacialCity(city)||RACIAL_CITIES[city].race!==h.race)return;
    const index=RACE_CLASSES[h.race].indexOf(id),spot=trainerPosition(city,index);
    if(index<0||!spot||Math.hypot(h.position[0]-spot[0],h.position[1]-spot[1])>3.6)return;
    if(h.classInitiated!==false){set({notice:`Caminho de ${CLASSES[h.classId].name} já iniciado.`});return;}
    if(h.classTrial?.id===id&&h.classTrial.kills>=3){
      const hero=grantStarterGear({...h,classId:id,classTrial:undefined,classInitiated:true,hotbar:[],skills:{},talents:[0,0,0]});
      set({hero:{...hero,equipped:hero.equipped.filter(item=>!ITEMS[item]||!itemRequirement(hero,ITEMS[item])),hp:Math.min(h.hp,stats(hero).maxHp),mp:Math.min(h.mp,stats(hero).maxMp)},notice:`Classe liberada: ${CLASSES[id].name}.`});return;
    }
    if(h.classTrial?.id===id){set({notice:`Prova de ${CLASSES[id].name}: ${h.classTrial.kills}/3 criaturas. Volte ao treinador ao concluir.`});return;}
    set({hero:{...h,classTrial:{id,kills:0}},notice:`Prova de ${CLASSES[id].name}: vença três criaturas de nível 1–3 nos arredores e volte ao treinador.`});
  },
  buyFlyingMount:id=>{
    const s=get(),h=s.hero,m=FLYING_MOUNTS.find(mount=>mount.id===id);
    if(!m||h.dead||h.instance||s.encounter||s.challenge||h.region!=='goddard'||h.level<50||h.flyingMount===id||h.gold<FLYING_MOUNT_PRICE)return;
    if(Math.hypot(h.position[0]-MOUNT_VENDOR[0],h.position[1]-MOUNT_VENDOR[1])>4)return;
    set({hero:{...h,flyingMount:id,gold:h.gold-FLYING_MOUNT_PRICE},notice:`${m.name} adquirido.`});
  },
  chooseMount:id=>{const s=get(),mount=MOUNTS.find(m=>m.id===id);if(!mount||s.hero.dead||s.hero.instance||s.encounter||s.challenge||!mountAvailable(s.hero,mount))return;if(s.mounted&&(id==='wolf'||id==='boar')&&!walkable(...s.hero.position,s.hero.region)){set({notice:'Desça sobre terreno livre antes de trocar para uma montaria terrestre.'});return;}set({hero:{...s.hero,selectedMount:id},notice:`${mount.name} selecionado.`});},
  toggleWolf:()=>{const s=get();if(s.wolfForm){set({wolfForm:false});return;}
    if(s.hero.classId!=='shaman'||s.hero.level<WOLF_FORM_LEVEL){set({notice:`Forma de Lobo: Shaman a partir do nível ${WOLF_FORM_LEVEL}.`});return;}
    if(s.hero.dead||s.encounter||s.challenge||s.hero.instance){set({notice:'Forma de Lobo só fora de combate e de masmorras.'});return;}
    set({wolfForm:true,mounted:false,sitting:false,walking:false,notice:'Forma de Lobo: você corre mais rápido. Em combate você volta à forma normal.'});},
  toggleMount:()=>{const s=get();if(!s.mounted&&s.wolfForm)set({wolfForm:false});if(s.mounted){const mount=mountOf(s.hero);if((mount?.id==='griffin'||mount?.id==='dragon')&&!walkable(...s.hero.position,s.hero.region)){set({notice:'Desça sobre terreno livre, longe das muralhas, montanhas e água.'});return;}set({mounted:false});return;}if(s.hero.dead||s.encounter||s.challenge||s.hero.level<MOUNT_LEVEL){set({notice:`Montaria a partir do nível ${MOUNT_LEVEL}, fora de combate.`});return;}if(s.hero.instance){set({notice:'Não dá para montar dentro da masmorra.'});return;}set({mounted:true,notice:`Montado em ${mountOf(s.hero)?.name}.`});},
  claimNexus:()=>{const s=get();if(s.hero.dead||s.encounter)return;if(s.hero.region!=='aurora'||!!s.hero.instance||Math.hypot(...s.hero.position)>7){set({notice:'Vá até o cristal da praça para receber a aura.'});return;}if(!nexusFull(s.hero.nexus,s.hero.level)){set({notice:'O Nexus ainda não está cheio. Ganhe XP em lutas, missões e runas.'});return;}set({hero:{...s.hero,nexus:{charge:0,aura:NEXUS_SECONDS}},notice:'✦ Aura do Herói! +12% ataque, +12% defesa e +10% vida por 10 minutos de jogo.'});},
  upgradeItem:id=>{const s=get(),step=forgeStep(id),item=ITEMS[id];if(!step||!item||s.hero.dead||s.encounter)return;const next=ITEMS[forgeId(step.base,step.to)];if(!next)return;
   if(!atForge(s.hero)){set({notice:'Procure Babbage, o ferreiro, na vila para aprimorar.'});return;}
   if(!s.hero.inventory.includes(id)){set({notice:'Você precisa ter o item.'});return;}
   const cost=forgeCost(item,next,step.to,LEVEL_BANDS[bandFor(item.minLevel)]),forgeGold=discounted(cost.gold,repPercent(adventureOf(s.hero),'ferreiros'));const left=removeItems(s.hero.inventory,cost.materials);
   if(!left||s.hero.gold<forgeGold||s.hero.materials<cost.fragments){set({notice:'Faltam moedas, fragmentos ou cristais para aprimorar.'});return;}
   const inventory=[...left];inventory[inventory.indexOf(id)]=next.id;const swap=(list:string[])=>list.map(i=>i===id?next.id:i);const durability={...s.hero.durability};delete durability[id];durability[next.id]=100;
   set({hero:{...s.hero,inventory,equipped:swap(s.hero.equipped),gold:s.hero.gold-forgeGold,materials:s.hero.materials-cost.fragments,durability},notice:`${next.name}! Babbage aprimorou seu item para ${next.rarity}.`});},
  submitPrecursor: (id, step, answer) => {
    const state = get();
    const { hero } = state;
    const precursor = PRECURSORS[id];
    if (!precursor || !nearLegacySite(state, precursor)) return "Aproxime-se do precursor com a jornada pronta para salvar.";
    const current = hero.precursorProgress?.[id] ?? 0;
    const quest = precursor.quests[current];
    if (step !== current || !quest) return "Esta etapa já foi registrada.";
    if (answer !== quest.answer) return quest.hint;
    set({ hero: { ...hero, precursorProgress: { ...hero.precursorProgress, [id]: current + 1 } } });
    return null;
  },
  submitChamber: answer => {
    const state = get();
    const { hero } = state;
    if (!nearLegacySite(state, CHAMBER_POSITION) || !hasAllArtifacts(hero)) return "Reúna os dez artefatos e vá até a Câmara.";
    if (hero.chamberComplete) return "A Câmara já foi restaurada.";
    if (answer !== CHAMBER_CHALLENGE.answer) return CHAMBER_CHALLENGE.hint;
    set({ hero: { ...hero, chamberComplete: true } });
    return null;
  },
  submitLovelace: (step, submission) => {
    const state = get();
    const { hero } = state;
    const current = cleanLovelaceProgress(hero.lovelaceProgress);
    if (!nearLegacySite(state, LOVELACE_POSITION)) {
      return "Aproxime-se de Lovelace com a jornada pronta para salvar.";
    }
    if (step !== current) return "Esta etapa já foi registrada. Abra o desafio atual.";
    const error = evaluateLovelace(step, submission);
    if (error) return error;
    set({ hero: { ...hero, lovelaceProgress: current + 1 } });
    return null;
  },
  deleteCharacter: slot=>{const s=get();if(!s.ready||s.saveError||s.encounter||s.challenge)return false;const next=deleteCharacter(savedState(s),slot);set({...next,relocation:s.relocation+1,mounted:false,encounter:null,challenge:null,target:null,queued:null,effects:[],cooldowns:{},buff:0,lastAttack:0,battleEvent:null,notice:'Personagem excluído.'});return true;},
  selectCharacter: slot=>{const s=get();if(!s.ready||s.saveError||s.encounter||s.challenge)return false;const next=selectCharacter(savedState(s),slot);set({...next,relocation:s.relocation+1,mounted:false,encounter:null,challenge:null,effects:[],cooldowns:{},buff:0,lastAttack:0,battleEvent:null,notice:''});return true;},
  hydrate: async () => { if(get().ready)return; await useGame.persist.rehydrate(); set({ ready: true, now: Date.now(), saveError: storageIssue, notice: storageIssue ? "Salvamento protegido. Exporte o original antes de recuperar." : "Bem-vindo a Pedra da Aurora." }); },
  createCharacter: (name, classId, mode, race) => {
    if(race && !validRaceClass(race,classId))return;
    const s = get(); if (s.hero.created && !s.hero.dead) return;
    const inherited = Math.min(100, s.ancestors.filter(a => !a.claimed).reduce((sum, a) => sum + a.legacy, 0));
    let hero = { ...freshHero(), name: name.trim().slice(0, 30) || "Viajante", classId, race: raceForClass(classId,race), created: true, mode, inherited };
    if(race){hero.region=cityForRace(race);if(hero.region!=="aurora")hero.classInitiated=false;}
    hero = grantStarterGear(withXp(hero, inherited));
    hero = { ...hero, hp: stats(hero).maxHp, mp: stats(hero).maxMp };
    set({ hero, challenge:null, ancestors: s.ancestors.map(a => ({ ...a, claimed: true })), encounter: null, notice: inherited ? `Nova jornada. ${inherited} XP de legado recebidos uma única vez.` : hero.classId === "hunter" ? "Seu arco já está equipado. Você recebeu 40 flechas." : hero.region === "aurora" ? "Você começa com roupas remendadas e uma arma simples. Procure Boole." : "Você começa com roupas remendadas e uma arma simples." });
  },
  customize: look => set(s => ({ look: migrateSave({ ...savedState(s), look: { ...s.look, ...look } }).look })),
  chooseClass: (classId, race) => {
    if(race && !validRaceClass(race,classId))return;
    const s = get(); if (s.encounter || s.hero.dead || s.hero.created) return;
    const hero = { ...s.hero, classId, race: raceForClass(classId,race ?? s.hero.race), talents: [0, 0, 0], hotbar:s.hero.hotbar.filter(id=>SKILLS[id]?.classId===classId), equipped:s.hero.equipped.filter(id=>{const item=ITEMS[id];return !item||!itemRequirement({...s.hero,classId},item);}) };
    const limits = stats(hero); set({ hero: { ...hero, hp: Math.min(hero.hp, limits.maxHp), mp: Math.min(hero.mp, limits.maxMp),stamina:Math.min(hero.stamina,limits.maxStamina) }, notice: "Novo caminho. Educação, itens, XP e bronze preservados; talentos devolvidos." });
  },
  move: position => {
    const s=get();
    if(s.hero.dead||s.encounter)return;
    const hero={...s.hero,position};
    const site=s.hero.instance?undefined:discoveryIn(hero.region);
    if(site&&discoveryDistance(site,position)<=DISCOVERY_REVEAL_RANGE&&!hero.adventure?.discoveries?.[site.id]){
      const adventure=adventureOf(hero);
      set({hero:{...hero,adventure:{...adventure,discoveries:{...adventure.discoveries,[site.id]:'seen'}}},
        ...(s.sitting?{sitting:false}:{}),notice:`Descoberta: ${site.name}. Local registrado no mapa.`});
    }else set({hero,...(s.sitting?{sitting:false}:{})});
  },
  openDiscovery:()=>{
    const s=get(),site=discoveryIn(s.hero.region);
    if(!site||s.hero.dead||s.hero.instance||s.encounter||s.challenge||discoveryDistance(site,s.hero.position)>DISCOVERY_OPEN_RANGE)return;
    const adventure=adventureOf(s.hero),status=adventure.discoveries[site.id];
    if(status==='claimed')return;
    if(site.guard&&status!=='cleared'){set({notice:site.hint});return;}
    set({hero:{...withXp(s.hero,site.xp),gold:s.hero.gold+site.bronze,
      adventure:{...adventure,discoveries:{...adventure.discoveries,[site.id]:'claimed'}}},
      lootEvent:{time:Date.now(),xp:site.xp,gold:site.bronze,items:[]},notice:`Baú aberto em ${site.name}.`});
  },
  toggleSit: () => { const s = get(); if (s.hero.dead) return; if (s.encounter) { set({ sitting: false, notice: 'Não dá para sentar em combate.' }); return; } set({ sitting: !s.sitting, notice: s.sitting ? 'Você se levantou.' : '🧘 Sentado: recuperando HP, MP e vigor 3x mais rápido. Andar ou lutar levanta.' }); },
  toggleWalk: () => set(s => ({ walking: !s.walking, notice: s.walking ? 'Correndo.' : 'Caminhando.' })),
  bankDeposit:amount=>{const s=get();if(s.encounter||s.hero.dead)return;if(!atTownService(s.hero)){set({notice:'Aproxime-se do banco da cidade.'});return;}const adv=adventureOf(s.hero),r=bankDeposit(adv.bank,s.hero.gold,amount,Date.now());if(!r.ok){set({notice:r.message});return;}set({hero:{...s.hero,gold:r.wallet,adventure:{...adv,bank:r.bank}},notice:`🏦 Guardado no banco. Saldo: ${currency(r.bank.balance)}.`});},
  bankWithdraw:amount=>{const s=get();if(s.encounter||s.hero.dead)return;if(!atTownService(s.hero)){set({notice:'Aproxime-se do banco da cidade.'});return;}const adv=adventureOf(s.hero),r=bankWithdraw(adv.bank,s.hero.gold,amount,Date.now());if(!r.ok){set({notice:r.message});return;}set({hero:{...s.hero,gold:r.wallet,adventure:{...adv,bank:r.bank}},notice:`🏦 Saque feito. Na bolsa: ${currency(r.wallet)}.`});},
  overlandTravel:region=>{
    const s=get(),from=s.hero.region;
    if(s.hero.dead||s.encounter||s.challenge||s.hero.instance||!isRacialCity(from))return;
    const road=roadAt(from,...s.hero.position),arrival=roadArrival(from,region);
    if(road?.to!==region||!arrival)return;
    set({hero:{...s.hero,region,position:arrival},relocation:s.relocation+1,sitting:false,
      target:null,queued:null,notice:`Você chegou pela estrada a ${REGIONS[region].name}.`});
  },
  skyTravel:region=>{
    const s=get(),from=s.hero.region;
    if(s.hero.dead||s.encounter||s.challenge||s.hero.instance)return;
    if(!(region==='goddard'&&isRacialCity(from)||from==='goddard'&&isRacialCity(region)))return;
    const [x,z]=from==="goddard"&&isRacialCity(region)?goddardExit(region):cityPortal(from);
    if(Math.hypot(s.hero.position[0]-x,s.hero.position[1]-z)>4){set({notice:'Aproxime-se do portal.'});return;}
    set({hero:{...s.hero,region,position:[...CITY_SPAWN]},relocation:s.relocation+1,mounted:false,notice:`Você chegou a ${REGIONS[region].name}.`});
  },
  wagonTravel:region=>{const s=get();if(s.encounter||s.challenge||s.hero.instance||s.hero.dead)return;if(region===s.hero.region){set({notice:'Você já está aqui.'});return;}if(region==='goddard'||s.hero.region==='goddard')return;const atStop=s.hero.region==='aurora'?atTownService(s.hero):isNewCity(s.hero.region)?Math.hypot(s.hero.position[0]-CITY_WAGON[0],s.hero.position[1]-CITY_WAGON[1])<=4:Math.hypot(s.hero.position[0],s.hero.position[1]-7)<=WAGON_STOP_RADIUS;if(!atStop){set({notice:s.hero.region==='aurora'?'A carroça sai da vila.':'A carroça espera na chegada da região.'});return;}const reason=regionRequirement(s.hero,s.education,region);if(reason){set({notice:reason});return;}if(s.hero.gold<WAGON_PRICE){set({notice:`A viagem custa ${currency(WAGON_PRICE)}.`});return;}set({hero:{...s.hero,gold:s.hero.gold-WAGON_PRICE,region,position:isRacialCity(region)?[...CITY_SPAWN]:[0,7]},notice:`🐴 A carroça te levou para ${REGIONS[region].name}.`});},
  practiceAnswer:(concept,correct)=>{if(!PRACTICE_CONCEPTS.includes(concept))return;set(s=>({education:{...s.education,practice:{...s.education.practice,[concept]:nextMastery(s.education.practice?.[concept],correct)}}}));},
  finishBlitz:(concept,score)=>{const s=get();if(!PRACTICE_CONCEPTS.includes(concept)||s.hero.dead)return null;if(score<BLITZ_PASS){set({notice:'Quase! Acerte 2 de 3 para ganhar a recompensa. O treino fica mais fácil quando você erra.'});return null;}
   const today=dayKey(Date.now());if(s.education.blitz?.[concept]===today){set({notice:'Missão relâmpago concluída. A recompensa desta runa volta amanhã; o treino continua valendo.'});return null;}
   const reward=blitzReward(s.education.practice?.[concept]?.level??1);set({hero:{...withXp(s.hero,reward.xp),gold:s.hero.gold+reward.gold},education:{...s.education,blitz:{...s.education.blitz,[concept]:today}},notice:`⚡ Missão relâmpago: +${reward.xp} XP e +${reward.gold} bronze.`});return reward;},
  battleInsight:correct=>{const s=get(),now=Date.now();if(!s.encounter||s.hero.dead||(s.cooldowns.insight??0)>now)return;
   if(!correct){set({cooldowns:{...s.cooldowns,insight:now+BATTLE_MISS_COOLDOWN_MS},notice:'Não foi dessa vez. Leia a explicação e tente de novo em instantes.'});return;}
   const amount=battleBuff(stats(s.hero).attack);set({cooldowns:{...s.cooldowns,insight:now+BATTLE_COOLDOWN_MS},effects:[...s.effects,{kind:'attack',amount,remaining:BATTLE_BUFF_SECONDS}],notice:`🧠 Golpe do saber! +${amount} de ataque por ${BATTLE_BUFF_SECONDS} segundos.`});},
  draft: (id, code) => set(s => ({ education: { ...s.education, drafts: { ...s.education.drafts, [id]: code } } })),
  solve: (id, code) => {
    const s = get(); const lesson = LESSONS.find(l => l.id === id); const result = evaluateLesson(id, code);
    if (s.hero.dead || !lesson || !!mainRequirement(s.hero,s.education,id)) return { ...result, passed: false, results: [{ label: "Runa trancada", passed: false, message: s.hero.dead ? "Seu herói precisa estar vivo para restaurar runas." : friendlyLock(mainRequirement(s.hero,s.education,id) ?? "") }] };
    const already = s.education.completed.includes(id);
    const education = { ...s.education, attempts: { ...s.education.attempts, [id]: (s.education.attempts[id] ?? 0) + 1 }, drafts: { ...s.education.drafts, [id]: code }, completed: result.passed ? [...new Set([...s.education.completed, id])] : s.education.completed, reviews: result.passed ? { ...s.education.reviews, [id]: Date.now() + 86400000 } : s.education.reviews };
    set({ education, ...(result.passed && !already ? { hero: { ...withXp(s.hero, lesson.xp + Math.round(lesson.xp * repPercent(adventureOf(s.hero), 'sabios') / 100)), gold: s.hero.gold + lesson.gold, adventure: addRep(progressDaily(currentAdventure(s), { type: 'code' }), 'sabios', 80) }, notice: `${lesson.title}: +${lesson.xp} XP e +${lesson.gold} bronze. O mundo se transforma.` } : {}), ...(result.passed && already ? { hero: { ...s.hero, adventure: progressDaily(currentAdventure(s), { type: 'code' }) }, notice: "Revisão concluída. Recompensa já recebida." } : {}) }); return result;
  },
  project: (id, code) => set(s => ({ education: { ...s.education, projects: { ...s.education.projects, [id]: { code, savedAt: Date.now() } } }, notice: "Projeto salvo. Evidências salvas não certificam domínio automaticamente." })),
  buy: (id,market) => {const s=get(),item=ITEMS[id];if(!item||s.hero.dead||s.encounter)return;
    if(market){
      const stall=cityMarket(s.hero.region).find(entry=>entry.id===market);
      if(s.hero.instance||!stall||Math.hypot(stall.approach[0]-s.hero.position[0],stall.approach[1]-s.hero.position[1])>3.3){set({notice:'Aproxime-se da banca para comprar.'});return;}
      if(!marketOpen(s.hero.region,s.education.completed)||!marketStocks(market,item)){set({notice:'Este item não está disponível nesta banca.'});return;}
    }
    const reason=itemRequirement(s.hero,item);if(reason){set({notice:reason});return;}if(item.source!=='shop'){set({notice:'Este item é obtido por fabricação ou saque.'});return;}const price=discounted(item.price,repPercent(adventureOf(s.hero),'mercadores'));if(s.hero.gold<price||countItem(s.hero.inventory,id)>=item.maxStack)return;const inventory=[...s.hero.inventory,id];if(!canStoreInventory(s.hero.inventory,inventory,s.hero.equipped)){set({notice:'Mochila cheia. Libere um espaço ou fabrique uma bolsa com Babbage.'});return;}set({hero:{...s.hero,gold:s.hero.gold-price,inventory},notice:`${item.name} adquirido.`});},
  allocateAttribute:key=>{const s=get();if(!ATTRIBUTE_KEYS.includes(key)||s.hero.dead||s.encounter||s.challenge||attributePoints(s.hero)<1)return;const allocated=cleanAttributes(s.hero.attributeAllocation,s.hero.level);set({hero:{...s.hero,attributeAllocation:{...allocated,[key]:allocated[key]+1}}});},
  equip: id => {
    const s=get(),item=ITEMS[id];if(!item||s.hero.dead||s.encounter||!s.hero.inventory.includes(id)||!isEquipment(item))return;
    if(s.hero.equipped.includes(id)){const hero={...s.hero,equipped:s.hero.equipped.filter(x=>x!==id)};const st=stats(hero);set({hero:{...hero,hp:Math.min(hero.hp,st.maxHp),mp:Math.min(hero.mp,st.maxMp),stamina:Math.min(hero.stamina,st.maxStamina)}});return;}
    const reason=itemRequirement(s.hero,item);if(reason){set({notice:reason});return;}
    const occupied=item.slot==='twohand'?['weapon','offhand','twohand']:item.slot==='weapon'||item.slot==='offhand'?[item.slot,'twohand']:[item.slot];
    const hero={...s.hero,equipped:[...s.hero.equipped.filter(x=>!occupied.includes(ITEMS[x]?.slot)),id]};const limits=stats(hero);
    set({hero:{...hero,hp:Math.min(hero.hp,limits.maxHp),mp:Math.min(hero.mp,limits.maxMp),stamina:Math.min(hero.stamina,limits.maxStamina)},notice:`${item.name} equipado.`});
  },
  sell: id => {const s=get(),item=ITEMS[id];if(!item||s.hero.dead||s.encounter||s.hero.equipped.includes(id)||!item.sellPrice)return;const inventory=removeItems(s.hero.inventory,{[id]:1});if(!inventory)return;set({hero:{...s.hero,inventory,gold:s.hero.gold+item.sellPrice},notice:`${item.name} vendido por ${item.sellPrice} bronze.`});},
  useItem: id => {
    const s=get(),item=ITEMS[id];if(!item?.effect||s.hero.dead)return;const reason=itemRequirement(s.hero,item);if(reason){set({notice:reason});return;}if(Date.now()<(s.cooldowns['consumable']??0))return;
    if(item.effect.teleport&&(s.encounter||s.challenge)){set({notice:"Não é possível teleportar durante combate ou desafio."});return;}
    const inventory=removeItems(s.hero.inventory,{[id]:1});if(!inventory)return;
    if(item.effect.teleport){set({relocation:s.relocation+1,hero:{...s.hero,inventory,instance:null,region:"aurora",position:[0,5]},mounted:false,cooldowns:{...s.cooldowns,consumable:Date.now()+1000},notice:"Você retornou à praça de Pedra da Aurora."});return;}const st=stats(s.hero),effect=item.effect;
    set({hero:{...s.hero,inventory,hp:Math.min(st.maxHp,s.hero.hp+(effect.hp??0)),mp:Math.min(st.maxMp,s.hero.mp+(effect.mp??0)),stamina:Math.min(st.maxStamina,s.hero.stamina+(effect.stamina??0))},cooldowns:{...s.cooldowns,consumable:Date.now()+1000},effects:effect.buff?[...s.effects.filter(e=>e.kind!==effect.buff),{kind:effect.buff,amount:effect.amount??0,remaining:effect.duration??60}]:s.effects,notice:`${item.name} utilizado.`});
  },
  craft: id => {
    const s=get(),item=ITEMS[id];if(!item||s.hero.dead||s.encounter||!s.education.completed.includes('arithmetic')||!item.recipe&&!item.ingredients)return;
    if(item.profession&&!s.hero.professions?.[item.profession]){set({notice:"Aprenda o ofício necessário com Babbage."});return;}if(s.hero.level<item.minLevel){set({notice:`Requer nível ${item.minLevel} para fabricar.`});return;}if(countItem(s.hero.inventory,id)>=item.maxStack)return;
    const fragments=item.recipe??0;const fee=item.ingredients?Math.max(item.sellPrice+1,Math.ceil((item.craftGold??0)*(1-passiveBonuses(s.hero).craftDiscount/100))):0;
    if(s.hero.materials<fragments||s.hero.gold<fee)return;const inventory=removeItems(s.hero.inventory,item.ingredients??{});if(!inventory)return;inventory.push(id);
    if(!canStoreInventory(s.hero.inventory,inventory,s.hero.equipped)){set({notice:'Mochila cheia. Libere espaço para o item fabricado.'});return;}
    set({hero:{...s.hero,professions:item.profession?{...s.hero.professions,[item.profession]:Math.min(100000,(s.hero.professions?.[item.profession]??1)+1)}:s.hero.professions,materials:s.hero.materials-fragments,gold:s.hero.gold-fee,inventory},notice:`${item.name} fabricado. Materiais e custo descontados uma única vez.`});
  },
  learnSkill: id => {const s=get();if(s.encounter)return;const reason=skillRequirement(s.hero,id);if(reason){set({notice:reason});return;}const skill=SKILLS[id];const hero={...s.hero,skills:{...s.hero.skills,[id]:skillRank(s.hero,id)+1},hotbar:skill.kind==='active'&&!s.hero.hotbar.includes(id)&&s.hero.hotbar.filter(Boolean).length<HOTBAR_SIZE?(()=>{const bar=[...s.hero.hotbar],empty=bar.indexOf('');if(empty>=0)bar[empty]=id;else bar.push(id);return bar;})():s.hero.hotbar};set({hero,notice:`${skill.name} aprimorada.`});},
  bindAction:(id,slot)=>{const s=get();if(s.hero.dead||s.encounter||!Number.isInteger(slot)||slot<0||slot>=HOTBAR_SIZE-1)return;if(id){if(id.startsWith('item:')){const key=id.slice(5);if(!ITEMS[key]?.effect||!s.hero.inventory.includes(key))return;}else if(!SKILLS[id]||SKILLS[id].classId!==s.hero.classId||SKILLS[id].kind!=='active'||!skillRank(s.hero,id))return;}const bar=[...s.hero.hotbar];while(bar.length<=slot)bar.push('');if(id){const old=bar.indexOf(id);if(old>=0)bar[old]='';}bar[slot]=id;set({hero:{...s.hero,hotbar:bar}});},
  bindSkill: (id,slot) => {const s=get(),skill=SKILLS[id];if(!skill||skill.classId!==s.hero.classId||skill.kind!=='active'||!skillRank(s.hero,id)||s.encounter||s.hero.dead)return;const bar=[...s.hero.hotbar];const existing=bar.indexOf(id);if(slot===undefined&&existing>=0){bar[existing]='';}else{const free=bar.slice(0,HOTBAR_SIZE-1).indexOf('');const target=slot??(free>=0?free:bar.length);if(!Number.isInteger(target)||target<0||target>=HOTBAR_SIZE-1){set({notice:'A tecla 1 é sempre Atacar. Use os espaços 2 a 0.'});return;}if(existing>=0)bar[existing]='';while(bar.length<=target)bar.push('');bar[target]=id;}set({hero:{...s.hero,hotbar:bar}});},
  respec:()=>{const s=get();if(s.encounter||s.hero.dead)return;const skills=Object.fromEntries(Object.entries(s.hero.skills).filter(([id])=>SKILLS[id]?.classId!==s.hero.classId));const hero={...s.hero,skills,hotbar:[],talents:[0,0,0]};const limits=stats(hero);set({hero:{...hero,hp:Math.min(hero.hp,limits.maxHp),mp:Math.min(hero.mp,limits.maxMp),stamina:Math.min(hero.stamina,limits.maxStamina)},notice:'Pontos da classe devolvidos. XP e progresso preservados.'});},
  castSkill:id=>{const s=get(),skill=SKILLS[id];if(!s.encounter||s.hero.dead||!skill||skill.classId!==s.hero.classId||skill.kind!=='active'||!skillRank(s.hero,id)||s.hero.level<skill.minLevel)return;if(Date.now()<(s.cooldowns[id]??0)||Date.now()-s.lastAttack<650)return;executeBattle(id,false,set,get);},
  talent: branch => { const s = get(); if (s.hero.dead || branch < 0 || branch > 2 || s.hero.talents.reduce((a, b) => a + b, 0) >= s.hero.level - 1 || s.hero.talents[branch] >= 10) return; set({ hero: { ...s.hero, talents: s.hero.talents.map((v, i) => i === branch ? v + 1 : v) } }); },
  travelRegion:region=>{const s=get();if(isNewCity(region)||isNewCity(s.hero.region))return;if(s.encounter||s.challenge||s.hero.instance)return;const reason=regionRequirement(s.hero,s.education,region);if(reason){set({notice:reason});return;}const gate=campaignGate(s.hero.region,region);if(!gate||Math.hypot(s.hero.position[0]-gate[0],s.hero.position[1]-gate[1])>4){set({notice:'Aproxime-se do portal para viajar.'});return;}set({hero:{...s.hero,region,position:[0,7]},mounted:false,relocation:s.relocation+1,notice:`Você entrou em ${REGIONS[region].name}.`});},
  startEncounter: (elite, requestedLevel, monsterId, action) => {
    const s=get();if(s.hero.dead||s.encounter||s.challenge)return;
    const fallback=MONSTERS.find(m=>m.region===s.hero.region&&(m.instance??null)===(s.hero.instance??null)&&m.boss===!!elite&&(s.hero.region!=='aurora'||!!s.hero.instance||(s.hero.position[0]>15?m.x>15:m.x<15)));
    const monster=MONSTERS.find(m=>m.id===(monsterId??fallback?.id));if(!monster)return;
    const reason=monsterRequirement(s.hero,s.education,monster.id);if(reason){set({notice:reason});return;}
    if((s.slain[monster.id]??0)>Date.now())return;
    if(s.hero.instance){const sealed=doorBetween(s.hero.instance,adventureOf(s.hero).doors,s.hero.position[1],monster.z);if(sealed){set({notice:`Porta selada: ${sealed.title}. Resolva o código da porta primeiro.`});return;}}
    const rare=rareNow(Date.now(),s.hero.region),isRare=!s.hero.instance&&!!rare&&rare.monsterId===monster.id&&adventureOf(s.hero).rareDone!==rare.window;
    const position=monsterPoint(monster,Date.now(),s.hero.position);
    if(Math.hypot(s.hero.position[0]-position[0],s.hero.position[1]-position[1])>attackRange(s.hero,action)+.5){set({notice:'Fora de alcance. Chegue mais perto do alvo.'});return;}
    const level=monster.boss?monster.level:Math.max(monster.level,Math.min(60,s.hero.level+3,Number.isFinite(requestedLevel)?Math.floor(requestedLevel!):s.hero.level));
    const vitals=enemyVitals(monster.kind,level,monster.boss);
    const noviceExpedition=monster.instance==="frost-cave";
    const maxHp=Math.round(vitals.maxHp*(isRare?2:noviceExpedition?.76:1));
    set({mounted:false,encounter:{...vitals,kind:monster.kind,turn:0,id:`enemy-${Date.now()}`,monsterId:monster.id,position,bossId:monster.boss?monster.id:undefined,name:isRare?`✦ ${monster.name} raro`:monster.name,hp:maxHp,maxHp,level,instanceId:s.hero.instance??undefined,power:Math.round((15+level*4)*(monster.boss?1.2:isRare?1.25:1)*(noviceExpedition?.72:s.hero.instance?1.15:1)),reward:25+level*18,elite:monster.boss||isRare,...(isRare&&rare?{rare:rare.window}:{})},lastAttack:0,notice:isRare?'✦ Monstro raro! Mais forte, com recompensa melhor.':monster.boss?(monster.instance?'Guardião da expedição.':'Chefe de região. A vitória abre o caminho seguinte.'):'Observe seus recursos e habilidades.'});
  },
  attack: starter => {const s=get();if(!s.encounter||s.hero.dead||Date.now()-s.lastAttack<650)return;executeBattle(undefined,!!starter,set,get);},
  flee: () => {
    const s=get(), id=s.hero.instance;
    if (!s.encounter || s.hero.dead) return;
    if (id) {
      const place=INSTANCES[id];
      set({encounter:null,target:null,queued:null,mounted:false,relocation:s.relocation+1,
        hero:{...s.hero,region:place.region,instance:null,instanceProgress:[],position:[place.x,place.z+2]},
        notice:"Você recuou para a entrada da expedição."});
      return;
    }
    set({encounter:null,target:null,queued:null,hero:{...s.hero,region:'aurora',position:[0,5]},notice:"Você recuou para Pedra da Aurora."});
  },
  rest: () => { const s = get(); if (s.encounter || s.hero.dead || s.hero.region!=="aurora" || !!s.hero.instance || Math.hypot(...s.hero.position) > 11) return; const st = stats(s.hero); set({ hero: { ...s.hero, hp: st.maxHp, mp: st.maxMp, stamina: st.maxStamina }, notice: "Você descansou junto ao cristal de Lion." }); },
  setTarget:id=>{const s=get();if(s.encounter&&id!==s.encounter.monsterId)return;set({target:id,queued:null});},
  act:action=>{const s=get();if(s.hero.dead)return;const lock=action.kind==='power'?classPowerRequirement(s.hero):undefined;if(lock){set({notice:lock});return;}if(s.encounter){if(action.kind==='skill'&&action.skill)get().castSkill(action.skill);else get().attack(action.kind==='power');return;}if(!s.target){set({notice:'Clique em um monstro para selecioná-lo.'});return;}set({queued:action});},
  acceptQuest:id=>{const s=get(),log=cleanLog(s.hero.quests),next=acceptLog(log,id,s.hero.level,s.education.completed);if(next===log||s.hero.dead)return;const q=QUESTS.find(q=>q.id===id)!;set({hero:{...s.hero,quests:next},notice:`Nova missão: ${q.title}. ${q.objectives.map(o=>o.label).join(' · ')}`});},
  turnInQuest:id=>{const s=get();if(s.hero.dead)return;const {log,reward}=turnInLog(cleanLog(s.hero.quests),id);if(!reward)return;const q=QUESTS.find(q=>q.id===id)!;set({hero:{...withXp(s.hero,reward.xp),gold:s.hero.gold+reward.gold,quests:log,adventure:addRep(adventureOf(s.hero),factionOf(q.giver),100)},notice:`${q.title} concluída! +${reward.xp} XP · +${reward.gold} bronze. ${q.finish}`});},
  questEvent:event=>{const s=get();const {log,changed}=progressQuests(cleanLog(s.hero.quests),event);if(!changed.length)return;set({hero:{...s.hero,quests:log},notice:changed.map(id=>{const q=QUESTS.find(q=>q.id===id)!,p=log.active[id];return `${q.title}: `+q.objectives.map((o,i)=>`${o.label} ${p[i]}/${goal(o)}`).join(' · ');}).join(' | ')});},
  gather:id=>{
    const vein=ORE_VEINS.find(v=>v.id===id);
    if(vein){
      const s=get(),now=Date.now();
      if(s.hero.dead||s.encounter||s.challenge||s.hero.region!==(vein.region??'aurora')||(s.hero.instance??null)!==(vein.instance??null)||(s.gathered[id]??0)>now)return;
      if(Math.hypot(s.hero.position[0]-vein.x,s.hero.position[1]-vein.z)>3.2)return;
      if(vein.id==='vein-iron-forest'&&!s.education.completed.includes('variables'))return;
      if(!s.hero.inventory.includes(PICKAXE_ID)){set({notice:'Compre uma picareta com Babbage ou Dorin para minerar.'});return;}
      const inventory=[...s.hero.inventory,vein.item,vein.item];
      if(countItem(inventory,vein.item)>ITEMS[vein.item].maxStack||!canStoreInventory(s.hero.inventory,inventory,s.hero.equipped)){set({notice:'Mochila cheia. Libere espaço para o minério.'});return;}
      set({hero:{...s.hero,inventory},gathered:{...s.gathered,[id]:now+GATHER_RESPAWN_MS},notice:`Extração concluída · +2 ${ITEMS[vein.item].name}.`});
      return;
    }
    const s=get(),node=GATHER_NODES.find(n=>n.id===id),now=Date.now();if(!node||s.hero.dead||s.encounter||s.hero.region!=='aurora'||s.hero.instance)return;if((s.gathered[id]??0)>now)return;if(Math.hypot(s.hero.position[0]-node.x,s.hero.position[1]-node.z)>3.2){set({notice:'Chegue mais perto para coletar.'});return;}const log=cleanLog(s.hero.quests),wanted=Object.entries(log.active).some(([qid,p])=>QUESTS.find(q=>q.id===qid)?.objectives.some((o,i)=>o.type==='collect'&&o.node===node.node&&(p[i]??0)<goal(o)));const adv0=currentAdventure(s),daily=dailyWants(adv0,{type:'collect',node:node.node});if(!wanted&&!daily){set({notice:node.node==='herb'?'Uma erva brilhante. Mira, a boticária, procura por elas.':'Um cristal de runa. Pip, perto da floresta, coleciona estes cristais.'});return;}set({gathered:{...s.gathered,[id]:now+GATHER_RESPAWN_MS},hero:{...s.hero,adventure:{...progressDaily(adv0,{type:'collect',node:node.node}),gathers:adv0.gathers+1}},...(wanted?{}:{notice:node.node==='herb'?'Erva coletada para a missão do dia.':'Cristal coletado para a missão do dia.'})});if(wanted)get().questEvent({type:'collect',node:node.node});},
  tick: seconds => {const s=get();if(storageIssue!==s.saveError)set({saveError:storageIssue});const dt=Number.isFinite(seconds)?Math.max(0,seconds):0,resources=recoverResources(s.hero,stats(s.hero),dt*(s.sitting&&!s.encounter?SIT_REGEN:1),!s.hero.created||s.hero.dead||!!s.encounter||Date.now()-s.lastAttack<10000),nexus=cleanNexus(s.hero.nexus),aura=Math.max(0,nexus.aura-dt);const changed=resources.hp!==s.hero.hp||resources.mp!==s.hero.mp||resources.stamina!==s.hero.stamina||aura!==nexus.aura;
    // Aventura: missões do dia, XP descansado na vila, conquistas e aviso de monstro raro.
    let adv=adventureOf(s.hero),advChanged=false,note='',rareSeen=s.rareSeen,restPending=s.restPending;const step=(next:typeof adv)=>{if(next!==adv){adv=next;advChanged=true;}};
    if(s.hero.created&&!s.hero.dead){const now=Date.now();if(!s.encounter&&s.hero.region==='aurora'&&!s.hero.instance&&Math.hypot(...s.hero.position)<SAFE_TOWN_RADIUS)restPending=Math.min(600,restPending+dt);if(restPending>=120){step(accrueRest(adv,s.hero.level,restPending));restPending=0;}const news=newAchievements({hero:s.hero,adv,completed:s.education.completed});if(news.length){step({...adv,achievements:[...adv.achievements,...news.map(a=>a.id)],title:adv.title||news[0].id});note=`🏆 Conquista: ${news.map(a=>a.name).join(', ')}${news.some(a=>a.pet)?' · novo mascote!':''}`;}const rare=s.hero.instance?null:rareNow(now,s.hero.region);if(rare&&rare.window!==rareSeen&&adv.rareDone!==rare.window){rareSeen=rare.window;note||=`✦ Um monstro raro apareceu: ${rare.name}! Ele some em 3 minutos.`;}}
    const hero=changed||advChanged?{...s.hero,hp:resources.hp,mp:resources.mp,stamina:resources.stamina,nexus:aura!==nexus.aura?{...nexus,aura}:s.hero.nexus,...(advChanged?{adventure:adv}:{})}:s.hero;set({hero,...(rareSeen!==s.rareSeen?{rareSeen}:{}),...(restPending!==s.restPending?{restPending}:{}),...(note?{notice:note}:{}),now:Date.now(),buff:Math.max(0,s.buff-dt),effects:s.effects.length?s.effects.map(e=>({...e,remaining:Math.max(0,e.remaining-dt)})).filter(e=>e.remaining>0):s.effects});},
  setting: value => set(s => ({ settings: migrateSave({ ...savedState(s), settings: { ...s.settings, ...value } }).settings })),
  restore: raw => {
    const envelope = checkEnvelope(raw); const next = migrateSave(envelope.state); const s = get();
    const ancestors = new Map(next.ancestors.map(a => [a.id, a]));
    for (const a of s.ancestors) { const other = ancestors.get(a.id); ancestors.set(a.id, { ...(other ?? a), claimed: a.claimed || !!other?.claimed }); }
    const education = { ...next.education, deliveries:[...new Set([...next.education.deliveries,...s.education.deliveries])], aiCompleted:[...new Set([...next.education.aiCompleted,...s.education.aiCompleted])], aiEvidence:{...next.education.aiEvidence,...s.education.aiEvidence}, reviewedProjects:[...new Set([...next.education.reviewedProjects,...s.education.reviewedProjects])], completed: [...new Set([...next.education.completed, ...s.education.completed])], projects: { ...next.education.projects, ...s.education.projects } };
    localStorage.setItem(SAVE_KEY + "-before-import-" + Date.now(), localStorage.getItem(SAVE_KEY) ?? raw);
    blocked = false; storageIssue = ""; set({ ...next, hero: ancestors.has(next.hero.id) ? { ...next.hero, dead: true, hp: 0 } : {...next.hero,defeatedBosses:next.hero.id===s.hero.id?[...new Set([...next.hero.defeatedBosses,...s.hero.defeatedBosses])]:next.hero.defeatedBosses,openedChests:next.hero.id===s.hero.id?[...new Set([...next.hero.openedChests,...s.hero.openedChests])]:next.hero.openedChests,promotions:next.hero.id===s.hero.id?Object.fromEntries(Object.keys(CLASSES).map(id=>[id,Math.max(next.hero.promotions[id as ClassId]??0,s.hero.promotions[id as ClassId]??0)])):next.hero.promotions}, education, ancestors: [...ancestors.values()], ready: true, encounter: null, challenge:null, saveError: "", notice: "Jornada recuperada. Educação e legados consumidos preservados." });
  },
  deliverQuest:kind=>{const s=get();const npc=kind==='main'?(s.hero.region==='goddard'?{x:GODDARD_BOOLE[0],z:GODDARD_BOOLE[1]}:PRECURSORS.boole):travelerFor(s.hero.id);if(s.hero.dead||s.encounter||s.hero.instance||(s.hero.region!=='aurora'&&(kind!=='main'||s.hero.region!=='goddard'))||Math.hypot(s.hero.position[0]-npc.x,s.hero.position[1]-npc.z)>4){set({notice:'Chegue mais perto: caminhe até o mentor (o personagem com ? em cima) e aperte Entregar missão ali.'});return;}const pending=pendingDelivery(s.education,kind);if(!pending.length)return;set({education:{...s.education,deliveries:[...new Set([...s.education.deliveries,...pending.map(id=>kind+':'+id)])]},notice:'Missão entregue. O próximo capítulo está liberado; a recompensa da prática já foi registrada.'});},
  draftAI:(id,code)=>set(s=>({education:{...s.education,aiEvidence:{...s.education.aiEvidence,[id]:code.slice(0,12000)}}})),
  reviewProject:index=>{const s=get();const reason=projectRequirement(s.hero,s.education,index);if(reason){set({notice:reason});return;}if((s.education.projects[String(index)]?.code.trim().length??0)<160){set({notice:'Registre o projeto, os testes e a revisão antes de avançar (mínimo de 160 caracteres).'});return;}set({education:{...s.education,reviewedProjects:[...new Set([...s.education.reviewedProjects,index])]},notice:'Revisão própria registrada. Não equivale a certificação automática de domínio.'});},
  beginPromotion:()=>{const s=get();if(s.challenge||s.encounter)return;const reason=promotionRequirement(s.hero,s.education);if(reason){set({notice:reason});return;}if((s.cooldowns.exam??0)>Date.now()){set({notice:'Revise o conteúdo. Nova tentativa liberada em até 30 segundos.'});return;}set({challenge:makeChallenge('promotion',String(promotionRank(s.hero)+1),s.hero)});},
  beginChest:id=>{const s=get(),chest=CHESTS.find(c=>c.id===id);if(!chest||s.challenge||s.encounter||s.hero.dead||s.hero.region!=="aurora"||s.hero.openedChests.includes(id))return;if(Math.hypot(s.hero.position[0]-chest.x,s.hero.position[1]-chest.z)>3){set({notice:'Aproxime-se do baú para examinar a fechadura.'});return;}if(s.hero.level<chest.level||!s.education.completed.includes(chest.lesson)){set({notice:`Baú selado: nível ${chest.level} e missão ${chest.lesson}.`});return;}set({challenge:makeChallenge('chest',id,s.hero,s.education)});},
  beginAI:id=>{const s=get(),index=AI_COURSE.findIndex(m=>m.id===id),unit=AI_COURSE[index];if(!unit||s.challenge||s.encounter||s.hero.dead)return;const requirement=aiRequirement(s.hero,s.education,id);if(requirement){set({notice:requirement});return;}set({challenge:makeChallenge('ai',id,s.hero)});},
  answerChallenge:answer=>{const s=get(),c=s.challenge;if(!c||c.done||s.hero.dead||c.heroId!==s.hero.id||c.classId!==s.hero.classId)return;const question=c.questions[c.index];if(!question?.options.includes(answer))return;const correct=answer===question.answer,score=c.score+Number(correct),feedback=[...c.feedback,`${correct?'✓':'○'} ${question.explanation}`];if(c.index<c.questions.length-1){set({challenge:{...c,index:c.index+1,score,feedback}});return;}const passed=score>=c.required,challenge={...c,score,done:true,passed,feedback};
    if(!passed){set({challenge,cooldowns:c.kind==='promotion'?{...s.cooldowns,exam:Date.now()+30000}:s.cooldowns,notice:'Revisão recomendada. Nenhum item ou ponto foi perdido.'});return;}
    if(c.kind==='promotion'){const rank=Number(c.target);if(promotionRequirement(s.hero,s.education)||rank!==promotionRank(s.hero)+1){set({challenge:{...challenge,passed:false},notice:'Requisitos da promoção mudaram. Inicie uma nova prova.'});return;}set({challenge,hero:{...s.hero,promotions:{...s.hero.promotions,[s.hero.classId]:rank}},notice:'Promoção conquistada! +3 ATQ, +3 DEF e novas etapas de habilidades liberadas.'});}
    else if(c.kind==='chest'){const chest=CHESTS.find(x=>x.id===c.target)!;if(s.hero.openedChests.includes(chest.id)){set({challenge});return;}set({challenge,hero:{...s.hero,openedChests:[...s.hero.openedChests,chest.id],inventory:[...s.hero.inventory,chest.item]},notice:`Tesouro encontrado: ${ITEMS[chest.item].name}. Recompensa única por personagem.`});}
    else {const done=s.education.aiCompleted.includes(c.target);const unit=AI_COURSE.find(m=>m.id===c.target)!;set({challenge,hero:done?s.hero:withXp(s.hero,50+unit.level*3),education:{...s.education,aiCompleted:[...new Set([...s.education.aiCompleted,c.target])]},notice:done?'Revisão concluída, sem repetir XP.':'Etapa de IA concluída. Evidência prática salva para revisão.'});}
  },
  cancelChallenge:()=>set({challenge:null}),
  claimDaily:index=>{const s=get();if(s.hero.dead)return;const adv=currentAdventure(s),t=DAILY_POOL.find(t=>t.id===adv.daily.ids[index]);if(!t||adv.daily.claimed[index]||adv.daily.progress[index]<t.count)return;const r=dailyReward(s.hero.level),xp=r.xp+Math.round(r.xp*repPercent(adv,'sabios')/100);set({hero:{...withXp(s.hero,xp),gold:s.hero.gold+r.gold,adventure:{...addRep(adv,t.faction,r.rep),daily:{...adv.daily,claimed:adv.daily.claimed.map((c,i)=>c||i===index)},dailyDone:adv.dailyDone+1}},notice:`Missão do dia concluída! +${xp} XP · +${r.gold} bronze · +${r.rep} reputação.`});},
  feedDog:kind=>{const s=get(),adv=adventureOf(s.hero),now=Date.now();if(s.hero.dead)return{ok:false,message:'Seu herói precisa estar vivo para brincar com o Caramelo.'};
   const food=kind==='food'?dogFood(s.hero.inventory):undefined;
   if(kind==='food'&&!food)return{ok:false,message:'Não há comida na mochila. Compre pão, ensopado ou frutas com Mira, ou dê um petisco.'};
   if(kind==='treat'&&s.hero.gold<TREAT_PRICE)return{ok:false,message:`O petisco custa ${TREAT_PRICE} moedas e você ainda não tem.`};
   const r=feedDogRule(adv.dog,now,kind);if(!r.ok)return{ok:false,message:r.message};
   set({hero:{...s.hero,inventory:food?(removeItems(s.hero.inventory,{[food]:1})??s.hero.inventory):s.hero.inventory,gold:kind==='treat'?s.hero.gold-TREAT_PRICE:s.hero.gold,adventure:{...adv,dog:r.dog}},notice:r.message});return{ok:true,message:r.message};},
  buildSpot:id=>{const s=get(),spot=CODE_SPOTS.find(x=>x.id===id),adv=adventureOf(s.hero);if(!spot)return{ok:false,message:'Ponto desconhecido.'};if(s.hero.dead)return{ok:false,message:'Seu herói precisa estar vivo.'};if(adv.built.includes(id))return{ok:true,message:spot.done};if(!spotAvailable(adv.built,id))return{ok:false,message:'Faça o ponto anterior primeiro.'};
    set({hero:{...withXp(s.hero,spot.xp),gold:s.hero.gold+spot.gold,adventure:{...addRep(progressDaily(currentAdventure(s),{type:'code'}),'sabios',30),built:[...adv.built,id]}},notice:`✨ ${spot.done} +${spot.xp} XP · +${spot.gold} bronze.`});return{ok:true,message:spot.done};},
  hearth:()=>{const s=get(),now=Date.now(),adv=adventureOf(s.hero);if(s.hero.dead||!s.hero.created)return;if(s.encounter||s.challenge){set({notice:'A pedra de retorno não funciona em combate.'});return;}if(adv.hearthAt>now){set({notice:`A pedra de retorno recarrega em ${Math.ceil((adv.hearthAt-now)/60000)} min.`});return;}set({mounted:false,target:null,queued:null,relocation:s.relocation+1,hero:{...s.hero,instance:null,region:'aurora',position:[0,5],adventure:{...adv,hearthAt:now+HEARTH_MS}},notice:'A pedra de retorno brilhou. Você está na praça da Aurora.'});},
  chooseSpec:id=>{const s=get(),adv=adventureOf(s.hero),spec=SPECS[s.hero.classId].find(x=>x.id===id);if(!spec||s.hero.dead||s.encounter||adv.spec===id)return;if(s.hero.level<SPEC_LEVEL){set({notice:`Especialização a partir do nível ${SPEC_LEVEL}.`});return;}const cost=SPECS[s.hero.classId].some(x=>x.id===adv.spec)?specChangeCost(s.hero.level):0;if(s.hero.gold<cost){set({notice:'Bronze insuficiente para trocar de especialização.'});return;}const hero={...s.hero,gold:s.hero.gold-cost,adventure:{...adv,spec:id}},st=stats(hero);set({hero:{...hero,hp:Math.min(hero.hp,st.maxHp)},notice:`Especialização: ${spec.name}. Seu Poder agora é ${spec.power}.`});},
  setTitle:id=>{const s=get(),adv=adventureOf(s.hero);if(id&&!adv.achievements.includes(id))return;set({hero:{...s.hero,adventure:{...adv,title:id}}});},
  setPet:id=>{const s=get(),adv=adventureOf(s.hero);if(id&&!unlockedPets(adv).includes(id as PetId))return;set({hero:{...s.hero,adventure:{...adv,pet:id}}});},
  openDoor:(id,code)=>{const s=get(),d=DOORS.find(d=>d.id===id),result=tryDoor(id,code);if(!d||s.hero.dead)return result;if(s.hero.instance!==d.instance||Math.abs(s.hero.position[1]-d.z)>10){set({notice:'Chegue perto da porta para usar o código.'});return {...result,passed:false,results:[...result.results,{label:'Lugar',passed:false,message:'O código está certo! Agora chegue perto desta porta, dentro da masmorra, e execute de novo.'}]};}const adv=adventureOf(s.hero);if(!result.passed||adv.doors.includes(id))return result;const xp=40+s.hero.level*6;set({hero:{...withXp(s.hero,xp),adventure:{...adv,doors:[...adv.doors,id]}},notice:`A porta “${d.title}” se abriu! +${xp} XP.`});return result;},
  clearNotice: () => set({ notice: "" }),
}), { name: SAVE_KEY, version: 4, skipHydration: true, storage: optimizedStorage, partialize: savedState, migrate: state => migrateSave(state), merge: (saved, current) => ({ ...current, ...migrateSave(saved) }), onRehydrateStorage: () => (_s, error) => { if (error) { blocked = true; storageIssue ||= "Seu salvamento foi preservado, mas precisa de recuperação."; } } }));

