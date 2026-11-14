import * as THREE from 'three';
import type { Look, Race } from './game';

/**
 * Peças de rosto no mesmo traço cartoon dos heróis KayKit: barba, bigode, sobrancelha, nariz,
 * orelhas, marcas, acessórios, presas do orc e prendedores de cabelo.
 * As medidas vêm das cabeças originais (todas as 5 têm o rosto no mesmo lugar):
 * olhos em y 1,54–1,67, queixo em y 1,22, frente do rosto em z ≈ 0,5, lados em x ±0,54.
 * Coordenadas no espaço do modelo em repouso; o grupo é preso ao osso da cabeça e acompanha as animações.
 */
export const FACE = { eyeY: 1.606, eyeX: .17, faceZ: .47, noseY: 1.5, mouthY: 1.39, chinY: 1.22, earX: .54, earY: 1.53, browY: 1.735, crownY: 2.12 } as const;

export const BEARDS = ['Sem barba', 'Curta', 'Cheia', 'Trança central', 'Duas tranças', 'Quatro tranças', 'Cavanhaque', 'Costeletas', 'Barba por fazer', 'Âncora', 'Selvagem'];
/** Anão nunca fica sem barba: as 6 opções são próprias da raça. */
export const DWARF_BEARDS = ['Barba de forja', 'Bifurcada', 'Longa até o cinto', 'Duas tranças grossas', 'Anéis de ouro', 'Larga e cheia'];
/** Cabelos próprios do anão (o índice é o mesmo campo `hair` do visual). */
export const DWARF_HAIR = ['Careca de forja', 'Coroa trançada', 'Moicano de pedra', 'Tranças nas têmporas', 'Coque de ferreiro', 'Juba longa'];
export const MOUSTACHES = ['Sem bigode', 'Fino', 'Cheio', 'Pontas para cima', 'Longo caído', 'Grosso'];
export const BROWS = ['Pintadas', 'Finas', 'Grossas', 'Arqueadas', 'Bravas', 'Unidas'];
export const NOSES = ['Do modelo', 'Pequeno', 'Redondo', 'Grande', 'Pontudo', 'Batata'];
export const EARS = ['Da raça', 'Arredondadas', 'Grandes', 'Pontudas', 'Longas pontudas', 'De abano'];
export const SCARS = ['Sem cicatriz', 'Bochecha', 'Olho', 'Queixo', 'Testa', 'Cruz'];
export const PAINTS = ['Sem pintura', 'Faixas', 'Pontos', 'Linha', 'Tribal', 'Lágrima'];
/** Detalhes do rosto (campo `face` do visual). */
export const FACES = ['Padrão', 'Sardas', 'Bochechas coradas', 'Covinhas', 'Pinta', 'Olheiras'];
export const ACCESSORIES = ['Nenhum', 'Brinco', 'Dois brincos', 'Tapa-olho', 'Faixa na testa', 'Argola no nariz'];
/** Orelha usada quando a opção é “Da raça”. */
export const RACE_EARS: Record<Race, number> = { human: 0, dwarf: 0, elf: 4, orc: 3, gnome: 2 };
/** Raças com cabeça um pouco maior (o gnomo tem a cabeça proporcionalmente grande). */
export const RACE_HEAD: Record<Race, number> = { human: 1, elf: 1, orc: 1.03, dwarf: 1.3, gnome: 1.2 };
/** Formato da cabeça (largura, altura, profundidade): o anão tem rosto largo e baixo. */
export const RACE_HEAD_SHAPE: Record<Race, [number, number, number]> = { human: [1, 1, 1], elf: [1, 1, 1], orc: [1.03, 1.03, 1.03], dwarf: [1.4, 1.2, 1.28], gnome: [1.2, 1.2, 1.2] };

