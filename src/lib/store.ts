"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SKILLS, skillRank, skillRequirement, passiveBonuses } from "./skills";
import { isEquipment, itemRequirement, removeItems, countItem } from "./equipment";
import { resolveCombat, battleRewards, type EnemyState } from "./combat";
import { CLASSES, ITEMS, LESSONS, evaluateLesson, freshHero, freshSave, migrateSave, stats, withXp, type SaveData, type ClassId, type Look, type Settings } from "./game";
export const SAVE_KEY = "genesis-reborn-rpg-v3";
export const BACKUP_KEY = SAVE_KEY + "-before-lions-cave-1.3.1";
let blocked = false; let storageIssue = ""; let snapshotAt = 0;
export function checkEnvelope(raw: string): { state: unknown; version: number } {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || !("state" in value)) throw new Error("Formato desconhecido. O original foi preservado.");
  const e = value as { state: unknown; version?: number };
  if (![0, 1, 2, 3].includes(e.version ?? 0)) throw new Error("Save de versão diferente. Exporte o original para recuperação.");
  if (!e.state || typeof e.state !== "object" || !("hero" in e.state)) throw new Error("Personagem inválido. O original foi preservado.");
  const hero = (e.state as { hero: unknown }).hero;
  if (!hero || typeof hero !== "object" || Array.isArray(hero)) throw new Error("Estrutura do personagem inválida. O original foi preservado.");
  return { state: e.state, version: e.version ?? 0 };
}
const guardedStorage = {
  getItem: (name: string) => {
    try { const raw = localStorage.getItem(name); if (raw) { const envelope=checkEnvelope(raw); const upgradeKey=SAVE_KEY+"-before-1.4.0"; if(envelope.version<3&&!localStorage.getItem(upgradeKey))localStorage.setItem(upgradeKey,raw); if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, raw); } return raw; }
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
  ready: boolean; saveError: string; notice: string; encounter: Encounter | null; buff: number; lastAttack: number; cooldowns: Record<string,number>; now: number; effects: {kind:string;amount:number;remaining:number}[];
  hydrate: () => Promise<void>;
  createCharacter: (name: string, classId: ClassId, mode: "normal" | "hardcore") => void;
  customize: (look: Partial<Look>) => void; chooseClass: (id: ClassId) => void; move: (p: [number, number]) => void;
  draft: (id: string, code: string) => void; solve: (id: string, code: string) => ReturnType<typeof evaluateLesson>; project: (id: string, code: string) => void;
  buy: (id: string) => void; equip: (id: string) => void; useItem: (id: string) => void; craft: (id: string) => void; talent: (branch: number) => void;
  startEncounter: (elite?: boolean, level?: number) => void; attack: (skill?: boolean) => void; flee: () => void; rest: () => void; tick: (seconds: number) => void;
  sell: (id: string) => void; learnSkill: (id:string) => void; bindSkill: (id:string) => void; respec: () => void; castSkill: (id:string) => void;
  setting: (v: Partial<Settings>) => void; restore: (raw: string) => void; clearNotice: () => void;
}
export function savedState(s: SaveData): SaveData { return { hero: s.hero, look: s.look, education: s.education, ancestors: s.ancestors, settings: s.settings, legacy: s.legacy }; }
function executeBattle(id:string|undefined,starter:boolean,set:(value:Partial<GameStore>)=>void,get:()=>GameStore){
 const s=get(),enemy=s.encounter!;
 const result=resolveCombat(s.hero,enemy,{skillId:id,starter,attackBuff:s.effects.filter(e=>e.kind==='attack').reduce((n,e)=>n+e.amount,0),defenseBuff:(s.buff>0?5:0)+s.effects.filter(e=>e.kind==='defense').reduce((n,e)=>n+e.amount,0)});
 if(result.error){set({notice:result.error});return;}
 const now=Date.now(),cooldowns={...s.cooldowns,...(id?{[id]:now+SKILLS[id].cooldown*1000}:{})};
 if(result.won){const reward=battleRewards(s.hero,enemy);const inventory=[...result.hero.inventory];for(const drop of reward.drops){const item=ITEMS[drop];if(item&&countItem(inventory,drop)<item.maxStack)inventory.push(drop);}set({hero:{...withXp(result.hero,reward.xp),gold:result.hero.gold+reward.gold,materials:result.hero.materials+reward.fragments,kills:result.hero.kills+1,inventory},encounter:null,cooldowns,now,lastAttack:now,notice:`Vitória! +${reward.xp} XP · +${reward.gold} ouro · ${reward.drops.length} itens/materiais. Confira a mochila.`});return;}
 if(result.dead&&s.hero.mode==='hardcore'){const h=result.hero;const ancestor={id:h.id,name:h.name,classId:h.classId,level:h.level,diedAt:now,cause:enemy.name,legacy:Math.min(100,Math.max(0,Math.floor((h.xp-h.inherited)*.15))),claimed:false};set({hero:{...h,hp:0,dead:true},ancestors:s.ancestors.some(a=>a.id===h.id)?s.ancestors:[...s.ancestors,ancestor],encounter:null,cooldowns,now,lastAttack:now,notice:'Aventura encerrada. Educação e portfólio preservados.'});return;}
 if(result.dead){set({hero:{...result.hero,hp:Math.round(stats(result.hero).maxHp*.6),position:[0,5]},encounter:null,cooldowns,now,lastAttack:now,notice:'Lion levou você à vila. Seu progresso foi preservado.'});return;}
 set({hero:result.hero,encounter:result.enemy,cooldowns,now,lastAttack:now,notice:`${id?SKILLS[id].name:starter?CLASSES[s.hero.classId].skill:'Ataque'}: ${result.damage} de dano · ${result.received} recebido.`});
}
export const useGame = create<GameStore>()(persist<GameStore, [], [], SaveData>((set, get) => ({
  ...freshSave(), ready: false, saveError: "", notice: "", encounter: null, buff: 0, lastAttack: 0, cooldowns: {}, now: 0, effects: [],
  hydrate: async () => { await useGame.persist.rehydrate(); set({ ready: true, now: Date.now(), saveError: storageIssue, notice: storageIssue ? "Salvamento protegido. Exporte o original antes de recuperar." : "Bem-vindo a Pedra da Aurora." }); },
  createCharacter: (name, classId, mode) => {
    const s = get(); if (s.hero.created && !s.hero.dead) return;
    const inherited = Math.min(100, s.ancestors.filter(a => !a.claimed).reduce((sum, a) => sum + a.legacy, 0));
    let hero = { ...freshHero(), name: name.trim().slice(0, 30) || "Viajante", classId, race: CLASSES[classId].race, created: true, mode, inherited };
    hero = { ...withXp(hero, inherited), hp: stats(hero).maxHp, mp: stats(hero).maxMp };
    set({ hero, ancestors: s.ancestors.map(a => ({ ...a, claimed: true })), encounter: null, notice: inherited ? `Nova jornada. ${inherited} XP de legado recebidos uma única vez.` : "Sua jornada começa com roupas remendadas. Procure Eldrin." });
  },
  customize: look => set(s => ({ look: migrateSave({ ...savedState(s), look: { ...s.look, ...look } }).look })),
  chooseClass: classId => {
    const s = get(); if (s.encounter || s.hero.dead) return;
    const hero = { ...s.hero, classId, race: CLASSES[classId].race, talents: [0, 0, 0], hotbar:s.hero.hotbar.filter(id=>SKILLS[id]?.classId===classId), equipped:s.hero.equipped.filter(id=>{const item=ITEMS[id];return !item||!itemRequirement({...s.hero,classId},item);}) };
    const limits = stats(hero); set({ hero: { ...hero, hp: Math.min(hero.hp, limits.maxHp), mp: Math.min(hero.mp, limits.maxMp),stamina:Math.min(hero.stamina,limits.maxStamina) }, notice: "Novo caminho. Educação, itens, XP e ouro preservados; talentos devolvidos." });
  },
  move: position => { const s = get(); if (!s.hero.dead && !s.encounter) set({ hero: { ...s.hero, position } }); },
  draft: (id, code) => set(s => ({ education: { ...s.education, drafts: { ...s.education.drafts, [id]: code } } })),
  solve: (id, code) => {
    const s = get(); const lesson = LESSONS.find(l => l.id === id); const result = evaluateLesson(id, code); const index = LESSONS.findIndex(l => l.id === id);
    if (s.hero.dead || !lesson || (index > 0 && !s.education.completed.includes(LESSONS[index - 1].id))) return { ...result, passed: false, results: [{ label: "Pré-requisito", passed: false, message: "Conclua a missão anterior com um personagem vivo." }] };
    const already = s.education.completed.includes(id);
    const education = { ...s.education, attempts: { ...s.education.attempts, [id]: (s.education.attempts[id] ?? 0) + 1 }, drafts: { ...s.education.drafts, [id]: code }, completed: result.passed ? [...new Set([...s.education.completed, id])] : s.education.completed, reviews: result.passed ? { ...s.education.reviews, [id]: Date.now() + 86400000 } : s.education.reviews };
    set({ education, ...(result.passed && !already ? { hero: { ...withXp(s.hero, lesson.xp), gold: s.hero.gold + lesson.gold }, notice: `${lesson.title}: +${lesson.xp} XP e +${lesson.gold} ouro. O mundo se transforma.` } : {}), ...(result.passed && already ? { notice: "Revisão concluída. Recompensa já recebida." } : {}) }); return result;
  },
  project: (id, code) => set(s => ({ education: { ...s.education, projects: { ...s.education.projects, [id]: { code, savedAt: Date.now() } } }, notice: "Projeto salvo. Evidências salvas não certificam domínio automaticamente." })),
  buy: id => {const s=get(),item=ITEMS[id];if(!item||s.hero.dead)return;const reason=itemRequirement(s.hero,item);if(reason){set({notice:reason});return;}if(item.source!=='shop'){set({notice:'Este item é obtido por fabricação ou saque.'});return;}if(s.hero.gold<item.price||countItem(s.hero.inventory,id)>=item.maxStack)return;set({hero:{...s.hero,gold:s.hero.gold-item.price,inventory:[...s.hero.inventory,id]},notice:`${item.name} adquirido.`});},
  equip: id => {
    const s=get(),item=ITEMS[id];if(!item||s.hero.dead||s.encounter||!s.hero.inventory.includes(id)||!isEquipment(item))return;
    if(s.hero.equipped.includes(id)){const hero={...s.hero,equipped:s.hero.equipped.filter(x=>x!==id)};const st=stats(hero);set({hero:{...hero,hp:Math.min(hero.hp,st.maxHp),mp:Math.min(hero.mp,st.maxMp),stamina:Math.min(hero.stamina,st.maxStamina)}});return;}
    const reason=itemRequirement(s.hero,item);if(reason){set({notice:reason});return;}
    const occupied=item.slot==='twohand'?['weapon','offhand','twohand']:item.slot==='weapon'||item.slot==='offhand'?[item.slot,'twohand']:[item.slot];
    const hero={...s.hero,equipped:[...s.hero.equipped.filter(x=>!occupied.includes(ITEMS[x]?.slot)),id]};const limits=stats(hero);
    set({hero:{...hero,hp:Math.min(hero.hp,limits.maxHp),mp:Math.min(hero.mp,limits.maxMp),stamina:Math.min(hero.stamina,limits.maxStamina)},notice:`${item.name} equipado.`});
  },
  sell: id => {const s=get(),item=ITEMS[id];if(!item||s.hero.dead||s.encounter||s.hero.equipped.includes(id)||!item.sellPrice)return;const inventory=removeItems(s.hero.inventory,{[id]:1});if(!inventory)return;set({hero:{...s.hero,inventory,gold:s.hero.gold+item.sellPrice},notice:`${item.name} vendido por ${item.sellPrice} ouro.`});},
  useItem: id => {
    const s=get(),item=ITEMS[id];if(!item?.effect||s.hero.dead)return;const reason=itemRequirement(s.hero,item);if(reason){set({notice:reason});return;}if(Date.now()<(s.cooldowns['consumable']??0))return;
    const inventory=removeItems(s.hero.inventory,{[id]:1});if(!inventory)return;const st=stats(s.hero),effect=item.effect;
    set({hero:{...s.hero,inventory,hp:Math.min(st.maxHp,s.hero.hp+(effect.hp??0)),mp:Math.min(st.maxMp,s.hero.mp+(effect.mp??0)),stamina:Math.min(st.maxStamina,s.hero.stamina+(effect.stamina??0))},cooldowns:{...s.cooldowns,consumable:Date.now()+1000},effects:effect.buff?[...s.effects.filter(e=>e.kind!==effect.buff),{kind:effect.buff,amount:effect.amount??0,remaining:effect.duration??60}]:s.effects,notice:`${item.name} utilizado.`});
  },
  craft: id => {
    const s=get(),item=ITEMS[id];if(!item||s.hero.dead||s.encounter||!s.education.completed.includes('arithmetic')||!item.recipe&&!item.ingredients)return;
    if(s.hero.level<item.minLevel){set({notice:`Requer nível ${item.minLevel} para fabricar.`});return;}if(countItem(s.hero.inventory,id)>=item.maxStack)return;
    const fragments=item.recipe??0;const fee=item.ingredients?Math.max(item.sellPrice+1,Math.ceil((item.craftGold??0)*(1-passiveBonuses(s.hero).craftDiscount/100))):0;
    if(s.hero.materials<fragments||s.hero.gold<fee)return;const inventory=removeItems(s.hero.inventory,item.ingredients??{});if(!inventory)return;
    set({hero:{...s.hero,materials:s.hero.materials-fragments,gold:s.hero.gold-fee,inventory:[...inventory,id]},notice:`${item.name} fabricado. Materiais e custo descontados uma única vez.`});
  },
  learnSkill: id => {const s=get();if(s.encounter)return;const reason=skillRequirement(s.hero,id);if(reason){set({notice:reason});return;}const skill=SKILLS[id];const hero={...s.hero,skills:{...s.hero.skills,[id]:skillRank(s.hero,id)+1},hotbar:skill.kind==='active'&&!s.hero.hotbar.includes(id)&&s.hero.hotbar.length<4?[...s.hero.hotbar,id]:s.hero.hotbar};set({hero,notice:`${skill.name} aprimorada.`});},
  bindSkill: id => {const s=get(),skill=SKILLS[id];if(!skill||skill.classId!==s.hero.classId||skill.kind!=='active'||!skillRank(s.hero,id)||s.encounter)return;if(s.hero.hotbar.includes(id)){set({hero:{...s.hero,hotbar:s.hero.hotbar.filter(x=>x!==id)}});return;}if(s.hero.hotbar.length>=4){set({notice:'Retire uma habilidade da barra para selecionar outra. Limite: quatro.'});return;}set({hero:{...s.hero,hotbar:[...s.hero.hotbar,id]}});},
  respec:()=>{const s=get();if(s.encounter||s.hero.dead)return;const skills=Object.fromEntries(Object.entries(s.hero.skills).filter(([id])=>SKILLS[id]?.classId!==s.hero.classId));const hero={...s.hero,skills,hotbar:[],talents:[0,0,0]};const limits=stats(hero);set({hero:{...hero,hp:Math.min(hero.hp,limits.maxHp),mp:Math.min(hero.mp,limits.maxMp),stamina:Math.min(hero.stamina,limits.maxStamina)},notice:'Pontos da classe devolvidos. XP e progresso preservados.'});},
  castSkill:id=>{const s=get(),skill=SKILLS[id];if(!s.encounter||s.hero.dead||!skill||skill.classId!==s.hero.classId||skill.kind!=='active'||!skillRank(s.hero,id)||s.hero.level<skill.minLevel)return;if(Date.now()<(s.cooldowns[id]??0)||Date.now()-s.lastAttack<650)return;executeBattle(id,false,set,get);},
  talent: branch => { const s = get(); if (s.hero.dead || branch < 0 || branch > 2 || s.hero.talents.reduce((a, b) => a + b, 0) >= s.hero.level - 1 || s.hero.talents[branch] >= 10) return; set({ hero: { ...s.hero, talents: s.hero.talents.map((v, i) => i === branch ? v + 1 : v) } }); },
  startEncounter: (elite, requestedLevel) => {
    const s = get(); if (s.hero.dead || s.encounter) return; const [x, z] = s.hero.position;
    if (elite ? !(x > 15 && z < -12 && s.education.completed.includes("conditions")) : !(z < -13 && s.education.completed.includes("variables"))) { set({ notice: "Encontre uma sentinela na região desbloqueada." }); return; }
    const level=Math.max(1,Math.min(60,s.hero.level+3,Number.isFinite(requestedLevel)?Math.floor(requestedLevel!):Math.min(60,s.hero.level)));
    const maxHp=Math.round((80+level*28+Math.floor(level/5)*35)*(elite?1.8:1));
    set({ encounter: { id: `enemy-${Date.now()}`, name: elite ? "Guardião das Duas Portas" : "Sentinela Esquecida", hp:maxHp,maxHp,level,power:Math.round((15+level*4)*(elite?1.2:1)),reward:25+level*18,elite:!!elite }, lastAttack: 0, notice: "Observe seus recursos. Você pode recuar antes do próximo golpe." });
  },
  attack: starter => {const s=get();if(!s.encounter||s.hero.dead||Date.now()-s.lastAttack<650)return;executeBattle(undefined,!!starter,set,get);},
  flee: () => set(s => ({ encounter: null, hero: { ...s.hero, position: [0, 5] }, notice: "Você recuou para Pedra da Aurora." })),
  rest: () => { const s = get(); if (s.encounter || s.hero.dead || Math.hypot(...s.hero.position) > 11) return; const st = stats(s.hero); set({ hero: { ...s.hero, hp: st.maxHp, mp: st.maxMp, stamina: st.maxStamina }, notice: "Você descansou junto ao cristal de Lion." }); },
  tick: seconds => { const s = get(); if (storageIssue !== s.saveError) set({ saveError: storageIssue }); set({now:Date.now(),buff:Math.max(0,s.buff-seconds),effects:s.effects.map(e=>({...e,remaining:Math.max(0,e.remaining-seconds)})).filter(e=>e.remaining>0)}); },
  setting: value => set(s => ({ settings: migrateSave({ ...savedState(s), settings: { ...s.settings, ...value } }).settings })),
  restore: raw => {
    const envelope = checkEnvelope(raw); const next = migrateSave(envelope.state); const s = get();
    const ancestors = new Map(next.ancestors.map(a => [a.id, a]));
    for (const a of s.ancestors) { const other = ancestors.get(a.id); ancestors.set(a.id, { ...(other ?? a), claimed: a.claimed || !!other?.claimed }); }
    const education = { ...next.education, completed: [...new Set([...next.education.completed, ...s.education.completed])], projects: { ...next.education.projects, ...s.education.projects } };
    localStorage.setItem(SAVE_KEY + "-before-import-" + Date.now(), localStorage.getItem(SAVE_KEY) ?? raw);
    blocked = false; storageIssue = ""; set({ ...next, hero: ancestors.has(next.hero.id) ? { ...next.hero, dead: true, hp: 0 } : next.hero, education, ancestors: [...ancestors.values()], ready: true, encounter: null, saveError: "", notice: "Jornada recuperada. Educação e legados consumidos preservados." });
  },
  clearNotice: () => set({ notice: "" }),
}), { name: SAVE_KEY, version: 3, skipHydration: true, storage: createJSONStorage<SaveData>(() => guardedStorage), partialize: savedState, migrate: state => migrateSave(state), merge: (saved, current) => ({ ...current, ...migrateSave(saved) }), onRehydrateStorage: () => (_s, error) => { if (error) { blocked = true; storageIssue ||= "Seu salvamento foi preservado, mas precisa de recuperação."; } } }));
