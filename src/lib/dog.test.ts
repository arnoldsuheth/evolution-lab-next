import test from 'node:test';
import assert from 'node:assert/strict';
import { DOG_FULL_MS, FOOD_GAIN, FRESH_DOG, cleanDog, dogFood, dogHungry, dogLevel, feedDog } from './dog';

test('Caramelo: comida enche a amizade, ele fica satisfeito por um tempo e sobe de nível', () => {
  const t0 = 1_000_000;
  const first = feedDog(FRESH_DOG, t0, 'food');
  assert.equal(first.ok, true); assert.equal(first.dog.friendship, FOOD_GAIN); assert.equal(first.dog.meals, 1);
  assert.equal(feedDog(first.dog, t0 + 1000, 'food').ok, false, 'logo depois de comer ele está cheio');
  assert.equal(dogHungry(first.dog, t0 + DOG_FULL_MS), true);
  const second = feedDog(first.dog, t0 + DOG_FULL_MS, 'food');
  assert.equal(second.ok && second.levelUp, true, 'de 15 para 30 vira Curioso');
  assert.equal(dogLevel(30).name, 'Curioso');
  let dog = second.dog, now = t0 + DOG_FULL_MS;
  for (let i = 0; i < 20; i++) { now += DOG_FULL_MS; const r = feedDog(dog, now, 'treat'); dog = r.dog; }
  assert.equal(dog.friendship, 100); assert.equal(dogLevel(100).name, 'Companheiro fiel');
  assert.equal(feedDog(dog, now + DOG_FULL_MS, 'food').ok, false, 'com amizade completa não come mais');
});

test('Caramelo: save estranho vira estado válido e ele só aceita comida de verdade', () => {
  assert.deepEqual(cleanDog({ friendship: 900, fedAt: -5, meals: 'x' }), { friendship: 100, fedAt: 0, meals: 0 });
  assert.deepEqual(cleanDog(null), FRESH_DOG);
  assert.equal(dogFood(['consume-life-1', 'food-bread-1']), 'food-bread-1');
  assert.equal(dogFood(['consume-life-1']), undefined);
});