/** Peças extras de penteado presas à cabeça. */
export type HairExtra = 'ponytail' | 'bun' | 'mohawk' | 'spiky' | 'afro' | 'braids' | 'shaved';
export type FacePart = { part: string; shape: 'sphere' | 'cone' | 'capsule' | 'box' | 'torus' | 'cylinder'; color: 'hair' | 'skin' | 'scar' | 'paint' | 'gold' | 'ivory' | 'dark' | 'blush' | 'freckle' | 'shade' | 'lips'; position: [number, number, number]; scale: [number, number, number]; rotation?: [number, number, number] };
export interface FaceOptions { look: Pick<Look, 'beard' | 'moustache' | 'brows' | 'nose' | 'ears' | 'scar' | 'tattoo' | 'accessory'> & { face?: number }; race: Race; covered: boolean; feminine?: boolean; extra?: HairExtra; dwarfHair?: number }

const mirror = (p: FacePart): FacePart[] => [p, { ...p, position: [-p.position[0], p.position[1], p.position[2]], rotation: p.rotation ? [p.rotation[0], -p.rotation[1], -p.rotation[2]] : undefined }];
const braid = (x: number, top: number, links: number, z = .5): FacePart[] => [...Array.from({ length: links }, (_, i): FacePart => ({ part: 'beard', shape: 'sphere', color: 'hair', position: [x, top - i * .11, z - i * .015], scale: [.075 - i * .006, .07, .07] })), { part: 'beard', shape: 'torus', color: 'gold', position: [x, top - links * .11 + .03, z - links * .015], scale: [.05, .05, .05], rotation: [Math.PI / 2, 0, 0] }];

