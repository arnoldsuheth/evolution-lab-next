/**
 * Modo Aprendiz: o código é montado com botões. Cada lacuna tem opções e, para cada opção errada,
 * uma explicação curta em português simples. Nada aqui depende de React: é testado como dado puro.
 */
/** Explica em linguagem simples por que uma runa ainda está trancada. */
export function friendlyLock(reason: string) {
  if (reason === 'Entregue a runa anterior a Eldrin') return 'Primeiro entregue a runa anterior: caminhe até Eldrin (o mentor com ? em cima, na praça) e aperte "Entregar missão" perto dele.';
  if (reason === 'Conclua o capítulo anterior') return 'Primeiro termine a runa anterior.';
  if (reason.startsWith('Requer nível')) return reason.replace('Requer nível', 'Seu herói precisa chegar ao nível') + '. Vença monstros ou faça os pontos de código da vila para ganhar XP.';
  return reason;
}
export type Blank = { options: string[]; answer: string; why: Record<string, string> };
export interface Builder {
  /** O pedido em palavras do dia a dia. */
  simple: string;
  /** Código com lacunas {0}, {1}... */
  code: string;
  blanks: Blank[];
  /** Uma explicação por linha do código, mostrada em "Me mostra como". */
  explain: string[];
  /** Pequeno glossário: palavra técnica → explicação simples. */
  words?: [string, string][];
}

export function fillCode(b: Builder, picks: (string | null | undefined)[], empty = '___') {
  return b.code.replace(/\{(\d+)\}/g, (_, n: string) => picks[Number(n)] ?? empty);
}
export function answers(b: Builder) { return b.blanks.map(x => x.answer); }
export function checkPicks(b: Builder, picks: (string | null | undefined)[]) {
  const missing = b.blanks.map((_, i) => i).filter(i => !picks[i]);
  const wrong = b.blanks.map((x, i) => ({ index: i, pick: picks[i] })).filter(p => p.pick && p.pick !== b.blanks[p.index].answer)
    .map(p => ({ index: p.index, message: b.blanks[p.index].why[p.pick!] ?? 'Quase! Essa peça não encaixa aqui. Tente outra.' }));
  return { complete: missing.length === 0, missing, wrong, ok: missing.length === 0 && wrong.length === 0 };
}

const blank = (answer: string, why: Record<string, string>, extra: string[] = []): Blank => ({ answer, why, options: shuffle([answer, ...Object.keys(why), ...extra]) });
/** Ordem fixa (sem sorteio), mas a resposta certa não fica sempre em primeiro. */
function shuffle(list: string[]) { const out = [...new Set(list)]; if (out.length > 1) out.push(out.shift()!); return out; }

