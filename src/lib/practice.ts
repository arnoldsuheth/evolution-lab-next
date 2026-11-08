/**
 * Treino rápido das runas.
 * A · Missão relâmpago: 3 perguntas curtas por runa (cerca de 1 minuto).
 * B · Desafios variados: escolher, completar a lacuna, ordenar as linhas e achar o erro.
 * C · Pergunta de batalha: acertar no meio da luta fortalece o próximo golpe.
 * D · Dificuldade que se ajusta: acertos sobem o nível do treino; erros descem e abrem a pista.
 * Tudo se responde tocando, sem digitar: funciona bem no celular.
 */
export type PracticeKind = 'choice' | 'fill' | 'order' | 'bug';
export type PracticeLevel = 1 | 2 | 3;
export interface PracticeQuestion {
  id: string; concept: string; level: PracticeLevel; kind: PracticeKind;
  prompt: string;
  /** Linhas de código mostradas. Em "fill", a linha com ___ é a lacuna. */
  code?: string[];
  /** choice/fill: opções; order: linhas na ordem certa; bug: as linhas do código. */
  options: string[];
  /** choice/fill: texto certo; order: ordem certa; bug: índice da linha com erro. */
  answer: string | string[] | number;
  hint: string; explanation: string;
}
export interface Mastery { level: PracticeLevel; streak: number; misses: number; right: number; total: number }
export const KIND_LABEL: Record<PracticeKind, string> = { choice: 'Escolha', fill: 'Complete a lacuna', order: 'Ordene as linhas', bug: 'Ache o erro' };
export const LEVEL_LABEL: Record<PracticeLevel, string> = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' };
export const BLITZ_SIZE = 3, BLITZ_PASS = 2;
export const BATTLE_COOLDOWN_MS = 30000, BATTLE_MISS_COOLDOWN_MS = 15000, BATTLE_BUFF_SECONDS = 20;

const bank: PracticeQuestion[] = [];
const choice = (id: string, concept: string, level: PracticeLevel, prompt: string, answer: string, wrong: string[], explanation: string, hint: string, code?: string[]) => { bank.push({ id, concept, level, kind: 'choice', prompt, code, options: [answer, ...wrong], answer, hint, explanation }); };
const fill = (id: string, concept: string, level: PracticeLevel, prompt: string, code: string[], answer: string, wrong: string[], explanation: string, hint: string) => { bank.push({ id, concept, level, kind: 'fill', prompt, code, options: [answer, ...wrong], answer, hint, explanation }); };
const order = (id: string, concept: string, level: PracticeLevel, prompt: string, lines: string[], explanation: string, hint: string) => { bank.push({ id, concept, level, kind: 'order', prompt, options: lines, answer: lines, hint, explanation }); };
const bug = (id: string, concept: string, level: PracticeLevel, prompt: string, lines: string[], wrongLine: number, explanation: string, hint: string) => { bank.push({ id, concept, level, kind: 'bug', prompt, options: lines, answer: wrongLine, hint, explanation }); };

// Variáveis
choice('v1', 'variables', 1, 'Qual linha guarda o número 5 numa caixa chamada energia?', 'let energia = 5;', ['energia let = 5;', 'let 5 = energia;'], 'Primeiro vem let, depois o nome da caixa, o sinal = e o valor.', 'A ordem é: palavra let, nome, =, valor.');
fill('v2', 'variables', 1, 'Complete para criar a caixa ouro com 10 moedas.', ['___ ouro = 10;'], 'let', ['if', 'return'], 'let cria uma caixa nova.', 'Qual palavra cria uma caixa?');
choice('v3', 'variables', 2, 'O nome do reino nunca muda. Qual palavra combina melhor?', 'const', ['let', 'for'], 'const guarda um valor que não vai trocar.', 'Uma das palavras significa "constante".');
bug('v4', 'variables', 2, 'Qual linha dá erro?', ['const vida = 10;', 'vida = 8;', 'console.log(vida);'], 1, 'Uma caixa const não pode receber outro valor. Se a vida vai mudar, use let.', 'Pense em qual linha tenta trocar uma constante.');
order('v5', 'variables', 2, 'Coloque na ordem: criar, mudar e mostrar as moedas.', ['let moedas = 3;', 'moedas = moedas + 2;', 'console.log(moedas);'], 'Primeiro a caixa nasce, depois muda de valor, e só então mostramos.', 'Não dá para mudar uma caixa que ainda não existe.');
choice('v6', 'variables', 3, 'Depois deste código, quanto vale x?', '7', ['6', '9'], 'x começa em 2, vira 2 × 3 = 6 e depois 6 + 1 = 7.', 'Faça linha por linha, como o computador.', ['let x = 2;', 'x = x * 3;', 'x = x + 1;']);

