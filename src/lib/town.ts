/**
 * Pedra da Aurora como cidade de verdade: avenidas que ligam as portas, trilhas até os campos de caça
 * e objetos de cidade com colisão. Tudo é dado puro (testado) e o mundo 3D só desenha.
 * Cada runa de programação acende ou destrava algo real neste mapa (WORLD_UNLOCKS).
 */
import { INSTANCES } from "./instances";

export type Point = [number, number];
export type Road = { id: string; a: Point; b: Point; width: number; kind: 'road' | 'trail' };
export const PLAZA_RADIUS = 6.7;
export type InteriorPanel = 'codex' | 'academy' | 'character';
export type Interior = {
  id: string; x: number; z: number; w: number; d: number;
  label: string; panel: InteriorPanel; accent: string;
};
export const ARCHIVE: Interior = { id: 'archive', x: -8, z: -6, w: 2.8, d: 2.5, label: 'Consultar o Códice', panel: 'codex', accent: '#b88b58' };
export const WORKSHOP: Interior = { id: 'workshop', x: -9, z: 5, w: 2.7, d: 2.7, label: 'Abrir equipamento e fabricação', panel: 'character', accent: '#bf8445' };
export const ACADEMY: Interior = { id: 'academy', x: 9, z: -7, w: 2.6, d: 2.6, label: 'Abrir estudos de programação', panel: 'academy', accent: '#6daabf' };
export const INTERIORS = [ARCHIVE, WORKSHOP, ACADEMY];

export function interiorBlocks(room: Interior, x: number, z: number) {
  const dx = Math.abs(x - room.x);
  const dz = z - room.z;
  if (dx >= room.w + .4 || Math.abs(dz) >= room.d + .4) return false;
  return dx >= room.w - .95 || dz <= -1.6 || (dz >= 1.6 && dx >= .85) ||
    (dx < .8 && dz >= -1.5 && dz <= -.75);
}

export const ROADS: Road[] = [
  { id: 'eixo-cidadela', a: [0, -28], b: [0, 20], width: 4.8, kind: 'road' },
  // Avenida das Guildas: liga os postos de Elara (oeste) e Dorin (leste) passando pela entrada da praça.
  { id: 'avenida', a: [-33, 12], b: [33, 12], width: 3.2, kind: 'road' },
  { id: 'arcada-norte', a: [-8, -10], b: [9, -10], width: 2.2, kind: 'road' },
  { id: 'rua-oeste', a: [-13, -3], b: [-13, 12], width: 2.1, kind: 'road' },
  { id: 'travessa-oeste', a: [-13, -3], b: [ARCHIVE.x, -3], width: 1.8, kind: 'road' },
  { id: 'rua-leste', a: [12.7, -10], b: [12.7, 12], width: 1.8, kind: 'road' },
  { id: 'ligacao-academia', a: [9, -10], b: [12.7, -10], width: 2.2, kind: 'road' },
  { id: 'travessa-leste', a: [9, -3.7], b: [12.7, -3.7], width: 1.8, kind: 'road' },
  // Caminhos das portas até a avenida e até a praça.
  { id: 'porta-oficina', a: [-9, 8.3], b: [-9, 12], width: 1.6, kind: 'road' },
  { id: 'porta-pousada', a: [9, 7.1], b: [9, 12], width: 1.6, kind: 'road' },
  { id: 'soleira-arquivo', a: [ARCHIVE.x, ARCHIVE.z + ARCHIVE.d], b: [ARCHIVE.x, -3], width: 1.6, kind: 'road' },
  { id: 'porta-arquivo', a: [ARCHIVE.x, -3], b: [-3.8, -2.9], width: 1.6, kind: 'road' },
  { id: 'porta-casa', a: [9, -3.7], b: [3.8, -2.9], width: 1.6, kind: 'road' },
  // Trilhas de terra até os campos de caça.
  { id: 'trilha-javalis', a: [-20, 12], b: [-24.5, 7.5], width: 1.4, kind: 'trail' },
  { id: 'trilha-lobos-1', a: [-4.7, -1.8], b: [-15, -3.5], width: 1.4, kind: 'trail' },
  { id: 'trilha-lobos-2', a: [-15, -3.5], b: [-23.5, -5], width: 1.4, kind: 'trail' },
  { id: 'trilha-caverna-norte', a: [0, -28], b: [-14, -31], width: 1.8, kind: 'trail' },
  { id: 'trilha-caverna-final', a: [-14, -31], b: [INSTANCES.cavern.x, INSTANCES.cavern.z + 2], width: 1.8, kind: 'trail' },
  { id: 'trilha-pomar', a: [12, 12], b: [12.5, 17.5], width: 1.4, kind: 'trail' },
  { id: 'trilha-farol', a: [1.9, -10.9], b: [12.2, -11], width: 1.4, kind: 'trail' },
];
export const CITADEL_SECTORS = [
  { name: "Biblioteca ancestral", short: "Biblioteca", x: -3, z: -9.3, entrance: [0, -9] },
  { name: "Arquivo histórico", short: "Arquivo", x: ARCHIVE.x, z: ARCHIVE.z + 1.4, entrance: [ARCHIVE.x, -3] },
  { name: "Oficina de mecanismos", short: "Oficina", x: -8.6, z: 4.3, entrance: [-9, 9] },
  { name: "Academia de programação", short: "Academia", x: 8.5, z: -4, entrance: [ACADEMY.x, -3] },
  { name: "Pátio de cálculos", short: "Pátio", x: 8.5, z: 5.8, entrance: [9, 9] },
] satisfies { name: string; short: string; x: number; z: number; entrance: Point }[];

