import { test } from 'node:test'; import { strict as assert } from 'node:assert';
import { freshSave, stats } from './game';
const mem = new Map<string, string>(); Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) } });
import { useGame } from './store';
import { blitzReward, BATTLE_BUFF_SECONDS, battleBuff } from './practice';
function reset() { useGame.setState({ ...freshSave(), encounter: null, effects: [], cooldowns: {}, lastAttack: 0, buff: 0 }); useGame.getState().createCharacter('Teste', 'paladin', 'normal'); }

test('missão relâmpago dá recompensa uma vez por dia e exige 2 de 3', () => {
  reset(); const g = useGame.getState; const before = g().hero;
  assert.equal(g().finishBlitz('variables', 1), null); assert.equal(g().hero.xp, before.xp);
  const reward = g().finishBlitz('variables', 2); assert.deepEqual(reward, blitzReward(1));
  assert.equal(g().hero.gold, before.gold + reward!.gold);
  assert.equal(g().finishBlitz('variables', 3), null, 'segunda vez no mesmo dia não paga de novo');
  assert.equal(g().hero.gold, before.gold + reward!.gold);
  assert.equal(g().finishBlitz('runa-falsa', 3), null);
});

test('respostas ajustam o nível do treino da runa', () => {
  reset(); const g = useGame.getState;
  g().practiceAnswer('loops', true); g().practiceAnswer('loops', true);
  assert.equal(g().education.practice?.loops.level, 2);
  g().practiceAnswer('nao-existe', true); assert.equal(g().education.practice?.['nao-existe'], undefined);
});

test('pergunta de batalha só funciona em combate e respeita a recarga', () => {
  reset(); const g = useGame.getState;
  g().battleInsight(true); assert.deepEqual(g().effects, [], 'fora de combate não dá bônus');
  useGame.setState({ encounter: { name: 'Lobo', hp: 30, maxHp: 30, attack: 3, defense: 1, level: 1 } as never });
  g().battleInsight(true);
  assert.deepEqual(g().effects, [{ kind: 'attack', amount: battleBuff(stats(g().hero).attack), remaining: BATTLE_BUFF_SECONDS }]);
  g().battleInsight(true); assert.equal(g().effects.length, 1, 'recarga impede repetir na hora');
  useGame.setState({ cooldowns: {}, effects: [] }); g().battleInsight(false);
  assert.deepEqual(g().effects, []); assert.ok((g().cooldowns.insight ?? 0) > Date.now());
});
