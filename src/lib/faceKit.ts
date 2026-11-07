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

export const BEARDS = ['Sem barba', 'Curta', 'Cheia', 'Trança central', 'Duas tranças', 'Quatro tranças'];
export const MOUSTACHES = ['Sem bigode', 'Fino', 'Cheio', 'Pontas para cima', 'Longo caído', 'Grosso'];
export const BROWS = ['Pintadas', 'Finas', 'Grossas', 'Arqueadas', 'Bravas', 'Unidas'];
export const NOSES = ['Do modelo', 'Pequeno', 'Redondo', 'Grande', 'Pontudo', 'Batata'];
export const EARS = ['Da raça', 'Arredondadas', 'Grandes', 'Pontudas', 'Longas pontudas', 'De abano'];
export const SCARS = ['Sem cicatriz', 'Bochecha', 'Olho', 'Queixo', 'Testa', 'Cruz'];
export const PAINTS = ['Sem pintura', 'Faixas', 'Pontos', 'Linha', 'Tribal', 'Lágrima'];
export const ACCESSORIES = ['Nenhum', 'Brinco', 'Dois brincos', 'Tapa-olho', 'Faixa na testa', 'Argola no nariz'];
/** Orelha usada quando a opção é “Da raça”. */
export const RACE_EARS: Record<Race, number> = { human: 0, dwarf: 0, elf: 4, orc: 3, gnome: 2 };
/** Raças com cabeça um pouco maior (o gnomo tem a cabeça proporcionalmente grande). */
export const RACE_HEAD: Record<Race, number> = { human: 1, elf: 1, orc: 1.03, dwarf: 1.3, gnome: 1.2 };

export type FacePart = { part: string; shape: 'sphere' | 'cone' | 'capsule' | 'box' | 'torus' | 'cylinder'; color: 'hair' | 'skin' | 'scar' | 'paint' | 'gold' | 'ivory' | 'dark'; position: [number, number, number]; scale: [number, number, number]; rotation?: [number, number, number] };
export interface FaceOptions { look: Pick<Look, 'beard' | 'moustache' | 'brows' | 'nose' | 'ears' | 'scar' | 'tattoo' | 'accessory'>; race: Race; covered: boolean; extra?: 'ponytail' | 'bun' }

const mirror = (p: FacePart): FacePart[] => [p, { ...p, position: [-p.position[0], p.position[1], p.position[2]], rotation: p.rotation ? [p.rotation[0], -p.rotation[1], -p.rotation[2]] : undefined }];
const braid = (x: number, top: number, links: number, z = .5): FacePart[] => [...Array.from({ length: links }, (_, i): FacePart => ({ part: 'beard', shape: 'sphere', color: 'hair', position: [x, top - i * .11, z - i * .015], scale: [.075 - i * .006, .07, .07] })), { part: 'beard', shape: 'torus', color: 'gold', position: [x, top - links * .11 + .03, z - links * .015], scale: [.05, .05, .05], rotation: [Math.PI / 2, 0, 0] }];

