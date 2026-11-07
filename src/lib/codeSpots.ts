/**
 * Pontos de código na Pedra da Aurora: o jogador monta um código com botões e o mundo muda de verdade
 * (a lanterna acende, as flores nascem, a ponte é consertada). Cada ponto fica salvo no personagem.
 * Um ponto por tema, na mesma ordem das runas de Eldrin.
 */
import type { Builder } from './apprentice';

export type SpotKind = 'lantern' | 'flowers' | 'nightlamp' | 'trees' | 'water' | 'garden' | 'fountain' | 'bridge';
export interface CodeSpot { id: string; kind: SpotKind; theme: string; title: string; story: string; done: string; x: number; z: number; xp: number; gold: number; builder: Builder }

const b = (answer: string, why: Record<string, string>) => ({ answer, why, options: [...Object.keys(why), answer].sort((x, y) => x.length - y.length || x.localeCompare(y)) });

export const CODE_SPOTS: CodeSpot[] = [
  { id: 'spot-lantern', kind: 'lantern', theme: 'Variáveis', title: 'Acenda a lanterna', x: -3.5, z: 9.5, xp: 40, gold: 10,
    story: 'Esta lanterna está apagada. Ela obedece a uma caixa chamada lanternaAcesa.', done: 'A lanterna acendeu e vai ficar acesa.',
    builder: { simple: 'Guarde true (verdadeiro) na caixa lanternaAcesa.', code: 'let lanternaAcesa = {0};', blanks: [b('true', { false: 'false quer dizer falso: a lanterna continuaria apagada.', '"acesa"': 'Com aspas é texto. A lanterna entende true ou false.' })],
      explain: ['let cria a caixa lanternaAcesa e guarda true (verdadeiro) dentro: a lanterna acende.'], words: [['variável', 'caixa com nome'], ['true', 'verdadeiro']] } },
  { id: 'spot-flowers', kind: 'flowers', theme: 'Contas', title: 'Plante o canteiro', x: -14.5, z: 4.5, xp: 45, gold: 10,
    story: 'Um canteiro vazio. Mira quer 2 fileiras com 3 flores em cada.', done: 'Nasceram 6 flores: 2 fileiras de 3.',
    builder: { simple: 'Calcule quantas flores plantar: 2 fileiras vezes 3 flores.', code: 'const fileiras = 2;\nconst porFileira = 3;\nconst flores = fileiras {0} porFileira;\nplantar("flor", flores);', blanks: [b('*', { '+': 'Com + nasceriam 5 flores (2 + 3). São 2 fileiras de 3: vezes.', '-': 'Com - daria 2 - 3 = -1: nenhuma flor nasceria.' })],
      explain: ['2 fileiras.', '3 flores em cada fileira.', 'flores = 2 * 3 = 6.', 'Planta as 6 flores no canteiro.'], words: [['*', 'vezes'], ['plantar(...)', 'manda o canteiro plantar']] } },
  { id: 'spot-nightlamp', kind: 'nightlamp', theme: 'Condições', title: 'Lampião inteligente', x: -14.5, z: 0.5, xp: 50, gold: 12,
    story: 'Este lampião gasta óleo de dia. Ensine: se for noite, acende; senão, apaga.', done: 'O lampião agora acende sozinho à noite e apaga de dia.',
    builder: { simple: 'Se for noite, acenda. Senão, apague.', code: 'if (noite) {\n  lampiao.{0}();\n} else {\n  lampiao.{1}();\n}', blanks: [b('acender', { apagar: 'À noite o lampião precisa de luz: acender.' }), b('apagar', { acender: 'De dia ele ficaria aceso gastando óleo. No else (senão), apague.' })],
      explain: ['if (noite) = "se for noite".', 'Então o lampião acende.', 'else = "senão" (de dia).', 'O lampião apaga.', 'Fim.'], words: [['if', 'se'], ['else', 'senão']] } },
  { id: 'spot-trees', kind: 'trees', theme: 'Repetição', title: 'Fileira de árvores', x: 15, z: 0.5, xp: 55, gold: 12,
    story: 'Pip quer 5 árvores em fila. Plantar uma por uma cansa: use uma repetição.', done: 'Uma fileira de 5 árvores cresceu em segundos.',
    builder: { simple: 'Repita 5 vezes: plante uma árvore.', code: 'for (let i = 0; i < {0}; i{1}) {\n  plantar("árvore", i);\n}', blanks: [b('5', { '0': 'Com i < 0 a repetição nem começa: nenhuma árvore.', i: 'i < i nunca é verdade: a repetição não roda.' }), b('++', { '--': 'i-- diminui: o i nunca chega a 5 e a repetição não termina!' })],
      explain: ['Começa com i = 0, repete enquanto i for menor que 5 e soma 1 no i a cada volta.', 'Em cada volta planta uma árvore na posição i.', 'Fim: 5 voltas, 5 árvores.'], words: [['for', 'repita'], ['i++', 'aumenta 1']] } },
  { id: 'spot-water', kind: 'water', theme: 'Funções', title: 'A receita de regar', x: -13, z: -4.5, xp: 60, gold: 14,
    story: 'Dois canteiros secos. Crie a receita regar() uma vez e use nos dois.', done: 'Os dois canteiros foram regados e brotaram.',
    builder: { simple: 'A receita regar molha o canteiro. Use a receita no segundo canteiro também.', code: 'function regar(canteiro) {\n  canteiro.agua = {0};\n}\nregar(canteiroA);\n{1}(canteiroB);', blanks: [b('true', { false: 'false deixaria o canteiro seco.' }), b('regar', { function: 'function cria uma receita nova. Para usar a que já existe, chame pelo nome: regar(...).', canteiro: 'canteiro é só o nome usado dentro da receita. Chame a receita: regar.' })],
      explain: ['Cria a receita regar, que recebe um canteiro.', 'Molha o canteiro (agua = true).', 'Fim da receita.', 'Usa a receita no canteiro A.', 'Usa a mesma receita no canteiro B.'], words: [['função', 'receita com nome'], ['regar(x)', 'usa a receita em x']] } },
  { id: 'spot-garden', kind: 'garden', theme: 'Listas', title: 'Jardim de cores', x: 14.5, z: 6.5, xp: 60, gold: 14,
    story: 'Uma lista guarda as cores do jardim. Plante cada cor pela posição dela.', done: 'Flores rosa, amarela e azul enfeitam o jardim.',
    builder: { simple: 'A lista começa na posição 0. Plante as cores das posições 0, 1 e 2.', code: 'const cores = ["rosa", "amarela", "azul"];\nplantar("flor", cores[{0}]);\nplantar("flor", cores[{1}]);\nplantar("flor", cores[2]);', blanks: [b('0', { '1': 'A primeira cor fica na posição 0. Com 1 você plantaria a amarela duas vezes.', '3': 'A lista vai de 0 a 2. A posição 3 não existe: nada nasceria.' }), b('1', { '2': 'A posição 2 é a azul, que já está na última linha. A amarela é a posição 1.', '3': 'A posição 3 não existe nessa lista.' })],
      explain: ['Lista com 3 cores: posição 0 rosa, 1 amarela, 2 azul.', 'Planta a cor da posição 0 (rosa).', 'Planta a cor da posição 1 (amarela).', 'Planta a cor da posição 2 (azul).'], words: [['lista (array)', 'vários valores em ordem'], ['[0]', 'a primeira posição']] } },
  { id: 'spot-fountain', kind: 'fountain', theme: 'Objetos', title: 'Ligue a fonte', x: -11.5, z: -11, xp: 65, gold: 16,
    story: 'A fonte lê uma ficha com dois campos: agua e altura.', done: 'A fonte voltou a jorrar água.',
    builder: { simple: 'Na ficha da fonte, agua é verdadeiro e altura é o número 3.', code: 'const fonte = {\n  agua: {0},\n  altura: {1}\n};\nligar(fonte);', blanks: [b('true', { '"sim"': 'Com aspas é texto. A fonte entende true.', false: 'Com false a fonte continuaria seca.' }), b('3', { '"alta"': 'altura é um número: 3, sem aspas.', '-3': 'Altura negativa: a água desceria para dentro do chão!' })],
      explain: ['Cria a ficha (objeto) fonte.', 'Campo agua: verdadeiro.', 'Campo altura: 3.', 'Fim da ficha.', 'Liga a fonte com essa ficha.'], words: [['objeto', 'ficha com campos'], ['agua: true', 'campo: valor']] } },
  { id: 'spot-bridge', kind: 'bridge', theme: 'Achar o erro', title: 'Conserte a ponte', x: 14, z: -6.5, xp: 70, gold: 18,
    story: 'A ponte tem 4 tábuas (0, 1, 2 e 3), mas o código tenta pôr uma quinta e ela cai no riacho.', done: 'A ponte ficou firme com 4 tábuas.',
    builder: { simple: 'Ache o erro: as tábuas vão da posição 0 à 3. Pare antes do 4.', code: 'const tabuas = 4;\nfor (let i = 0; i {0} tabuas; i++) {\n  colocarTabua(i);\n}', blanks: [b('<', { '<=': 'Com <= o i chega a 4 e coloca uma 5ª tábua que cai no riacho. Esse é o erro!', '>': 'Com > a repetição nem começa: nenhuma tábua.' })],
      explain: ['A ponte tem 4 tábuas.', 'i vai de 0 até 3 (para antes de 4).', 'Coloca a tábua da posição i.', 'Fim: 4 tábuas, ponte firme.'], words: [['bug', 'erro no código'], ['<', 'menor que (para antes)']] } },
];

/** Cada ponto abre quando o anterior foi construído. */
export function spotAvailable(built: string[], id: string) {
  const i = CODE_SPOTS.findIndex(s => s.id === id);
  return i === 0 || (i > 0 && built.includes(CODE_SPOTS[i - 1].id));
}
export const nextSpot = (built: string[]) => CODE_SPOTS.find(s => !built.includes(s.id));