// Operadores
choice('a1', 'arithmetic', 1, 'Quanto é 2 + 3 * 4?', '14', ['20', '24'], 'A multiplicação vem antes: 3 × 4 = 12, mais 2 dá 14.', 'O * acontece antes do +.');
fill('a2', 'arithmetic', 1, 'Borin tem 5 caixas com 2 pães em cada. Complete a conta.', ['const total = 5 ___ 2;'], '*', ['+', '-'], 'Grupos iguais se calculam com multiplicação.', 'São 5 grupos de 2.');
choice('a3', 'arithmetic', 2, 'Quanto vale (2 + 3) * 4?', '20', ['14', '9'], 'Os parênteses vêm primeiro: 5 × 4 = 20.', 'Resolva o que está entre parênteses antes.');
bug('a4', 'arithmetic', 2, 'A média de 8 e 4 deveria ser 6. Qual linha calcula errado?', ['const a = 8;', 'const b = 4;', 'const media = a + b / 2;'], 2, 'Sem parênteses, b / 2 é feito antes. O certo é (a + b) / 2.', 'Lembre a ordem: / antes de +.');
order('a5', 'arithmetic', 3, 'Monte o cálculo do preço total.', ['const preco = 10;', 'const quantidade = 3;', 'const total = preco * quantidade;', 'console.log(total);'], 'As caixas usadas na conta precisam existir antes dela.', 'A conta usa preco e quantidade.');
choice('a6', 'arithmetic', 3, 'O sinal % mostra o resto da divisão. Quanto vale 10 % 3?', '1', ['3', '0'], '10 dividido por 3 dá 3 e sobra 1.', 'Quantos sobram quando você divide 10 por 3?');

// Condições
choice('c1', 'conditions', 1, 'A energia é 12. O que acontece?', 'A porta abre', ['Nada acontece', 'O jogo dá erro'], '12 é maior ou igual a 10, então a condição é verdadeira.', '12 >= 10 é verdade?', ['if (energia >= 10) {', '  abrirPorta();', '}']);
fill('c2', 'conditions', 1, 'Complete para perguntar se a vida é igual a 0.', ['if (vida ___ 0) {', '  derrota();', '}'], '===', ['=', '=>'], '=== compara. Um = sozinho guarda valor.', 'Para comparar se é igual, use três sinais.');
bug('c3', 'conditions', 2, 'Qual linha tem o erro?', ['let ouro = 5;', 'if (ouro = 10) {', '  comprar();', '}'], 1, 'Dentro do if é preciso comparar com ===. Um = sozinho troca o valor do ouro.', 'Procure o sinal de igual que deveria comparar.');
choice('c4', 'conditions', 2, 'O nível é 3. O que aparece na tela?', 'treinando', ['forte', 'forte e treinando'], '3 não é maior que 5, então vai para o else.', 'Só um dos dois caminhos acontece.', ['if (nivel > 5) {', '  console.log("forte");', '} else {', '  console.log("treinando");', '}']);
order('c5', 'conditions', 3, 'Monte a regra: sem vida, derrota; senão, continua lutando.', ['if (vida <= 0) {', '  console.log("derrota");', '} else {', '  console.log("lutando");', '}'], 'O if vem primeiro, o else vem depois do fecha-chaves.', 'O else nunca começa sozinho.');
choice('c6', 'conditions', 3, 'Qual condição só é verdadeira quando você TEM a chave E a porta está fechada?', 'temChave && fechada', ['temChave || fechada', '!temChave && fechada'], '&& exige as duas coisas ao mesmo tempo. || aceita só uma.', '&& quer dizer "e".');