export type TownService = 'bank' | 'wagon';
export const TOWN_SERVICES = [
  { id: 'bank', name: 'Banco da Aurora', short: 'Banco', x: -7, z: 9.5, entrance: [-7, 12] },
  { id: 'wagon', name: 'Carroça de Tobias', short: 'Carroça', x: 5.5, z: 10.5, entrance: [5, 13] },
] satisfies { id: TownService; name: string; short: string; x: number; z: number; entrance: Point }[];

export function distanceToRoad(x: number, z: number, road: Road) {
  const [ax, az] = road.a, [bx, bz] = road.b, dx = bx - ax, dz = bz - az, len = dx * dx + dz * dz;
  const t = len ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len)) : 0;
  return Math.hypot(x - (ax + t * dx), z - (az + t * dz));
}
/** Também conta a estrada principal (norte-sul), a praça do cristal e a estrada das minas, já existentes. */
export function onRoad(x: number, z: number, margin = 0) {
  if (Math.hypot(x, z) < PLAZA_RADIUS + margin) return true;
  if (Math.abs(z + 16) < 1.5 + margin && x > -1.5 && x < 23.5) return true;
  return ROADS.some(r => distanceToRoad(x, z, r) < r.width / 2 + margin);
}

export type PropKind = 'lamp' | 'well' | 'stall' | 'bench' | 'crate' | 'barrel' | 'sign' | 'gate' | 'board' | 'beacon' | 'fence' | 'garden' | 'cart' | 'bank' | 'statue' | 'floodgate';
export type Prop = { id: string; kind: PropKind; x: number; z: number; turn?: number; radius: number; label?: string; unlock?: string; service?: TownService };
const lamp = (id: string, x: number, z: number, unlock = 'variables'): Prop => ({ id, kind: 'lamp', x, z, radius: .3, unlock });
export const PROPS: Prop[] = [
  // Lanternas da praça: acendem com a primeira runa (variáveis).
  lamp('lamp-ne', 6.2, 2.2), lamp('lamp-se', 2.4, 6.2), lamp('lamp-sw', -2.4, 6.2), lamp('lamp-w', -5.2, 4.4), lamp('lamp-n1', -2.4, -6.2), lamp('lamp-n2', 2.4, -6.2),
  // Lanternas da avenida e da entrada sul.
  lamp('lamp-av1', -14, 13.9), lamp('lamp-av2', -26, 13.9), lamp('lamp-av3', 14.5, 10.1), lamp('lamp-av4', 26, 10.1), lamp('lamp-sul1', -3.1, 17), lamp('lamp-sul2', 3.1, 17),
  // Portões da cidade.
  { id: 'gate-sul', kind: 'gate', x: 0, z: 19.4, radius: 0, label: 'Cidadela do Conhecimento' },
  { id: 'gate-norte', kind: 'gate', x: 0, z: -11.2, radius: 0, label: 'Floresta das Variáveis' },
  // Armazém de Borin: caixas se enchem com a runa das operações.
  { id: 'crates', kind: 'crate', x: -9.4, z: .3, radius: .9, unlock: 'arithmetic' },
  { id: 'barrels', kind: 'barrel', x: -11.6, z: 9.2, radius: .7 },
  ...TOWN_SERVICES.map(({ id, x, z, name }): Prop => ({ id, x, z, label: name, service: id, kind: id === 'bank' ? 'bank' : 'cart', radius: 1.25, turn: id === 'wagon' ? .4 : 0 })),
  // Comporta das minas: abre com a runa das condições (as minas já abrem por ela).
  { id: 'floodgate', kind: 'floodgate', x: 14.2, z: -16, radius: 0, unlock: 'conditions' },
  // Poço dos ecos: a água volta a correr com a runa das funções.
  { id: 'well', kind: 'well', x: -5.6, z: 15.6, radius: 1.0, unlock: 'functions' },
  // Mercado: as bancas abrem com a runa dos arrays (uma lista de mercadorias).
  { id: 'stall-1', kind: 'stall', x: -15, z: 16, radius: 1.3, unlock: 'arrays' },
  { id: 'stall-2', kind: 'stall', x: -19.5, z: 16, radius: 1.3, unlock: 'arrays' },
  { id: 'stall-3', kind: 'stall', x: -24, z: 16, radius: 1.3, unlock: 'arrays' },
  // Quadro do guardião: a ficha dos heróis aparece com a runa dos objetos.
  { id: 'board', kind: 'board', x: 6.8, z: 8.4, radius: .5, unlock: 'objects', label: 'Registro dos heróis' },
  // Farol das sentinelas: acende com a runa da depuração.
  { id: 'beacon', kind: 'beacon', x: 13.6, z: -11.3, radius: 1.1, unlock: 'debug' },
  // Estátua de Lion na entrada sul, bancos e horta.
  { id: 'statue', kind: 'statue', x: 5.8, z: 18.6, radius: .8 },
  { id: 'bench-1', kind: 'bench', x: -4.8, z: 7.8, turn: .5, radius: .45 },
  { id: 'bench-2', kind: 'bench', x: 4.6, z: -7.6, turn: -2.6, radius: .45 },
  { id: 'garden', kind: 'garden', x: -16, z: -9, radius: 0 },
  // Placas nos cruzamentos.
  { id: 'sign-av', kind: 'sign', x: 4.6, z: 13.9, radius: .2, label: '← Mercado · Dorin →' },
  { id: 'sign-lobos', kind: 'sign', x: -15, z: -2.2, radius: .2, label: 'Colinas dos Lobos ←' },
  { id: 'sign-javalis', kind: 'sign', x: -21.5, z: 13.9, radius: .2, label: 'Campo dos Javalis ↖' },
  { id: 'sign-pomar', kind: 'sign', x: 13.8, z: 13.9, radius: .2, label: 'Pomar ↓' },
];
/** Cercas e horta: retângulos que não podem ser atravessados. */
export const FENCES: { id: string; x: number; z: number; w: number; d: number }[] = [{ id: 'garden', x: -16, z: -9, w: 2.2, d: 1.5 }];
export function townBlocked(x: number, z: number) {
  if (PROPS.some(p => p.radius > 0 && Math.hypot(x - p.x, z - p.z) < p.radius)) return true;
  return FENCES.some(f => Math.abs(x - f.x) < f.w && Math.abs(z - f.z) < f.d);
}

