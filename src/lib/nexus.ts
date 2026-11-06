/**
 * Nexus central (o cristal de Lion): todo XP ganho também carrega o Nexus. Cheio, o jogador toca no cristal
 * e recebe a Aura do Herói por 10 minutos de jogo (o tempo para quando um menu está aberto).
 * Meta de leve a média: cerca de 10–15 lutas no começo, crescendo com o nível.
 */
export type NexusState = { charge: number; aura: number };
export const NEXUS_SECONDS = 600;
export const NEXUS_BONUS = { attack: 1.12, defense: 1.12, maxHp: 1.1 } as const;
export const nexusGoal = (level: number) => 400 + Math.max(1, level) * 60;
export function cleanNexus(raw: unknown): NexusState {
  const r = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const num = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
  return { charge: num(r.charge, 1e7), aura: num(r.aura, NEXUS_SECONDS) };
}
/** XP ganho carrega o Nexus (só enquanto a aura não está ativa), até a meta do nível. */
export function chargeNexus(state: NexusState | undefined, amount: number, level: number): NexusState {
  const n = cleanNexus(state);
  return n.aura > 0 ? n : { ...n, charge: Math.min(nexusGoal(level), n.charge + Math.max(0, Math.floor(amount))) };
}
export const nexusFull = (state: NexusState | undefined, level: number) => cleanNexus(state).charge >= nexusGoal(level);
