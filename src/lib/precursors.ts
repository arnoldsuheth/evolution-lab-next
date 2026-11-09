import { PRECURSOR_IDS, PRECURSORS, type PrecursorId } from './precursorCatalog';
import { runProgram } from './program';

export const LOVELACE_POSITION = { x: -3, z: -8 } as const;

export const LOVELACE_QUESTS = [
  { title: 'Cartas fora de ordem', concept: 'Sequência', task: 'Escolha a ordem das instruções para o leitor da biblioteca.', choices: ['Registrar → calcular → receber', 'Receber → calcular → registrar', 'Calcular → receber → registrar'], answer: 1, hint: 'O leitor precisa receber a entrada antes de calcular. Só depois existe um resultado para registrar.' },
  { title: 'A mesma regra, outra entrada', concept: 'Entrada e saída', task: 'O leitor soma 2 à entrada. Quais saídas ele dá para 3 e 5, nessa ordem?', choices: ['3 e 5', '6 e 10', '5 e 7'], answer: 2, hint: 'A operação é somar 2, então 3 + 2 = 5 e 5 + 2 = 7.' },
  { title: 'O corredor das runas', concept: 'Repetição', task: 'Três runas apagadas estão em fila. Qual instrução acende todas em ordem?', choices: ['Repita 3 vezes: acenda a próxima runa.', 'Repita 2 vezes: acenda a próxima runa.', 'Repita 3 vezes: acenda sempre a primeira runa.'], answer: 0, hint: 'Cada repetição precisa avançar para a próxima runa. São três runas, então são três repetições.' },
  { title: 'A instrução quebrada', concept: 'Teste e depuração', task: 'Complete a função transformar para devolver n × 2 + 1. O leitor verifica as entradas 0, 3 e 7.', starter: 'function transformar(n) {\n  return n;\n}', cases: [[0, 1], [3, 7], [7, 15]], hint: 'Multiplique n por 2 antes de somar 1.' },
  { title: 'O primeiro artefato', concept: 'Algoritmo completo', task: 'O arquivo recebe um número, calcula o dobro menos 1 e guarda o resultado. Complete a função transformar. O leitor verifica 1, 4 e 9.', starter: 'function transformar(n) {\n  return n;\n}', cases: [[1, 1], [4, 7], [9, 17]], hint: 'Use a entrada n, multiplique por 2 e então subtraia 1. O return entrega o resultado ao arquivo.' },
] as const;

export function cleanLovelaceProgress(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value)
    ? Math.min(LOVELACE_QUESTS.length, Math.max(0, value))
    : 0;
}

export function evaluateLovelace(step: number, submission: string | number): string | null {
  const quest = LOVELACE_QUESTS[step];
  if (!quest) return 'Esta cadeia já está concluída.';
  if ('choices' in quest) return submission === quest.answer ? null : quest.hint;
  if (typeof submission !== 'string' || submission.length > 2400) return 'Envie até 2.400 caracteres de código.';
  try {
    for (const [input, expected] of quest.cases) {
      const { variables } = runProgram(submission + '\nlet resultadoDaRuna = transformar(' + input + ');');
      if (variables.resultadoDaRuna !== expected) {
        return 'Para n = ' + input + ', era esperado ' + expected + ' e o código devolveu ' + String(variables.resultadoDaRuna) + '. ' + quest.hint;
      }
    }
    return null;
  } catch (error) {
    return (error instanceof Error ? error.message : 'O código não pôde ser executado.') + ' ' + quest.hint;
  }
}

export const CHAMBER_CHALLENGE = {
  task: 'O arquivo lê 101 em binário, soma 1, registra o resultado em binário e só então toca o sino. Qual sequência cumpre todas as regras?',
  choices: ['Tocar → ler 101 → registrar 110', 'Ler 101 → somar 1 → registrar 111 → tocar', 'Ler 101 → somar 1 → registrar 110 → tocar'],
  answer: 2,
  hint: '101 representa 5. Depois da soma, 6 é 110 em binário. Registre antes de tocar.',
} as const;

export function hasAllArtifacts(hero: { lovelaceProgress?: number; precursorProgress?: Partial<Record<PrecursorId, number>> }) {
  return cleanLovelaceProgress(hero.lovelaceProgress) === LOVELACE_QUESTS.length
    && PRECURSOR_IDS.every(id => hero.precursorProgress?.[id] === PRECURSORS[id].quests.length);
}