// Laços
choice('l1', 'loops', 1, 'Quantas vezes o herói bate?', '3', ['2', '4'], 'i vale 0, 1 e 2. Quando chega a 3, o laço para.', 'Conte os valores de i menores que 3.', ['for (let i = 0; i < 3; i++) {', '  bater();', '}']);
fill('l2', 'loops', 1, 'Complete para contar de 1 até 5, incluindo o 5.', ['for (let i = 1; i ___ 5; i++) {', '  console.log(i);', '}'], '<=', ['<', '>='], '<= inclui o próprio 5. Com < pararia no 4.', 'O 5 precisa entrar na conta.');
bug('l3', 'loops', 2, 'Este laço nunca termina. Qual linha está errada?', ['for (let i = 0; i < 3; i--) {', '  pular();', '}'], 0, 'i-- diminui o contador, então ele nunca chega a 3. O certo é i++.', 'O contador está indo para o lado certo?');
choice('l4', 'loops', 2, 'O que aparece no final?', '6', ['3', '4'], 'A soma faz 0 + 1 + 2 + 3 = 6.', 'Some 1, depois 2, depois 3.', ['let soma = 0;', 'for (let i = 1; i <= 3; i++) {', '  soma = soma + i;', '}', 'console.log(soma);']);
order('l5', 'loops', 3, 'Monte o laço que junta 2 moedas, 5 vezes.', ['let moedas = 0;', 'for (let i = 0; i < 5; i++) {', '  moedas = moedas + 2;', '}', 'console.log(moedas);'], 'A caixa nasce antes do laço, cresce dentro dele e é mostrada no fim.', 'O que acontece 5 vezes fica entre as chaves.');
choice('l6', 'loops', 3, 'Qual laço é melhor quando você não sabe quantas vezes vai repetir?', 'while', ['for com número fixo', 'if'], 'while repete enquanto a condição for verdadeira, sem número fixo.', 'Um deles nem repete.');

// Funções
choice('f1', 'functions', 1, 'Qual valor a função devolve?', '8', ['4', '6'], 'dobro(4) faz 4 × 2 = 8.', 'n vale 4 nesta chamada.', ['function dobro(n) {', '  return n * 2;', '}', 'dobro(4);']);
fill('f2', 'functions', 1, 'Complete para a função entregar o resultado.', ['function soma(a, b) {', '  ___ a + b;', '}'], 'return', ['console.log', 'let'], 'return entrega o valor para quem chamou a função.', 'Qual palavra devolve um valor?');
bug('f3', 'functions', 2, 'nova deveria valer 15. Qual linha tem o erro?', ['function cura(vida) {', '  vida + 5;', '}', 'const nova = cura(10);'], 1, 'Sem return a função não devolve nada. O certo é: return vida + 5;', 'A conta é feita, mas ninguém a entrega.');
choice('f4', 'functions', 2, 'Em function atacar(forca) { }, o que é forca?', 'Um parâmetro: o valor que a função recebe', ['O nome da função', 'Um laço'], 'Parâmetros ficam entre os parênteses e recebem valores na chamada.', 'Fica dentro dos parênteses.');
order('f5', 'functions', 3, 'Monte a função que cumprimenta e depois use-a.', ['function saudar(nome) {', '  return "Olá, " + nome;', '}', 'console.log(saudar("Borin"));'], 'Primeiro a função é escrita, depois ela é chamada.', 'O return fica dentro da função.');
choice('f6', 'functions', 3, 'Qual valor esta chamada devolve?', '9', ['3', '12'], '3 não é maior que 9, então a função devolve b, que é 9.', 'Compare a e b.', ['function maior(a, b) {', '  if (a > b) return a;', '  return b;', '}', 'maior(3, 9);']);

// Listas (arrays)
choice('r1', 'arrays', 1, 'Qual item é itens[0]?', '"espada"', ['"escudo"', '"poção"'], 'A contagem da lista começa em 0.', 'O primeiro da lista tem índice 0.', ['const itens = ["espada", "escudo", "poção"];']);
fill('r2', 'arrays', 1, 'Complete para colocar uma maçã no fim da mochila.', ['mochila.___("maçã");'], 'push', ['pop', 'length'], 'push coloca no fim. pop tira do fim.', 'Empurrar para dentro em inglês.');
choice('r3', 'arrays', 2, 'Quanto vale itens.length?', '4', ['3', '9'], 'length conta quantos itens existem: 3, 7, 9 e 2.', 'Conte os números.', ['const itens = [3, 7, 9, 2];']);
bug('r4', 'arrays', 2, 'Qual linha procura um item que não existe?', ['const runas = ["fogo", "água"];', 'console.log(runas[2]);'], 1, 'Só existem os índices 0 e 1. runas[2] dá undefined.', 'Com 2 itens, qual é o último índice?');
order('r5', 'arrays', 3, 'Monte: mochila vazia, guarde pão e mapa, mostre quantos itens.', ['const mochila = [];', 'mochila.push("pão");', 'mochila.push("mapa");', 'console.log(mochila.length);'], 'A lista precisa existir antes de receber itens.', 'O que vem antes de guardar?');
choice('r6', 'arrays', 3, 'O que aparece na tela?', '6', ['3', '123'], 'O laço soma 1 + 2 + 3 = 6.', 'Cada x da lista é somado no total.', ['const n = [1, 2, 3];', 'let total = 0;', 'for (const x of n) total = total + x;', 'console.log(total);']);

