/**
 * Caramelo, o vira-lata da Pedra da Aurora (mascote do jogo).
 * Ele vive na cidade, segue o herói pelas ruas e pede comida. Cada comida enche a barra de amizade.
 * Tudo aqui é dado puro (testado); o mundo 3D e a janela só mostram.
 */
export interface DogState { friendship: number; fedAt: number; meals: number }
export const DOG_NAME = 'Caramelo';
export const FRESH_DOG: DogState = { friendship: 0, fedAt: 0, meals: 0 };
/** Depois de comer, ele fica satisfeito por um tempinho (não dá para encher a barra de uma vez). */
export const DOG_FULL_MS = 45_000;
export const TREAT_PRICE = 8;
export const FOOD_GAIN = 15, TREAT_GAIN = 8;

export const DOG_LEVELS = [
  { min: 0, name: 'Desconfiado', face: '🐾', line: 'Ele te olha de longe, abanando o rabo devagar. Será que você tem um petisco?' },
  { min: 20, name: 'Curioso', face: '👀', line: 'Ele chega mais perto e cheira sua mochila. O rabo já balança mais rápido!' },
  { min: 45, name: 'Amigo', face: '😊', line: 'Ele te segue pelas ruas e late feliz quando você chega. Ganhou uma bandana!' },
  { min: 75, name: 'Melhor amigo', face: '💛', line: 'Ele pula, rola no chão e não sai do seu lado. Vocês são inseparáveis.' },
  { min: 100, name: 'Companheiro fiel', face: '🏅', line: 'Amizade completa! Alegria do Caramelo: +10% de HP máximo e, se você cair, ele te põe de pé no mesmo lugar.' },
] as const;

export function cleanDog(input: unknown): DogState {
  const d = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const n = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0;
  return { friendship: Math.round(n(d.friendship, 100)), fedAt: n(d.fedAt, Number.MAX_SAFE_INTEGER), meals: Math.floor(n(d.meals, 1_000_000)) };
}
export const dogLevel = (friendship: number) => [...DOG_LEVELS].reverse().find(l => friendship >= l.min) ?? DOG_LEVELS[0];
export const nextDogLevel = (friendship: number) => DOG_LEVELS.find(l => l.min > friendship);
export const dogHungry = (dog: DogState, now: number) => now - dog.fedAt >= DOG_FULL_MS;
/** Comida da mochila que ele aceita: pão, ensopado e frutas (itens "food-"). */
export const dogFood = (inventory: string[]) => inventory.find(id => id.startsWith('food-'));

/** Dar comida: devolve o novo estado e a reação dele. Não mexe em mochila nem moedas (o store faz isso). */
export function feedDog(dog: DogState, now: number, kind: 'food' | 'treat') {
  if (dog.friendship >= 100) return { ok: false as const, dog, message: `${DOG_NAME} já é seu companheiro fiel! Ele agradece com uma lambida, mas está de barriga cheia.` };
  if (!dogHungry(dog, now)) return { ok: false as const, dog, message: `${DOG_NAME} acabou de comer e está deitado de barriga para cima. Volte daqui a pouco!` };
  const before = dogLevel(dog.friendship), friendship = Math.min(100, dog.friendship + (kind === 'food' ? FOOD_GAIN : TREAT_GAIN));
  const after = dogLevel(friendship), next: DogState = { friendship, fedAt: now, meals: dog.meals + 1 };
  const up = after.min !== before.min;
  return { ok: true as const, dog: next, levelUp: up, message: up ? `${after.face} ${DOG_NAME} agora é seu ${after.name.toLowerCase()}! ${after.line}` : `❤ ${DOG_NAME} comeu tudo e abanou o rabo! Amizade ${friendship}/100.` };
}

/** Alegria do Caramelo: com a amizade completa ele dá +10% de HP máximo e, se você cair,
 *  te põe de pé no mesmo lugar (em vez de voltar para a vila). */
export const DOG_JOY_HP = 0.1;
export const hasDogJoy = (hero: { adventure?: { dog?: { friendship?: number } } }) => (hero.adventure?.dog?.friendship ?? 0) >= 100;

let barkContext: AudioContext | null = null;
/** "Au-au" curtinho feito na hora (sem arquivo de som). Respeita volume e mudo do jogo. */
export function bark(volume: number, times = 2) {
  if (typeof window === 'undefined' || volume <= 0) return;
  try {
    barkContext ??= new AudioContext();
    const ctx = barkContext, start = ctx.currentTime + .02;
    for (let i = 0; i < times; i++) {
      const t = start + i * .2, osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(560, t); osc.frequency.exponentialRampToValueAtTime(240, t + .12);
      filter.type = 'lowpass'; filter.frequency.value = 1400;
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.32 * volume, t + .015); gain.gain.exponentialRampToValueAtTime(.001, t + .14);
      osc.connect(filter).connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t + .16);
    }
  } catch { /* navegador sem áudio: segue sem latido */ }
}