/** Lista pura das peças (testável sem renderizar). */
export function faceParts({ look: chosen, race, covered, extra, dwarfHair, feminine }: FaceOptions): FacePart[] {
  const parts: FacePart[] = [], add = (...list: FacePart[]) => parts.push(...list), F = FACE;
  // Corpo feminino: sem barba nem bigode (a anã mantém a barba da raça), com cílios e lábios.
  const look = feminine && race !== 'dwarf' ? { ...chosen, beard: 0, moustache: 0 } : chosen;
  if (feminine) add(...mirror({ part: 'lash', shape: 'box', color: 'dark', position: [F.eyeX + .075, F.eyeY + .04, .468], scale: [.055, .014, .02], rotation: [0, 0, -.55] }),
    { part: 'lips', shape: 'capsule', color: 'lips', position: [0, F.mouthY + .005, .478], scale: [.022, .05, .014], rotation: [0, 0, Math.PI / 2] });
  const details: Record<number, FacePart[]> = {
    1: [0, 1, 2, 3].flatMap(i => mirror({ part: 'freckle', shape: 'sphere', color: 'freckle', position: [.16 + (i % 2) * .07 + i * .012, 1.5 - Math.floor(i / 2) * .045, .49 - i * .012], scale: [.013, .013, .008] })),
    2: mirror({ part: 'cheek', shape: 'sphere', color: 'blush', position: [.27, 1.47, .45], scale: [.075, .045, .025] }),
    3: mirror({ part: 'dimple', shape: 'sphere', color: 'freckle', position: [.13, F.mouthY - .01, .49], scale: [.012, .016, .008] }),
    4: [{ part: 'mole', shape: 'sphere', color: 'dark', position: [-.19, 1.43, .49], scale: [.017, .017, .01] }],
    5: mirror({ part: 'shade', shape: 'capsule', color: 'shade', position: [F.eyeX, F.eyeY - .065, .468], scale: [.012, .05, .01], rotation: [0, 0, Math.PI / 2] }),
  };
  if (details[chosen.face ?? 0]) add(...details[chosen.face ?? 0]);
  if (feminine && (chosen.face ?? 0) !== 2) add(...mirror({ part: 'cheek', shape: 'sphere', color: 'blush', position: [.27, 1.47, .45], scale: [.06, .035, .02] }));
  if (race === 'dwarf') {
    // Traços do anão: nariz de batata, testa marcada e bochechas coradas.
    add({ part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY - .03, .53], scale: [.13, .1, .12] },
      { part: 'brow-ridge', shape: 'capsule', color: 'skin', position: [0, F.browY - .015, .445], scale: [.05, .12, .05], rotation: [0, 0, Math.PI / 2] },
      ...mirror({ part: 'cheek', shape: 'sphere', color: 'blush', position: [.27, 1.47, .445], scale: [.075, .045, .025] }));
    const B = (position: [number, number, number], scale: [number, number, number], shape: FacePart['shape'] = 'sphere'): FacePart => ({ part: 'beard', shape, color: 'hair', position, scale });
    const jaw = [B([0, 1.24, .42], [.5, .24, .2]), ...mirror(B([.4, 1.38, .28], [.14, .24, .16]))];
    const ring = (y: number, z: number, r: number): FacePart => ({ part: 'beard', shape: 'torus', color: 'gold', position: [0, y, z], scale: [r, r, r], rotation: [Math.PI / 2, 0, 0] });
    const beards: FacePart[][] = [
      [...jaw, B([0, 1.02, .42], [.36, .2, .17])],
      [...jaw, ...mirror(B([.15, .96, .42], [.14, .24, .13]))],
      [...jaw, B([0, 1.0, .43], [.34, .22, .17]), B([0, .8, .42], [.25, .18, .14]), B([0, .64, .4], [.15, .12, .11])],
      [...jaw, ...braid(-.2, 1.06, 4, .47), ...braid(.2, 1.06, 4, .47)],
      [...jaw, B([0, 1.0, .43], [.34, .22, .17]), B([0, .84, .42], [.22, .16, .14]), ring(1.02, .47, .2), ring(.86, .45, .16)],
      [...jaw, B([0, 1.04, .42], [.5, .24, .19]), B([-.22, .88, .42], [.17, .13, .14]), B([0, .87, .43], [.18, .13, .14]), B([.22, .88, .42], [.17, .13, .14])],
    ];
    add(...(beards[look.beard] ?? beards[0]));
    if (!covered) {
      const crown = Array.from({ length: 12 }, (_, i): FacePart => { const a = i / 12 * Math.PI * 2; return { part: 'hair', shape: 'sphere', color: 'hair', position: [Math.sin(a) * .42, 2.07, Math.cos(a) * .4 - .03], scale: [.09, .08, .09] }; });
      const mohawk = [0, 1, 2, 3, 4].map((i): FacePart => ({ part: 'hair', shape: 'sphere', color: 'hair', position: [0, 2.13 - Math.abs(i - 2) * .025, .28 - i * .16], scale: [.09, .15 - Math.abs(i - 2) * .02, .11] }));
      const hairs: FacePart[][] = [[], [...crown, { part: 'hair', shape: 'torus', color: 'gold', position: [0, 2.07, .4], scale: [.07, .07, .07], rotation: [0, 0, 0] }], mohawk, [...braid(-.52, 1.62, 4, .12), ...braid(.52, 1.62, 4, .12)].map((p): FacePart => ({ ...p, part: 'hair' })), [], []];
      add(...(hairs[dwarfHair ?? 0] ?? []));
    }
  }
  // Barba: abaixo da boca, sem cobrir o sorriso.
  if (race !== 'dwarf' && look.beard === 1) add({ part: 'beard', shape: 'sphere', color: 'hair', position: [0, 1.27, .44], scale: [.3, .11, .12] });
  if (race !== 'dwarf' && look.beard >= 2 && look.beard <= 5) add({ part: 'beard', shape: 'sphere', color: 'hair', position: [0, 1.22, .43], scale: [.4, .19, .15] }, ...mirror({ part: 'beard', shape: 'sphere', color: 'hair', position: [.33, 1.37, .32], scale: [.11, .17, .12] }));
  if (race !== 'dwarf' && look.beard === 3) add(...braid(0, 1.0, 3));
  if (race !== 'dwarf' && look.beard === 4) add(...braid(-.17, 1.02, 3), ...braid(.17, 1.02, 3));
  if (race !== 'dwarf' && look.beard === 5) add(...braid(-.27, 1.05, 2, .46), ...braid(-.09, 1.0, 3), ...braid(.09, 1.0, 3), ...braid(.27, 1.05, 2, .46));
  if (race !== 'dwarf' && look.beard === 6) add({ part: 'beard', shape: 'sphere', color: 'hair', position: [0, 1.25, .45], scale: [.13, .13, .11] });
  if (race !== 'dwarf' && look.beard === 7) add(...mirror({ part: 'beard', shape: 'capsule', color: 'hair', position: [.4, 1.47, .3], scale: [.055, .12, .05] }));
  if (race !== 'dwarf' && look.beard === 8) add({ part: 'beard', shape: 'sphere', color: 'hair', position: [0, 1.28, .43], scale: [.33, .075, .07] });
  // Selvagem (veio dos penteados): barba volumosa e desgrenhada, com tufos soltos.
  if (race !== 'dwarf' && look.beard === 10) add({ part: 'beard', shape: 'sphere', color: 'hair', position: [0, 1.18, .42], scale: [.46, .26, .18] }, ...mirror({ part: 'beard', shape: 'sphere', color: 'hair', position: [.34, 1.36, .3], scale: [.14, .22, .14] }), { part: 'beard', shape: 'sphere', color: 'hair', position: [-.16, .98, .43], scale: [.15, .14, .13] }, { part: 'beard', shape: 'sphere', color: 'hair', position: [.14, .96, .43], scale: [.14, .15, .13] }, { part: 'beard', shape: 'sphere', color: 'hair', position: [0, .9, .44], scale: [.12, .12, .11] });
  if (race !== 'dwarf' && look.beard === 9) add({ part: 'beard', shape: 'sphere', color: 'hair', position: [0, 1.23, .45], scale: [.14, .15, .11] }, { part: 'beard', shape: 'box', color: 'hair', position: [0, 1.335, .465], scale: [.3, .035, .04] });
  // Bigode: logo abaixo do nariz.
  if (look.moustache === 1) add(...mirror({ part: 'moustache', shape: 'capsule', color: 'hair', position: [.09, 1.43, .53], scale: [.028, .09, .028], rotation: [0, 0, 1.25] }));
  if (look.moustache >= 2 && look.moustache <= 4) add(...mirror({ part: 'moustache', shape: 'sphere', color: 'hair', position: [.09, 1.425, .53], scale: [.11, .045, .05], rotation: [0, 0, -.15] }));
  if (look.moustache === 3) add(...mirror({ part: 'moustache', shape: 'cone', color: 'hair', position: [.21, 1.46, .51], scale: [.03, .08, .03], rotation: [0, 0, -.5] }));
  if (look.moustache === 4) add(...mirror({ part: 'moustache', shape: 'capsule', color: 'hair', position: [.19, 1.33, .5], scale: [.03, .1, .03], rotation: [0, 0, .12] }));
  if (look.moustache === 5) add({ part: 'moustache', shape: 'sphere', color: 'hair', position: [0, 1.42, .53], scale: [.22, .065, .065] });
  // Nariz: “Do modelo” mantém o rosto original (o anão já tem o nariz da raça).
  const nose: Record<number, FacePart> = {
    1: { part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY, .515], scale: [.045, .045, .045] },
    2: { part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY, .515], scale: [.075, .07, .07] },
    3: { part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY - .01, .52], scale: [.075, .1, .09] },
    4: { part: 'nose', shape: 'cone', color: 'skin', position: [0, F.noseY, .56], scale: [.045, .13, .045], rotation: [Math.PI / 2, 0, 0] },
    5: { part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY - .03, .52], scale: [.1, .085, .085] },
  };
  if (nose[look.nose] && race !== 'dwarf') add(nose[look.nose]);
  if (race === 'orc') add(...mirror({ part: 'tusk', shape: 'cone', color: 'ivory', position: [.13, 1.345, .5], scale: [.035, .09, .035], rotation: [-.25, 0, -.12] }));
  if (!covered) {
    // Orelhas por cima das originais.
    const ear = look.ears || RACE_EARS[race];
    if (ear === 1) add(...mirror({ part: 'ear', shape: 'sphere', color: 'skin', position: [F.earX, F.earY, .02], scale: [.06, .12, .09] }));
    if (ear === 2) add(...mirror({ part: 'ear', shape: 'sphere', color: 'skin', position: [F.earX + .02, F.earY + .02, .0], scale: [.07, .17, .13] }));
    if (ear === 3) add(...mirror({ part: 'ear', shape: 'cone', color: 'skin', position: [F.earX + .03, F.earY + .1, -.02], scale: [.06, .2, .06], rotation: [-.25, 0, -.7] }));
    if (ear === 4) add(...mirror({ part: 'ear', shape: 'cone', color: 'skin', position: [F.earX + .1, F.earY + .14, -.04], scale: [.06, .36, .06], rotation: [-.35, 0, -1.0] }));
    if (ear === 5) add(...mirror({ part: 'ear', shape: 'sphere', color: 'skin', position: [F.earX + .07, F.earY, .03], scale: [.04, .14, .12], rotation: [0, -.7, 0] }));
    // Sobrancelhas acima das pintadas.
    // As sobrancelhas esculpidas do modelo são retiradas da malha (headTrim), então a escolhida fica sozinha e no tamanho natural.
    const brow = (y: number, sx: number, sy: number, tilt: number): FacePart[] => mirror({ part: 'brow', shape: 'box', color: 'hair', position: [F.eyeX + .01, y, .468], scale: [sx - .04, sy * .8, .04], rotation: [0, 0, tilt] });
    const by = F.browY - .03;
    if (look.brows === 1) add(...brow(by, .26, .072, -.04));
    if (look.brows === 2) add(...brow(by - .004, .27, .1, -.04));
    if (look.brows === 3) add(...brow(by + .008, .26, .075, -.2));
    if (look.brows === 4) add(...brow(by - .006, .26, .078, .26));
    if (look.brows === 5) { add(...brow(by, .26, .075, 0)); add({ part: 'brow', shape: 'box', color: 'hair', position: [0, by, .482], scale: [.16, .06, .045] }); }
  }
  // Marcas pintadas sobre a pele.
  const scar: Record<number, FacePart[]> = {
    1: [{ part: 'scar', shape: 'box', color: 'scar', position: [.25, 1.45, .49], scale: [.16, .022, .02], rotation: [0, .35, .6] }],
    2: [{ part: 'scar', shape: 'box', color: 'scar', position: [.2, 1.61, .46], scale: [.022, .24, .02], rotation: [0, .2, .15] }],
    3: [{ part: 'scar', shape: 'box', color: 'scar', position: [.08, 1.27, .5], scale: [.12, .022, .02], rotation: [0, 0, -.4] }],
    4: [{ part: 'scar', shape: 'box', color: 'scar', position: [-.12, 1.85, .43], scale: [.18, .022, .02], rotation: [0, -.2, .3] }],
    5: [{ part: 'scar', shape: 'box', color: 'scar', position: [.25, 1.45, .49], scale: [.15, .022, .02], rotation: [0, .35, .7] }, { part: 'scar', shape: 'box', color: 'scar', position: [.25, 1.45, .49], scale: [.15, .022, .02], rotation: [0, .35, -.7] }],
  };
  if (scar[look.scar] && !(covered && look.scar === 4)) add(...scar[look.scar]);
  const paint: Record<number, FacePart[]> = {
    1: [...mirror({ part: 'paint', shape: 'box', color: 'paint', position: [.25, 1.49, .48], scale: [.2, .03, .02], rotation: [0, .35, 0] }), ...mirror({ part: 'paint', shape: 'box', color: 'paint', position: [.25, 1.44, .49], scale: [.2, .03, .02], rotation: [0, .35, 0] })],
    2: [0, 1, 2].flatMap(i => mirror({ part: 'paint', shape: 'sphere', color: 'paint', position: [.2 + i * .07, 1.47 - (i % 2) * .03, .5 - i * .03], scale: [.022, .022, .012] })),
    3: [{ part: 'paint', shape: 'box', color: 'paint', position: [0, 1.82, .45], scale: [.035, .2, .02] }],
    4: mirror({ part: 'paint', shape: 'box', color: 'paint', position: [.25, 1.45, .49], scale: [.18, .035, .02], rotation: [0, .35, .5] }).concat(mirror({ part: 'paint', shape: 'box', color: 'paint', position: [.25, 1.4, .49], scale: [.14, .03, .02], rotation: [0, .35, -.5] })),
    5: [{ part: 'paint', shape: 'sphere', color: 'paint', position: [.2, 1.48, .49], scale: [.025, .04, .015] }],
  };
  if (paint[look.tattoo] && !(covered && look.tattoo === 3)) add(...paint[look.tattoo]);
  // Brinco preso no lóbulo (antes ficava solto, longe da orelha).
  const earring: FacePart = { part: 'accessory', shape: 'torus', color: 'gold', position: [F.earX - .025, F.earY - .17, .02], scale: [.032, .032, .032], rotation: [0, Math.PI / 2, 0] };
  if (look.accessory === 1 && !covered) add(earring, { ...earring, shape: 'sphere', position: [F.earX - .03, F.earY - .14, .02], scale: [.018, .018, .018] });
  if (look.accessory === 2 && !covered) add(...mirror(earring), ...mirror({ ...earring, shape: 'sphere', position: [F.earX - .03, F.earY - .14, .02], scale: [.018, .018, .018] }));
  if (look.accessory === 3) add({ part: 'accessory', shape: 'cylinder', color: 'dark', position: [-F.eyeX, F.eyeY, .455], scale: [.11, .02, .1], rotation: [Math.PI / 2, 0, 0] }, { part: 'accessory', shape: 'box', color: 'dark', position: [0, 1.72, .43], scale: [.56, .025, .02], rotation: [0, 0, .32] });
  if (look.accessory === 4 && !covered) add({ part: 'accessory', shape: 'torus', color: 'paint', position: [0, 1.86, -.02], scale: [.53, .5, .04], rotation: [Math.PI / 2, 0, 0] });
  if (look.accessory === 5) add({ part: 'accessory', shape: 'torus', color: 'gold', position: [.035, F.noseY - .035, .505], scale: [.022, .022, .022], rotation: [0, .5, 0] });
  // Prendedores de cabelo (penteados com rabo de cavalo ou coque).
  if (!covered && extra === 'ponytail') add(...[0, 1, 2, 3].map((i): FacePart => ({ part: 'hair', shape: 'sphere', color: 'hair', position: [0, 1.82 - i * .16, -.52 - i * .03], scale: [.12 - i * .015, .11, .11] })), { part: 'hair', shape: 'torus', color: 'gold', position: [0, 1.88, -.5], scale: [.07, .07, .07], rotation: [0, 0, 0] });
  if (!covered && extra === 'bun') add({ part: 'hair', shape: 'sphere', color: 'hair', position: [0, 2.12, -.3], scale: [.18, .16, .18] }, { part: 'hair', shape: 'torus', color: 'gold', position: [0, 2.02, -.27], scale: [.12, .12, .12], rotation: [Math.PI / 2 - .4, 0, 0] });
  if (!covered && extra) add(...hairExtra(extra));
  return parts;
}

