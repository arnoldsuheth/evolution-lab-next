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

/** Portas de código das masmorras (caverna e monastério), também montadas com botões. */
export const DOOR_APPRENTICE: Record<string, Builder> = {
  'cavern-1': { simple: 'A fechadura pede a chave número 3. Guarde 3 na variável chave.', code: 'let chave = {0};',
    blanks: [blank('3', { '0': 'Com 0 a fechadura continua travada: ela pede a chave 3.', '"3"': 'Com aspas vira texto. A fechadura quer o número 3, sem aspas.' })],
    explain: ['let cria a caixa chave e guarda o número 3: a fechadura gira.'], words: [['let', 'cria uma variável (caixa com nome)']] },
  'cavern-2': { simple: 'Se houver 2 tochas ou mais, a porta abre (aberta = true).', code: 'const tochas = 2;\nlet aberta = false;\nif (tochas {0} 2) {\n  aberta = {1};\n}',
    blanks: [blank('>=', { '<': 'Com < a porta só abriria com MENOS de 2 tochas: o contrário!', '==': 'Com == ela só abriria com exatamente 2. Com 3 tochas ficaria fechada.' }),
      blank('true', { false: 'false deixaria a porta fechada mesmo com as tochas acesas.' })],
    explain: ['Há 2 tochas acesas.', 'A porta começa fechada.', 'Se tochas for 2 ou mais...', '...a porta abre (true).', 'Fim do se.'], words: [['>=', 'maior ou igual'], ['if', 'se']] },
  'cavern-3': { simple: 'Some todos os cristais da lista no total, um por volta da repetição.', code: 'const cristais = [4, 1, 5];\nlet total = 0;\nfor (let i = 0; i < cristais.length; i++) {\n  total {0} cristais[{1}];\n}',
    blanks: [blank('+=', { '=': 'Com = o total guardaria só o último cristal (5), não a soma.', '-=': 'Com -= o total ficaria negativo.' }),
      blank('i', { '0': 'Com [0] você somaria sempre o primeiro cristal (4), três vezes.', '1': 'Com [1] somaria sempre o mesmo cristal. Use i, que muda a cada volta.' })],
    explain: ['Lista com 3 cristais: 4, 1 e 5.', 'O total começa em 0.', 'Repete uma vez para cada cristal (i = 0, 1, 2).', 'Soma o cristal da posição i ao total: 4 + 1 + 5 = 10.', 'Fim da repetição.'], words: [['+=', 'soma ao que já tem'], ['[i]', 'o item da posição i']] },
  'monastery-1': { simple: 'Toque o sino 5 vezes: uma repetição que conta um toque por volta.', code: 'let toques = 0;\nfor (let i = 0; i < {0}; i++) {\n  toques{1};\n}',
    blanks: [blank('5', { '4': 'Com 4 o sino toca só 4 vezes.', '6': 'Com 6 seriam 6 toques, um a mais.' }),
      blank('++', { '--': 'toques-- diminui: terminaria em -5.' })],
    explain: ['Começa com 0 toques.', 'Repete 5 vezes (i = 0, 1, 2, 3, 4).', 'Cada volta soma 1 toque.', 'Fim: 5 toques.'], words: [['for', 'repita'], ['++', 'aumenta 1']] },
  'monastery-2': { simple: 'A função selo recebe um número e devolve esse número mais 10.', code: 'function selo(n) {\n  {0} n {1} 10;\n}',
    blanks: [blank('return', { 'console.log': 'console.log só mostra na tela. A função precisa DEVOLVER o valor: return.', let: 'let cria uma variável. Para devolver um valor use return.' }),
      blank('+', { '*': 'n * 10 daria 50 com n = 5. O selo pede n + 10 = 15.', '-': 'n - 10 daria -5 com n = 5.' })],
    explain: ['Cria a função selo, que recebe um número n.', 'Devolve n mais 10 (com 5, devolve 15).', 'Fim da função.'], words: [['return', 'devolve o resultado'], ['função', 'receita com nome']] },
  'monastery-3': { simple: 'Passa quem tem nível 25 ou mais E tem o selo (as duas coisas).', code: 'const nivel = 25;\nconst temSelo = true;\nconst passa = nivel {0} 25 {1} temSelo;',
    blanks: [blank('>=', { '>': 'Com > quem tem exatamente nível 25 não passaria.', '<': 'Com < só passaria quem tem nível baixo: o contrário.' }),
      blank('&&', { '||': 'Com || bastaria ter só uma das duas coisas. O abade exige as duas: &&.' })],
    explain: ['O herói tem nível 25.', 'O herói tem o selo.', 'passa é verdadeiro só se o nível for 25 ou mais E tiver o selo.'], words: [['&&', 'e (as duas coisas)'], ['||', 'ou (basta uma)']] },
};

