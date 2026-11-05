import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { runProgram } from './program';
import { EXTRA_CHALLENGES, LESSONS, evaluateExtra, evaluateLesson } from './game';

const SOLUTIONS: Record<string, string> = {
  variables: 'const nome = "Aurora";\nconst saudacao = "Olá, " + nome;',
  arithmetic: 'const pocoes = 11;\nconst lugares = 4;\nconst sobra = pocoes % lugares;',
  conditions: 'const energia = 7;\nlet nivelDaLuz = "";\nif (energia < 5) {\n  nivelDaLuz = "fraca";\n} else if (energia < 10) {\n  nivelDaLuz = "média";\n} else {\n  nivelDaLuz = "forte";\n}',
  loops: 'const meta = 100;\nlet ouro = 1;\nlet dias = 0;\nwhile (ouro < meta) {\n  ouro = ouro * 2;\n  dias++;\n}',
  functions: 'function podeEntrar(nivel, temChave) {\n  return nivel >= 3 && temChave;\n}',
  arrays: 'const limite = 6;\nconst pares = [];\nfor (let i = 1; i <= limite; i++) {\n  if (i % 2 === 0) {\n    pares.push(i);\n  }\n}',
  objects: 'const itens = [{ nome: "poção", preco: 3 }, { nome: "mapa", preco: 5 }];\nlet total = 0;\nfor (let i = 0; i < itens.length; i++) {\n  total += itens[i].preco;\n}',
  debug: 'const pontos = 95;\nlet medalha = "";\nif (pontos >= 90) {\n  medalha = "ouro";\n} else if (pontos >= 50) {\n  medalha = "prata";\n} else {\n  medalha = "bronze";\n}',
};

test('cada runa tem um desafio extra que o modelo não resolve sozinho e a solução resolve', () => {
  for (const lesson of LESSONS) {
    const extra = EXTRA_CHALLENGES[lesson.id];
    assert.ok(extra, lesson.id);
    assert.equal(evaluateExtra(lesson.id, extra.starter).passed, false, `${lesson.id}: modelo já passaria`);
    const solved = evaluateExtra(lesson.id, SOLUTIONS[lesson.id]);
    assert.equal(solved.passed, true, `${lesson.id}: ${JSON.stringify(solved.results)}`);
  }
});
test('else if, break, continue e operadores compostos', () => {
  const r = runProgram('let n = 0;\nfor (let i = 0; i < 10; i++) {\n  if (i === 2) { continue; } else if (i === 5) { break; }\n  n += i;\n}\nlet x = 3; x *= 4; x /= 2;');
  assert.equal(r.variables.n, 0 + 1 + 3 + 4); assert.equal(r.variables.x, 6);
  assert.throws(() => runProgram('break;'), /dentro de um laço/);
});
test('listas, textos e Math têm só métodos seguros', () => {
  const r = runProgram('const l = [1]; l.push(2, 3); const ultimo = l.pop(); const tem = l.includes(2); const grande = "ok".toUpperCase(); const m = Math.max(2, Math.floor(7.8));');
  assert.deepEqual(r.variables.l, [1, 2]); assert.equal(r.variables.ultimo, 3); assert.equal(r.variables.tem, true); assert.equal(r.variables.grande, 'OK'); assert.equal(r.variables.m, 7);
  assert.throws(() => runProgram('const a = Math.random();'), /não está disponível/);
  assert.throws(() => runProgram('const l = []; l.map(1);'), /não está disponível/);
  assert.throws(() => runProgram('const l = []; for (let i = 0; i < 3000; i++) { l.push(i); }'), /limite/i);
});
test('erros dizem a linha e explicam o que aparece mais tarde no curso', () => {
  assert.throws(() => runProgram('let a = 1;\nlet b = c;'), /^Error: Linha 2: A variável “c”/);
  assert.throws(() => runProgram('const f = x => x;'), /Linha 1: .*function/);
  assert.throws(() => runProgram('const t = `oi`;'), /aspas/);
  assert.match(evaluateLesson('variables', 'let nivel = ;').results[0].message, /^Linha 1/);
});
test('passo a passo mostra cada caixa recebendo um valor, na linha certa', () => {
  const r = evaluateLesson('variables', 'let lanternas = 2;\nlanternas = 3;\nlet nivel = 1;');
  assert.deepEqual(r.trace.slice(0, 3), [{ line: 1, name: 'lanternas', value: '2' }, { line: 2, name: 'lanternas', value: '3' }, { line: 3, name: 'nivel', value: '1' }]);
  assert.ok(runProgram('let s = 0; for (let i = 0; i < 500; i++) { s += i; }').trace.length <= 60, 'passo a passo é limitado');
});
