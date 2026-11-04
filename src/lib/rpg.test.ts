import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  initialHero, buyItem, equipItem,
  completeMission, checkAnswer,
} from "./rpg";

test("compra desconta ouro", () => {
  const hero = buyItem(initialHero, "axe");
  assert.equal(hero.gold, 25);
  assert.deepEqual(hero.inventory, ["axe"]);
});

test("compra duplicada nao funciona", () => {
  const hero = buyItem(initialHero, "axe");
  assert.deepEqual(buyItem(hero, "axe"), hero);
});

test("compra sem dinheiro nao funciona", () => {
  const hero = { ...initialHero, gold: 1 };
  assert.deepEqual(buyItem(hero, "axe"), hero);
});

test("equipamento precisa estar no inventario", () => {
  assert.deepEqual(equipItem(initialHero, "shield"), initialHero);
  const hero = buyItem(initialHero, "shield");
  assert.deepEqual(equipItem(hero, "shield").equipped, ["shield"]);
});

test("resposta correta reconhecida", () => {
  assert.equal(checkAnswer("let nivel = 1;"), true);
  assert.equal(checkAnswer("const nivel = 1;"), true);
  assert.equal(checkAnswer("nivel = 1"), false);
});

test("resposta errada nao recebe XP", () => {
  assert.deepEqual(completeMission(initialHero, "nivel = 1"), initialHero);
});

test("missao correta concede recompensa", () => {
  const hero = completeMission(initialHero, "let nivel = 1;");
  assert.equal(hero.xp, 100);
  assert.equal(hero.gold, 70);
  assert.equal(hero.level, 2);
  assert.equal(hero.missionComplete, true);
});

test("recompensa nao duplica", () => {
  const hero = completeMission(initialHero, "let nivel = 1;");
  assert.deepEqual(completeMission(hero, "let nivel = 1;"), hero);
});