import test from 'node:test';
import assert from 'node:assert/strict';
import { freshSave, stats } from './game';
import { resolveCombat } from './combat';
import { cleanAttributes } from './attributes';
const enemy = { id: 'lobo', name: 'Lobo', hp: 500, maxHp: 500, power: 1, reward: 1, elite: false, level: 1 };
const hero = (classId: 'mage' | 'warrior') => ({ ...freshSave().hero, classId, created: true });

test('mago iniciado e equipado gasta MP no ataque normal; guerreiro gasta estamina', () => {
  const mage = { ...hero('mage'), level: 8, classInitiated: true, inventory: ['staff'], equipped: ['staff'] }, r = resolveCombat(mage, enemy, { criticalRoll: 1 });
  assert.equal(r.hero.mp, mage.mp - 6); assert.equal(r.hero.stamina, mage.stamina);
  const war = hero('warrior'), w = resolveCombat(war, enemy, { criticalRoll: 1 });
  assert.equal(w.hero.stamina, war.stamina - 9); assert.equal(w.hero.mp, war.mp);
  assert.equal(resolveCombat({ ...mage, mp: 3 }, enemy).error, 'MP insuficiente');
});

test('Mentalidade dá MP e ataque mágico', () => {
  const base = { ...hero('mage'), level: 5 }, withMen = { ...base, attributeAllocation: cleanAttributes({ mentality: 4 }, 5) };
  assert.equal(stats(withMen).maxMp - stats(base).maxMp, 12);
  assert.equal(stats(withMen).attack - stats(base).attack, 3);
  assert.equal(stats({ ...withMen, classId: 'warrior' }).attack, stats({ ...base, classId: 'warrior' }).attack);
});
