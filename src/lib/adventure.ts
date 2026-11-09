import { cleanBank, type BankState } from './bank';
import { cleanDog, type DogState } from './dog';
import type { ClassId, HeroData, NpcId } from './game';
import { MONSTERS, type MonsterKind, type RegionId } from './campaign';

/**
 * Sistemas de aventura da 1.10 (mecânicas inspiradas em MMOs, com nomes e regras próprias):
 * missões do dia, pedra de retorno, XP descansado, conquistas e títulos, reputação, especialização,
 * monstro raro, portas de código das masmorras e mascotes. Tudo puro e testável; o estado fica em hero.adventure.
 */
export type Faction = 'mercadores' | 'ferreiros' | 'sabios';
export type PetId = 'boar' | 'spider' | 'wolf' | 'golem' | 'wraith' | 'dragon';
export type DailyState = { day: string; ids: string[]; progress: number[]; claimed: boolean[] };
export interface AdventureState {
  daily: DailyState; hearthAt: number; rested: number; kinds: Partial<Record<MonsterKind, number>>; gathers: number; rares: number; rareDone: number;
  dailyDone: number; achievements: string[]; title: string; rep: Record<Faction, number>; spec: string; doors: string[]; pet: string;
  /** Pontos de código da vila já construídos (lanterna, flores, ponte...). */
  built: string[];
  /** Caramelo, o vira-lata da cidade: amizade, última refeição e quantas vezes comeu. */
  dog: DogState;
  /** Banco da Aurora: saldo guardado e desde quando rende juros. */
  bank: BankState;
}
const num = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
const rec = (v: unknown) => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const strs = (v: unknown) => Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [];
export function cleanAdventure(input: unknown): AdventureState {
  const a = rec(input), d = rec(a.daily), rep = rec(a.rep), kinds = rec(a.kinds);
  const ids = strs(d.ids).filter(id => DAILY_POOL.some(t => t.id === id)).slice(0, 3);
  return {
    daily: { day: typeof d.day === 'string' ? d.day : '', ids, progress: ids.map((_, i) => Math.floor(num(Array.isArray(d.progress) ? d.progress[i] : 0, 0, 999))), claimed: ids.map((_, i) => Array.isArray(d.claimed) && d.claimed[i] === true) },
    hearthAt: num(a.hearthAt), rested: Math.floor(num(a.rested)), gathers: Math.floor(num(a.gathers)), rares: Math.floor(num(a.rares)), rareDone: Math.floor(num(a.rareDone)), dailyDone: Math.floor(num(a.dailyDone)),
    kinds: Object.fromEntries(Object.entries(kinds).filter(([k]) => ['wolf', 'spider', 'boar', 'golem', 'wraith', 'dragon'].includes(k)).map(([k, v]) => [k, Math.floor(num(v))])),
    achievements: strs(a.achievements).filter(id => ACHIEVEMENTS.some(x => x.id === id)),
    title: typeof a.title === 'string' && ACHIEVEMENTS.some(x => x.id === a.title) ? a.title : '',
    rep: { mercadores: Math.floor(num(rep.mercadores, 0, REP_MAX)), ferreiros: Math.floor(num(rep.ferreiros, 0, REP_MAX)), sabios: Math.floor(num(rep.sabios, 0, REP_MAX)) },
    spec: typeof a.spec === 'string' && Object.values(SPECS).some(list => list.some(s => s.id === a.spec)) ? a.spec : '',
    doors: strs(a.doors), dog: cleanDog(a.dog), bank: cleanBank(a.bank), built: strs(a.built).filter(id => id.startsWith('spot-')).slice(0, 32), pet: typeof a.pet === 'string' && Object.hasOwn(PETS, a.pet) ? a.pet : '',
  };
}
export const adventureOf = (hero: Pick<HeroData, 'adventure'>) => cleanAdventure(hero.adventure);
export function hash(text: string) { let h = 2166136261; for (const c of text) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// ── Missões do dia ──────────────────────────────────────────────────────────────
export type DailyTask = { id: string; label: string; type: 'kill' | 'collect' | 'code'; kind?: MonsterKind | 'any'; node?: 'herb' | 'crystal'; count: number; faction: Faction; level: number; lesson?: string };
export const DAILY_POOL: DailyTask[] = [
  { id: 'd-code', label: 'Resolver ou revisar 1 runa', type: 'code', count: 1, faction: 'sabios', level: 1 },
  { id: 'd-boar', label: 'Vencer 4 javalis', type: 'kill', kind: 'boar', count: 4, faction: 'ferreiros', level: 1 },
  { id: 'd-spider', label: 'Vencer 4 aranhas', type: 'kill', kind: 'spider', count: 4, faction: 'mercadores', level: 1 },
  { id: 'd-any', label: 'Vencer 6 monstros', type: 'kill', kind: 'any', count: 6, faction: 'mercadores', level: 1 },
  { id: 'd-herb', label: 'Coletar 3 ervas', type: 'collect', node: 'herb', count: 3, faction: 'mercadores', level: 1 },
  { id: 'd-wolf', label: 'Vencer 3 lobos', type: 'kill', kind: 'wolf', count: 3, faction: 'ferreiros', level: 3 },
  { id: 'd-crystal', label: 'Coletar 3 cristais de runa', type: 'collect', node: 'crystal', count: 3, faction: 'sabios', level: 2, lesson: 'variables' },
  { id: 'd-golem', label: 'Vencer 2 golens', type: 'kill', kind: 'golem', count: 2, faction: 'ferreiros', level: 10, lesson: 'conditions' },
  { id: 'd-wraith', label: 'Vencer 2 espectros', type: 'kill', kind: 'wraith', count: 2, faction: 'sabios', level: 15 },
];
/** O dia vira à meia-noite de Brasília, para todos os jogadores. */
export function dayKey(now: number) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now)); }
/** Sempre uma tarefa de código e mais duas sorteadas pelo dia (iguais o dia inteiro). */
export function dailyFor(day: string, heroId: string, level: number, lessons: string[]): string[] {
  const pool = DAILY_POOL.filter(t => t.type !== 'code' && level >= t.level && (!t.lesson || lessons.includes(t.lesson)));
  const picked: string[] = [], seed = hash(day + heroId);
  for (let i = 0; picked.length < 2 && i < pool.length * 3; i++) { const t = pool[(seed + i * 7) % pool.length]; if (!picked.includes(t.id)) picked.push(t.id); }
  return ['d-code', ...picked];
}
export function ensureDaily(adv: AdventureState, now: number, heroId: string, level: number, lessons: string[]): AdventureState {
  const day = dayKey(now); if (adv.daily.day === day && adv.daily.ids.length) return adv;
  const ids = dailyFor(day, heroId, level, lessons);
  return { ...adv, daily: { day, ids, progress: ids.map(() => 0), claimed: ids.map(() => false) } };
}
export type DailyEvent = { type: 'kill'; kind: MonsterKind } | { type: 'collect'; node: 'herb' | 'crystal' } | { type: 'code' };
export function dailyWants(adv: AdventureState, event: DailyEvent) {
  return adv.daily.ids.some((id, i) => { const t = DAILY_POOL.find(t => t.id === id); return !!t && !adv.daily.claimed[i] && adv.daily.progress[i] < t.count && matches(t, event); });
}
function matches(t: DailyTask, e: DailyEvent) { return t.type === e.type && (e.type === 'kill' ? t.kind === 'any' || t.kind === e.kind : e.type === 'collect' ? t.node === e.node : true); }
export function progressDaily(adv: AdventureState, event: DailyEvent): AdventureState {
  if (!dailyWants(adv, event)) return adv;
  const progress = adv.daily.ids.map((id, i) => { const t = DAILY_POOL.find(t => t.id === id)!; return !adv.daily.claimed[i] && adv.daily.progress[i] < t.count && matches(t, event) ? adv.daily.progress[i] + 1 : adv.daily.progress[i]; });
  return { ...adv, daily: { ...adv.daily, progress } };
}
export const dailyReward = (level: number) => ({ xp: 30 + level * 14, gold: 8 + level * 3, rep: 60 });

