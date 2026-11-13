/** Prólogo do Lovelace Kingdom: roteiro aprovado (11 cenas). Cada cena tem a fala e o tipo de visual. */
export type PrologueVisual = 'logo' | 'loom' | 'engine' | 'runes' | 'void' | 'cities' | 'masters' | 'bosses' | 'heart' | 'hero' | 'end';
export type PrologueScene = { id: string; visual: PrologueVisual; title?: string; lines: string[] };

export const PROLOGUE: PrologueScene[] = [
  { id: 'abertura', visual: 'logo', lines: ['Antes das espadas, antes dos reinos… existia o Código.', 'E o Código guardava tudo o que sabíamos.'] },
  { id: 'jacquard', visual: 'loom', title: '1804 · O tear de Jacquard', lines: ['Em 1804, um tear aprendeu a tecer seguindo cartões perfurados.', 'Pela primeira vez, uma máquina obedecia a instruções.'] },
  { id: 'ada', visual: 'engine', title: 'Babbage e Ada Lovelace', lines: ['Babbage sonhou com a Máquina Analítica.', 'Ada Lovelace enxergou além: escreveu o primeiro algoritmo da história.', 'Em sua homenagem, nasceu este reino: Lovelace Kingdom.'] },
  { id: 'boole', visual: 'runes', title: 'Boole e as oito runas', lines: ['Boole deu ao reino a lógica do verdadeiro e do falso.', 'Oito runas foram gravadas, e cada uma guardava um pedaço do saber.'] },
  { id: 'queda', visual: 'void', title: 'Nullarion', lines: ['Até que veio Nullarion, o Devorador do Código.', 'Onde ele passa, tudo vira nulo. As oito runas se apagaram.'] },
  { id: 'cidades', visual: 'cities', title: 'Os povos do reino', lines: ['Os povos resistem: os humanos na Pedra da Aurora, os anões em Iron Forge, os gnomos em Gnomolândia, os elfos no Bosque Arcano e os orcs em Ogrimmar.', 'No centro, a Cidadela do Conhecimento ainda brilha.'] },
  { id: 'mestres', visual: 'masters', title: 'Os mestres da Cidadela', lines: ['Na Cidadela, os mestres ensinam quem tiver coragem.', 'Pascal fez as primeiras contas mecânicas. Zuse construiu o primeiro computador programável.'] },
  { id: 'chefes', visual: 'bosses', title: 'Os guardiões do caminho', lines: ['Mas o caminho é guardado.', 'Brutamato, Senhor do Bosque. Granito, Vigia das Condições. O Oráculo Fragmentado. Aracna, Tecelã dos Caminhos.'] },
  { id: 'coracao', visual: 'heart', title: 'Coração do Código Perdido', lines: ['E, no fim de tudo, o coração do reino, onde Nullarion espera.'] },
  { id: 'heroi', visual: 'hero', lines: ['Cada runa restaurada é uma lição aprendida.', 'Cada linha de código, um passo de volta à luz.', 'O reino precisa de um herói.'] },
  { id: 'final', visual: 'end', lines: ['Restaure o Código. Escreva a sua história.'] },
];

/** Chefes mostrados na cena dos guardiões, na ordem da fala. */
export const PROLOGUE_BOSSES = [
  { kind: 'boar', name: 'Brutamato', title: 'Senhor do Bosque' },
  { kind: 'golem', name: 'Granito', title: 'Vigia das Condições' },
  { kind: 'wraith', name: 'Oráculo Fragmentado', title: 'Ruínas das Funções' },
  { kind: 'spider', name: 'Aracna', title: 'Tecelã dos Caminhos' },
] as const;

/** Cidades da cena dos povos (nome, povo e cor da região). */
export const PROLOGUE_CITIES = [
  { name: 'Pedra da Aurora', people: 'Humanos', color: '#76a35a' },
  { name: 'Iron Forge', people: 'Anões', color: '#a5bbc7' },
  { name: 'Gnomolândia', people: 'Gnomos', color: '#8aaab5' },
  { name: 'Bosque Arcano', people: 'Elfos', color: '#66865c' },
  { name: 'Ogrimmar', people: 'Orcs', color: '#a56c4d' },
] as const;

/** Tempo de leitura de uma fala quando não há voz (ou o som está desligado): ~2,6 palavras por segundo. */
export function lineSeconds(line: string) { return Math.max(2.6, line.trim().split(/\s+/).length / 2.6 + 1); }
export const PROLOGUE_SEEN_KEY = 'lovelace-prologo-visto-v1';
