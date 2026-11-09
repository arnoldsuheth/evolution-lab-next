/** Miniatura de barba para o criador (prévia 5): rosto simples com o formato de cada barba. */
const HUMAN: string[] = [
  '',
  'M34 60 Q50 70 66 60 Q64 68 50 71 Q36 68 34 60Z',
  'M30 54 Q32 78 50 82 Q68 78 70 54 Q60 66 50 66 Q40 66 30 54Z',
  'M30 54 Q32 76 50 78 Q68 76 70 54 Q60 66 50 66 Q40 66 30 54Z M46 78 h8 v14 h-8Z',
  'M30 54 Q32 76 50 78 Q68 76 70 54 Q60 66 50 66 Q40 66 30 54Z M38 76 h7 v14 h-7Z M55 76 h7 v14 h-7Z',
  'M30 54 Q32 76 50 78 Q68 76 70 54 Q60 66 50 66 Q40 66 30 54Z M33 72 h5 v12 h-5Z M42 76 h5 v14 h-5Z M53 76 h5 v14 h-5Z M62 72 h5 v12 h-5Z',
  'M43 64 Q50 66 57 64 Q56 76 50 78 Q44 76 43 64Z',
  'M28 40 h6 v20 h-6Z M66 40 h6 v20 h-6Z',
  'M32 58 Q50 72 68 58 Q66 66 50 70 Q34 66 32 58Z',
  'M43 64 Q50 66 57 64 Q56 76 50 78 Q44 76 43 64Z M36 61 h28 v3 h-28Z',
  'M26 50 Q24 72 34 82 Q40 92 50 90 Q60 92 66 82 Q76 72 74 50 Q64 66 50 66 Q36 66 26 50Z M30 80 l-6 6 M70 80 l6 6',
];
const DWARF: string[] = [
  'M26 50 Q26 82 50 86 Q74 82 74 50 Q62 66 50 66 Q38 66 26 50Z',
  'M26 50 Q26 76 40 80 L44 96 L50 82 L56 96 L60 80 Q74 76 74 50 Q62 66 50 66 Q38 66 26 50Z',
  'M26 50 Q26 80 42 84 L46 98 h8 L58 84 Q74 80 74 50 Q62 66 50 66 Q38 66 26 50Z',
  'M26 50 Q26 76 50 80 Q74 76 74 50 Q62 66 50 66 Q38 66 26 50Z M36 78 h8 v18 h-8Z M56 78 h8 v18 h-8Z',
  'M26 50 Q26 80 50 84 Q74 80 74 50 Q62 66 50 66 Q38 66 26 50Z M42 86 h16 v4 h-16Z',
  'M22 50 Q22 84 50 88 Q78 84 78 50 Q62 66 50 66 Q38 66 22 50Z',
];
export default function BeardIcon({ index, dwarf }: { index: number; dwarf?: boolean }) {
  const path = (dwarf ? DWARF : HUMAN)[index] ?? '';
  return <svg className="beard-icon" viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="46" rx="25" ry="30" fill="#e7bd9e" stroke="#6e4a2c" strokeWidth="2" />
    <path d="M25 38 Q28 14 50 14 Q72 14 75 38 Q62 26 50 26 Q38 26 25 38Z" fill="#7a4a2a" />
    <circle cx="41" cy="44" r="2.6" fill="#24140c" /><circle cx="59" cy="44" r="2.6" fill="#24140c" />
    <path d="M47 52 Q50 56 53 52" stroke="#a46f55" strokeWidth="2" fill="none" />
    {path && <path d={path} fill="#7a4a2a" stroke="#4a2c16" strokeWidth="1.5" strokeLinejoin="round" />}
    {!path && <path d="M43 62 Q50 66 57 62" stroke="#a46f55" strokeWidth="2" fill="none" />}
  </svg>;
}
