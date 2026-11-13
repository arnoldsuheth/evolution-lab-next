import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { cityFolk, FOLK_ROUTE, routePoint } from './cityFolk';
import { RACIAL_CITIES, cityBuildings } from './kingdomCities';

test('cityFolk: moradores são da raça da cidade e andam em duplas', () => {
  for (const city of Object.keys(RACIAL_CITIES) as (keyof typeof RACIAL_CITIES)[]) {
    if (city === 'aurora') continue;
    for (const pair of cityFolk(city)) { assert.equal(pair.length, 2); for (const w of pair) assert.equal(w.race, RACIAL_CITIES[city].race); }
  }
  assert.ok(cityFolk('goddard').flat().every(w => w.celestial));
});

test('cityFolk: rota fecha o laço e não entra nas casas', () => {
  const a = routePoint(FOLK_ROUTE.city, 0), b = routePoint(FOLK_ROUTE.city, 1);
  assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 1e-6);
  for (const [route, city] of [[FOLK_ROUTE.city, 'ogrimmar'], [FOLK_ROUTE.goddard, 'goddard']] as const)
    for (let t = 0; t < 1; t += .01) {
      const p = routePoint(route, t);
      for (const h of cityBuildings(city)) assert.ok(Math.abs(p.x - h.x) > h.w + .8 || Math.abs(p.z - h.z) > h.d + .8, `${city} ${t}`);
    }
});
