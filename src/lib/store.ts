"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CLASSES, ITEMS, LESSONS, evaluateLesson, freshHero, freshSave, migrateSave, stats, withXp, type SaveData, type ClassId, type Look, type Settings } from "./game";
export const SAVE_KEY = "genesis-reborn-rpg-v3";
export const BACKUP_KEY = SAVE_KEY + "-before-lions-cave-1.3.1";
let blocked = false; let storageIssue = ""; let snapshotAt = 0;
export function checkEnvelope(raw: string): { state: unknown; version: number } {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || !("state" in value)) throw new Error("Formato desconhecido. O original foi preservado.");
  const e = value as { state: unknown; version?: number };
  if (![0, 1, 2].includes(e.version ?? 0)) throw new Error("Save de versão diferente. Exporte o original para recuperação.");
  if (!e.state || typeof e.state !== "object" || !("hero" in e.state)) throw new Error("Personagem inválido. O original foi preservado.");
  const hero = (e.state as { hero: unknown }).hero;
  if (!hero || typeof hero !== "object" || Array.isArray(hero)) throw new Error("Estrutura do personagem inválida. O original foi preservado.");
  return { state: e.state, version: e.version ?? 0 };
}
const guardedStorage = {
  getItem: (name: string) => {
    try { const raw = localStorage.getItem(name); if (raw) { checkEnvelope(raw); if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, raw); } return raw; }
    catch (e) { blocked = true; storageIssue = e instanceof Error ? e.message : "Armazenamento indisponível."; throw e; }
  },
  setItem: (name: string, value: string) => {
    if (blocked) return;
    try { if (Date.now() - snapshotAt > 60000) { const old = localStorage.getItem(name); if (old) localStorage.setItem(name + "-recovery", old); snapshotAt = Date.now(); } localStorage.setItem(name, value); }
    catch { blocked = true; storageIssue = "Armazenamento cheio ou indisponível. Exporte sua jornada antes de sair."; }
  },
  removeItem: () => { throw new Error("Exclusão automática de saves desativada."); },
};
export interface Encounter { id: string; name: string; hp: number; maxHp: number; power: number; reward: number; elite: boolean; }
interface GameStore extends SaveData {
  ready: boolean; saveError: string; notice: string; encounter: Encounter | null; buff: number; lastAttack: number;
  hydrate: () => Promise<void>;
  createCharacter: (name: string, classId: ClassId, mode: "normal" | "hardcore") => void;
  customize: (look: Partial<Look>) => void; chooseClass: (id: ClassId) => void; move: (p: [number, number]) => void;
  draft: (id: string, code: string) => void; solve: (id: string, code: string) => ReturnType<typeof evaluateLesson>; project: (id: string, code: string) => void;
  buy: (id: string) => void; equip: (id: string) => void; useItem: (id: string) => void; craft: (id: string) => void; talent: (branch: number) => void;
  startEncounter: (elite?: boolean) => void; attack: (skill?: boolean) => void; flee: () => void; rest: () => void; tick: (seconds: number) => void;
  setting: (v: Partial<Settings>) => void; restore: (raw: string) => void; clearNotice: () => void;
}
export function savedState(s: SaveData): SaveData { return { hero: s.hero, look: s.look, education: s.education, ancestors: s.ancestors, settings: s.settings, legacy: s.legacy }; }
export const useGame = create<GameStore>()(persist<GameStore, [], [], SaveData>((set, get) => ({
  ...freshSave(), ready: false, saveError: "", notice: "", encounter: null, buff: 0, lastAttack: 0,
  hydrate: async () => { await useGame.persist.rehydrate(); set({ ready: true, saveError: storageIssue, notice: storageIssue ? "Salvamento protegido. Exporte o original antes de recuperar." : "Bem-vindo a Pedra da Aurora." }); },
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
    const hero = { ...s.hero, classId, race: CLASSES[classId].race, talents: [0, 0, 0], equipped: s.hero.equipped.filter(id => !ITEMS[id]?.classId || ITEMS[id]?.classId === classId) };
    const limits = stats(hero); set({ hero: { ...hero, hp: Math.min(hero.hp, limits.maxHp), mp: Math.min(hero.mp, limits.maxMp) }, notice: "Novo caminho. Educação, itens, XP e ouro preservados; talentos devolvidos." });
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
  buy: id => { const s = get(); const item = ITEMS[id]; if (!item || s.hero.dead || s.hero.gold < item.price || (item.slot !== "consumable" && s.hero.inventory.includes(id))) return; set({ hero: { ...s.hero, gold: s.hero.gold - item.price, inventory: [...s.hero.inventory, id] }, notice: `${item.name} adquirido.` }); },
  equip: id => {
    const s = get(); const item = ITEMS[id]; if (!item || s.hero.dead || s.encounter || !s.hero.inventory.includes(id) || item.slot === "consumable") return;
    if (item.classId && item.classId !== s.hero.classId) { set({ notice: "Equipamento de outra classe. Ele continua guardado." }); return; }
    if (s.hero.equipped.includes(id)) { set({ hero: { ...s.hero, equipped: s.hero.equipped.filter(x => x !== id) } }); return; }
    const occupied = item.slot === "twohand" ? ["weapon", "offhand", "twohand"] : item.slot === "weapon" || item.slot === "offhand" ? [item.slot, "twohand"] : [item.slot];
    set({ hero: { ...s.hero, equipped: [...s.hero.equipped.filter(x => !occupied.includes(ITEMS[x]?.slot)), id] }, notice: `${item.name} equipado.` });
  },
  useItem: id => {
    const s = get(); if (s.hero.dead || !s.hero.inventory.includes(id) || ITEMS[id]?.slot !== "consumable") return;
    const inventory = [...s.hero.inventory]; inventory.splice(inventory.indexOf(id), 1); const st = stats(s.hero);
    set({ hero: { ...s.hero, inventory, hp: id === "potion" ? Math.min(st.maxHp, s.hero.hp + 45) : s.hero.hp, mp: id === "food" ? Math.min(st.maxMp, s.hero.mp + 30) : s.hero.mp, stamina: id === "food" ? st.maxStamina : s.hero.stamina }, ...(id === "tea" ? { buff: 60 } : {}), notice: `${ITEMS[id].name} utilizado.` });
  },
  craft: id => { const s = get(); const item = ITEMS[id]; if (!item?.recipe || s.hero.dead || s.hero.inventory.includes(id) || s.hero.materials < item.recipe || !s.education.completed.includes("arithmetic")) return; set({ hero: { ...s.hero, materials: s.hero.materials - item.recipe, inventory: [...s.hero.inventory, id] }, notice: `${item.name} fabricado na oficina.` }); },
  talent: branch => { const s = get(); if (s.hero.dead || branch < 0 || branch > 2 || s.hero.talents.reduce((a, b) => a + b, 0) >= s.hero.level - 1 || s.hero.talents[branch] >= 10) return; set({ hero: { ...s.hero, talents: s.hero.talents.map((v, i) => i === branch ? v + 1 : v) } }); },
  startEncounter: elite => {
    const s = get(); if (s.hero.dead || s.encounter) return; const [x, z] = s.hero.position;
    if (elite ? !(x > 15 && z < -12 && s.education.completed.includes("conditions")) : !(z < -13 && s.education.completed.includes("variables"))) { set({ notice: "Encontre uma sentinela na região desbloqueada." }); return; }
    const maxHp = elite ? 230 : 75 + s.hero.level * 12;
    set({ encounter: { id: `enemy-${Date.now()}`, name: elite ? "Guardião das Duas Portas" : "Sentinela Esquecida", hp: maxHp, maxHp, power: elite ? 29 : 15 + s.hero.level * 2, reward: elite ? 80 : 25, elite: !!elite }, lastAttack: 0, notice: "Observe seus recursos. Você pode recuar antes do próximo golpe." });
  },
  attack: skill => {
    const s = get(); const enemy = s.encounter; if (!enemy || s.hero.dead || Date.now() - s.lastAttack < 650) return;
    const st = stats(s.hero); const cost = skill ? 18 : 9;
    if (skill ? s.hero.mp < cost : s.hero.stamina < cost) { set({ notice: skill ? "MP insuficiente. Use alimento ou recue." : "Sem estamina. Recue para descansar." }); return; }
    const damage = Math.round(st.attack * (skill ? 1.8 : 1) + (s.hero.classId === "hunter" && s.hero.equipped.includes("bow") ? 5 : 0));
    const hp = Math.max(0, enemy.hp - damage); const next = { ...s.hero, mp: s.hero.mp - (skill ? cost : 0), stamina: s.hero.stamina - (skill ? 0 : cost) };
    if (!hp) { set({ hero: { ...withXp(next, enemy.reward), gold: next.gold + (enemy.elite ? 30 : 8), materials: next.materials + (enemy.elite ? 3 : 1), kills: next.kills + 1 }, encounter: null, lastAttack: Date.now(), notice: `Vitória! +${enemy.reward} XP, fragmentos e ouro.` }); return; }
    const retaliation = Math.max(3, Math.round(enemy.power - st.defense * 0.5 - (s.buff > 0 ? 5 : 0) - (skill && s.hero.classId === "hacker" ? 6 : 0)));
    const heroHp = Math.max(0, next.hp - retaliation + (skill && next.classId === "paladin" ? 8 : 0));
    if (!heroHp && next.mode === "hardcore") {
      const ancestor = { id: next.id, name: next.name, classId: next.classId, level: next.level, diedAt: Date.now(), cause: enemy.name, legacy: Math.min(100, Math.max(0, Math.floor((next.xp - next.inherited) * 0.15))), claimed: false };
      set({ hero: { ...next, hp: 0, dead: true }, ancestors: s.ancestors.some(a => a.id === next.id) ? s.ancestors : [...s.ancestors, ancestor], encounter: null, notice: "Aventura encerrada. Educação e portfólio preservados. Crie um personagem em Antepassados." }); return;
    }
    if (!heroHp) { set({ hero: { ...next, hp: Math.round(st.maxHp * 0.6), position: [0, 5] }, encounter: null, notice: "Lion levou você à vila. Nenhum XP, item ou ouro foi perdido." }); return; }
    set({ hero: { ...next, hp: Math.min(st.maxHp, heroHp) }, encounter: { ...enemy, hp }, lastAttack: Date.now(), notice: `Você causou ${damage} de dano e recebeu ${retaliation}.` });
  },
  flee: () => set(s => ({ encounter: null, hero: { ...s.hero, position: [0, 5] }, notice: "Você recuou para Pedra da Aurora." })),
  rest: () => { const s = get(); if (s.encounter || s.hero.dead || Math.hypot(...s.hero.position) > 11) return; const st = stats(s.hero); set({ hero: { ...s.hero, hp: st.maxHp, mp: st.maxMp, stamina: st.maxStamina }, notice: "Você descansou junto ao cristal de Lion." }); },
  tick: seconds => { const s = get(); if (storageIssue !== s.saveError) set({ saveError: storageIssue }); if (s.buff > 0) set({ buff: Math.max(0, s.buff - seconds) }); },
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
}), { name: SAVE_KEY, version: 2, skipHydration: true, storage: createJSONStorage<SaveData>(() => guardedStorage), partialize: savedState, migrate: state => migrateSave(state), merge: (saved, current) => ({ ...current, ...migrateSave(saved) }), onRehydrateStorage: () => (_s, error) => { if (error) { blocked = true; storageIssue ||= "Seu salvamento foi preservado, mas precisa de recuperação."; } } }));
