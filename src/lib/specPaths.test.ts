import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { SPECS, SPEC_FX } from './adventure';
import { resolveCombat } from './combat';
import { freshSave, type HeroData } from './game';

const caster = (classId: HeroData['classId'], spec: string): HeroData => {
  const base = freshSave().hero;
  return { ...base, created: true, classId, level: 12, hp: 60, mp: 300, stamina: 300, adventure: { ...(base.adventure ?? {}), spec } as HeroData['adventure'] };
};
const enemy = { id: 'e', name: 'Alvo', hp: 5000, maxHp: 5000, power: 40, reward: 1, elite: false };

test('mago e shaman têm três caminhos com elemento e efeito próprio', () => {
  assert.deepEqual(SPECS.mage.map(s => s.element), ['frost', 'fire', 'shadow']);
  assert.deepEqual(SPECS.shaman.map(s => s.element), ['heal', 'jungle', 'astral']);
  for (const s of [...SPECS.mage, ...SPECS.shaman]) assert.ok(SPEC_FX[s.element!].tone.startsWith('#'));
  assert.ok(Object.values(SPECS).every(list => list.length >= 2 && new Set(list.map(s => s.id)).size === list.length));
});

test('fogo queima, gelo protege e bruxo rouba vida no Poder', () => {
  const fire = resolveCombat(caster('mage', 'mage-fury'), enemy, { starter: true, criticalRoll: 1 });
  assert.ok(fire.enemy.bleed && fire.enemy.bleed.turns === 3);
  const plain = resolveCombat(caster('mage', ''), enemy, { starter: true, criticalRoll: 1 });
  const frost = resolveCombat(caster('mage', 'mage-guard'), enemy, { starter: true, criticalRoll: 1 });
  assert.ok(frost.received < plain.received);
  const warlock = caster('mage', 'mage-warlock'), hit = resolveCombat(warlock, enemy, { starter: true, criticalRoll: 1 });
  assert.ok(hit.hero.hp > warlock.hp - hit.received);
});