/** Lista pura das peças (testável sem renderizar). */
export function faceParts({ look, race, covered, extra }: FaceOptions): FacePart[] {
  const parts: FacePart[] = [], add = (...list: FacePart[]) => parts.push(...list), F = FACE;
  if(race==='dwarf'){
    add({part:'nose',shape:'sphere',color:'skin',position:[0,F.noseY-.02,.52],scale:[.12,.085,.11]},
      ...mirror({part:'nose',shape:'sphere',color:'skin',position:[.3,1.34,.4],scale:[.13,.11,.1]}));
  }
  // Barba: abaixo da boca, sem cobrir o sorriso.
  if (look.beard === 1) add({ part: 'beard', shape: 'sphere', color: 'hair', position: [0, 1.27, .44], scale: [.3, .11, .12] });
  if (look.beard >= 2) add({ part: 'beard', shape: 'sphere', color: 'hair', position: [0, 1.22, .43], scale: [.4, .19, .15] }, ...mirror({ part: 'beard', shape: 'sphere', color: 'hair', position: [.33, 1.37, .32], scale: [.11, .17, .12] }));
  if (look.beard === 3) add(...braid(0, 1.0, 3));
  if (look.beard === 4) add(...braid(-.17, 1.02, 3), ...braid(.17, 1.02, 3));
  if (look.beard === 5) add(...braid(-.27, 1.05, 2, .46), ...braid(-.09, 1.0, 3), ...braid(.09, 1.0, 3), ...braid(.27, 1.05, 2, .46));
  // Bigode: logo abaixo do nariz.
  if (look.moustache === 1) add(...mirror({ part: 'moustache', shape: 'capsule', color: 'hair', position: [.09, 1.43, .53], scale: [.028, .09, .028], rotation: [0, 0, 1.25] }));
  if (look.moustache >= 2 && look.moustache <= 4) add(...mirror({ part: 'moustache', shape: 'sphere', color: 'hair', position: [.09, 1.425, .53], scale: [.11, .045, .05], rotation: [0, 0, -.15] }));
  if (look.moustache === 3) add(...mirror({ part: 'moustache', shape: 'cone', color: 'hair', position: [.21, 1.46, .51], scale: [.03, .08, .03], rotation: [0, 0, -.5] }));
  if (look.moustache === 4) add(...mirror({ part: 'moustache', shape: 'capsule', color: 'hair', position: [.19, 1.33, .5], scale: [.03, .1, .03], rotation: [0, 0, .12] }));
  if (look.moustache === 5) add({ part: 'moustache', shape: 'sphere', color: 'hair', position: [0, 1.42, .53], scale: [.22, .065, .065] });
  // Nariz: “Do modelo” mantém o rosto original.
  const nose: Record<number, FacePart> = {
    1: { part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY, .515], scale: [.045, .045, .045] },
    2: { part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY, .515], scale: [.075, .07, .07] },
    3: { part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY - .01, .52], scale: [.075, .1, .09] },
    4: { part: 'nose', shape: 'cone', color: 'skin', position: [0, F.noseY, .56], scale: [.045, .13, .045], rotation: [Math.PI / 2, 0, 0] },
    5: { part: 'nose', shape: 'sphere', color: 'skin', position: [0, F.noseY - .03, .52], scale: [.1, .085, .085] },
  };
  if (nose[look.nose]) add(nose[look.nose]);
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
    const brow = (y: number, sx: number, sy: number, tilt: number): FacePart[] => mirror({ part: 'brow', shape: 'box', color: 'hair', position: [F.eyeX, y, .465], scale: [sx, sy, .035], rotation: [0, 0, tilt] });
    if (look.brows === 1) add(...brow(F.browY, .17, .028, -.05));
    if (look.brows === 2) add(...brow(F.browY, .2, .06, -.05));
    if (look.brows === 3) add(...brow(F.browY + .02, .18, .04, -.3));
    if (look.brows === 4) add(...brow(F.browY - .01, .2, .05, .35));
    if (look.brows === 5) add({ part: 'brow', shape: 'box', color: 'hair', position: [0, F.browY, .47], scale: [.54, .05, .035] });
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
  if (look.accessory === 1 && !covered) add({ part: 'accessory', shape: 'torus', color: 'gold', position: [F.earX + .02, F.earY - .14, .03], scale: [.04, .04, .04], rotation: [0, Math.PI / 2, 0] });
  if (look.accessory === 2 && !covered) add(...mirror({ part: 'accessory', shape: 'torus', color: 'gold', position: [F.earX + .02, F.earY - .14, .03], scale: [.04, .04, .04], rotation: [0, Math.PI / 2, 0] }));
  if (look.accessory === 3) add({ part: 'accessory', shape: 'cylinder', color: 'dark', position: [-F.eyeX, F.eyeY, .455], scale: [.11, .02, .1], rotation: [Math.PI / 2, 0, 0] }, { part: 'accessory', shape: 'box', color: 'dark', position: [0, 1.72, .43], scale: [.56, .025, .02], rotation: [0, 0, .32] });
  if (look.accessory === 4 && !covered) add({ part: 'accessory', shape: 'torus', color: 'paint', position: [0, 1.86, -.02], scale: [.53, .5, .04], rotation: [Math.PI / 2, 0, 0] });
  if (look.accessory === 5) add({ part: 'accessory', shape: 'torus', color: 'gold', position: [.03, F.noseY - .06, .53], scale: [.03, .03, .03] });
  // Prendedores de cabelo (penteados com rabo de cavalo ou coque).
  if (!covered && extra === 'ponytail') add(...[0, 1, 2, 3].map((i): FacePart => ({ part: 'hair', shape: 'sphere', color: 'hair', position: [0, 1.82 - i * .16, -.52 - i * .03], scale: [.12 - i * .015, .11, .11] })), { part: 'hair', shape: 'torus', color: 'gold', position: [0, 1.88, -.5], scale: [.07, .07, .07], rotation: [0, 0, 0] });
  if (!covered && extra === 'bun') add({ part: 'hair', shape: 'sphere', color: 'hair', position: [0, 2.12, -.3], scale: [.18, .16, .18] }, { part: 'hair', shape: 'torus', color: 'gold', position: [0, 2.02, -.27], scale: [.12, .12, .12], rotation: [Math.PI / 2 - .4, 0, 0] });
  return parts;
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
  const colors: Record<FacePart['color'], THREE.MeshStandardMaterial> = { hair: paint(hair), skin: paint(skin), scar: paint('#b4544c'), paint: paint('#2f5f93'), gold: paint('#e2b54f', true), ivory: paint('#f3ead2'), dark: paint('#2a2522') };
  for (const p of faceParts(options)) {
    const mesh = new THREE.Mesh(unit(p.shape), colors[p.color]);
    mesh.name = 'face-' + p.part; mesh.position.set(...p.position); mesh.scale.set(...p.scale); if (p.rotation) mesh.rotation.set(...p.rotation);
    mesh.castShadow = true; mesh.raycast = () => null; group.add(mesh);
  }
  return group;
}