/** O que cada runa muda no mundo (aparece no aviso, no mapa e no próprio cenário). */
export const WORLD_UNLOCKS: { lesson: string; title: string; text: string; x: number; z: number }[] = [
  { lesson: 'variables', title: 'As lanternas acenderam!', text: 'As lanternas da praça e da avenida ganharam luz, e a trilha da floresta se abriu.', x: 0, z: 6 },
  { lesson: 'arithmetic', title: 'O armazém de Borin encheu', text: 'As contas fecharam: caixas de suprimentos chegaram à oficina de Borin.', x: -9.4, z: .3 },
  { lesson: 'conditions', title: 'A comporta se abriu', text: 'A comporta decidiu: há energia suficiente. O caminho das minas está livre.', x: 14.2, z: -16 },
  { lesson: 'loops', title: 'A trilha iluminada', text: 'Uma lanterna para cada volta do laço: a trilha da floresta brilha à noite.', x: 0, z: -18 },
  { lesson: 'functions', title: 'O poço dos ecos voltou', text: 'A função devolveu a água: o poço da avenida voltou a correr.', x: -5.6, z: 15.6 },
  { lesson: 'arrays', title: 'O mercado abriu', text: 'Uma lista de mercadorias: as bancas do mercado abriram na avenida.', x: -19.5, z: 16 },
  { lesson: 'objects', title: 'O registro dos heróis', text: 'Sua ficha de herói foi pendurada no quadro da praça.', x: 6.8, z: 8.4 },
  { lesson: 'debug', title: 'O farol das sentinelas', text: 'Você achou o erro do limite: o farol voltou a vigiar a estrada das minas.', x: 13.6, z: -11.3 },
];
