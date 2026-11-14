import assert from 'node:assert/strict';
import test from 'node:test';
import { freshSave, migrateSave } from './game';
import { LOVELACE_POSITION, evaluateLovelace } from './precursors';
import { useGame, savedState } from './store';
import { findPath } from './navigation';

test('Lovelace oferece rota de aproximação sem desbloquear a floresta ou as minas', () => {
  const route = findPath([0, 5], [LOVELACE_POSITION.x, LOVELACE_POSITION.z + 2]);
  assert.ok(route.length);
});

test('o laboratório verifica diferentes entradas e explica os erros', () => {
  assert.match(evaluateLovelace(0, 0) ?? '', /receber/);
  assert.match(evaluateLovelace(3, 'function transformar(n) { return 1; }') ?? '', /n = 3/);
  assert.match(evaluateLovelace(4, 'function transformar(n) { return n * 2 + 1; }') ?? '', /esperado 1/);
  assert.equal(evaluateLovelace(4, 'function transformar(n) { return n * 2 - 1; }'), null);
});

test('cadeia salva por personagem, exige sequência e evita concessão repetida', () => {
  const save = freshSave();
  useGame.setState({ ...save, ready: true, saveError: '', hero: { ...save.hero, created: true, position: [0, 5] } });
  const submit = useGame.getState().submitLovelace;
  assert.match(submit(0, 1) ?? '', /Aproxime-se/);
  useGame.setState(s => ({ hero: { ...s.hero, position: [LOVELACE_POSITION.x, LOVELACE_POSITION.z + 2] } }));
  assert.ok(submit(2, 0));
  assert.ok(submit(0, 0));
  const answers = [1, 2, 0, 'function transformar(n) { return n * 2 + 1; }', 'function transformar(n) { return n * 2 - 1; }'];
  answers.forEach((answer, step) => {
    assert.equal(submit(step, answer), null);
    const restored = migrateSave(JSON.parse(JSON.stringify(savedState(useGame.getState()))));
    assert.equal(restored.hero.lovelaceProgress, step + 1);
    useGame.setState(restored);
  });
  assert.ok(submit(4, answers[4]));
  assert.equal(useGame.getState().hero.lovelaceProgress, 5);
  assert.equal(useGame.getState().hero.xp, save.hero.xp);
  assert.deepEqual(useGame.getState().education.completed, save.education.completed);
  assert.deepEqual(useGame.getState().hero.inventory, save.hero.inventory);
  assert.equal(migrateSave(freshSave()).hero.lovelaceProgress, undefined);
});

test('save antigo e personagem hardcore morto preservam o bloqueio', () => {
  const save = freshSave();
  useGame.setState({ ...save, ready: true, saveError: '', hero: { ...save.hero, created: true, mode: 'hardcore', dead: true, position: [LOVELACE_POSITION.x, LOVELACE_POSITION.z + 2] } });
  assert.ok(useGame.getState().submitLovelace(0, 1));
  assert.equal(useGame.getState().hero.lovelaceProgress, undefined);
});

test('os dez precursores e a Câmara têm rota de aproximação na Cidadela', async () => {
  const { NPCS_LIVE } = await import('./game');
  const { CHAMBER_POSITION, PRECURSOR_IDS, PRECURSORS, precursorForNpc } = await import('./precursorCatalog');
  const sites = [...PRECURSOR_IDS.map(id => PRECURSORS[id]), CHAMBER_POSITION, LOVELACE_POSITION];
  assert.equal(new Set(NPCS_LIVE.map(npc => npc.id)).size, NPCS_LIVE.length);
  assert.equal(NPCS_LIVE.filter(npc => npc.id === 'lovelace' || precursorForNpc(npc.id)).length, 10);
  for (const { x, z } of sites) {
    const candidates = [[x + 2, z], [x - 2, z], [x, z + 2], [x, z - 2]] as [number, number][];
    assert.ok(candidates.some(target => findPath([0, 5], target).length), 'Sem rota para ' + x + ', ' + z);
  }
});

test('as 45 missões adicionais registram artefatos e destravam a Câmara sem repetir progresso', async () => {
  const { CHAMBER_POSITION, PRECURSOR_IDS, PRECURSORS } = await import('./precursorCatalog');
  const { hasAllArtifacts, CHAMBER_CHALLENGE } = await import('./precursors');
  const save = freshSave();
  useGame.setState({ ...save, ready: true, saveError: '', hero: { ...save.hero, created: true, lovelaceProgress: 5 } });
  const moveTo = ({ x, z }: {x: number; z: number}) =>
    useGame.setState(s => ({ hero: { ...s.hero, position: [x, z] } }));
  moveTo(CHAMBER_POSITION);
  assert.ok(useGame.getState().submitChamber(CHAMBER_CHALLENGE.answer));
  let completed = 0;
  for (const id of PRECURSOR_IDS) {
    const entry = PRECURSORS[id];
    moveTo(entry);
    entry.quests.forEach((quest, step) => {
      assert.equal(useGame.getState().submitPrecursor(id, step, 1 - quest.answer), quest.hint);
      assert.equal(useGame.getState().submitPrecursor(id, step, quest.answer), null);
      assert.ok(useGame.getState().submitPrecursor(id, step, quest.answer));
      completed++;
    });
  }
  assert.equal(completed, 45);
  assert.ok(hasAllArtifacts(useGame.getState().hero));
  assert.ok(useGame.getState().submitChamber(CHAMBER_CHALLENGE.answer));
  moveTo(CHAMBER_POSITION);
  assert.equal(useGame.getState().submitChamber(0), CHAMBER_CHALLENGE.hint);
  assert.equal(useGame.getState().submitChamber(CHAMBER_CHALLENGE.answer), null);
  const restored = migrateSave(JSON.parse(JSON.stringify(savedState(useGame.getState()))));
  assert.equal(restored.hero.chamberComplete, true);
  assert.deepEqual(restored.hero.precursorProgress, Object.fromEntries(PRECURSOR_IDS.map(id => [id, 5])));
  assert.deepEqual(restored.education, save.education);
  assert.equal(restored.hero.xp, save.hero.xp);
});

test('Boole aceita a resposta na praça de Goddard', async () => {
  const { PRECURSORS } = await import('./precursorCatalog');
  const { GODDARD_BOOLE } = await import('./kingdomCities');
  const save = freshSave();
  useGame.setState({ ...save, ready: true, saveError: '', hero: { ...save.hero, created: true, region: 'goddard', position: [GODDARD_BOOLE[0], GODDARD_BOOLE[1] + 3] } });
  const quest = PRECURSORS.boole.quests[0];
  assert.equal(useGame.getState().submitPrecursor('boole', 0, quest.answer), null);
  assert.equal(useGame.getState().hero.precursorProgress?.boole, 1);
  useGame.setState(s => ({ hero: { ...s.hero, position: [20, 20] } }));
  assert.match(String(useGame.getState().submitPrecursor('boole', 1, PRECURSORS.boole.quests[1].answer)), /Aproxime-se/);
});
