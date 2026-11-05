// Remove animações não usadas de um arquivo .glb e reempacota o buffer binário.
// Malhas, esqueleto, texturas e as animações mantidas ficam byte a byte iguais.
/** Animações usadas pelo jogo (conferidas com HERO_ANIMATIONS em src/lib/heroModels.test.ts). As demais não são publicadas. */
export const KEEP_ANIMATIONS = ['Idle','Walking_A','Unarmed_Melee_Attack_Punch_A','1H_Melee_Attack_Chop','2H_Melee_Idle','2H_Melee_Attack_Chop','2H_Ranged_Shoot','Spellcast_Shoot','Dualwield_Melee_Attack_Stab','Spellcast_Raise','Dualwield_Melee_Attack_Slice','Spellcast_Long'];
const GLB = 0x46546c67, JSON_CHUNK = 0x4e4f534a, BIN_CHUNK = 0x004e4942;

export function readGlb(data) {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (buffer.readUInt32LE(0) !== GLB || buffer.readUInt32LE(4) !== 2) throw Error('Arquivo não é GLB 2.0.');
  let offset = 12, json, bin = Buffer.alloc(0);
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset), type = buffer.readUInt32LE(offset + 4), chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === JSON_CHUNK) json = JSON.parse(chunk.toString('utf8')); else if (type === BIN_CHUNK) bin = chunk;
    offset += 8 + length;
  }
  if (!json) throw Error('GLB sem JSON.');
  return { json, bin };
}

export function writeGlb(json, bin) {
  const pad = (b, fill) => b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - b.length % 4, fill)]) : b;
  const text = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20), body = pad(bin, 0);
  const header = Buffer.alloc(12), jsonHead = Buffer.alloc(8), binHead = Buffer.alloc(8);
  header.writeUInt32LE(GLB, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + text.length + 8 + body.length, 8);
  jsonHead.writeUInt32LE(text.length, 0); jsonHead.writeUInt32LE(JSON_CHUNK, 4);
  binHead.writeUInt32LE(body.length, 0); binHead.writeUInt32LE(BIN_CHUNK, 4);
  return Buffer.concat([header, jsonHead, text, binHead, body]);
}

/** Mantém só as animações em `keep`; recusa arquivos com recursos que este script não sabe remapear. */
export function pruneAnimations(data, keep) {
  const { json, bin } = readGlb(data), wanted = new Set(keep);
  if ((json.buffers ?? []).length > 1 || json.extensionsUsed?.length) throw Error('GLB com múltiplos buffers ou extensões não suportado.');
  if ((json.accessors ?? []).some(a => a.sparse)) throw Error('GLB com accessors esparsos não suportado.');
  const animations = (json.animations ?? []).filter(a => wanted.has(a.name));
  const missing = [...wanted].filter(name => !animations.some(a => a.name === name));
  if (missing.length) throw Error(`Animações ausentes: ${missing.join(', ')}`);
  const usedAccessors = new Set();
  const mark = index => { if (index !== undefined) usedAccessors.add(index); };
  for (const mesh of json.meshes ?? []) for (const primitive of mesh.primitives) { Object.values(primitive.attributes).forEach(mark); mark(primitive.indices); for (const target of primitive.targets ?? []) Object.values(target).forEach(mark); }
  for (const skin of json.skins ?? []) mark(skin.inverseBindMatrices);
  for (const animation of animations) for (const sampler of animation.samplers) { mark(sampler.input); mark(sampler.output); }
  const accessorOrder = [...usedAccessors].sort((a, b) => a - b), accessorMap = new Map(accessorOrder.map((old, i) => [old, i]));
  const usedViews = new Set(accessorOrder.map(i => json.accessors[i].bufferView).filter(v => v !== undefined));
  for (const image of json.images ?? []) if (image.bufferView !== undefined) usedViews.add(image.bufferView);
  const viewOrder = [...usedViews].sort((a, b) => a - b), viewMap = new Map(), parts = [];
  let size = 0;
  for (const old of viewOrder) {
    const view = json.bufferViews[old], start = view.byteOffset ?? 0, slice = bin.subarray(start, start + view.byteLength);
    const gap = (4 - size % 4) % 4; if (gap) { parts.push(Buffer.alloc(gap)); size += gap; }
    viewMap.set(old, { ...view, byteOffset: size }); parts.push(slice); size += slice.length;
  }
  const remap = index => index === undefined ? undefined : accessorMap.get(index);
  const next = { ...json }; delete next.animations;
  next.bufferViews = viewOrder.map(old => viewMap.get(old));
  const viewIndex = new Map(viewOrder.map((old, i) => [old, i]));
  next.accessors = accessorOrder.map(old => { const a = { ...json.accessors[old] }; if (a.bufferView !== undefined) a.bufferView = viewIndex.get(a.bufferView); return a; });
  if (json.images) next.images = json.images.map(image => image.bufferView === undefined ? image : { ...image, bufferView: viewIndex.get(image.bufferView) });
  if (json.meshes) next.meshes = json.meshes.map(mesh => ({ ...mesh, primitives: mesh.primitives.map(p => ({ ...p, attributes: Object.fromEntries(Object.entries(p.attributes).map(([k, v]) => [k, remap(v)])), ...(p.indices !== undefined ? { indices: remap(p.indices) } : {}), ...(p.targets ? { targets: p.targets.map(t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, remap(v)]))) } : {}) })) }));
  if (json.skins) next.skins = json.skins.map(skin => skin.inverseBindMatrices === undefined ? skin : { ...skin, inverseBindMatrices: remap(skin.inverseBindMatrices) });
  if (animations.length) next.animations = animations.map(a => ({ ...a, samplers: a.samplers.map(s => ({ ...s, input: remap(s.input), output: remap(s.output) })) }));
  const body = Buffer.concat(parts);
  next.buffers = [{ ...json.buffers[0], byteLength: body.length }];
  return writeGlb(next, body);
}