/** As 8 runas de Eldrin, agora montadas com botões. O código final passa nos mesmos testes de sempre. */
export const APPRENTICE: Record<string, Builder> = {
  variables: {
    simple: 'Crie uma caixa chamada nivel e guarde o número 1 dentro dela.',
    code: '// Acenda a primeira runa\n{0} nivel = {1};',
    blanks: [
      blank('let', { nivel: 'nivel é o nome da caixa. Antes do nome vem a palavra que cria a caixa: let.', '=': 'O = vem depois do nome. Comece criando a caixa com let.' }),
      blank('1', { '"um"': 'Entre aspas vira texto. A runa pede o número 1, sem aspas.', nivel: 'Isso colocaria a caixa dentro dela mesma. O valor que vai dentro é o número 1.' }),
    ],
    explain: ['Comentário: uma anotação para pessoas. O computador ignora.', 'let cria a caixa, nivel é o nome dela e = guarda o 1 lá dentro.'],
    words: [['variável', 'uma caixa com nome que guarda um valor'], ['let', 'a palavra que cria a caixa']],
  },
  arithmetic: {
    simple: 'São 4 caixas com 6 pães cada. Faça a conta com os nomes caixas e paes.',
    code: 'const caixas = 4;\nconst paes = 6;\nconst total = caixas {0} {1};',
    blanks: [
      blank('*', { x: 'Em programação, vezes é o asterisco *. A letra x não faz conta.', '+': 'O + soma: daria 4 + 6 = 10 pães. Cada caixa tem 6, então é vezes.' }),
      blank('paes', { '6': 'Funciona hoje, mas se Borin mudar a quantidade de pães a conta fica errada. Use o nome paes.', '24': '24 é o resultado pronto. A runa testa com outras quantidades, então use os nomes.' }),
    ],
    explain: ['Guarda 4 na caixa caixas.', 'Guarda 6 na caixa paes.', 'total recebe caixas vezes paes. Se as quantidades mudarem, a conta continua certa.'],
    words: [['*', 'vezes'], ['const', 'cria uma caixa que não muda depois']],
  },
  conditions: {
    simple: 'A comporta abre (true) só se a energia for 10 ou mais.',
    code: 'const energia = 12;\nlet aberta = false;\nif (energia {0} 10) {\n  aberta = {1};\n}',
    blanks: [
      blank('>=', { '<': '< quer dizer menor que. A comporta abriria só com pouca energia: ao contrário!', '=': 'Um = sozinho guarda valor, não compara. Para "10 ou mais" use >=.' }),
      blank('true', { false: 'aberta já começa false. Dentro do if ela precisa virar true.', '"sim"': 'Com aspas é texto. Verdadeiro em código é true, sem aspas.' }),
    ],
    explain: ['A energia vale 12.', 'A comporta começa fechada (false).', 'if = "se". Se a energia for 10 ou mais...', '...a comporta abre: aberta vira true.', 'Fim do bloco do if.'],
    words: [['if', 'se'], ['>=', 'maior ou igual'], ['true / false', 'verdadeiro / falso']],
  },
  loops: {
    simple: 'Some 1 + 2 + 3 + 4 + 5 usando uma repetição.',
    code: 'const limite = 5;\nlet soma = 0;\nfor (let i = 1; i {0} limite; i++) {\n  soma {1} i;\n}',
    blanks: [
      blank('<=', { '<': 'Com < a repetição para antes do 5: somaria só 1+2+3+4 = 10.', '>=': 'Com >= a repetição nem começa (1 não é maior que 5). A soma ficaria 0.' }),
      blank('+=', { '=': '= troca o valor a cada volta: no fim soma valeria só 5. += junta.', '-=': '-= tira. A soma ficaria negativa.' }),
    ],
    explain: ['O limite é 5.', 'A soma começa em 0.', 'for repete: i começa em 1, vai até o limite e aumenta 1 por volta.', 'Em cada volta, junta o i na soma.', 'Fim da repetição: soma = 15.'],
    words: [['for', 'repita'], ['i++', 'aumenta i em 1'], ['+=', 'junta ao que já tinha']],
  },
  functions: {
    simple: 'Faça a função dobro devolver o número vezes 2.',
    code: 'function dobro(valor) {\n  {0} valor {1};\n}',
    blanks: [
      blank('return', { 'console.log': 'console.log só mostra na tela. Para a função devolver o resultado use return.', let: 'let cria uma caixa nova. Aqui queremos devolver: return.' }),
      blank('* 2', { '+ 2': '+ 2 soma dois: dobro(10) daria 12, não 20.', '* valor': 'valor * valor é o quadrado: dobro(3) daria 9, não 6.' }),
    ],
    explain: ['Cria a função dobro, que recebe um número chamado valor.', 'return devolve valor vezes 2.', 'Fim da função.'],
    words: [['função', 'uma receita com nome que você pode usar várias vezes'], ['return', 'devolve o resultado']],
  },
  arrays: {
    simple: 'Some todos os itens da mochila [3, 5, 2], um por vez.',
    code: 'const recursos = [3, 5, 2];\nlet total = 0;\nfor (let i = 0; i < recursos.{0}; i++) {\n  total += {1};\n}',
    blanks: [
      blank('length', { '3': 'Funciona só com 3 itens. Se a mochila mudar, use recursos.length (o tamanho da lista).', size: 'Em JavaScript o tamanho da lista se chama length.' }),
      blank('recursos[i]', { i: 'i é a posição (0, 1, 2), não o item. Some recursos[i], o item daquela posição.', recursos: 'Isso tenta somar a lista inteira de uma vez. Pegue um item por volta: recursos[i].' }),
    ],
    explain: ['A mochila é uma lista com 3 itens.', 'O total começa em 0.', 'Passa pelas posições 0, 1 e 2 (length = tamanho da lista).', 'Junta o item da posição i no total.', 'Fim: total = 10.'],
    words: [['array', 'lista'], ['[i]', 'o item da posição i'], ['length', 'quantos itens a lista tem']],
  },
  objects: {
    simple: 'Complete a ficha do herói: vida 100 e ativo verdadeiro.',
    code: 'const heroi = {\n  nome: "Aurora",\n  vida: {0},\n  ativo: {1}\n};',
    blanks: [
      blank('100', { '"100"': 'Com aspas vira texto. Vida é número: 100 sem aspas.', vida: 'vida é o nome do campo. Depois dos dois pontos vem o valor: 100.' }),
      blank('true', { '"true"': 'Com aspas vira texto. Verdadeiro é true, sem aspas.', sim: 'Em código, verdadeiro se escreve true.' }),
    ],
    explain: ['Cria a ficha (objeto) heroi.', 'Campo nome: o texto "Aurora".', 'Campo vida: o número 100.', 'Campo ativo: verdadeiro.', 'Fim da ficha.'],
    words: [['objeto', 'uma ficha com campos'], ['nome: valor', 'cada campo da ficha']],
  },
  debug: {
    simple: 'O laço tem 2 erros. Faça somar 2 + 4 + 6 sem passar do fim da lista.',
    code: 'const valores = [2, 4, 6];\nlet soma = 0;\nfor (let i = {0}; i {1} valores.length; i++) {\n  soma += valores[i];\n}',
    blanks: [
      blank('0', { '1': 'Listas começam na posição 0. Começando em 1, o 2 fica de fora.' }),
      blank('<', { '<=': 'Com <= o laço tenta ler a posição 3, que não existe (a lista vai de 0 a 2).' }),
    ],
    explain: ['A lista tem 3 números.', 'A soma começa em 0.', 'Começa na posição 0 e para antes de length (3): posições 0, 1 e 2.', 'Junta cada número na soma.', 'Fim: soma = 12.'],
    words: [['índice', 'a posição na lista, começando em 0'], ['bug', 'um erro no código']],
  },
};
