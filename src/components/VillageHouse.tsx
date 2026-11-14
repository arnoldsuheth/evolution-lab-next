"use client";
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Lovelace 2.0: casas montadas com as peças do Medieval Village MegaKit (Quaternius, CC0).
 * Paredes de 2 m, telhado de telhas, oitão de tijolo, porta, janelas e chaminé.
 * Tudo é juntado em poucas malhas (uma por material) para pesar pouco no celular.
 */
export const VILLAGE_URL = (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/models/village/village.glb';
if (typeof window !== 'undefined') useGLTF.preload(VILLAGE_URL);

export type HouseSpec = { w: 2 | 3; d: 2 | 3 | 4; floors?: 1 | 2; brick?: boolean; chimney?: boolean; seed?: number };
const WALL_H = 3.12;
type Place = { name: string; p: [number, number, number]; r?: number; s?: number };

/** Lista de peças (nome, posição, giro) para uma casa w×d células de 2 m. */
export function houseLayout({ w, d, floors = 1, brick = false, chimney = true, seed = 0 }: HouseSpec): Place[] {
  const W = w * 2, D = d * 2, out: Place[] = [];
  const kind = (floor: number, side: number, cell: number, cells: number) => {
    const front = side === 0, mid = cell === Math.floor(cells / 2);
    if (floor === 0 && front && mid) return brick ? 'Wall_UnevenBrick_Door_Round' : 'Wall_Plaster_Door_Round';
    if ((cell + side + seed + floor) % 2 === 0) return brick && floor === 0 ? 'Wall_UnevenBrick_Window_Wide_Round' : 'Wall_Plaster_Window_Wide_Round';
    if (floor > 0) return 'Wall_Plaster_WoodGrid';
    return brick ? 'Wall_UnevenBrick_Straight' : 'Wall_Plaster_Straight';
  };
  for (let f = 0; f < floors; f++) {
    const y = f * WALL_H;
    // lados: 0 frente (+z), 1 direita (+x), 2 fundo (-z), 3 esquerda (-x)
    const sides: [number, number, number, number][] = [[0, D / 2, 0, w], [W / 2, 0, Math.PI / 2, d], [0, -D / 2, Math.PI, w], [-W / 2, 0, -Math.PI / 2, d]];
    sides.forEach(([cx, cz, r, cells], side) => {
      for (let c = 0; c < cells; c++) {
        const off = -cells + 1 + c * 2, x = cx + (side % 2 ? 0 : off * Math.cos(r)), z = cz + (side % 2 ? -off * Math.sin(r) : 0);
        const name = kind(f, side, c, cells);
        out.push({ name, p: [x, y, z], r });
        if (name.includes('Window')) out.push({ name: 'Window_Wide_Round1', p: [x, y, z], r });
        if (name.includes('Door')) out.push({ name: 'Door_1_Round', p: [x + Math.cos(r) * -.51, y, z - Math.sin(r) * -.51], r });
      }
    });
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) out.push({ name: brick && f === 0 ? 'Corner_Exterior_Brick' : 'Corner_Exterior_Wood', p: [sx * W / 2, y, sz * D / 2], r: sx > 0 ? (sz > 0 ? 0 : Math.PI / 2) : (sz > 0 ? -Math.PI / 2 : Math.PI) });
  }
  const top = floors * WALL_H;
  out.push({ name: `Roof_RoundTiles_${W}x${D}`, p: [0, top, 0] });
  out.push({ name: `Roof_Front_Brick${W}`, p: [0, top, D / 2], r: 0 }, { name: `Roof_Front_Brick${W}`, p: [0, top, -D / 2], r: Math.PI });
  if (chimney) out.push({ name: 'Prop_Chimney', p: [W / 2 - 1.1, top - .4, -D / 4] });
  return out;
}

export default function VillageHouse({ spec }: { spec: HouseSpec }) {
  const gltf = useGLTF(VILLAGE_URL);
  const key = JSON.stringify(spec);
  const meshes = useMemo(() => {
    const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const piece = (name: string) => gltf.scene.getObjectByName(name);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    for (const pl of houseLayout(spec)) {
      const src = piece(pl.name); if (!src) continue;
      q.setFromAxisAngle(up, pl.r ?? 0);
      m4.compose(new THREE.Vector3(...pl.p), q, new THREE.Vector3().setScalar(pl.s ?? 1));
      src.updateMatrixWorld(true);
      src.traverse(o => {
        const mesh = o as THREE.Mesh; if (!mesh.isMesh) return;
        const local = new THREE.Matrix4().copy(mesh.matrixWorld).premultiply(new THREE.Matrix4().copy(src.matrixWorld).invert()).premultiply(m4);
        const g = mesh.geometry.clone(); for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
        g.applyMatrix4(local);
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        if (mats.length === 1) { const list = byMat.get(mats[0]) ?? []; list.push(g.index ? g.toNonIndexed() : g); byMat.set(mats[0], list); }
      });
    }
    return [...byMat].map(([mat, list]) => {
      const merged = mergeGeometries(list, false); list.forEach(g => g.dispose());
      return { mat: (mat as THREE.MeshStandardMaterial).clone(), geo: merged };
    }).filter(m => m.geo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf.scene, key]);
  return <group>{meshes.map((m, i) => <mesh key={i} geometry={m.geo!} material={m.mat} castShadow receiveShadow />)}</group>;
}
