type Question = readonly [title: string, prompt: string, correct: string, distractor: string];

function challenges(questions: readonly Question[]) {
  return questions.map(([title, task, correct, distractor], index) => {
    const answer = (index + Math.floor(index / 2)) % 2;
    return { title, task, choices: answer ? [distractor, correct] : [correct, distractor], answer, hint: 'Reveja a regra: ' + correct };
  });
}

export const PRECURSORS = {
  babbage: {
    year: 1837, name: 'Babbage', title: 'Arquiteto das Máquinas', sector: 'Oficina de mecanismos', x: -6, z: 1, artifact: 'Engrenagem do Moinho',
    history: 'Charles Babbage projetou a Máquina Analítica, que distinguia o armazenamento do mecanismo de cálculo.',
    source: 'https://www.computerhistory.org/babbage/overview/',
    quests: challenges([
      ['O armazém', 'Qual peça guarda o número para que seja usado mais tarde?', 'A memória guarda valores.', 'O mecanismo de saída guarda todas as instruções.'],
      ['O moinho', 'Onde a máquina soma dois valores?', 'Na unidade de cálculo, depois de receber os valores.', 'Na memória, sem ler os valores.'],
      ['A ordem dos cartões', 'Para calcular a soma de 4 e 6, qual sequência é válida?', 'Ler 4 e 6 → somar → registrar 10.', 'Registrar 10 → somar → ler 4 e 6.'],
      ['A engrenagem travada', 'O moinho já calculou 10, mas o arquivo segue vazio. Qual operação falta?', 'Gravar a saída na memória.', 'Somar os mesmos valores outra vez.'],
      ['Uma máquina, duas tarefas', 'O que torna um mecanismo de uso geral mais flexível?', 'A sequência de instruções pode mudar sem reconstruir a máquina.', 'Toda operação exige uma máquina nova.'],
    ]),
  },
  boole: {
    year: 1854, name: 'Boole', title: 'Mestre da Lógica', sector: 'Academia de programação', x: 4, z: -2, artifact: 'Selo da Lógica',
    history: 'A álgebra de George Boole permite representar e combinar condições verdadeiras e falsas.',
    source: 'https://www.computerhistory.org/timeline/computers/',
    quests: challenges([
      ['A lanterna apagada', 'A condição “a lanterna está acesa” é falsa. Qual é sua negação?', 'A lanterna não está acesa.', 'Duas lanternas estão acesas.'],
      ['As duas chaves', 'Uma porta exige A E B. Apenas A é verdadeira. A porta abre?', 'Não. As duas condições precisam ser verdadeiras.', 'Sim. Uma condição verdadeira já basta.'],
      ['Passagens alternativas', 'Um alarme toca se a janela OU a porta abrir. Ambas abriram. O que acontece?', 'Toca. OU inclusivo também aceita as duas condições verdadeiras.', 'Não toca. Apenas uma pode ser verdadeira.'],
      ['A chave diferente', 'O selo só brilha se exatamente uma chave for ligada. Que operador descreve isso?', 'OU exclusivo, ou XOR.', 'E lógico.'],
      ['O guardião da porta', 'A porta abre quando há crachá e a área não está bloqueada. Qual condição representa isso?', 'crachá E NÃO bloqueada.', 'crachá OU bloqueada.'],
    ]),
  },
  turing: {
    year: 1936, name: 'Turing', title: 'Decifrador', sector: 'Academia de programação', x: 5, z: 1, artifact: 'Fita do Decifrador',
    history: 'Alan Turing descreveu um modelo abstrato de computação e, posteriormente, apresentou uma proposta para o computador ACE.',
    source: 'https://www.computerhistory.org/tdih/february/19/',
    quests: challenges([
      ['Uma célula por vez', 'O leitor está sobre uma célula com 1. Qual símbolo ele lê agora?', 'O 1 da célula atual.', 'Todos os símbolos da fita ao mesmo tempo.'],
      ['A regra do estado', 'Ao ler 1 no estado A, a regra manda escrever 0 e mover à direita. Qual é o próximo passo?', 'Escrever 0 na célula atual e avançar para a direita.', 'Apagar a fita inteira e voltar ao início.'],
      ['A primeira parada', 'O leitor anda à direita até encontrar um espaço vazio, onde para. A fita é 11 seguida de vazio. Quantos movimentos?', 'Dois movimentos, um sobre cada 1.', 'Três movimentos, incluindo o espaço vazio.'],
      ['Uma regra que não termina', 'A fita é ilimitada e todas as regras mandam avançar. Quando o processo termina?', 'Não termina enquanto nenhuma condição de parada for alcançada.', 'Sempre termina depois de dez passos.'],
      ['O código invertido', 'Inverta cada bit de 1010 independentemente. Qual a saída?', '0101, trocando cada 1 por 0 e cada 0 por 1.', '1010, invertendo apenas a ordem das posições duas vezes.'],
    ]),
  },
  'von-neumann': {
    year: 1945, name: 'Von Neumann', title: 'Guardião da Memória', sector: 'Arquivo histórico', x: -4, z: -5, artifact: 'Núcleo do Programa',
    history: 'O relatório de John von Neumann sobre o EDVAC descreveu uma organização em que dados e instruções podiam residir na memória.',
    source: 'https://www.computerhistory.org/tdih/february/19/',
    quests: challenges([
      ['O endereço', 'O valor 7 está no endereço 20. O que identifica a localização?', 'O endereço 20 identifica a célula.', 'O valor 7 sempre identifica a célula.'],
      ['Instrução armazenada', 'Onde ficam as instruções de um programa armazenado?', 'Na memória, de onde a unidade de controle pode buscá-las.', 'Somente em engrenagens fixas.'],
      ['O ciclo', 'Qual sequência descreve um ciclo básico da instrução?', 'Buscar → decodificar → executar.', 'Executar → buscar → decodificar.'],
      ['O próximo endereço', 'Depois de um salto para o endereço 8, de onde se busca a próxima instrução?', 'Do endereço 8 definido pelo salto.', 'Sempre do endereço anterior mais um.'],
      ['Controle e cálculo', 'Qual parte decide qual operação executar e qual a realiza?', 'O controle coordena; a unidade aritmética e lógica calcula.', 'A unidade aritmética busca arquivos externos; a saída decodifica.'],
    ]),
  },
  pascal: {
    year: 1642, name: 'Pascal', title: 'Mestre dos Cálculos', sector: 'Pátio de cálculos', x: 5, z: 4, artifact: 'Roda da Pascalina',
    history: 'Blaise Pascal desenvolveu no século XVII uma calculadora mecânica capaz de adicionar e subtrair.',
    source: 'https://tcm.computerhistory.org/Timeline/PioneerComputerTimeline2.pdf',
    quests: challenges([
      ['A primeira roda', 'A roda das unidades está em 7. Avance dois dentes.', '9, sem transportar.', '0, com transporte.'],
      ['A volta completa', 'Some 1 a 9 numa máquina decimal. O que acontece?', 'As unidades voltam a 0 e a dezena avança.', 'As unidades mostram 10 no mesmo mostrador.'],
      ['O empréstimo', 'Como calcular 30 − 7 com duas rodas decimais?', 'Troque uma dezena por dez unidades; sobra 23.', 'Subtraia 7 das dezenas; sobra 20.'],
      ['O mostrador limitado', 'Um mostrador de dois dígitos passa de 99 para 00 ao somar 1. O que ocorreu?', 'A centena excedeu a capacidade do mostrador.', 'O resultado matemático de 99 + 1 é zero.'],
      ['As duas coroas', 'Na soma de 28 e 17, quantos ficam em cada roda?', '4 dezenas e 5 unidades, após um transporte.', '3 dezenas e 15 unidades no mesmo mostrador.'],
    ]),
  },
  leibniz: {
    year: 1703, name: 'Leibniz', title: 'Sábio Binário', sector: 'Pátio de cálculos', x: 6, z: 6, artifact: 'Cristal Binário',
    history: 'Gottfried Wilhelm Leibniz estudou a aritmética binária e desenvolveu uma calculadora mecânica.',
    source: 'https://www.computerhistory.org/brochures/calculators/',
    quests: challenges([
      ['As duas runas', 'Quais são os dígitos de um número binário?', '0 e 1.', '1 e 2.'],
      ['O valor das posições', 'Quanto vale 10 em binário?', '2, pois a segunda posição vale dois.', '10, pois a segunda posição vale dez.'],
      ['Três luzes', 'Quanto vale 101 em decimal?', '5, pois 4 + 0 + 1 = 5.', '6, pois todas as três posições estão ligadas.'],
      ['A soma de bits', 'Qual é o resultado binário de 11 + 1?', '100, com dois transportes.', '12, mantendo o 2 na casa das unidades.'],
      ['A lanterna dos oito', 'Qual padrão de quatro bits representa 9?', '1001, somando as posições 8 e 1.', '0111, somando as posições 4, 2 e 1.'],
    ]),
  },
  jacquard: {
    year: 1804, name: 'Jacquard', title: 'Tecelão dos Comandos', sector: 'Oficina de mecanismos', x: -5, z: 6, artifact: 'Cartão do Tear',
    history: 'O mecanismo associado a Joseph Marie Jacquard usava cartões perfurados para controlar padrões de tecelagem.',
    source: 'https://tcm.computerhistory.org/GardnerHenrieFiles/Milestones%20of%20History.pdf',
    quests: challenges([
      ['O furo e o vazio', 'No tear do jogo, furo significa levantar o fio. O que um cartão sem furos ordena?', 'Nenhum fio deve ser levantado.', 'Todos os fios devem ser levantados.'],
      ['Uma fileira', 'O cartão 101 comanda três fios, da esquerda para a direita. Quais sobem?', 'O primeiro e o terceiro.', 'Apenas o segundo.'],
      ['A sequência do tecido', 'O que acontece se inverter a ordem de dois cartões diferentes?', 'As duas fileiras saem na ordem invertida.', 'Cada cartão perde os próprios furos.'],
      ['Repetir o desenho', 'Para reproduzir um padrão sem alterar o tear, o que deve ser reutilizado?', 'A sequência de cartões, na mesma ordem.', 'Somente a cor original do fio.'],
      ['Um novo motivo', 'O primeiro fio subiu por engano e os outros estão certos. Qual correção é mínima?', 'Corrigir a primeira posição do cartão responsável.', 'Trocar todas as posições de todos os cartões.'],
    ]),
  },
  hollerith: {
    year: 1890, name: 'Hollerith', title: 'Guardião dos Dados', sector: 'Arquivo histórico', x: -6, z: -9, artifact: 'Tabulador do Arquivo',
    history: 'Herman Hollerith usou cartões perfurados e tabulação eletromecânica no processamento do censo dos Estados Unidos de 1890.',
    source: 'https://tcm.computerhistory.org/Timeline/PioneerComputerTimeline2.pdf',
    quests: challenges([
      ['Um cartão por registro', 'Cada pessoa tem um cartão com idade e cidade. O que o cartão representa?', 'Um registro com campos definidos.', 'A contagem total de todas as cidades.'],
      ['A coluna correta', 'Como comparar as idades sem confundir com a cidade?', 'Ler o campo de idade na mesma posição em todos os cartões.', 'Ler sempre o primeiro número, independentemente do campo.'],
      ['A pilha da Aurora', 'Dois cartões dizem Aurora e um diz Vale. Qual é a contagem da Aurora?', '2 registros.', '3 registros.'],
      ['O cartão repetido', 'Dois cartões têm o mesmo identificador de pessoa e foram marcados como cópias. O que fazer?', 'Contar uma vez ao calcular pessoas únicas.', 'Somar os dois porque o papel é diferente.'],
      ['Conferir os totais', 'Três registros únicos pertencem a exatamente uma cidade cada. Que verificação faz sentido?', 'A soma das contagens por cidade deve ser 3.', 'Cada cidade deve conter os mesmos 3 registros.'],
    ]),
  },
  zuse: {
    year: 1941, name: 'Zuse', title: 'Construtor Digital', sector: 'Oficina de mecanismos', x: -4, z: 3, artifact: 'Relé do Construtor',
    history: 'Konrad Zuse construiu o Z3, um computador digital eletromecânico controlado por programa.',
    source: 'https://computerhistory.org/profile/konrad-zuse/',
    quests: challenges([
      ['Estados do relé', 'Como representar dois valores em um relé idealizado?', 'Aberto e fechado podem representar 0 e 1.', 'Um único estado representa todos os valores sozinho.'],
      ['As entradas', 'O programa manda somar os dois valores lidos. Qual saída resulta de 6 e 2?', '8, porque o programa soma as entradas.', '4, porque o programa subtrai a segunda entrada.'],
      ['Troca de programa', 'Como transformar a operação anterior em subtração sem trocar a máquina?', 'Alterar a instrução do programa.', 'Trocar apenas a cor do relé.'],
      ['Sequência na fita', 'A fita contém “dobrar” e depois “somar 1”. Qual a saída para 3?', '7, pois (3 × 2) + 1 = 7.', '8, pois a soma foi feita antes de dobrar.'],
      ['Prova do construtor', 'Com o mesmo programa, a entrada 5 gera 11. Qual teste ajuda a detectar uma máquina que sempre devolve 11?', 'Testar também a entrada 0, que deve devolver 1.', 'Repetir apenas a entrada 5 indefinidamente.'],
    ]),
  },
} as const;

export type PrecursorId = keyof typeof PRECURSORS;

export const PRECURSOR_IDS = Object.keys(PRECURSORS) as PrecursorId[];
export function isPrecursor(id: string): id is PrecursorId {
  return Object.hasOwn(PRECURSORS, id);
}

export const CHAMBER_POSITION = { x: -2, z: -10 } as const;

export function precursorForNpc(id: string): PrecursorId | undefined {
  if (id === 'borin') return 'babbage';
  if (id === 'eldrin') return 'boole';
  return isPrecursor(id) ? id : undefined;
}

export function cleanPrecursorProgress(value: unknown): Partial<Record<PrecursorId, number>> {
  if (!value || typeof value !== 'object') return {};
  const raw = value as Record<string, unknown>;
  return Object.fromEntries(PRECURSOR_IDS.flatMap(id => {
    const progress = raw[id];
    return typeof progress === 'number' && Number.isInteger(progress) && progress > 0
      ? [[id, Math.min(PRECURSORS[id].quests.length, progress)]] : [];
  }));
}