/** Penteados montados com peças: moicano, arrepiado, black power e tranças (raspado só escurece o couro). */
function hairExtra(extra: HairExtra): FacePart[] {
  const H = (position: [number, number, number], scale: [number, number, number], shape: FacePart['shape'] = 'sphere', rotation?: [number, number, number]): FacePart => ({ part: 'hair', shape, color: 'hair', position, scale, ...(rotation ? { rotation } : {}) });
  // As cabeças KayKit são quase cúbicas: topo do cabelo em y ≈ 2,3, lados em x ±0,44, frente z 0,5 e nuca z −0,47.
  const top = (x: number, z: number) => 2.3 - Math.max(0, Math.abs(x) - .28) * 1.3 - Math.max(0, Math.abs(z) - .3) * 1.3;
  if (extra === 'mohawk') {
    const crest = [.4, .27, .14, .01, -.12, -.25].map((z, i) => H([0, top(0, z) + .1 - Math.abs(i - 2) * .008, z], [.11, .22 - Math.abs(i - 2.5) * .012, .1]));
    return [...crest, H([0, 2.18, -.46], [.075, .16, .09]), H([0, 1.98, -.52], [.07, .14, .08])];
  }
  if (extra === 'spiky') {
    const spikes: FacePart[] = [];
    for (const x of [-.3, -.1, .1, .3]) for (const z of [.28, .02, -.26]) spikes.push(H([x, top(x, z) + .08, z], [.09, .26, .09], 'cone', [z * 1.3 + .15, 0, -x * 1.4]));
    for (const side of [-1, 1]) for (const z of [.15, -.2]) spikes.push(H([side * .47, 2.08, z], [.08, .22, .08], 'cone', [z, 0, -side * 1.15]));
    for (const x of [-.22, .22]) spikes.push(H([x, 2.08, -.5], [.08, .22, .08], 'cone', [-1.15, 0, -x]));
    return spikes;
  }
  if (extra === 'afro') {
    const puffs = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return H([Math.sin(a) * .62, 2.16 + (i % 2 ? .1 : -.06), Math.cos(a) * .55 - .14], [.24, .22, .24]); }).filter(p => p.position[2] < .3);
    return [H([0, 2.16, -.14], [.66, .46, .6]), H([0, 2.42, -.14], [.46, .22, .44]), ...puffs];
  }
  if (extra === 'braids') {
    const rows = [-.3, -.1, .1, .3].flatMap(x => [...[.4, .26, .12, -.02, -.16, -.3].map(z => H([x, top(x, z) - .005, z], [.05, .03, .075])), ...[2.12, 1.98, 1.84].map(y => H([x, y, -.49], [.05, .07, .03]))]);
    const tails = [-.2, .2].flatMap(x => [...Array.from({ length: 5 }, (_, i) => H([x * (1 + i * .05), 1.72 - i * .13, -.53 - i * .02], [.07 - i * .005, .08, .07])), { part: 'hair', shape: 'torus', color: 'gold', position: [x * 1.25, 1.1, -.62], scale: [.045, .045, .045], rotation: [Math.PI / 2, 0, 0] } as FacePart]);
    return [...rows, ...tails];
  }
  return [];
}

