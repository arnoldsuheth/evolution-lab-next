import test from 'node:test';
import assert from 'node:assert/strict';
import { FRESH_BANK, bankInterest, cleanBank, deposit, withdraw, BANK_DAILY_CAP } from './bank';
import { PRICE } from './catalogue';
const DAY = 86_400_000, T = Date.UTC(2026, 10, 8);

test('banco: juros de 1% ao dia, com teto por dia e por período', () => {
  const r = deposit(FRESH_BANK, 2000, 1000, T); assert.ok(r.ok);
  assert.equal(r.wallet, 1000); assert.equal(r.bank.balance, 1000);
  assert.equal(bankInterest(r.bank, T + DAY - 1), 0);
  assert.equal(bankInterest(r.bank, T + 3 * DAY), 30);
  assert.equal(bankInterest(r.bank, T + 400 * DAY), 300, 'conta no máximo 30 dias');
  assert.equal(bankInterest({ balance: 1_000_000, since: T }, T + DAY), BANK_DAILY_CAP);
  const w = withdraw(r.bank, 1000, 99999, T + 2 * DAY); assert.ok(w.ok);
  assert.equal(w.wallet, 1000 + 1020); assert.deepEqual(w.bank, { balance: 0, since: 0 });
});

test('banco recusa valores inválidos e salvamento sujo', () => {
  assert.equal(deposit(FRESH_BANK, 50, 50, T).ok, false);
  assert.equal(deposit(FRESH_BANK, 100, 500, T).ok, false);
  assert.equal(withdraw(FRESH_BANK, 0, 100, T).ok, false);
  assert.deepEqual(cleanBank({ balance: -5, since: 'x' }), { balance: 0, since: 0 });
});

test('preços: armas desde 8 prata, armaduras desde 3 prata, joias desde 5 prata, crescendo com nível', () => {
  assert.ok(PRICE.weapon(1, 1, 1) >= 800); assert.ok(PRICE.armor(1, .45, 1) >= 300); assert.ok(PRICE.jewel(1, 1) >= 500);
  assert.ok(PRICE.weapon(20, 1, 1.18) > PRICE.weapon(10, 1, 1.08)); assert.ok(PRICE.armor(30, 1.2, 1.32) > PRICE.armor(30, .45, 1.32));
  assert.ok(PRICE.potion(1) < PRICE.armor(1, .45, 1));
});