// ── Pedra de retorno e XP descansado ────────────────────────────────────────────
export const HEARTH_MS = 5 * 60_000;
export const restCap = (level: number) => 120 + level * 50;
/** Enche o bônus inteiro em 10 minutos parado na vila. */
export function accrueRest(adv: AdventureState, level: number, seconds: number): AdventureState {
  const cap = restCap(level); if (seconds <= 0 || adv.rested >= cap) return adv;
  return { ...adv, rested: Math.min(cap, Math.round(adv.rested + cap / 600 * seconds)) };
}
/** Cada luta vencida dobra o XP enquanto houver bônus descansado. */
export const restBonus = (adv: AdventureState, xp: number) => Math.min(adv.rested, xp);

// ── Reputação ───────────────────────────────────────────────────────────────────
export const REP_MAX = 3000;
export const FACTIONS: Record<Faction, { name: string; npcs: NpcId[]; perk: string }> = {
  mercadores: { name: 'Mercadores da Aurora', npcs: ['elara', 'dorin', 'mira'], perk: 'desconto nas lojas' },
  ferreiros: { name: 'Forja de Babbage', npcs: ['borin'], perk: 'desconto no ferreiro e nos reparos' },
  sabios: { name: 'Círculo das Runas', npcs: ['eldrin', 'lion', 'lovelace', 'pip', 'traveler'], perk: 'mais XP nas runas e missões do dia' },
};
export const REP_LEVELS = [{ name: 'Neutro', min: 0 }, { name: 'Amigável', min: 250 }, { name: 'Honrado', min: 750 }, { name: 'Reverenciado', min: 1500 }, { name: 'Exaltado', min: 3000 }];
export const repRank = (points: number) => REP_LEVELS.reduce((rank, l, i) => points >= l.min ? i : rank, 0);
/** 0%, 5%, 10%, 15% ou 20%, conforme a reputação. */
export const repPercent = (adv: AdventureState, faction: Faction) => repRank(adv.rep[faction]) * 5;
export const factionOf = (npc: NpcId): Faction => (Object.keys(FACTIONS) as Faction[]).find(f => FACTIONS[f].npcs.includes(npc)) ?? 'sabios';
export const addRep = (adv: AdventureState, faction: Faction, amount: number): AdventureState => ({ ...adv, rep: { ...adv.rep, [faction]: Math.min(REP_MAX, adv.rep[faction] + amount) } });
export const discounted = (price: number, percent: number) => percent && price > 0 ? Math.max(1, Math.round(price * (1 - percent / 100))) : price;