const geometries = new Map<string, THREE.BufferGeometry>();
const unit = (shape: FacePart['shape']) => {
  let g = geometries.get(shape);
  if (!g) {
    g = shape === 'sphere' ? new THREE.SphereGeometry(1, 14, 10) : shape === 'cone' ? new THREE.ConeGeometry(1, 1, 10) : shape === 'capsule' ? new THREE.CapsuleGeometry(1, 1, 4, 8) : shape === 'torus' ? new THREE.TorusGeometry(1, .28, 8, 16) : shape === 'cylinder' ? new THREE.CylinderGeometry(1, 1, 1, 16) : new THREE.BoxGeometry(1, 1, 1);
    geometries.set(shape, g);
  }
  return g;
};
const materials = new Map<string, THREE.MeshStandardMaterial>();
const paint = (color: string, metal = false) => { const key = color + metal; let m = materials.get(key); if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: metal ? .35 : .85, metalness: metal ? .6 : 0 }); materials.set(key, m); } return m; };

/** Monta as peças como malhas 3D. `hair` e `skin` são as cores escolhidas pelo jogador. */
export function buildFaceKit(options: FaceOptions & { hair: string; skin: string }): THREE.Group {
  const group = new THREE.Group(); group.name = 'face-kit';
  const hair = new THREE.Color(options.hair).multiplyScalar(.92).getStyle(), skin = new THREE.Color(options.skin).multiplyScalar(.97).getStyle();
  const colors: Record<FacePart['color'], THREE.MeshStandardMaterial> = { hair: paint(hair), skin: paint(skin), scar: paint('#b4544c'), paint: paint('#2f5f93'), gold: paint('#e2b54f', true), ivory: paint('#f3ead2'), dark: paint('#2a2522'), blush: paint('#d97a6c'), freckle: paint('#9c5a38'), shade: paint('#6e5463'), lips: paint('#b9545a') };
  for (const p of faceParts(options)) {
    const mesh = new THREE.Mesh(unit(p.shape), colors[p.color]);
    mesh.name = 'face-' + p.part; mesh.position.set(...p.position); mesh.scale.set(...p.scale); if (p.rotation) mesh.rotation.set(...p.rotation);
    mesh.castShadow = true; mesh.raycast = () => null; group.add(mesh);
  }
  return group;
}
