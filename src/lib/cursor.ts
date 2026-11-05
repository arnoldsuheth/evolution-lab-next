/**
 * Cursores do jogo, desenhados no mesmo traço cartoon dos heróis:
 * mão = mapa (andar, girar e aproximar), seta = algo clicável, espada = inimigo ou combate.
 * No celular não há cursor; nada muda no toque.
 */
export type CursorKind = 'map' | 'point' | 'combat';
const INK = '#2a1b12';
const SVG: Record<CursorKind, { svg: string; x: number; y: number; fallback: string }> = {
  map: { x: 15, y: 5, fallback: 'grab', svg: `<path d="M8 17V9a2 2 0 0 1 4 0v6V6a2 2 0 0 1 4 0v9V7a2 2 0 0 1 4 0v8v-5a2 2 0 0 1 4 0v11c0 4.5-3 8-7.5 8H14c-2.5 0-4.2-1.2-5.6-3.2l-3.8-5.4a2 2 0 0 1 3.2-2.4Z" fill="#fff1d6" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M12 15v3M16 15v3M20 15v3" stroke="#c9a77a" stroke-width="1.4" stroke-linecap="round"/>` },
  point: { x: 3, y: 2, fallback: 'pointer', svg: `<path d="M3 2v22l6-5.5 4 8.5 4-2-4-8.2h8Z" fill="#fff6e0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M6 7v11" stroke="#e9c98f" stroke-width="1.6" stroke-linecap="round"/>` },
  combat: { x: 2, y: 2, fallback: 'crosshair', svg: `<path d="M2 2l7.5 2.6L21 16.1 16.1 21 4.6 9.5Z" fill="#e8eef2" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M5 5l12.5 12.5" stroke="#aab7c0" stroke-width="1.3"/><path d="M13.5 24.5l11-11" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/><path d="M13.5 24.5l11-11" stroke="#f0c457" stroke-width="2.6" stroke-linecap="round"/><path d="M20.5 20.5l5.5 5.5" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M20.5 20.5l5.5 5.5" stroke="#9a6236" stroke-width="2.2" stroke-linecap="round"/><circle cx="27.6" cy="27.6" r="2.6" fill="#f0c457" stroke="${INK}" stroke-width="1.6"/>` },
};
export const cursorCss = (kind: CursorKind) => { const c = SVG[kind]; return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${c.svg}</svg>`)}") ${c.x} ${c.y}, ${c.fallback}`; };
/** Combate tem prioridade: durante a luta, o mundo inteiro mostra a espada. */
export const resolveCursor = (hover: CursorKind, combat: boolean): CursorKind => combat ? 'combat' : hover;

let element: HTMLElement | null = null, hover: CursorKind = 'map', combat = false;
const apply = () => { if (element) element.dataset.cursor = resolveCursor(hover, combat); };
export function bindCursor(target: HTMLElement | null) { element = target; hover = 'map'; apply(); }
export function setCombatCursor(active: boolean) { combat = active; apply(); }
export function hoverCursor(kind: CursorKind) { hover = kind; apply(); }
/** Propriedades para objetos 3D clicáveis: `<group {...cursorOn('point')}>`. */
export const cursorOn = (kind: CursorKind) => ({
  onPointerOver: (event: { stopPropagation: () => void }) => { event.stopPropagation(); hoverCursor(kind); },
  onPointerOut: () => hoverCursor('map'),
});
/** Publica os três cursores como variáveis CSS (usadas em botões e no mundo). */
export function installCursors(root: HTMLElement) { (['map', 'point', 'combat'] as CursorKind[]).forEach(kind => root.style.setProperty(`--cursor-${kind}`, cursorCss(kind))); }