// ── Conquistas, títulos e mascotes ──────────────────────────────────────────────
export const PETS: Record<PetId, string> = { boar: 'Leitão Valente', spider: 'Aranhinha Tecelã', wolf: 'Filhote de Lobo', golem: 'Pedrinha', wraith: 'Faísca Rúnica', dragon: 'Dragãozinho' };
type Ctx = { hero: HeroData; adv: AdventureState; completed: string[] };
export const ACHIEVEMENTS: { id: string; name: string; goal: string; title: string; pet?: PetId; check: (c: Ctx) => boolean }[] = [
  { id: 'first', name: 'Primeiro passo', goal: 'Vença 1 monstro', title: 'Aventureiro', check: c => c.hero.kills >= 1 },
  { id: 'boar', name: 'Caçador de Javalis', goal: 'Vença 10 javalis', title: 'Caçador de Javalis', pet: 'boar', check: c => (c.adv.kinds.boar ?? 0) >= 10 },
  { id: 'spider', name: 'Caçador de Aranhas', goal: 'Vença 10 aranhas', title: 'Caçador de Aranhas', pet: 'spider', check: c => (c.adv.kinds.spider ?? 0) >= 10 },
  { id: 'wolf', name: 'Domador de Lobos', goal: 'Vença 10 lobos', title: 'Domador de Lobos', pet: 'wolf', check: c => (c.adv.kinds.wolf ?? 0) >= 10 },
  { id: 'gather', name: 'Mão verde', goal: 'Colete 20 ervas ou cristais', title: 'Herborista', check: c => c.adv.gathers >= 20 },
  { id: 'runes', name: 'Aprendiz de Runas', goal: 'Restaure 4 runas', title: 'Aprendiz de Runas', check: c => c.completed.length >= 4 },
  { id: 'debug', name: 'O Depurador', goal: 'Conclua a runa de Depuração', title: 'O Depurador', check: c => c.completed.includes('debug') },
  { id: 'forest', name: 'Senhor do Bosque', goal: 'Vença o Brutamato', title: 'Vencedor do Bosque', check: c => c.hero.defeatedBosses.includes('boss-forest') },
  { id: 'rare', name: 'Olho de águia', goal: 'Vença um monstro raro', title: 'Caçador de Raros', pet: 'dragon', check: c => c.adv.rares >= 1 },
  { id: 'daily', name: 'Pontual', goal: 'Receba 10 missões do dia', title: 'Pontual', check: c => c.adv.dailyDone >= 10 },
  { id: 'doors', name: 'Quebra-Códigos', goal: 'Abra as 3 portas da Caverna', title: 'Quebra-Códigos', check: c => ['cavern-1', 'cavern-2', 'cavern-3'].every(d => c.adv.doors.includes(d)) },
  { id: 'friend', name: 'Querido na vila', goal: 'Chegue a Honrado com um grupo', title: 'Amigo da Vila', check: c => Object.values(c.adv.rep).some(p => p >= 750) },
];
/** Mascotes que vêm da reputação (Honrado). */
export const REP_PETS: Partial<Record<Faction, PetId>> = { ferreiros: 'golem', sabios: 'wraith' };
export function newAchievements(c: Ctx) { return ACHIEVEMENTS.filter(a => !c.adv.achievements.includes(a.id) && a.check(c)); }
export function unlockedPets(adv: AdventureState): PetId[] {
  const pets = ACHIEVEMENTS.filter(a => a.pet && adv.achievements.includes(a.id)).map(a => a.pet!);
  for (const [f, pet] of Object.entries(REP_PETS) as [Faction, PetId][]) if (adv.rep[f] >= 750) pets.push(pet);
  return [...new Set(pets)];
}
export const titleOf = (adv: AdventureState) => ACHIEVEMENTS.find(a => a.id === adv.title)?.title ?? '';

