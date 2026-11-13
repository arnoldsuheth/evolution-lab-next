import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { minimapBearing, minimapViewBox } from './minimap';

test('mantém o marcador perto e aponta para o destino distante dentro da borda circular', () => {
  assert.equal(minimapViewBox([7, -4]), '-6 -17 26 26');
  assert.equal(minimapBearing([7, -4], [7, -15]), undefined);

  for (const [dx, dz, angle] of [[0, -50, 0], [60, 0, 90], [0, 40, 180], [-50, 0, -90], [40, -40, 45]]) {
    const bearing = minimapBearing([7, -4], [7 + dx, -4 + dz]);
    assert.ok(bearing);
    assert.equal(bearing.angle, angle);
    assert.ok(Math.abs(Math.hypot(bearing.point[0] - 7, bearing.point[1] + 4) - 9.5) < 1e-8);
  }
});
