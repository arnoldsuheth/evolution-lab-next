import type { NpcId } from './game';
import type { MonsterKind } from './campaign';

/**
 * Missões secundárias de clique: falar, caçar e coletar. As de programação continuam sendo as runas.
 * Tudo puro e testável; a loja só guarda o diário (QuestLog) dentro do herói.
 */
export type QuestObjective =
  | { type: 'talk'; npc: NpcId; label: string }
  | { type: 'kill'; kinds?: MonsterKind[]; ids?: string[]; count: number; label: string }
  | { type: 'collect'; node: GatherKind; count: number; label: string };
export type Quest = { id: string; title: string; giver: NpcId; level: number; after?: string; lesson?: string; intro: string; finish: string; objectives: QuestObjective[]; reward: { xp: number; gold: number } };
export type QuestLog = { active: Record<string, number[]>; done: string[] };
export type QuestEvent = { type: 'talk'; npc: NpcId } | { type: 'kill'; kind: MonsterKind; id: string } | { type: 'collect'; node: GatherKind };
export type GatherKind = 'herb' | 'crystal';

export const QUESTS: Quest[] = [
  { id: 'q-boas-vindas', title: 'Boas-vindas à Aurora', giver: 'lovelace', level: 1, intro: 'Conheça quem vai te ajudar: fale com Boole, Babbage e Mira.', finish: 'Agora você sabe a quem pedir ajuda. Bem-vindo à vila!', objectives: [{ type: 'talk', npc: 'eldrin', label: 'Falar com Boole' }, { type: 'talk', npc: 'borin', label: 'Falar com Babbage' }, { type: 'talk', npc: 'mira', label: 'Falar com Mira' }], reward: { xp: 40, gold: 80 } },
  { id: 'q-couro', title: 'Couro para a oficina', giver: 'borin', level: 1, after: 'q-boas-vindas', intro: 'Os javalis do Campo dos Javalis (oeste) estão comendo as plantações. Traga couro de 3 deles.', finish: 'Couro de primeira! Vou fazer boas botas com isto.', objectives: [{ type: 'kill', kinds: ['boar'], count: 3, label: 'Javalis vencidos' }], reward: { xp: 60, gold: 120 } },
  { id: 'q-ervas', title: 'Ervas da Aurora', giver: 'mira', level: 1, after: 'q-boas-vindas', intro: 'Preciso de 5 ervas brilhantes. Elas crescem nos campos ao redor da vila.', finish: 'Perfeitas! Com isto preparo poções para todos os aventureiros.', objectives: [{ type: 'collect', node: 'herb', count: 5, label: 'Ervas coletadas' }], reward: { xp: 50, gold: 96 } },
  { id: 'q-teias', title: 'Teias no pomar', giver: 'mira', level: 1, after: 'q-ervas', intro: 'Aranhas tomaram o pomar ao sul da avenida. Afaste 3 delas.', finish: 'O pomar voltou a dar frutas. Obrigada!', objectives: [{ type: 'kill', kinds: ['spider'], count: 3, label: 'Aranhas vencidas' }], reward: { xp: 70, gold: 144 } },
  { id: 'q-lobos', title: 'Uivos nas colinas', giver: 'borin', level: 3, after: 'q-couro', intro: 'Lobos rondam as Colinas dos Lobos, a oeste da praça. Vença 3 lobos.', finish: 'As colinas estão seguras de novo. Você está ficando forte!', objectives: [{ type: 'kill', kinds: ['wolf'], count: 3, label: 'Lobos vencidos' }], reward: { xp: 110, gold: 200 } },
  { id: 'q-lanternas', title: 'A luz da praça', giver: 'eldrin', level: 1, lesson: 'variables', intro: 'Sua primeira runa acendeu as lanternas! Conte para Lovelace o que você aprendeu.', finish: 'Cada runa que você restaura muda o mundo de verdade.', objectives: [{ type: 'talk', npc: 'lovelace', label: 'Contar a Lovelace sobre as lanternas' }], reward: { xp: 30, gold: 40 } },
  { id: 'q-cristais', title: 'Fragmentos da floresta', giver: 'pip', level: 2, lesson: 'variables', intro: 'Há cristais de runa espalhados pela Floresta das Variáveis. Junte 4 para mim. Shhh!', finish: 'Que brilho! Babbage vai ficar com inveja.', objectives: [{ type: 'collect', node: 'crystal', count: 4, label: 'Cristais coletados' }], reward: { xp: 90, gold: 160 } },
  { id: 'q-senhor-bosque', title: 'O Senhor do Bosque', giver: 'pip', level: 5, after: 'q-cristais', intro: 'O Brutamato guarda o coração da floresta. Vença-o e a floresta fica livre.', finish: 'Você venceu o Brutamato! A floresta inteira fala de você.', objectives: [{ type: 'kill', ids: ['boss-forest'], count: 1, label: 'Brutamato vencido' }], reward: { xp: 220, gold: 400 } },
];
/** Pontos de coleta: brilham no chão; somem por alguns segundos depois de coletados. */
export const GATHER_NODES: { id: string; node: GatherKind; x: number; z: number }[] = [
  ...([[-21, 6], [-21, 1.5], [-12, 16.5], [-27, 15], [14, 8], [-6, 21], [20, 16], [-30, 3]] as const).map(([x, z], i) => ({ id: 'herb-' + i, node: 'herb' as const, x, z })),
  ...([[-6, -20], [4, -22], [-13, -16], [9, -18], [-2, -26]] as const).map(([x, z], i) => ({ id: 'crystal-' + i, node: 'crystal' as const, x, z })),
];
export const GATHER_RESPAWN_MS = 30000, MONSTER_RESPAWN_MS = 40000;

