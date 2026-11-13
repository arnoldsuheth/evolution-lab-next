/** 5.0: clima de cada região, igual para todos os jogadores no mesmo minuto (segue o relógio real). */
export type WeatherKind = 'clear' | 'rain' | 'snow' | 'soot' | 'dust';
export type Weather = { kind: WeatherKind; strength: number };

/** Ciclos em minutos: chove `on` minutos a cada `every` (com 1 minuto para começar e parar devagar). */
const RAIN: Record<string, { every: number; on: number }> = { bosque: { every: 18, on: 6 }, frontier: { every: 26, on: 5 }, aurora: { every: 40, on: 5 } };

function cycle(minutes: number, every: number, on: number) {
  const m = ((minutes % every) + every) % every;
  if (m >= on) return 0;
  return Math.min(1, m, on - m); // sobe no 1º minuto, desce no último
}

export function regionWeather(region: string, now = Date.now()): Weather {
  // Para testar a aparência: localStorage 'lovelace-clima-teste' = rain | snow | soot | dust.
  try { const forced = typeof localStorage === 'undefined' ? null : localStorage.getItem('lovelace-clima-teste'); if (forced === 'rain' || forced === 'snow' || forced === 'soot' || forced === 'dust') return { kind: forced, strength: 1 }; } catch { /* sem armazenamento */ }
  const minutes = now / 60000;
  const rain = RAIN[region];
  if (rain) { const s = cycle(minutes, rain.every, rain.on); return s > 0 ? { kind: 'rain', strength: s } : { kind: 'clear', strength: 0 }; }
  if (region === 'iron-forge') return { kind: 'snow', strength: .45 + .55 * cycle(minutes, 20, 7) };
  if (region === 'ogrimmar') return { kind: 'soot', strength: .55 };
  if (region === 'ruins') return { kind: 'dust', strength: .35 + .65 * cycle(minutes, 15, 4) };
  return { kind: 'clear', strength: 0 };
}

/** 0 = meio-dia claro, 1 = noite fechada (a partir da luz do mundo). */
export const nightness = (light: number) => Math.max(0, Math.min(1, (.62 - light) / .4));