/** Desafios extras (treino opcional) também com botões. */
export const EXTRA_APPRENTICE: Record<string, Builder> = {
  variables: { simple: 'Junte o texto "Olá, " com o nome para formar a saudação.', code: 'const nome = "Aurora";\nconst saudacao = {0} {1} nome;',
    blanks: [blank('"Olá, "', { '"Olá"': 'Sem a vírgula e o espaço ficaria "OláAurora", tudo grudado.', 'Olá, ': 'Texto precisa de aspas. Sem aspas o computador acha que é o nome de uma variável.' }),
      blank('+', { '-': 'Com - o computador tenta fazer conta com texto e não dá.', '*': 'O * multiplica números. Para juntar textos use +.' })],
    explain: ['Guarda o nome "Aurora".', 'Junta "Olá, " com o nome: "Olá, Aurora".'], words: [['texto (string)', 'palavras entre aspas'], ['+', 'junta textos']] },
  arithmetic: { simple: 'Mochilas de 4 lugares: quantas poções ficam de fora? É o resto da divisão (%).', code: 'const pocoes = 11;\nconst lugares = 4;\nconst sobra = pocoes {0} lugares;',
    blanks: [blank('%', { '/': 'Com / você teria 2,75 (a divisão), não o que sobra.', '-': 'Com - daria 7. O que queremos é o resto da divisão.' })],
    explain: ['São 11 poções.', 'Cada mochila tem 4 lugares.', '11 % 4 = 3: cabem 8 e sobram 3.'], words: [['%', 'resto da divisão']] },
  conditions: { simple: 'Menos de 5: fraca. Menos de 10: média. Senão: forte.', code: 'const energia = 7;\nlet nivelDaLuz = "";\nif (energia < 5) {\n  nivelDaLuz = "fraca";\n} else if (energia < 10) {\n  nivelDaLuz = {0};\n} else {\n  nivelDaLuz = {1};\n}',
    blanks: [blank('"média"', { '"forte"': 'Entre 5 e 9 a luz é média. Forte é só de 10 para cima.', '"fraca"': 'Fraca já foi resolvida no primeiro if (menor que 5).' }),
      blank('"forte"', { '"média"': 'No else (senão) sobram as energias de 10 ou mais: forte.', '"fraca"': 'Aqui a energia é 10 ou mais: a luz é forte.' })],
    explain: ['Energia vale 7.', 'Começa sem nível.', 'Se for menor que 5...', '...a luz é fraca.', 'Senão, se for menor que 10...', '...a luz é média.', 'Senão (10 ou mais)...', '...a luz é forte.', 'Fim.'], words: [['else if', 'senão, se']] },
  loops: { simple: 'Enquanto o ouro não chegar à meta, dobre o ouro e conte mais um dia.', code: 'const meta = 100;\nlet ouro = 1;\nlet dias = 0;\nwhile (ouro < meta) {\n  ouro = ouro {0} 2;\n  dias{1};\n}',
    blanks: [blank('*', { '+': 'Com + 2 o ouro sobe de 2 em 2. Ele precisa DOBRAR: * 2.', '-': 'Com - o ouro diminui e a repetição nunca termina!' }), blank('++', { '--': 'dias-- conta para trás.' })],
    explain: ['A meta é 100.', 'Começa com 1 de ouro.', 'Zero dias contados.', 'Repete enquanto o ouro for menor que a meta.', 'Dobra o ouro: 2, 4, 8, 16...', 'Conta mais um dia.', 'Fim: 7 dias para passar de 100.'], words: [['while', 'enquanto']] },
  functions: { simple: 'Entra quem tem nível 3 ou mais E tem a chave (as duas coisas).', code: 'function podeEntrar(nivel, temChave) {\n  return nivel {0} 3 {1} temChave;\n}',
    blanks: [blank('>=', { '>': 'Com > quem tem exatamente nível 3 ficaria de fora.', '<': 'Com < só entraria quem tem nível baixo.' }), blank('&&', { '||': 'Com || bastaria uma das duas. A porta exige as duas: &&.' })],
    explain: ['Cria a função que recebe o nível e se tem a chave.', 'Devolve verdadeiro só se o nível for 3 ou mais E tiver a chave.', 'Fim da função.'], words: [['&&', 'e (as duas)'], ['return', 'devolve o resultado']] },
  arrays: { simple: 'Guarde na lista pares cada número par de 1 até o limite.', code: 'const limite = 6;\nconst pares = [];\nfor (let i = 1; i <= limite; i++) {\n  if (i % 2 === 0) {\n    pares.{0}(i);\n  }\n}',
    blanks: [blank('push', { pop: 'pop TIRA o último item da lista. Para guardar use push.', includes: 'includes só pergunta se o item está na lista; não guarda nada.' })],
    explain: ['Vai até 6.', 'Começa com a lista vazia.', 'Repete com i de 1 até 6.', 'Se o resto de i por 2 for 0, i é par...', '...então guarda i na lista: [2, 4, 6].', 'Fim do se.', 'Fim da repetição.'], words: [['push', 'coloca no fim da lista']] },
  objects: { simple: 'Some o preço de cada ficha da lista no total.', code: 'const itens = [{ nome: "poção", preco: 3 }, { nome: "mapa", preco: 5 }];\nlet total = 0;\nfor (let i = 0; i < itens.length; i++) {\n  total += itens[{0}].{1};\n}',
    blanks: [blank('i', { '0': 'Com [0] você somaria sempre a poção, duas vezes.', '1': 'Com [1] você somaria sempre o mapa. Use i, que muda a cada volta.' }),
      blank('preco', { nome: 'nome é texto: somar nomes não dá um preço.', length: 'length é o tamanho da lista, não o preço da ficha.' })],
    explain: ['Lista com duas fichas: poção (3) e mapa (5).', 'O total começa em 0.', 'Repete uma vez para cada ficha.', 'Soma o preço da ficha i: 3 + 5 = 8.', 'Fim da repetição.'], words: [['itens[i].preco', 'o preço da ficha i']] },
  debug: { simple: 'Ache o erro: pergunte primeiro pelo ouro (90+), depois pela prata (50+). O resto é bronze.', code: 'const pontos = 95;\nlet medalha = "";\nif (pontos >= {0}) {\n  medalha = "ouro";\n} else if (pontos >= {1}) {\n  medalha = "prata";\n} else {\n  medalha = "bronze";\n}',
    blanks: [blank('90', { '50': 'Com 50 primeiro, quem tem 60 pontos já ganharia ouro. Pergunte do maior para o menor.', '0': 'Com 0 todo mundo ganharia ouro: o programa para na primeira pergunta verdadeira.' }),
      blank('50', { '90': 'O ouro já cuidou do 90. Aqui é a prata: 50 ou mais.', '0': 'Com 0 quem tem 10 pontos ganharia prata.' })],
    explain: ['95 pontos.', 'Começa sem medalha.', 'Se tiver 90 ou mais...', '...ganha ouro.', 'Senão, se tiver 50 ou mais...', '...ganha prata.', 'Senão...', '...ganha bronze.', 'Fim.'], words: [['bug', 'erro no código']] },
};
