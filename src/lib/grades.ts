/** Grau do equipamento pela faixa de nível: D comum, C verde, B amarelo, A roxo, S laranja (o melhor). */
export type Grade = 'D' | 'C' | 'B' | 'A' | 'S';
export const GRADES: { grade: Grade; from: number; name: string; color: string }[] = [
  { grade: 'D', from: 1, name: 'Comum', color: '#d8d2c4' },
  { grade: 'C', from: 10, name: 'Especial', color: '#4fd27a' },
  { grade: 'B', from: 20, name: 'Raro', color: '#f1cf4a' },
  { grade: 'A', from: 30, name: 'Épico', color: '#b57cf0' },
  { grade: 'S', from: 50, name: 'Lendário', color: '#ff8a2a' },
];
const EQUIP = new Set(['weapon', 'armor', 'accessory']);
export function gradeForLevel(level: number): Grade {
  let g: Grade = 'D'; for (const r of GRADES) if (level >= r.from) g = r.grade; return g;
}
/** Só armas, armaduras e acessórios têm grau; o resto devolve null. */
export function gradeOf(item: { category: string; minLevel: number; slot?: string }): Grade | null {
  if (!EQUIP.has(item.category) || item.slot === 'trophy' || item.slot === 'pet') return null;
  return gradeForLevel(item.minLevel);
}
export const gradeInfo = (g: Grade) => GRADES.find(r => r.grade === g)!;