export const emptyLog = (): QuestLog => ({ active: {}, done: [] });
export function cleanLog(input: unknown): QuestLog {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const active: Record<string, number[]> = {};
  const rawActive = raw.active && typeof raw.active === 'object' ? raw.active as Record<string, unknown> : {};
  for (const quest of QUESTS) {
    const progress = rawActive[quest.id];
    if (Array.isArray(progress)) active[quest.id] = quest.objectives.map((o, i) => Math.max(0, Math.min(goal(o), Math.floor(Number(progress[i]) || 0))));
  }
  const done = Array.isArray(raw.done) ? [...new Set(raw.done.filter((id): id is string => typeof id === 'string' && QUESTS.some(q => q.id === id)))] : [];
  for (const id of done) delete active[id];
  return { active, done };
}
export const goal = (o: QuestObjective) => o.type === 'talk' ? 1 : o.count;
export type QuestStatus = 'locked' | 'available' | 'active' | 'ready' | 'done';
export function questStatus(log: QuestLog, quest: Quest, level: number, lessons: string[]): QuestStatus {
  if (log.done.includes(quest.id)) return 'done';
  const progress = log.active[quest.id];
  if (progress) return quest.objectives.every((o, i) => (progress[i] ?? 0) >= goal(o)) ? 'ready' : 'active';
  if (level < quest.level || (quest.after && !log.done.includes(quest.after)) || (quest.lesson && !lessons.includes(quest.lesson))) return 'locked';
  return 'available';
}
/** Por que ainda não dá para pegar a missão (para mostrar ao jogador). */
export function questLockReason(log: QuestLog, quest: Quest, level: number, lessons: string[]) {
  if (level < quest.level) return `Requer nível ${quest.level}`;
  if (quest.after && !log.done.includes(quest.after)) return `Conclua antes: ${QUESTS.find(q => q.id === quest.after)?.title}`;
  if (quest.lesson && !lessons.includes(quest.lesson)) return 'Restaure a primeira runa com Boole';
  return undefined;
}
export function acceptQuest(log: QuestLog, id: string, level: number, lessons: string[]): QuestLog {
  const quest = QUESTS.find(q => q.id === id);
  if (!quest || questStatus(log, quest, level, lessons) !== 'available') return log;
  return { ...log, active: { ...log.active, [id]: quest.objectives.map(() => 0) } };
}
/** Aplica um acontecimento (falar, vencer, coletar) a todas as missões ativas. */
export function progressQuests(log: QuestLog, event: QuestEvent): { log: QuestLog; changed: string[] } {
  const active = { ...log.active }, changed: string[] = [];
  for (const [id, progress] of Object.entries(log.active)) {
    const quest = QUESTS.find(q => q.id === id); if (!quest) continue;
    const next = quest.objectives.map((o, i) => {
      const value = progress[i] ?? 0; if (value >= goal(o)) return value;
      const hit = o.type === 'talk' ? event.type === 'talk' && event.npc === o.npc
        : o.type === 'kill' ? event.type === 'kill' && (o.ids ? o.ids.includes(event.id) : !!o.kinds?.includes(event.kind))
        : event.type === 'collect' && event.node === o.node;
      return hit ? value + 1 : value;
    });
    if (next.some((v, i) => v !== progress[i])) { active[id] = next; changed.push(id); }
  }
  return { log: changed.length ? { ...log, active } : log, changed };
}
export function turnInQuest(log: QuestLog, id: string): { log: QuestLog; reward?: Quest['reward'] } {
  const quest = QUESTS.find(q => q.id === id), progress = log.active[id];
  if (!quest || !progress || !quest.objectives.every((o, i) => (progress[i] ?? 0) >= goal(o))) return { log };
  const active = { ...log.active }; delete active[id];
  return { log: { active, done: [...log.done, id] }, reward: quest.reward };
}
/** Marcador acima do NPC, como nos RPGs clássicos: ! tem missão nova, ? tem missão para entregar. */
export function npcMarker(log: QuestLog, npc: NpcId, level: number, lessons: string[]): '!' | '?' | '' {
  const mine = QUESTS.filter(q => q.giver === npc), states = mine.map(q => questStatus(log, q, level, lessons));
  return states.includes('ready') ? '?' : states.includes('available') ? '!' : '';
}