// ── Especialização (nível 10) ───────────────────────────────────────────────────
export const SPEC_LEVEL = 10;
export type Spec = { id: string; name: string; style: 'guard' | 'fury'; power: string; description: string };
const pair = (c: string, guard: [string, string], fury: [string, string]): [Spec, Spec] => [
  { id: c + '-guard', name: guard[0], style: 'guard', power: guard[1], description: 'Defesa +15%, vida +12%. O Poder (R) bate menos, mas cura 12% da vida.' },
  { id: c + '-fury', name: fury[0], style: 'fury', power: fury[1], description: 'Ataque +12%. O Poder (R) causa 35% a mais de dano.' },
];
export const SPECS: Record<ClassId, [Spec, Spec]> = {
  paladin: pair('paladin', ['Guardião da Luz', 'Égide Radiante'], ['Cruzado', 'Sentença Solar']),
  warrior: pair('warrior', ['Muralha', 'Grito de Ferro'], ['Berserker', 'Fúria Selvagem']),
  hunter: pair('hunter', ['Mestre das Feras', 'Vínculo Curativo'], ['Atirador', 'Tiro Certeiro']),
  engineer: pair('engineer', ['Blindado', 'Escudo de Engrenagens'], ['Artilheiro', 'Canhão de Pulso']),
  mage: pair('mage', ['Guardião Rúnico', 'Barreira Arcana'], ['Arcano', 'Cometa Estelar']),
  hacker: pair('hacker', ['Sabotador', 'Firewall'], ['Sombra', 'Golpe Invisível']),
  prophet: pair('prophet', ['Luz Curativa', 'Prece Maior'], ['Disciplina', 'Castigo Sagrado']),
  duelist: pair('duelist', ['Esquiva', 'Dança das Lâminas'], ['Lâmina Dançante', 'Corte Final']),
  shaman: pair('shaman', ['Espíritos', 'Sopro da Vida'], ['Tempestade', 'Relâmpago Ancestral']),
};
export const SPEC_EFFECT = { guard: { attack: 1, defense: 1.15, maxHp: 1.12, powerDamage: .85, powerHeal: .12 }, fury: { attack: 1.12, defense: 1, maxHp: 1, powerDamage: 1.35, powerHeal: 0 } } as const;
export function specOf(hero: Pick<HeroData, 'classId' | 'level' | 'adventure'>): Spec | undefined {
  if (hero.level < SPEC_LEVEL) return undefined; const id = hero.adventure?.spec;
  return SPECS[hero.classId].find(s => s.id === id);
}
/** A primeira escolha é grátis; trocar depois custa bronze. */
export const specChangeCost = (level: number) => 50 + level * 10;

// ── Monstro raro ────────────────────────────────────────────────────────────────
export const RARE_WINDOW_MS = 7 * 60_000, RARE_ACTIVE_MS = 3 * 60_000;
/** A cada 7 minutos um monstro comum da região vira raro por 3 minutos (o mesmo para todos). */
export function rareNow(now: number, region: RegionId) {
  const window = Math.floor(now / RARE_WINDOW_MS); if (now - window * RARE_WINDOW_MS > RARE_ACTIVE_MS) return null;
  const pool = MONSTERS.filter(m => m.region === region && !m.boss && !m.instance && m.level >= 2); if (!pool.length) return null;
  const monster = pool[hash('rare' + window) % pool.length];
  return { monsterId: monster.id, name: monster.name, window, endsAt: window * RARE_WINDOW_MS + RARE_ACTIVE_MS };
}

// ── Montaria ────────────────────────────────────────────────────────────────────
export const MOUNT_LEVEL = 10;
/** Nível 10: montaria básica (+35%). Nível 30 com o Javali de Montaria equipado: +50%. */
export function mountSpeed(hero: Pick<HeroData, 'level' | 'inventory' | 'equipped'>) { return hero.level >= 30 && hero.inventory.includes('mount-boar') && hero.equipped.includes('mount-boar') ? 1.5 : 1.35; }
