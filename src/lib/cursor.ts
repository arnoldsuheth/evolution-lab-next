/**
 * Cursores do jogo, no mesmo traço cartoon dos heróis:
 * seta = andar pelo mapa · dedo = algo clicável · balão = conversar com alguém ·
 * espada = inimigo ou combate · mão = só enquanto aproxima ou gira a câmera.
 * No celular não há cursor; nada muda no toque.
 */
export type CursorKind = 'map' | 'point' | 'talk' | 'combat' | 'zoom';
export const CURSOR_KINDS: CursorKind[] = ['map', 'point', 'talk', 'combat', 'zoom'];
const INK = '#2a1b12';
const SVG: Record<CursorKind, { svg: string; x: number; y: number; fallback: string }> = {
  map: { x: 3, y: 2, fallback: 'default', svg: `<path d="M3 2v22l6-5.5 4 8.5 4-2-4-8.2h8Z" fill="#fff6e0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M6 7v11" stroke="#e9c98f" stroke-width="1.6" stroke-linecap="round"/>` },
  point: { x: 13, y: 2, fallback: 'pointer', svg: `<path d="M11 16V4.8a2.4 2.4 0 0 1 4.8 0V13.6a2.3 2.3 0 0 1 4.4 1.3 2.3 2.3 0 0 1 4.2 1.4 2.2 2.2 0 0 1 3.8 1.5V23c0 4.7-3.4 8-8 8h-2.6c-2.6 0-4.4-1.1-5.9-3.3l-4.6-6.6a2.3 2.3 0 0 1 3.5-2.9Z" fill="#fff1d6" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M15.8 14v4M20.2 15v3M24.4 16.3v2.4" stroke="#c9a77a" stroke-width="1.4" stroke-linecap="round"/>` },
  talk: { x: 6, y: 29, fallback: 'pointer', svg: `<path d="M5 3h21a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H14l-8 7v-7H5a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z" fill="#fff6e0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="9.5" cy="13" r="2" fill="${INK}"/><circle cx="15.5" cy="13" r="2" fill="${INK}"/><circle cx="21.5" cy="13" r="2" fill="${INK}"/>` },
  combat: { x: 2, y: 2, fallback: 'crosshair', svg: `<path d="M2 2l7.5 2.6L21 16.1 16.1 21 4.6 9.5Z" fill="#e8eef2" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M5 5l12.5 12.5" stroke="#aab7c0" stroke-width="1.3"/><path d="M13.5 24.5l11-11" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/><path d="M13.5 24.5l11-11" stroke="#f0c457" stroke-width="2.6" stroke-linecap="round"/><path d="M20.5 20.5l5.5 5.5" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M20.5 20.5l5.5 5.5" stroke="#9a6236" stroke-width="2.2" stroke-linecap="round"/><circle cx="27.6" cy="27.6" r="2.6" fill="#f0c457" stroke="${INK}" stroke-width="1.6"/>` },
  zoom: { x: 15, y: 5, fallback: 'grab', svg: `<path d="M8 17V9a2 2 0 0 1 4 0v6V6a2 2 0 0 1 4 0v9V7a2 2 0 0 1 4 0v8v-5a2 2 0 0 1 4 0v11c0 4.5-3 8-7.5 8H14c-2.5 0-4.2-1.2-5.6-3.2l-3.8-5.4a2 2 0 0 1 3.2-2.4Z" fill="#fff1d6" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M12 15v3M16 15v3M20 15v3" stroke="#c9a77a" stroke-width="1.4" stroke-linecap="round"/>` },
};
export const cursorCss = (kind: CursorKind) => { const c = SVG[kind]; return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${c.svg}</svg>`)}") ${c.x} ${c.y}, ${c.fallback}`; };
/** A mão aparece só durante o zoom/giro; durante a luta o mundo mostra a espada; fora disso vale o que está sob o mouse. */
export const resolveCursor = (hover: CursorKind, combat: boolean, zooming = false): CursorKind => zooming ? 'zoom' : combat ? 'combat' : hover;

let element: HTMLElement | null = null, hover: CursorKind = 'map', combat = false, zooming = false, zoomTimer: ReturnType<typeof setTimeout> | undefined;
const apply = () => { if (element) element.dataset.cursor = resolveCursor(hover, combat, zooming); };
export function bindCursor(target: HTMLElement | null) {
  element?.removeEventListener('wheel', onWheel); element?.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('pointerup', onPointerUp);
  element = target; hover = 'map'; zooming = false; apply();
  target?.addEventListener('wheel', onWheel, { passive: true }); target?.addEventListener('pointerdown', onPointerDown); window.addEventListener('pointerup', onPointerUp);
}
function setZoom(active: boolean, ms = 0) { clearTimeout(zoomTimer); zooming = active; apply(); if (active && ms) zoomTimer = setTimeout(() => { zooming = false; apply(); }, ms); }
function onWheel() { setZoom(true, 450); }
function onPointerDown(e: PointerEvent) { if (e.button === 1 || e.button === 2) setZoom(true); }
function onPointerUp() { if (zooming) setZoom(false); }
export function setCombatCursor(active: boolean) { combat = active; apply(); }
export function hoverCursor(kind: CursorKind) { hover = kind; apply(); }
/** Propriedades para objetos 3D clicáveis: `<group {...cursorOn('talk')}>`. */
export const cursorOn = (kind: CursorKind) => ({
  onPointerOver: (event: { stopPropagation: () => void }) => { event.stopPropagation(); hoverCursor(kind); },
  onPointerOut: () => hoverCursor('map'),
});
/** Publica os cursores como variáveis CSS (usadas em botões e no mundo). */
export function installCursors(root: HTMLElement) { CURSOR_KINDS.forEach(kind => root.style.setProperty(`--cursor-${kind}`, cursorCss(kind))); }
