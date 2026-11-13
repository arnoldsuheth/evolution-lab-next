import { DEFAULT_LOOK, RACE_CLASSES, type ClassId, type Look, type Race } from './game';
import { RACIAL_CITIES, type NewCity } from './kingdomCities';

/** Moradores das cidades (lógica pura, testável): quem são e por onde andam. */
export type Walker = { race: Race; classId: ClassId; look: Look; celestial?: boolean };

/** Rotas fechadas pela praça (não passam por dentro das casas). */
export const FOLK_ROUTE: Record<'city' | 'goddard', [number, number][]> = {
  city: [[-5, 6], [5, 6], [5.5, -3.5], [-5.5, -3.5]],
  goddard: [[-6.5, 4], [6.5, 4], [6.5, -1], [-6.5, -1]],
};

/** Posição e direção ao longo da rota fechada, com t de 0 a 1. */
export function routePoint(route: [number, number][], t: number): { x: number; z: number; heading: number } {
  const lengths = route.map((p, i) => { const q = route[(i + 1) % route.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]); });
  const total = lengths.reduce((a, b) => a + b, 0);
  let d = (((t % 1) + 1) % 1) * total, i = 0;
  while (d > lengths[i] && i < route.length - 1) { d -= lengths[i]; i++; }
  const p = route[i], q = route[(i + 1) % route.length], k = lengths[i] ? d / lengths[i] : 0;
  return { x: p[0] + (q[0] - p[0]) * k, z: p[1] + (q[1] - p[1]) * k, heading: Math.atan2(q[0] - p[0], q[1] - p[1]) };
}

/** Moradores de cada cidade: sempre da raça da cidade; em Goddard, celestiais. */
export function cityFolk(city: NewCity): Walker[][] {
  if (city === 'goddard') {
    const robot = (classId: ClassId, i: number): Walker => ({ race: 'human', classId, celestial: true, look: { ...DEFAULT_LOOK, hair: 14, beard: 0, moustache: 0, skin: 0, body: 1 + i % 3, gender: i % 2 } });
    return [[robot('mage', 0), robot('paladin', 1)], [robot('engineer', 2), robot('mage', 3)]];
  }
  const race = RACIAL_CITIES[city].race, classes = RACE_CLASSES[race];
  const folk = (i: number): Walker => ({ race, classId: classes[i % classes.length], look: { ...DEFAULT_LOOK, gender: i % 2, hair: [1, 2, 10, 5, 11, 12][i % 6], hairColor: (i * 2 + 1) % 7, beard: race === 'dwarf' ? i % 6 : i % 2 ? 0 : 1 + i % 3, skin: i % 3, body: 1 + i % 4, face: i % 6 } });
  return [[folk(0), folk(1)], [folk(2), folk(3)]];
}

