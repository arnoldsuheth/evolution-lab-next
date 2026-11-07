import test from 'node:test';
import assert from 'node:assert/strict';
import { APPRENTICE, answers, checkPicks, fillCode, friendlyLock } from './apprentice';
import { CODE_SPOTS, spotAvailable, nextSpot } from './codeSpots';
import { LESSONS, NPCS_LIVE, evaluateLesson } from './game';
import { walkable, BUILDINGS } from './navigation';
import { onRoad } from './town';

test('cada runa tem versão com botões e a resposta montada passa nos testes de verdade', () => {
  for (const l of LESSONS) {
    const b = APPRENTICE[l.id]; assert.ok(b, `falta ${l.id}`);
    const code = fillCode(b, answers(b));
    assert.equal(evaluateLesson(l.id, code).passed, true, `${l.id}: ${code}`);
    assert.equal(b.explain.length, b.code.split('\n').length, `${l.id}: uma explicação por linha`);
  }
});
test('toda opção errada explica o porquê e nenhuma resposta errada passa nos testes', () => {
  for (const [id, b] of Object.entries(APPRENTICE)) b.blanks.forEach((blank, i) => {
    assert.ok(blank.options.includes(blank.answer));
    assert.ok(blank.options.length >= 2 && blank.options.length <= 4, `${id} lacuna ${i}`);
    for (const o of blank.options.filter(o => o !== blank.answer)) {
      assert.ok(blank.why[o]?.length > 10, `${id}: falta explicação para ${o}`);
      const picks = answers(b); picks[i] = o;
      assert.equal(checkPicks(b, picks).ok, false, `${id}: a opção errada ${o} é recusada e explicada`);
    }
  });
});
test('checkPicks aponta lacuna vazia e erro com explicação', () => {
  const b = APPRENTICE.arithmetic;
  assert.deepEqual(checkPicks(b, [null, null]).missing, [0, 1]);
  const r = checkPicks(b, ['x', 'paes']); assert.equal(r.ok, false); assert.match(r.wrong[0].message, /asterisco/);
  assert.equal(checkPicks(b, ['*', 'paes']).ok, true);
});
test('runa trancada explica o motivo real em português simples', () => {
  assert.match(friendlyLock('Entregue a runa anterior a Eldrin'), /Entregar missão/);
  assert.match(friendlyLock('Requer nível 3'), /nível 3/);
});
test('pontos de código: 8 temas, na grama da vila, em ordem', () => {
  assert.equal(CODE_SPOTS.length, 8); assert.equal(new Set(CODE_SPOTS.map(s => s.id)).size, 8);
  for (const s of CODE_SPOTS) {
    assert.ok(walkable(s.x, s.z, true, true, 'aurora'), s.id); assert.ok(NPCS_LIVE.every(n => Math.hypot(n.x - s.x, n.z - s.z) >= 3), `${s.id} longe dos personagens`); assert.ok(!onRoad(s.x, s.z), `${s.id} fora da rua`);
    assert.ok(!BUILDINGS.some(b => Math.abs(b.x - s.x) < b.w + 1 && Math.abs(b.z - s.z) < b.d + 1), `${s.id} fora das casas`);
    assert.equal(checkPicks(s.builder, answers(s.builder)).ok, true);
    assert.equal(s.builder.explain.length, s.builder.code.split('\n').length, s.id);
    for (const blank of s.builder.blanks) for (const o of blank.options.filter(o => o !== blank.answer)) assert.ok(blank.why[o], `${s.id}: ${o}`);
  }
  assert.equal(spotAvailable([], CODE_SPOTS[0].id), true); assert.equal(spotAvailable([], CODE_SPOTS[1].id), false);
  assert.equal(spotAvailable([CODE_SPOTS[0].id], CODE_SPOTS[1].id), true); assert.equal(nextSpot([CODE_SPOTS[0].id])?.id, CODE_SPOTS[1].id);
});

test('portas das masmorras com botões: a resposta abre a porta, cada erro é explicado e recusado', async () => {
  const { DOOR_APPRENTICE, answers: ans, checkPicks: check, fillCode: fill } = await import('./apprentice');
  const { DOORS, tryDoor } = await import('./dungeon');
  for (const d of DOORS) {
    const b = DOOR_APPRENTICE[d.id];
    assert.ok(b, `${d.id} tem modo com botões`);
    assert.equal(tryDoor(d.id, fill(b, ans(b))).passed, true, `${d.id}: a resposta abre a porta`);
    assert.equal(b.explain.length, b.code.split('\n').length, `${d.id}: uma explicação por linha`);
    b.blanks.forEach((blank, i) => { for (const o of blank.options) if (o !== blank.answer) { assert.ok(blank.why[o], `${d.id}: "${o}" explicado`); const picks = ans(b); picks[i] = o; assert.equal(check(b, picks).ok, false); } });
  }
});
