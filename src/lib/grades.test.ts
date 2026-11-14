import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeForLevel, gradeOf } from './grades';
import { ITEMS } from './game';
test('faixas de grau D C B A S', () => {
  assert.deepEqual([1, 9, 10, 19, 20, 29, 30, 49, 50, 60].map(gradeForLevel), ['D', 'D', 'C', 'C', 'B', 'B', 'A', 'A', 'S', 'S']);
});
test('só equipamento tem grau', () => {
  const equip = Object.values(ITEMS).filter(i => i.category === 'weapon' || i.category === 'armor');
  assert.ok(equip.length > 0 && equip.every(i => gradeOf(i)));
  assert.equal(gradeOf({ category: 'consumable', minLevel: 40 }), null);
  assert.ok(equip.some(i => gradeOf(i) === 'S'));
});
