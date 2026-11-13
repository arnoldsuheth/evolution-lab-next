import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { freshSave, ITEMS } from './game';
import { HIT_FEEL, hitWeight, knockbackAt } from './impact';
import { battleRewards, dropRarity, lootHighlight, withRarity } from './combat';
import { forgeId } from './catalogue';

test('QA26: golpe mais forte pesa mais (leve → esmagador)', () => {
  const base = { maxHp: 1000, kind: 'attack' as const };
  assert.equal(hitWeight({ ...base, damage: 0 }), 'light');
  assert.equal(hitWeight({ ...base, damage: 50 }), 'light');
  assert.equal(hitWeight({ ...base, damage: 250 }), 'medium');
  assert.equal(hitWeight({ ...base, damage: 250, critical: true }), 'heavy');
  assert.equal(hitWeight({ ...base, damage: 400, critical: true, won: true }), 'crushing');
  assert.equal(hitWeight({ ...base, damage: 100, kind: 'power' }), 'medium');
});

test('QA26: cada nível de peso trava, empurra e treme mais que o anterior', () => {
  const tiers = ['light', 'medium', 'heavy', 'crushing'] as const;
  for (let i = 1; i < tiers.length; i++) {
    const a = HIT_FEEL[tiers[i - 1]], b = HIT_FEEL[tiers[i]];
    assert.ok(b.hitstop > a.hitstop && b.knockback > a.knockback && b.shake > a.shake && b.scale > a.scale);
  }
  assert.equal(HIT_FEEL.light.shake, 0, 'golpe leve não treme a tela');
});

test('QA26: monstro fica parado no impacto, é empurrado e volta ao lugar', () => {
  assert.equal(knockbackAt(0, 'heavy'), 0);
  const peak = knockbackAt(HIT_FEEL.heavy.hitstop + .45 * .25, 'heavy');
  assert.ok(Math.abs(peak - HIT_FEEL.heavy.knockback) < 1e-9);
  assert.equal(knockbackAt(2, 'heavy'), 0);
});

test('QA26: chance de raridade cresce de monstro comum para elite e chefe', () => {
  assert.equal(dropRarity({ elite: false }, .5), 'comum');
  assert.equal(dropRarity({ elite: false }, .05), 'epico');
  assert.equal(dropRarity({ elite: false }, .005), 'mitico');
  assert.equal(dropRarity({ elite: true }, .2), 'epico');
  assert.equal(dropRarity({ elite: false, rare: 1 }, .2), 'epico');
  assert.equal(dropRarity({ elite: true, bossId: 'boss-master' }, .1), 'mitico');
  assert.equal(dropRarity({ elite: false }, 1), 'comum');
});

test('QA26: item raro que cai é a versão Épica ou Mítica do mesmo equipamento', () => {
  const base = Object.values(ITEMS).find(i => ITEMS[forgeId(i.id, 'epico')])!;
  assert.equal(ITEMS[withRarity(base.id, 'epico')].rarity, 'Épico');
  assert.equal(ITEMS[withRarity(base.id, 'mitico')].rarity, 'Mítico');
  assert.equal(withRarity(base.id, 'comum'), base.id);
  assert.equal(withRarity('potion', 'mitico'), 'potion', 'sem versão rara, mantém o item');
});

test('QA26: elite derrotado com sorte entrega equipamento Mítico e aviso dourado', () => {
  const hero = { ...freshSave().hero, created: true, level: 15 };
  const enemy = { id: 'x', name: 'Elite', hp: 0, maxHp: 900, power: 40, reward: 25, elite: true, level: 15 };
  const lucky = battleRewards(hero, enemy, .01).drops, plain = battleRewards(hero, enemy).drops;
  assert.ok(lucky.some(id => ITEMS[id]?.rarity === 'Mítico'));
  assert.equal(lootHighlight(lucky), 'mitico');
  assert.ok(!plain.some(id => ITEMS[id]?.source === 'forge'), 'sem sorteio continua igual ao de antes');
});

import { nextEnemyPower, resolveCombat, supremoGain, SUPREMO_MULT } from './combat';
test('5.0: aviso aparece na reação anterior ao poder do monstro', () => {
  assert.equal(nextEnemyPower({ kind: 'spider', turn: 1, hp: 10 }), null);
  assert.equal(nextEnemyPower({ kind: 'spider', turn: 2, hp: 10 }), 'Picada venenosa');
  assert.equal(nextEnemyPower({ kind: 'spider', turn: 2, hp: 0 }), null, 'morto não avisa');
  assert.equal(nextEnemyPower({ kind: 'spider', turn: 2, hp: 10, resource: 'stamina', resourceCurrent: 2 }), null, 'sem reserva não usa poder');
  assert.equal(nextEnemyPower({ kind: 'spider', turn: 1, hp: 10, phase: 2 }), 'Picada venenosa', 'furioso usa a cada 2');
});
test('5.0: Supremo enche golpeando e multiplica o dano', () => {
  assert.ok(supremoGain('skill', false) > supremoGain('attack', false));
  assert.equal(supremoGain('power', false), 0, 'o próprio poder não carrega a barra');
  const hero = { ...freshSave().hero, created: true, level: 10, mp: 999, stamina: 999 };
  const enemy = { id: 'x', name: 'Alvo', hp: 99999, maxHp: 99999, power: 1, reward: 1, elite: false, level: 10 };
  const plain = resolveCombat(hero, enemy, { criticalRoll: 1 }).damage, strong = resolveCombat(hero, enemy, { criticalRoll: 1, damageMult: SUPREMO_MULT }).damage;
  assert.ok(strong >= Math.round(plain * SUPREMO_MULT) - 1);
});
