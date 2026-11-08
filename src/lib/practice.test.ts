import test from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE, PRACTICE_CONCEPTS, pickQuestions, nextMastery, checkAnswer, autoHint, freshMastery, battleConcepts, dayKey, cleanMastery } from './practice';
import { MAIN_ORDER } from './journey';
import { migrateSave, freshSave } from './game';

test('cada runa tem treino nos três níveis e com tipos variados', () => {
  assert.deepEqual([...PRACTICE_CONCEPTS].sort(), [...MAIN_ORDER].sort());
  for (const concept of MAIN_ORDER) {
    const qs = PRACTICE.filter(q => q.concept === concept);
    assert.deepEqual([...new Set(qs.map(q => q.level))].sort(), [1, 2, 3], concept);
    assert.ok(new Set(qs.map(q => q.kind)).size >= 3, concept);
  }
  assert.equal(new Set(PRACTICE.map(q => q.id)).size, PRACTICE.length);
});

test('toda pergunta tem uma resposta certa possível', () => {
  for (const q of PRACTICE) {
    if (q.kind === 'choice' || q.kind === 'fill') { assert.ok(q.options.includes(q.answer as string), q.id); assert.equal(new Set(q.options).size, q.options.length, q.id); assert.ok(checkAnswer(q, q.answer as string), q.id); }
    if (q.kind === 'fill') assert.ok(q.code?.some(l => l.includes('___')), q.id);
    if (q.kind === 'order') { assert.ok(checkAnswer(q, [...q.options]), q.id); assert.ok(!checkAnswer(q, [...q.options].reverse()), q.id); }
    if (q.kind === 'bug') { assert.ok(Number.isInteger(q.answer) && (q.answer as number) < q.options.length, q.id); assert.ok(checkAnswer(q, q.answer as number), q.id); }
  }
});

test('missão relâmpago escolhe 3 perguntas diferentes, de tipos diferentes, perto do nível do jogador', () => {
  for (const level of [1, 2, 3] as const) {
    const qs = pickQuestions('loops', { ...freshMastery(), level }, 3, () => 0.37);
    assert.equal(qs.length, 3); assert.equal(new Set(qs.map(q => q.id)).size, 3);
    assert.equal(new Set(qs.map(q => q.kind)).size, 3);
    assert.ok(qs.every(q => Math.abs(q.level - level) <= 1));
  }
});

test('dificuldade se ajusta: dois acertos sobem, dois erros descem e abrem a pista', () => {
  let m = nextMastery(undefined, true); assert.equal(m.level, 1);
  m = nextMastery(m, true); assert.equal(m.level, 2);
  m = nextMastery(m, false); assert.equal(m.level, 2); assert.ok(autoHint(m));
  m = nextMastery(m, false); assert.equal(m.level, 1); assert.equal(m.total, 4); assert.equal(m.right, 2);
  m = nextMastery(nextMastery(nextMastery(nextMastery(m, true), true), true), true); assert.equal(m.level, 3);
  assert.equal(nextMastery(nextMastery({ ...m }, true), true).level, 3);
});

test('perguntas de batalha usam runas já aprendidas', () => {
  assert.deepEqual(battleConcepts([]), ['variables']);
  assert.deepEqual(battleConcepts(['variables', 'loops', 'ai-0']), ['variables', 'loops']);
});

test('treino é salvo, limpo e sobrevive a salvamentos antigos', () => {
  const save = freshSave();
  assert.equal(migrateSave(save).education.practice, undefined);
  const raw = { ...save, education: { ...save.education, practice: { loops: { level: 9, streak: 1, misses: 0, right: 3, total: 4 }, hacked: { level: 2 } }, blitz: { loops: dayKey(Date.UTC(2026, 10, 8, 12)), arrays: 'ontem' } } };
  const clean = migrateSave(JSON.parse(JSON.stringify(raw)));
  assert.deepEqual(clean.education.practice, { loops: { level: 3, streak: 1, misses: 0, right: 3, total: 4 } });
  assert.deepEqual(clean.education.blitz, { loops: '2026-11-08' });
  assert.equal(cleanMastery('x'), undefined);
});