// Objetos
choice('o1', 'objects', 1, 'Qual valor heroi.nivel guarda?', '3', ['"Ana"', 'nivel'], 'O ponto lê a propriedade nivel do objeto.', 'Procure nivel dentro das chaves.', ['const heroi = { nome: "Ana", nivel: 3 };']);
fill('o2', 'objects', 1, 'Complete para mostrar o nome do herói.', ['console.log(heroi___nome);'], '.', [',', ';'], 'O ponto entra no objeto e pega a propriedade.', 'É um sinal bem pequeno.');
choice('o3', 'objects', 2, 'Como mudar o nível do herói para 4?', 'heroi.nivel = 4;', ['heroi = 4;', 'nivel.heroi = 4;'], 'Primeiro o objeto, depois o ponto e a propriedade.', 'Objeto ponto propriedade.');
bug('o4', 'objects', 2, 'Qual linha tem o erro?', ['const item = { nome: "Arco" preco: 30 };', 'console.log(item.nome);'], 0, 'Falta a vírgula entre as propriedades: nome: "Arco", preco: 30.', 'Olhe entre "Arco" e preco.');
order('o5', 'objects', 3, 'Monte: crie o herói, tire 3 de vida e mostre.', ['const heroi = { vida: 10 };', 'heroi.vida = heroi.vida - 3;', 'console.log(heroi.vida);'], 'O objeto nasce primeiro; depois a propriedade muda.', 'Só dá para mudar o que já existe.');
choice('o6', 'objects', 3, 'Depois deste código, o que é verdade?', 'arma.dano vale 10', ['arma.dano vale 5', 'O código dá erro'], 'const impede trocar o objeto inteiro, mas permite mudar uma propriedade dele.', '5 × 2 = ?', ['const arma = { nome: "Machado", dano: 5 };', 'arma.dano = arma.dano * 2;']);

// Depuração
choice('d1', 'debug', 1, 'Um teste falhou. Qual é o primeiro passo?', 'Ler a mensagem de erro com calma', ['Apagar todo o código', 'Mudar o teste para passar'], 'A mensagem mostra o que deu errado e onde procurar.', 'O computador costuma dizer onde dói.');
bug('d2', 'debug', 1, 'Qual linha tem o erro?', ['let nivel = 1;', 'console.log(Nivel);'], 1, 'JavaScript diferencia maiúsculas: Nivel e nivel são nomes diferentes.', 'Compare as letras dos nomes.');
choice('d3', 'debug', 2, 'Para ver o valor de uma caixa no meio do código, use:', 'console.log(caixa);', ['return caixa;', 'if (caixa) {}'], 'console.log mostra o valor sem mudar o programa.', 'Qual comando escreve na tela?');
bug('d4', 'debug', 2, 'O total deveria ser 15, mas mostra 105. Qual linha causa isso?', ['const preco = "10";', 'const total = preco + 5;', 'console.log(total);'], 0, '"10" com aspas é texto, e + junta textos. Use 10 sem aspas.', 'Repare nas aspas.');
order('d5', 'debug', 3, 'Coloque os passos de depuração em ordem.', ['Reproduzir o erro', 'Ler a mensagem e achar a linha', 'Testar uma correção pequena', 'Rodar os testes de novo'], 'Primeiro ver o erro acontecer, entender, corrigir pouco e testar de novo.', 'Antes de corrigir, é preciso ver o erro acontecer.');
choice('d6', 'debug', 3, 'O que media([]) devolve?', 'NaN, porque divide 0 por 0', ['0', 'Infinity'], 'Lista vazia: soma 0 e length 0. 0 / 0 dá NaN. Vale testar listas vazias!', 'Quanto vale lista.length numa lista vazia?', ['function media(lista) {', '  let soma = 0;', '  for (const n of lista) soma = soma + n;', '  return soma / lista.length;', '}']);

