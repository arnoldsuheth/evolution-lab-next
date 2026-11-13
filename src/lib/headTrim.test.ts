import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { headIslands } from './headTrim';

/** Lê posição e índices de uma malha de um .glb (só o necessário para o teste). */
function readMesh(file: string, name: string) {
  const b = readFileSync(file), jsonLength = b.readUInt32LE(12), gltf = JSON.parse(b.subarray(20, 20 + jsonLength).toString()), bin = b.subarray(20 + jsonLength + 8);
  const node = gltf.nodes.find((n: { name?: string; mesh?: number }) => n.name === name), prim = gltf.meshes[node.mesh].primitives[0];
  const read = (i: number) => { const a = gltf.accessors[i], v = gltf.bufferViews[a.bufferView], off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0), n = a.count * ({ SCALAR: 1, VEC3: 3 } as Record<string, number>)[a.type];
    const Ctor = a.componentType === 5126 ? Float32Array : a.componentType === 5125 ? Uint32Array : Uint16Array; return new Ctor(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + n * Ctor.BYTES_PER_ELEMENT)); };
  return { positions: read(prim.attributes.POSITION), index: read(prim.indices) };
}

const HEADS: [string, string][] = [['Knight', 'Knight_Head'], ['Barbarian', 'Barbarian_Head'], ['Mage', 'Mage_Head'], ['Rogue', 'Rogue_Head']];
test('cabeças: sobrancelhas, orelhas e nariz originais são achados para poder trocar', { skip: !existsSync('public/models/heroes/Knight.glb') }, () => {
  for (const [file, name] of HEADS) {
    const { positions, index } = readMesh(`public/models/heroes/${file}.glb`, name), kinds = headIslands(positions, index).map(i => i.kind);
    const count = (k: string) => kinds.filter(x => x === k).length;
    assert.equal(count('face'), 1, file + ' rosto');
    assert.equal(count('brow'), 2, file + ' sobrancelhas');
    assert.equal(count('ear'), 2, file + ' orelhas');
    assert.equal(count('eye'), 2, file + ' olhos');
    assert.equal(count('nose'), 1, file + ' nariz');
  }
});
