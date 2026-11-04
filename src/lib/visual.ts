import type { Look, Race } from './game';
import { BODY_TRAITS, FACE_TRAITS, NOSE_TRAITS, BROW_NAMES } from './characterTraits';

// Indices stay stable (0..7). No persisted fields or storage versions are changed.
export const RACE_SKIN: Record<Race, readonly string[]> = {
  human: ['#e7bd9e','#c48a66','#925f46','#633f33','#f1d5bb','#704733','#b47d60','#e8c7ae'],
  orc: ['#83a66a','#5e874e','#3f6c42','#344f36','#a2b97d','#738e51','#43756a','#647b3e'],
  dwarf: ['#d5a683','#b97d57','#8b583e','#654331','#ecc7a3','#9f6a49','#c9926e','#795043'],
  elf: ['#e7d4c8','#cfb5ab','#ad8d83','#795f62','#f0e3d9','#b4b1cb','#91869f','#c8c4d8'],
  gnome: ['#a9b8c5','#829bad','#657f98','#4e627c','#c5d1d9','#90a0ba','#6d82aa','#a6aec9'],
};
export const RACE_FORM: Record<Race, { width: number; height: number; depth: number; head: [number,number,number]; jaw: number; eye: number; ear: number; description: string }> = {
  human: { width: 1, height: 1.1, depth: 1, head: [1,1,1], jaw: 1, eye: 1, ear: 1, description: 'Traços equilibrados, pele humana e proporções naturais.' },
  orc: { width: 1.32, height: 1.14, depth: 1.18, head: [1.17,0.98,1.12], jaw: 1.3, eye: 0.85, ear: 1.25, description: 'Pele verde em degradê, mandíbula larga, presas e sobrancelhas fortes.' },
  dwarf: { width: 1.16, height: 0.82, depth: 1.12, head: [1.12,0.96,1.03], jaw: 1.15, eye: 0.92, ear: 0.9, description: 'Silhueta compacta, rosto largo, nariz marcante e barbas volumosas.' },
  elf: { width: 0.86, height: 1.2, depth: 0.88, head: [0.88,1.08,0.94], jaw: 0.84, eye: 1, ear: 1.8, description: 'Rosto alongado, mandíbula delicada e orelhas longas e pontudas.' },
  gnome: { width: 0.82, height: 0.69, depth: 0.84, head: [1.2,1.1,1.12], jaw: 0.9, eye: 1.22, ear: 1.3, description: 'Pele cinza-azulada, olhos expressivos, nariz arredondado e cabeça maior.' },
};
export const HAIR_NAMES = ['Sem cabelo','Curto irregular','Risca lateral','Moicano','Longo','Rabo de cavalo'];
export const BEARD_NAMES = ['Sem barba','Curta','Cheia','Trança central','Duas tranças','Quatro tranças'];
export function skinColor(race: Race, index: number): string {
  const palette = RACE_SKIN[race] ?? RACE_SKIN.human;
  return palette[Number.isFinite(index) ? Math.max(0,Math.min(7,Math.floor(index))) : 1];
}
export function appearanceLabel(key: keyof Look, index: number): string {
  if (key === 'body') return BODY_TRAITS[index]?.name ?? 'Corpo';
  if (key === 'face') return FACE_TRAITS[index]?.name ?? 'Rosto';
  if (key === 'nose') return NOSE_TRAITS[index]?.name ?? 'Nariz';
  if (key === 'brows') return BROW_NAMES[index] ?? 'Sobrancelhas';
  if (key === 'hair') return HAIR_NAMES[index] ?? 'Estilo';
  if (key === 'beard') return BEARD_NAMES[index] ?? 'Estilo';
  return index === 0 && ['moustache','scar','tattoo','accessory'].includes(key) ? 'Nenhum' : `Variação ${index+1}`;
}
