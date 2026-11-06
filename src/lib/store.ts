"use client";
import {ATTRIBUTE_KEYS,attributePoints,cleanAttributes,type AttributeKey} from "./attributes";
import {packCharacters,selectCharacter,deleteCharacter} from './characterSlots';
import {INSTANCES,instanceRequirement,type InstanceId} from "./instances";
import {PROFESSIONS,repairCost,forgeCost,type Profession} from "./economy";
import {forgeStep,forgeId,bandFor,LEVEL_BANDS} from "./catalogue";
import {recoverResources} from "./recovery";
import { HOTBAR_SIZE } from './controls';
import {MONSTERS,REGIONS,regionRequirement,monsterRequirement,type RegionId} from "./campaign";
import { AI_COURSE, CHESTS, aiRequirement, travelerFor, pendingDelivery, makeChallenge, mainRequirement, projectRequirement, promotionRequirement, promotionRank, type Challenge } from "./journey";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SKILLS, skillRank, skillRequirement, passiveBonuses } from "./skills";
import { isEquipment, itemRequirement, removeItems, countItem } from "./equipment";
import { enemyVitals, resolveCombat, battleRewards, STATUS_NAMES, type EnemyState } from "./combat";
import { ATTACK_RANGE, type CombatAction } from "./combatEffects";
import { NEXUS_SECONDS, cleanNexus, nexusFull } from "./nexus";
import { QUESTS, GATHER_NODES, GATHER_RESPAWN_MS, MONSTER_RESPAWN_MS, acceptQuest as acceptLog, progressQuests, turnInQuest as turnInLog, cleanLog, goal, type QuestEvent } from "./quests";
import { CLASSES, ITEMS, LESSONS, evaluateLesson, freshHero, freshSave, migrateSave, stats, withXp, type SaveData, type ClassId, type Look, type Settings, type Race, validRaceClass, raceForClass } from "./game";
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
  enterInstance:(id:InstanceId)=>void;leaveInstance:()=>void; repair:()=>void;learnProfession:(id:Profession)=>void; bindAction:(id:string,slot:number)=>void; relocation:number; mounted:boolean; toggleMount:()=>void;
  ready: boolean; saveError: string; notice: string; encounter: Encounter | null; buff: number; lastAttack: number; cooldowns: Record<string,number>; now: number; effects: {kind:string;amount:number;remaining:number}[];
  lootEvent?:{time:number;xp:number;gold:number;items:string[]};
  battleEvent:{critical?:boolean;time:number;damage:number;received:number;x:number;z:number;tone:string;kind:"attack"|"power"|"skill";classId:ClassId;skill?:string;hx:number;hz:number;won?:boolean;enemySkill?:string;enemyPower?:string}|null;
  /** Monstros vencidos voltam depois de um tempo; pontos de coleta também (só durante a sessão). */
  slain:Record<string,number>; gathered:Record<string,number>;
  /** Monstro selecionado com um clique e a ação esperando o herói chegar ao alcance. */
  deleteCharacter:(slot:number)=>boolean; upgradeItem:(id:string)=>void; claimNexus:()=>void;
  target:string|null; queued:CombatAction|null; setTarget:(id:string|null)=>void; act:(action:CombatAction)=>void;
  acceptQuest:(id:string)=>void; turnInQuest:(id:string)=>void; questEvent:(event:QuestEvent)=>void; gather:(id:string)=>void;
  challenge: Challenge|null;
  beginPromotion:()=>void; beginChest:(id:string)=>void; beginAI:(id:string)=>void; answerChallenge:(answer:string)=>void; cancelChallenge:()=>void;
  deliverQuest:(kind:"main"|"ai")=>void;
  draftAI:(id:string,code:string)=>void; reviewProject:(index:number)=>void;
  hydrate: () => Promise<void>;
  selectCharacter: (slot:number)=>boolean;
  createCharacter: (name: string, classId: ClassId, mode: "normal" | "hardcore", race?: Race) => void;
  customize: (look: Partial<Look>) => void; chooseClass: (id: ClassId, race?: Race) => void; move: (p: [number, number]) => void;
  draft: (id: string, code: string) => void; solve: (id: string, code: string) => ReturnType<typeof evaluateLesson>; project: (id: string, code: string) => void;
  allocateAttribute:(key:AttributeKey)=>void;
  buy: (id: string) => void; equip: (id: string) => void; useItem: (id: string) => void; craft: (id: string) => void; talent: (branch: number) => void;
  startEncounter: (elite?: boolean, level?: number, monsterId?:string) => void; travelRegion:(region:RegionId)=>void; attack: (skill?: boolean) => void; flee: () => void; rest: () => void; tick: (seconds: number) => void;
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
 useGame.setState({...next,ready:true,encounter:null,challenge:null,battleEvent:null,cooldowns:{},lastAttack:0,effects:[],buff:0,saveError:'',notice:'Jornada da conta carregada.'});
 if(blocked)throw Error(storageIssue);
}
function executeBattle(id:string|undefined,starter:boolean,set:(value:Partial<GameStore>)=>void,get:()=>GameStore){
 const s=get(),enemy=s.encounter!;
 const result=resolveCombat(s.hero,enemy,{skillId:id,starter,criticalRoll:Math.random(),attackBuff:s.effects.filter(e=>e.kind==='attack').reduce((n,e)=>n+e.amount,0),defenseBuff:(s.buff>0?5:0)+s.effects.filter(e=>e.kind==='defense').reduce((n,e)=>n+e.amount,0)});
 if(result.error){set({notice:result.error});return;}
 result.hero={...result.hero,durability:{...result.hero.durability,...Object.fromEntries(s.hero.equipped.filter(id=>ITEMS[id]&&ITEMS[id].slot!=="pet").map(id=>[id,Math.max(0,(s.hero.durability?.[id]??100)-1)]))}};
 const target=MONSTERS.find(m=>m.id===enemy.monsterId);
 const feedback={battleEvent:{critical:!!result.critical,time:Date.now(),damage:result.damage,received:result.received,x:target?.x??s.hero.position[0],z:target?.z??s.hero.position[1],tone:id||starter?CLASSES[s.hero.classId].color:'#efd49a',kind:(id?'skill':starter?'power':'attack') as 'attack'|'power'|'skill',classId:s.hero.classId,skill:id,hx:s.hero.position[0],hz:s.hero.position[1],won:result.won,enemySkill:result.enemySkill,enemyPower:result.enemyPower}};
 const skillBuff=id?SKILLS[id].buff:undefined;
 const effects=skillBuff?[...s.effects.filter(e=>e.kind!==skillBuff.kind),{kind:skillBuff.kind,amount:Math.round(skillBuff.amount*(1+(skillRank(s.hero,id!)-1)*.14)),remaining:skillBuff.duration}]:s.effects;
 const now=Date.now(),cooldowns={...s.cooldowns,...(id?{[id]:now+SKILLS[id].cooldown*1000}:{})};
 if(result.won){const reward=battleRewards(s.hero,enemy);const hunted=target?progressQuests(cleanLog(s.hero.quests),{type:'kill',kind:target.kind,id:target.id}):null;const questNote=hunted?.changed.map(qid=>{const q=QUESTS.find(q=>q.id===qid)!,p=hunted.log.active[qid];return q.objectives.map((o,i)=>o.type==='kill'?` · ${o.label}: ${p[i]}/${goal(o)}`:'').join('');}).join('')??'';const slain=target&&!target.boss&&!target.instance?{...s.slain,[target.id]:Date.now()+MONSTER_RESPAWN_MS}:s.slain;const inventory=[...result.hero.inventory],accepted:string[]=[];for(const drop of reward.drops){const item=ITEMS[drop];if(item&&countItem(inventory,drop)<item.maxStack){inventory.push(drop);accepted.push(drop);}}set({...feedback,lootEvent:{time:now,xp:reward.xp,gold:reward.gold,items:accepted},hero:{...withXp(result.hero,reward.xp),gold:result.hero.gold+reward.gold,materials:result.hero.materials+reward.fragments,instanceProgress:enemy.instanceId?[...new Set([...(result.hero.instanceProgress??[]),enemy.monsterId!])]:result.hero.instanceProgress,kills:result.hero.kills+1,defeatedBosses:enemy.bossId?[...new Set([...result.hero.defeatedBosses,enemy.bossId])]:result.hero.defeatedBosses,inventory,quests:hunted?.log??result.hero.quests},slain,target:null,queued:null,encounter:null,cooldowns,effects,now,lastAttack:now,notice:questNote.trim()});return;}
 if(result.dead&&s.hero.mode==='hardcore'){const h=result.hero;const ancestor={id:h.id,name:h.name,classId:h.classId,level:h.level,diedAt:now,cause:enemy.name,legacy:Math.min(100,Math.max(0,Math.floor((h.xp-h.inherited)*.15))),claimed:false};set({...feedback,target:null,queued:null,hero:{...h,hp:0,dead:true},ancestors:s.ancestors.some(a=>a.id===h.id)?s.ancestors:[...s.ancestors,ancestor],encounter:null,cooldowns,effects,now,lastAttack:now,notice:'Aventura encerrada. Educação e portfólio preservados.'});return;}
 if(result.dead){set({...feedback,target:null,queued:null,hero:{...result.hero,hp:Math.round(stats(result.hero).maxHp*.6),instance:null,region:"aurora",position:[0,5]},encounter:null,cooldowns,effects,now,lastAttack:now,notice:'Lion levou você à vila. Seu progresso foi preservado.'});return;}
 set({...feedback,hero:result.hero,encounter:result.enemy,cooldowns,effects,now,lastAttack:now,notice:result.enemySkill?`${enemy.name} usou ${result.enemySkill}!${result.enemy.heroStatus?` Você está ${STATUS_NAMES[result.enemy.heroStatus.kind].toLowerCase()}.`:''}`:''});
}
export const useGame = create<GameStore>()(persist<GameStore, [], [], SaveData>((set, get) => ({
  ...freshSave(), relocation:0,mounted:false, battleEvent:null, slain:{}, gathered:{}, target:null, queued:null, challenge:null, ready: false, saveError: "", notice: "", encounter: null, buff: 0, lastAttack: 0, cooldowns: {}, now: 0, effects: [],
  enterInstance:id=>{const s=get();if(s.encounter||s.challenge||s.hero.instance)return;const reason=instanceRequirement(s.hero,s.education.completed,id);if(reason){set({notice:reason});return;}const place=INSTANCES[id];if(Math.hypot(s.hero.position[0]-place.x,s.hero.position[1]-place.z)>4.5){set({notice:'Aproxime-se da entrada para entrar.'});return;}set({mounted:false,relocation:s.relocation+1,hero:{...s.hero,instance:id,instanceProgress:[],position:[0,8]},notice:place.name+' · inimigos mais fortes, XP dobrado. Use a saída ao sul para retornar.'});},
  leaveInstance:()=>{const s=get(),id=s.hero.instance;if(!id||s.encounter||s.challenge||s.hero.dead)return;if(Math.hypot(s.hero.position[0],s.hero.position[1]-10)>4.5){set({notice:'A saída fica ao sul da instância.'});return;}const place=INSTANCES[id];set({mounted:false,relocation:s.relocation+1,hero:{...s.hero,instance:null,position:[place.x,place.z+2]},notice:'Você retornou da expedição.'});},
  repair:()=>{const s=get();if(s.hero.dead||s.encounter||s.hero.region!=='aurora'||!!s.hero.instance||Math.hypot(s.hero.position[0]+7,s.hero.position[1])>8){set({notice:'Procure Borin na vila para reparar.'});return;}const fee=repairCost(s.hero.equipped,s.hero.durability??{},ITEMS);if(!fee||s.hero.gold<fee)return;set({hero:{...s.hero,gold:s.hero.gold-fee,durability:{...s.hero.durability,...Object.fromEntries(s.hero.equipped.map(id=>[id,100]))}},notice:'Equipamento reparado.'});},
  learnProfession:id=>{const s=get();if(!Object.hasOwn(PROFESSIONS,id)||s.hero.dead||s.encounter||s.hero.gold<20||s.hero.professions?.[id]||s.hero.region!=='aurora'||!!s.hero.instance||Math.hypot(s.hero.position[0]+7,s.hero.position[1])>8)return;set({hero:{...s.hero,gold:s.hero.gold-20,professions:{...s.hero.professions,[id]:1}},notice:'Ofício aprendido: '+PROFESSIONS[id]});},
  toggleMount:()=>{const s=get();if(s.mounted){set({mounted:false});return;}if(s.hero.dead||s.encounter||s.challenge||s.hero.level<30){set({notice:'Montarias exigem nível 30 e estar fora de combate.'});return;}if(!s.hero.equipped.some(id=>ITEMS[id]?.mount&&s.hero.inventory.includes(id))){set({notice:'Equipe um pet de montaria na mochila.'});return;}set({mounted:true,notice:'Montado. Deslocamento 50% mais rápido.'});},
  claimNexus:()=>{const s=get();if(s.hero.dead||s.encounter)return;if(s.hero.region!=='aurora'||!!s.hero.instance||Math.hypot(...s.hero.position)>7){set({notice:'Vá até o cristal da praça para receber a aura.'});return;}if(!nexusFull(s.hero.nexus,s.hero.level)){set({notice:'O Nexus ainda não está cheio. Ganhe XP em lutas, missões e runas.'});return;}set({hero:{...s.hero,nexus:{charge:0,aura:NEXUS_SECONDS}},notice:'✦ Aura do Herói! +12% ataque, +12% defesa e +10% vida por 10 minutos de jogo.'});},
  upgradeItem:id=>{const s=get(),step=forgeStep(id),item=ITEMS[id];if(!step||!item||s.hero.dead||s.encounter)return;const next=ITEMS[forgeId(step.base,step.to)];if(!next)return;
   if(s.hero.region!=='aurora'||!!s.hero.instance||Math.hypot(s.hero.position[0]+7,s.hero.position[1])>8){set({notice:'Procure Borin, o ferreiro, na vila para aprimorar.'});return;}
   if(!s.hero.inventory.includes(id)){set({notice:'Você precisa ter o item.'});return;}
   const cost=forgeCost(item,next,step.to,LEVEL_BANDS[bandFor(item.minLevel)]);const left=removeItems(s.hero.inventory,cost.materials);
   if(!left||s.hero.gold<cost.gold||s.hero.materials<cost.fragments){set({notice:'Faltam moedas, fragmentos ou cristais para aprimorar.'});return;}
   const inventory=[...left];inventory[inventory.indexOf(id)]=next.id;const swap=(list:string[])=>list.map(i=>i===id?next.id:i);const durability={...s.hero.durability};delete durability[id];durability[next.id]=100;
   set({hero:{...s.hero,inventory,equipped:swap(s.hero.equipped),gold:s.hero.gold-cost.gold,materials:s.hero.materials-cost.fragments,durability},notice:`${next.name}! Borin aprimorou seu item para ${next.rarity}.`});},
  deleteCharacter: slot=>{const s=get();if(!s.ready||s.saveError||s.encounter||s.challenge)return false;const next=deleteCharacter(savedState(s),slot);set({...next,relocation:s.relocation+1,mounted:false,encounter:null,challenge:null,target:null,queued:null,effects:[],cooldowns:{},buff:0,lastAttack:0,battleEvent:null,notice:'Personagem excluído.'});return true;},
  selectCharacter: slot=>{const s=get();if(!s.ready||s.saveError||s.encounter||s.challenge)return false;const next=selectCharacter(savedState(s),slot);set({...next,relocation:s.relocation+1,mounted:false,encounter:null,challenge:null,effects:[],cooldowns:{},buff:0,lastAttack:0,battleEvent:null,notice:''});return true;},
  hydrate: async () => { if(get().ready)return; await useGame.persist.rehydrate(); set({ ready: true, now: Date.now(), saveError: storageIssue, notice: storageIssue ? "Salvamento protegido. Exporte o original antes de recuperar." : "Bem-vindo a Pedra da Aurora." }); },
  createCharacter: (name, classId, mode, race) => {
    if(race && !validRaceClass(race,classId))return;
    const s = get(); if (s.hero.created && !s.hero.dead) return;
    const inherited = Math.min(100, s.ancestors.filter(a => !a.claimed).reduce((sum, a) => sum + a.legacy, 0));
    let hero = { ...freshHero(), name: name.trim().slice(0, 30) || "Viajante", classId, race: raceForClass(classId,race), created: true, mode, inherited };
    hero = { ...withXp(hero, inherited), hp: stats(hero).maxHp, mp: stats(hero).maxMp };
    set({ hero, challenge:null, ancestors: s.ancestors.map(a => ({ ...a, claimed: true })), encounter: null, notice: inherited ? `Nova jornada. ${inherited} XP de legado recebidos uma única vez.` : "Sua jornada começa com roupas remendadas. Procure Eldrin." });
  },
  customize: look => set(s => ({ look: migrateSave({ ...savedState(s), look: { ...s.look, ...look } }).look })),
  chooseClass: (classId, race) => {
    if(race && !validRaceClass(race,classId))return;
    const s = get(); if (s.encounter || s.hero.dead || s.hero.created) return;
    const hero = { ...s.hero, classId, race: raceForClass(classId,race ?? s.hero.race), talents: [0, 0, 0], hotbar:s.hero.hotbar.filter(id=>SKILLS[id]?.classId===classId), equipped:s.hero.equipped.filter(id=>{const item=ITEMS[id];return !item||!itemRequirement({...s.hero,classId},item);}) };
    const limits = stats(hero); set({ hero: { ...hero, hp: Math.min(hero.hp, limits.maxHp), mp: Math.min(hero.mp, limits.maxMp),stamina:Math.min(hero.stamina,limits.maxStamina) }, notice: "Novo caminho. Educação, itens, XP e bronze preservados; talentos devolvidos." });
  },
  move: position => { const s = get(); if (!s.hero.dead && !s.encounter) set({ hero: { ...s.hero, position } }); },
  draft: (id, code) => set(s => ({ education: { ...s.education, drafts: { ...s.education.drafts, [id]: code } } })),
  solve: (id, code) => {
    const s = get(); const lesson = LESSONS.find(l => l.id === id); const result = evaluateLesson(id, code);
    if (s.hero.dead || !lesson || !!mainRequirement(s.hero,s.education,id)) return { ...result, passed: false, results: [{ label: "Pré-requisito", passed: false, message: "Conclua a missão anterior com um personagem vivo." }] };
    const already = s.education.completed.includes(id);
    const education = { ...s.education, attempts: { ...s.education.attempts, [id]: (s.education.attempts[id] ?? 0) + 1 }, drafts: { ...s.education.drafts, [id]: code }, completed: result.passed ? [...new Set([...s.education.completed, id])] : s.education.completed, reviews: result.passed ? { ...s.education.reviews, [id]: Date.now() + 86400000 } : s.education.reviews };
    set({ education, ...(result.passed && !already ? { hero: { ...withXp(s.hero, lesson.xp), gold: s.hero.gold + lesson.gold }, notice: `${lesson.title}: +${lesson.xp} XP e +${lesson.gold} bronze. O mundo se transforma.` } : {}), ...(result.passed && already ? { notice: "Revisão concluída. Recompensa já recebida." } : {}) }); return result;
  },
  project: (id, code) => set(s => ({ education: { ...s.education, projects: { ...s.education.projects, [id]: { code, savedAt: Date.now() } } }, notice: "Projeto salvo. Evidências salvas não certificam domínio automaticamente." })),
  buy: id => {const s=get(),item=ITEMS[id];if(!item||s.hero.dead)return;const reason=itemRequirement(s.hero,item);if(reason){set({notice:reason});return;}if(item.source!=='shop'){set({notice:'Este item é obtido por fabricação ou saque.'});return;}if(s.hero.gold<item.price||countItem(s.hero.inventory,id)>=item.maxStack)return;set({hero:{...s.hero,gold:s.hero.gold-item.price,inventory:[...s.hero.inventory,id]},notice:`${item.name} adquirido.`});},
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
    if(item.profession&&!s.hero.professions?.[item.profession]){set({notice:"Aprenda o ofício necessário com Borin."});return;}if(s.hero.level<item.minLevel){set({notice:`Requer nível ${item.minLevel} para fabricar.`});return;}if(countItem(s.hero.inventory,id)>=item.maxStack)return;
    const fragments=item.recipe??0;const fee=item.ingredients?Math.max(item.sellPrice+1,Math.ceil((item.craftGold??0)*(1-passiveBonuses(s.hero).craftDiscount/100))):0;
    if(s.hero.materials<fragments||s.hero.gold<fee)return;const inventory=removeItems(s.hero.inventory,item.ingredients??{});if(!inventory)return;
    set({hero:{...s.hero,professions:item.profession?{...s.hero.professions,[item.profession]:Math.min(100000,(s.hero.professions?.[item.profession]??1)+1)}:s.hero.professions,materials:s.hero.materials-fragments,gold:s.hero.gold-fee,inventory:[...inventory,id]},notice:`${item.name} fabricado. Materiais e custo descontados uma única vez.`});
  },
  learnSkill: id => {const s=get();if(s.encounter)return;const reason=skillRequirement(s.hero,id);if(reason){set({notice:reason});return;}const skill=SKILLS[id];const hero={...s.hero,skills:{...s.hero.skills,[id]:skillRank(s.hero,id)+1},hotbar:skill.kind==='active'&&!s.hero.hotbar.includes(id)&&s.hero.hotbar.filter(Boolean).length<HOTBAR_SIZE?(()=>{const bar=[...s.hero.hotbar],empty=bar.indexOf('');if(empty>=0)bar[empty]=id;else bar.push(id);return bar;})():s.hero.hotbar};set({hero,notice:`${skill.name} aprimorada.`});},
  bindAction:(id,slot)=>{const s=get();if(s.hero.dead||s.encounter||!Number.isInteger(slot)||slot<0||slot>=HOTBAR_SIZE-1)return;if(id){if(id.startsWith('item:')){const key=id.slice(5);if(!ITEMS[key]?.effect||!s.hero.inventory.includes(key))return;}else if(!SKILLS[id]||SKILLS[id].classId!==s.hero.classId||SKILLS[id].kind!=='active'||!skillRank(s.hero,id))return;}const bar=[...s.hero.hotbar];while(bar.length<=slot)bar.push('');if(id){const old=bar.indexOf(id);if(old>=0)bar[old]='';}bar[slot]=id;set({hero:{...s.hero,hotbar:bar}});},
  bindSkill: (id,slot) => {const s=get(),skill=SKILLS[id];if(!skill||skill.classId!==s.hero.classId||skill.kind!=='active'||!skillRank(s.hero,id)||s.encounter||s.hero.dead)return;const bar=[...s.hero.hotbar];const existing=bar.indexOf(id);if(slot===undefined&&existing>=0){bar[existing]='';}else{const free=bar.slice(0,HOTBAR_SIZE-1).indexOf('');const target=slot??(free>=0?free:bar.length);if(!Number.isInteger(target)||target<0||target>=HOTBAR_SIZE-1){set({notice:'A tecla 1 é sempre Atacar. Use os espaços 2 a 0.'});return;}if(existing>=0)bar[existing]='';while(bar.length<=target)bar.push('');bar[target]=id;}set({hero:{...s.hero,hotbar:bar}});},
  respec:()=>{const s=get();if(s.encounter||s.hero.dead)return;const skills=Object.fromEntries(Object.entries(s.hero.skills).filter(([id])=>SKILLS[id]?.classId!==s.hero.classId));const hero={...s.hero,skills,hotbar:[],talents:[0,0,0]};const limits=stats(hero);set({hero:{...hero,hp:Math.min(hero.hp,limits.maxHp),mp:Math.min(hero.mp,limits.maxMp),stamina:Math.min(hero.stamina,limits.maxStamina)},notice:'Pontos da classe devolvidos. XP e progresso preservados.'});},
  castSkill:id=>{const s=get(),skill=SKILLS[id];if(!s.encounter||s.hero.dead||!skill||skill.classId!==s.hero.classId||skill.kind!=='active'||!skillRank(s.hero,id)||s.hero.level<skill.minLevel)return;if(Date.now()<(s.cooldowns[id]??0)||Date.now()-s.lastAttack<650)return;executeBattle(id,false,set,get);},
  talent: branch => { const s = get(); if (s.hero.dead || branch < 0 || branch > 2 || s.hero.talents.reduce((a, b) => a + b, 0) >= s.hero.level - 1 || s.hero.talents[branch] >= 10) return; set({ hero: { ...s.hero, talents: s.hero.talents.map((v, i) => i === branch ? v + 1 : v) } }); },
  travelRegion:region=>{const s=get();if(s.encounter||s.challenge||s.hero.instance)return;const reason=regionRequirement(s.hero,s.education,region);if(reason){set({notice:reason});return;}const gate=region==='aurora'?{x:0,z:10}:s.hero.region==='aurora'?{x:25,z:-18}:{x:8,z:-24};if(Math.hypot(s.hero.position[0]-gate.x,s.hero.position[1]-gate.z)>4){set({notice:'Aproxime-se do portal para viajar.'});return;}set({hero:{...s.hero,region,position:[0,7]},notice:`Você entrou em ${REGIONS[region].name}.`});},
  startEncounter: (elite, requestedLevel, monsterId) => {
    const s=get();if(s.hero.dead||s.encounter||s.challenge)return;
    const fallback=MONSTERS.find(m=>m.region===s.hero.region&&(m.instance??null)===(s.hero.instance??null)&&m.boss===!!elite&&(s.hero.region!=='aurora'||!!s.hero.instance||(s.hero.position[0]>15?m.x>15:m.x<15)));
    const monster=MONSTERS.find(m=>m.id===(monsterId??fallback?.id));if(!monster)return;
    const reason=monsterRequirement(s.hero,s.education,monster.id);if(reason){set({notice:reason});return;}
    if((s.slain[monster.id]??0)>Date.now())return;
    if(Math.hypot(s.hero.position[0]-monster.x,s.hero.position[1]-monster.z)>(ATTACK_RANGE[s.hero.classId]??4)+.5){set({notice:'Fora de alcance. Chegue mais perto do alvo.'});return;}
    const level=monster.boss?monster.level:Math.max(monster.level,Math.min(60,s.hero.level+3,Number.isFinite(requestedLevel)?Math.floor(requestedLevel!):s.hero.level));
    const vitals=enemyVitals(monster.kind,level,monster.boss),maxHp=vitals.maxHp;
    set({mounted:false,encounter:{...vitals,kind:monster.kind,turn:0,id:`enemy-${Date.now()}`,monsterId:monster.id,bossId:monster.boss?monster.id:undefined,name:monster.name,hp:maxHp,maxHp,level,instanceId:s.hero.instance??undefined,power:Math.round((15+level*4)*(monster.boss?1.2:1)*(s.hero.instance?1.15:1)),reward:25+level*18,elite:monster.boss},lastAttack:0,notice:monster.boss?'Chefe de região. A vitória abre o caminho seguinte.':'Observe seus recursos e habilidades.'});
  },
  attack: starter => {const s=get();if(!s.encounter||s.hero.dead||Date.now()-s.lastAttack<650)return;executeBattle(undefined,!!starter,set,get);},
  flee: () => set(s => ({ encounter: null, target: null, queued: null, hero: { ...s.hero, region:'aurora', position: [0, 5] }, notice: "Você recuou para Pedra da Aurora." })),
  rest: () => { const s = get(); if (s.encounter || s.hero.dead || s.hero.region!=="aurora" || !!s.hero.instance || Math.hypot(...s.hero.position) > 11) return; const st = stats(s.hero); set({ hero: { ...s.hero, hp: st.maxHp, mp: st.maxMp, stamina: st.maxStamina }, notice: "Você descansou junto ao cristal de Lion." }); },
  setTarget:id=>{const s=get();if(s.encounter&&id!==s.encounter.monsterId)return;set({target:id,queued:null});},
  act:action=>{const s=get();if(s.hero.dead)return;if(s.encounter){if(action.kind==='skill'&&action.skill)get().castSkill(action.skill);else get().attack(action.kind==='power');return;}if(!s.target){set({notice:'Clique em um monstro para selecioná-lo.'});return;}set({queued:action});},
  acceptQuest:id=>{const s=get(),log=cleanLog(s.hero.quests),next=acceptLog(log,id,s.hero.level,s.education.completed);if(next===log||s.hero.dead)return;const q=QUESTS.find(q=>q.id===id)!;set({hero:{...s.hero,quests:next},notice:`Nova missão: ${q.title}. ${q.objectives.map(o=>o.label).join(' · ')}`});},
  turnInQuest:id=>{const s=get();if(s.hero.dead)return;const {log,reward}=turnInLog(cleanLog(s.hero.quests),id);if(!reward)return;const q=QUESTS.find(q=>q.id===id)!;set({hero:{...withXp(s.hero,reward.xp),gold:s.hero.gold+reward.gold,quests:log},notice:`${q.title} concluída! +${reward.xp} XP · +${reward.gold} bronze. ${q.finish}`});},
  questEvent:event=>{const s=get();const {log,changed}=progressQuests(cleanLog(s.hero.quests),event);if(!changed.length)return;set({hero:{...s.hero,quests:log},notice:changed.map(id=>{const q=QUESTS.find(q=>q.id===id)!,p=log.active[id];return `${q.title}: `+q.objectives.map((o,i)=>`${o.label} ${p[i]}/${goal(o)}`).join(' · ');}).join(' | ')});},
  gather:id=>{const s=get(),node=GATHER_NODES.find(n=>n.id===id),now=Date.now();if(!node||s.hero.dead||s.encounter||s.hero.region!=='aurora'||s.hero.instance)return;if((s.gathered[id]??0)>now)return;if(Math.hypot(s.hero.position[0]-node.x,s.hero.position[1]-node.z)>3.2){set({notice:'Chegue mais perto para coletar.'});return;}const log=cleanLog(s.hero.quests),wanted=Object.entries(log.active).some(([qid,p])=>QUESTS.find(q=>q.id===qid)?.objectives.some((o,i)=>o.type==='collect'&&o.node===node.node&&(p[i]??0)<goal(o)));if(!wanted){set({notice:node.node==='herb'?'Uma erva brilhante. Mira, a boticária, procura por elas.':'Um cristal de runa. Pip, perto da floresta, coleciona estes cristais.'});return;}set({gathered:{...s.gathered,[id]:now+GATHER_RESPAWN_MS}});get().questEvent({type:'collect',node:node.node});},
  tick: seconds => {const s=get();if(storageIssue!==s.saveError)set({saveError:storageIssue});const dt=Number.isFinite(seconds)?Math.max(0,seconds):0,resources=recoverResources(s.hero,stats(s.hero),dt,!s.hero.created||s.hero.dead||!!s.encounter||Date.now()-s.lastAttack<10000),nexus=cleanNexus(s.hero.nexus),aura=Math.max(0,nexus.aura-dt);const changed=resources.hp!==s.hero.hp||resources.mp!==s.hero.mp||resources.stamina!==s.hero.stamina||aura!==nexus.aura;const hero=changed?{...s.hero,hp:resources.hp,mp:resources.mp,stamina:resources.stamina,nexus:aura!==nexus.aura?{...nexus,aura}:s.hero.nexus}:s.hero;set({hero,now:Date.now(),buff:Math.max(0,s.buff-dt),effects:s.effects.length?s.effects.map(e=>({...e,remaining:Math.max(0,e.remaining-dt)})).filter(e=>e.remaining>0):s.effects});},
  setting: value => set(s => ({ settings: migrateSave({ ...savedState(s), settings: { ...s.settings, ...value } }).settings })),
  restore: raw => {
    const envelope = checkEnvelope(raw); const next = migrateSave(envelope.state); const s = get();
    const ancestors = new Map(next.ancestors.map(a => [a.id, a]));
    for (const a of s.ancestors) { const other = ancestors.get(a.id); ancestors.set(a.id, { ...(other ?? a), claimed: a.claimed || !!other?.claimed }); }
    const education = { ...next.education, deliveries:[...new Set([...next.education.deliveries,...s.education.deliveries])], aiCompleted:[...new Set([...next.education.aiCompleted,...s.education.aiCompleted])], aiEvidence:{...next.education.aiEvidence,...s.education.aiEvidence}, reviewedProjects:[...new Set([...next.education.reviewedProjects,...s.education.reviewedProjects])], completed: [...new Set([...next.education.completed, ...s.education.completed])], projects: { ...next.education.projects, ...s.education.projects } };
    localStorage.setItem(SAVE_KEY + "-before-import-" + Date.now(), localStorage.getItem(SAVE_KEY) ?? raw);
    blocked = false; storageIssue = ""; set({ ...next, hero: ancestors.has(next.hero.id) ? { ...next.hero, dead: true, hp: 0 } : {...next.hero,defeatedBosses:next.hero.id===s.hero.id?[...new Set([...next.hero.defeatedBosses,...s.hero.defeatedBosses])]:next.hero.defeatedBosses,openedChests:next.hero.id===s.hero.id?[...new Set([...next.hero.openedChests,...s.hero.openedChests])]:next.hero.openedChests,promotions:next.hero.id===s.hero.id?Object.fromEntries(Object.keys(CLASSES).map(id=>[id,Math.max(next.hero.promotions[id as ClassId]??0,s.hero.promotions[id as ClassId]??0)])):next.hero.promotions}, education, ancestors: [...ancestors.values()], ready: true, encounter: null, challenge:null, saveError: "", notice: "Jornada recuperada. Educação e legados consumidos preservados." });
  },
  deliverQuest:kind=>{const s=get();const npc=kind==='main'?{x:5,z:-5}:travelerFor(s.hero.id);if(s.hero.dead||s.encounter||Math.hypot(s.hero.position[0]-npc.x,s.hero.position[1]-npc.z)>4){set({notice:'Aproxime-se do mentor para entregar sua missão.'});return;}const pending=pendingDelivery(s.education,kind);if(!pending.length)return;set({education:{...s.education,deliveries:[...new Set([...s.education.deliveries,...pending.map(id=>kind+':'+id)])]},notice:'Missão entregue. O próximo capítulo está liberado; a recompensa da prática já foi registrada.'});},
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
  clearNotice: () => set({ notice: "" }),
}), { name: SAVE_KEY, version: 4, skipHydration: true, storage: optimizedStorage, partialize: savedState, migrate: state => migrateSave(state), merge: (saved, current) => ({ ...current, ...migrateSave(saved) }), onRehydrateStorage: () => (_s, error) => { if (error) { blocked = true; storageIssue ||= "Seu salvamento foi preservado, mas precisa de recuperação."; } } }));

