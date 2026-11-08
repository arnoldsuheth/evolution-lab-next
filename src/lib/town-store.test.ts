import { test } from 'node:test'; import { strict as assert } from 'node:assert';
import { freshSave } from './game';
const mem = new Map<string, string>(); Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) } });
import { useGame } from './store';
import { WAGON_PRICE } from './wagon';
function reset(gold: number, position: [number, number] = [0, 5]) { useGame.setState({ ...freshSave(), encounter: null, effects: [], cooldowns: {} }); useGame.getState().createCharacter('Teste', 'paladin', 'normal'); useGame.setState(s => ({ hero: { ...s.hero, gold, position, region: 'aurora', instance: null } })); }

test('banco guarda e devolve bronze só dentro da vila', () => {
  reset(1500); const g = useGame.getState;
  g().bankDeposit(1000); assert.equal(g().hero.gold, 500); assert.equal(g().hero.adventure?.bank?.balance, 1000);
  g().bankWithdraw(400); assert.equal(g().hero.gold, 900); assert.equal(g().hero.adventure?.bank?.balance, 600);
  useGame.setState(s => ({ hero: { ...s.hero, position: [60, 60] } })); g().bankDeposit(500); assert.equal(g().hero.gold, 900);
});

test('carroça cobra 2,5 prata e respeita o nível da região', () => {
  reset(1000); const g = useGame.getState;
  g().wagonTravel('ruins'); assert.equal(g().hero.region, 'aurora', 'região bloqueada no nível 1'); assert.equal(g().hero.gold, 1000);
  g().wagonTravel('aurora'); assert.equal(g().hero.gold, 1000);
  assert.equal(WAGON_PRICE, 250);
});
