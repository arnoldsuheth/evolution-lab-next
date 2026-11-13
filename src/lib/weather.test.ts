import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { nightness, regionWeather } from './weather';

const at = (min: number) => min * 60000;
test('clima: Bosque chove 6 de cada 18 minutos, começando e parando devagar', () => {
  assert.equal(regionWeather('bosque', at(18 * 100 + 3)).kind, 'rain');
  assert.equal(regionWeather('bosque', at(18 * 100 + 3)).strength, 1);
  assert.ok(regionWeather('bosque', at(18 * 100 + .5)).strength < 1, 'começa devagar');
  assert.equal(regionWeather('bosque', at(18 * 100 + 10)).kind, 'clear');
});
test('clima: cada região tem o seu', () => {
  assert.equal(regionWeather('iron-forge', at(5)).kind, 'snow');
  assert.equal(regionWeather('ogrimmar', at(5)).kind, 'soot');
  assert.equal(regionWeather('ruins', at(5)).kind, 'dust');
  assert.equal(regionWeather('heart', at(5)).kind, 'clear');
});
test('clima: noite cresce quando a luz cai', () => {
  assert.equal(nightness(1), 0);
  assert.equal(nightness(.2), 1);
  assert.ok(nightness(.4) > 0 && nightness(.4) < 1);
});
