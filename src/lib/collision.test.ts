import { test } from "node:test";
import { strict as assert } from "node:assert";
import { canMoveTo } from "./collision";

test("personagem pode caminhar pela praca", () => {
  assert.equal(canMoveTo(0, 0), true);
  assert.equal(canMoveTo(2, 2), true);
});

test("personagem nao atravessa casas", () => {
  assert.equal(canMoveTo(-7, -6), false);
  assert.equal(canMoveTo(7, -6), false);
  assert.equal(canMoveTo(-7, 6), false);
  assert.equal(canMoveTo(7, 6), false);
});

test("personagem respeita limites do mapa", () => {
  assert.equal(canMoveTo(13, 0), false);
  assert.equal(canMoveTo(0, -13), false);
});

test("coordenadas invalidas sao rejeitadas", () => {
  assert.equal(canMoveTo(NaN, 0), false);
  assert.equal(canMoveTo(Infinity, 0), false);
});
