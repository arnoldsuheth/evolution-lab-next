"use client";
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Junta várias peças paradas (cada uma com sua cor) numa só malha: a tela fica igual,
 * mas o computador desenha tudo de uma vez em vez de peça por peça.
 */
export type Part = { g: THREE.BufferGeometry; p: [number, number, number]; r?: [number, number, number]; c: string };
const matrix = new THREE.Matrix4(), euler = new THREE.Euler(), quat = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();

export function mergeParts(parts: Part[]) {
  const pieces = parts.map(part => {
    const g = part.g.index ? part.g.toNonIndexed() : part.g.clone();
    g.deleteAttribute('uv');
    matrix.compose(pos.set(...part.p), quat.setFromEuler(euler.set(...(part.r ?? [0, 0, 0]))), one);
    g.applyMatrix4(matrix);
    const color = new THREE.Color(part.c), n = g.attributes.position.count, colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) colors.set([color.r, color.g, color.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  });
  const merged = mergeGeometries(pieces) ?? new THREE.BufferGeometry();
  pieces.forEach(g => g.dispose()); parts.forEach(part => part.g.dispose());
  merged.computeBoundingSphere();
  return merged;
}

export function MergedParts({ parts, castShadow = false, receiveShadow = false, emissive, emissiveIntensity = 0 }: { parts: () => Part[]; castShadow?: boolean; receiveShadow?: boolean; emissive?: string; emissiveIntensity?: number }) {
  // parts é uma função fixa (definida fora do componente): monta a geometria uma vez só.
  const geometry = useMemo(() => mergeParts(parts()), [parts]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow={castShadow} receiveShadow={receiveShadow}>
    <meshStandardMaterial vertexColors flatShading roughness={1} emissive={emissive ?? '#000000'} emissiveIntensity={emissiveIntensity} />
  </mesh>;
}

const bakedMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .84 });
/**
 * Junta, depois de montadas, as peças paradas de um modelo (cores simples, um lado só) numa malha só.
 * As originais ficam escondidas (não são desenhadas). Devolve a função que desfaz a junção.
 */
export function bakeStatic(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert(), local = new THREE.Matrix4(), pieces: THREE.BufferGeometry[] = [], hidden: THREE.Mesh[] = [];
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh) || o.userData.baked) return;
    const m = o.material;
    if (!(m instanceof THREE.MeshStandardMaterial) || m.side !== THREE.FrontSide || m.transparent || m.map || m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    if (g.attributes.uv) g.deleteAttribute('uv');
    g.applyMatrix4(local.multiplyMatrices(inverse, o.matrixWorld));
    const n = g.attributes.position.count, colors = new Float32Array(n * 3), c = m.color;
    for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pieces.push(g); hidden.push(o);
  });
  if (pieces.length < 2) { pieces.forEach(g => g.dispose()); return () => {}; }
  const merged = mergeGeometries(pieces); pieces.forEach(g => g.dispose());
  if (!merged) return () => {};
  const mesh = new THREE.Mesh(merged, bakedMaterial); mesh.userData.baked = true; mesh.castShadow = hidden.some(h => h.castShadow);
  hidden.forEach(h => { h.visible = false; });
  root.add(mesh);
  return () => { mesh.removeFromParent(); merged.dispose(); hidden.forEach(h => { h.visible = true; }); };
}
