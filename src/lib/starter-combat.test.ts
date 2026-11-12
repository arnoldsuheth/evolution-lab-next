import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { HUNTER_ARROW } from './catalogue';
import { basicAttack, resolveCombat, type EnemyState } from './combat';
import { countItem } from './equipment';
import { freshHero, freshSave, hunterCompanion, migrateSave, stats } from './game';
import { classPowerRequirement } from './skills';
import { useGame } from './store';

const enemy: EnemyState = { id: 'trial', name: 'Criatura', hp: 100, maxHp: 100, power: 1, reward: 1, elite: false };

test('Hunter elfo começa com arco equipado e cada disparo básico usa uma flecha', () => {
  useGame.setState(freshSave());
  useGame.getState().createCharacter('Elfo', 'hunter', 'normal', 'elf');
  const hero = useGame.getState().hero;
  assert.equal(hero.region, 'bosque');
  assert.equal(hero.classInitiated, false);
  assert.ok(hero.equipped.includes('hunter-weapon0-1'));
  assert.equal(countItem(hero.inventory, HUNTER_ARROW), 40);
  assert.equal(basicAttack(hero).range, 15);

  const shot = resolveCombat(hero, enemy);
  assert.equal(shot.basicEffect, 'arrow');
  assert.equal(hunterCompanion(hero), 'wolf');
  assert.equal(shot.companionStrike, true);
  assert.equal(shot.damage, Math.round(stats(hero).attack + 2));

  const trainedWolf = { ...hero, inventory: [...hero.inventory, 'pet-wolf'], equipped: [...hero.equipped, 'pet-wolf'] };
  assert.equal(stats(trainedWolf).companion, 4);
  const unarmed = { ...trainedWolf, equipped: ['pet-wolf'] };
  assert.equal(hunterCompanion(unarmed), undefined);
  assert.equal(resolveCombat(unarmed, enemy).companionStrike, false);
  assert.equal(countItem(shot.hero.inventory, HUNTER_ARROW), 39);
  const empty = { ...hero, inventory: ['hunter-weapon0-1'] };
  const failed = resolveCombat(empty, enemy);
  assert.match(failed.error ?? '', /Sem flechas/);
  assert.equal(failed.hero, empty);
  assert.equal(failed.enemy, enemy);
});

test('salvamento antigo recebe o kit uma vez e mantém seu progresso', () => {
  const oldHunter = { ...freshHero(), created: true, race: 'elf', classId: 'hunter', level: 4,
    region: 'bosque', classInitiated: false, classTrial: { id: 'hunter', kills: 2 }, gold: 90 };
  const first = migrateSave({ ...freshSave(), hero: oldHunter });
  assert.equal(first.hero.id, oldHunter.id);
  assert.equal(first.hero.gold, 90);
  assert.equal(first.hero.classTrial?.kills, 2);
  assert.ok(first.hero.equipped.includes('hunter-weapon0-1'));

  first.hero.inventory = first.hero.inventory.filter(id => id !== HUNTER_ARROW);
  assert.equal(countItem(migrateSave(first).hero.inventory, HUNTER_ARROW), 0);
});

test('herói desarmado começa com soco e o poder exige nível e iniciação', () => {
  const novice = { ...freshHero(), classId: 'mage' as const, mp: 60, stamina: 100 };
  const punch = resolveCombat(novice, enemy);
  assert.equal(punch.basicEffect, 'punch');
  assert.equal(punch.hero.mp, novice.mp);
  assert.ok(punch.hero.stamina < novice.stamina);
  assert.equal(basicAttack(novice).range, 4);
  assert.match(resolveCombat(novice, enemy, { starter: true }).error ?? '', /nível 8/);
  assert.ok(classPowerRequirement({ ...novice, level: 8, classInitiated: false }));
  assert.equal(resolveCombat({ ...novice, level: 8, classInitiated: true }, enemy, { starter: true }).error, undefined);
});
