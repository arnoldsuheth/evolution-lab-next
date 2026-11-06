import { checkProgram, type LessonTest } from './game';
import type { InstanceId } from './instances';

/**
 * Portas de código das masmorras: cada sala só abre com um pequeno programa.
 * Uma porta aberta fica aberta para sempre naquele personagem (o aprendizado não se repete à força).
 */
export type CodeDoor = { id: string; instance: InstanceId; room: number; z: number; title: string; task: string; starter: string; hint: string; tests: LessonTest[] };
export const DOOR_Z = [5, -4, -13] as const;
const door = (instance: InstanceId, room: number, title: string, task: string, starter: string, hint: string, tests: LessonTest[]): CodeDoor => ({ id: `${instance}-${room}`, instance, room, z: DOOR_Z[room - 1], title, task, starter, hint, tests });
export const DOORS: CodeDoor[] = [
  door('cavern', 1, 'A porta da chave', 'Guarde o número 3 na variável chave para girar a fechadura.', '// A fechadura pede a chave 3\nlet chave = 0;\n', 'Troque o 0 por 3: let chave = 3;', [{ label: 'Chave certa', variable: 'chave', expected: 3 }]),
  door('cavern', 2, 'A porta das tochas', 'Acenda a porta: aberta deve ser true quando tochas for pelo menos 2.', 'const tochas = 2;\nlet aberta = false;\nif (tochas >= 2) {\n  // abra aqui\n}\n', 'Dentro das chaves: aberta = true;', [{ label: 'Duas tochas', variable: 'aberta', expected: true }, { label: 'Sem tochas', variable: 'aberta', expected: false, suffix: 'variant:tochas:0' }]),
  door('cavern', 3, 'A porta do guardião', 'Some os cristais do array em total. O guardião espera o valor certo.', 'const cristais = [4, 1, 5];\nlet total = 0;\nfor (let i = 0; i < cristais.length; i++) {\n  // some cristais[i]\n}\n', 'Dentro do laço: total += cristais[i];', [{ label: 'Cristais da sala', variable: 'total', expected: 10 }, { label: 'Outra sala', variable: 'total', expected: 9, suffix: 'variant:cristais:[2,7]' }]),
  door('monastery', 1, 'O sino do claustro', 'Toque o sino 5 vezes: conte em toques usando um laço for.', 'let toques = 0;\nfor (let i = 0; i < 5; i++) {\n  // conte mais um toque\n}\n', 'Dentro do laço: toques++;', [{ label: 'Cinco toques', variable: 'toques', expected: 5 }]),
  door('monastery', 2, 'O selo da função', 'Crie a função selo(n) que devolve n mais 10.', 'function selo(n) {\n  // devolva n + 10\n}\n', 'return n + 10;', [{ label: 'Selo de 5', variable: 'teste', expected: 15, suffix: 'const teste = selo(5);' }, { label: 'Selo de 0', variable: 'teste', expected: 10, suffix: 'const teste = selo(0);' }]),
  door('monastery', 3, 'O portão do abade', 'O abade só deixa passar quem tem nivel 25 ou mais E o selo. Defina passa.', 'const nivel = 25;\nconst temSelo = true;\nconst passa = \n', 'Use &&: nivel >= 25 && temSelo', [{ label: 'Com tudo', variable: 'passa', expected: true }, { label: 'Nível baixo', variable: 'passa', expected: false, suffix: 'variant:nivel:20' }, { label: 'Sem selo', variable: 'passa', expected: false, suffix: 'variant:temSelo:false' }]),
];
export const doorsOf = (instance: InstanceId) => DOORS.filter(d => d.instance === instance);
/** Portas ainda fechadas na instância, da entrada (z maior) para o fundo. */
export const closedDoors = (instance: InstanceId, open: string[]) => doorsOf(instance).filter(d => !open.includes(d.id));
/** Uma porta fechada separa o herói do ponto z? (as salas ficam em fila, do norte para o sul) */
export function doorBetween(instance: InstanceId, open: string[], fromZ: number, toZ: number) {
  return closedDoors(instance, open).find(d => (fromZ > d.z && toZ < d.z) || (fromZ < d.z && toZ > d.z));
}
export function tryDoor(id: string, code: string) {
  const d = DOORS.find(d => d.id === id);
  if (!d) return { passed: false, results: [{ label: 'Porta', passed: false, message: 'Porta desconhecida.' }], output: [] as string[], trace: [] };
  return checkProgram(d.tests, code);
}