export const PRACTICE: readonly PracticeQuestion[] = bank;
export const PRACTICE_BY_ID: Record<string, PracticeQuestion> = Object.fromEntries(bank.map(q => [q.id, q]));
export const PRACTICE_CONCEPTS = [...new Set(bank.map(q => q.concept))];

export const freshMastery = (): Mastery => ({ level: 1, streak: 0, misses: 0, right: 0, total: 0 });
/** D: dois acertos seguidos sobem o nível; dois erros seguidos descem. */
export function nextMastery(current: Mastery | undefined, correct: boolean): Mastery {
  const m = current ?? freshMastery();
  if (correct) { const streak = m.streak + 1; return streak >= 2 && m.level < 3 ? { level: (m.level + 1) as PracticeLevel, streak: 0, misses: 0, right: m.right + 1, total: m.total + 1 } : { ...m, streak, misses: 0, right: m.right + 1, total: m.total + 1 }; }
  const misses = m.misses + 1;
  return misses >= 2 && m.level > 1 ? { level: (m.level - 1) as PracticeLevel, streak: 0, misses: 0, right: m.right, total: m.total + 1 } : { ...m, streak: 0, misses, total: m.total + 1 };
}
/** D: depois de um erro, a pista já aparece aberta. */
export const autoHint = (m: Mastery | undefined) => (m?.misses ?? 0) > 0;
export function cleanMastery(raw: unknown): Mastery | undefined {
  if (!raw || typeof raw !== 'object') return undefined; const r = raw as Record<string, unknown>;
  const n = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
  const level = n(r.level, 3); return { level: (level < 1 ? 1 : level) as PracticeLevel, streak: n(r.streak, 99), misses: n(r.misses, 99), right: n(r.right, 1e6), total: n(r.total, 1e6) };
}

function shuffle<T>(items: readonly T[], random: () => number) { const r = [...items]; for (let i = r.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(random() * (i + 1))); [r[i], r[j]] = [r[j], r[i]]; } return r; }
/** B + D: perguntas do nível atual primeiro, com tipos diferentes; completa com níveis próximos. */
export function pickQuestions(concept: string, mastery: Mastery | undefined, count: number, random: () => number = Math.random, avoid: string[] = []): PracticeQuestion[] {
  const level = (mastery ?? freshMastery()).level; const pool = bank.filter(q => q.concept === concept);
  const byDistance = shuffle(pool, random).sort((a, b) => Math.abs(a.level - level) - Math.abs(b.level - level) || Number(avoid.includes(a.id)) - Number(avoid.includes(b.id)));
  const chosen: PracticeQuestion[] = []; const kinds = new Set<PracticeKind>();
  for (const q of byDistance) if (chosen.length < count && !kinds.has(q.kind) && Math.abs(q.level - level) <= 1) { chosen.push(q); kinds.add(q.kind); }
  for (const q of byDistance) if (chosen.length < count && !chosen.includes(q)) chosen.push(q);
  return chosen.slice(0, count);
}
/** Opções embaralhadas para mostrar (a ordem das linhas em "order" também). */
export const displayOptions = (q: PracticeQuestion, random: () => number = Math.random) => q.kind === 'bug' ? q.options.map((_, i) => i) : shuffle(q.options.map((_, i) => i), random);
export function checkAnswer(q: PracticeQuestion, given: string | number | string[]): boolean {
  if (q.kind === 'order') return Array.isArray(given) && given.length === (q.answer as string[]).length && given.every((line, i) => line === (q.answer as string[])[i]);
  if (q.kind === 'bug') return given === q.answer;
  return given === q.answer;
}
export const correctText = (q: PracticeQuestion) => q.kind === 'order' ? (q.answer as string[]).join('\n') : q.kind === 'bug' ? `Linha ${(q.answer as number) + 1}: ${q.options[q.answer as number]}` : String(q.answer);

/** A: recompensa da missão relâmpago, uma vez por runa por dia. */
export const blitzReward = (level: PracticeLevel) => ({ xp: 20 + level * 15, gold: level * 5 });
export const dayKey = (time: number) => { const d = new Date(time - 3 * 3600000); return d.toISOString().slice(0, 10); };
/** C: perguntas de batalha usam runas já restauradas; no começo, a primeira runa. */
export function battleConcepts(completed: readonly string[]) { const known = PRACTICE_CONCEPTS.filter(c => completed.includes(c)); return known.length ? known : ['variables']; }
export const battleBuff = (attack: number) => Math.max(3, Math.round(attack * 0.25));
