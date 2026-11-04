import { test } from "node:test";
import { strict as assert } from "node:assert";
import { canMoveTo, nearNpc, NPCS } from "./collision";
import {
  armorColors, beardColors,
  validAppearance, defaultAppearance,
} from "./appearance";

test("interacao funciona perto do mercador", () => {
  assert.equal(nearNpc(-2, -2, NPCS[0]), true);
});

test("interacao distante nao funciona", () => {
  assert.equal(nearNpc(0, 8, NPCS[0]), false);
});

test("NPCs possuem colisao", () => {
  assert.equal(canMoveTo(-3, -3), false);
  assert.equal(canMoveTo(3, -3), false);
});

test("cores iniciais validas", () => {
  assert.equal(validAppearance(defaultAppearance), true);
});

test("personalizacao possui tres cores", () => {
  assert.equal(Object.keys(armorColors).length, 3);
  assert.equal(Object.keys(beardColors).length, 3);
});