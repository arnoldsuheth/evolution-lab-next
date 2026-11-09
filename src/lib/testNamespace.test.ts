import test from 'node:test';
import assert from 'node:assert/strict';
import { installTestNamespace } from './testNamespace';

class FakeStorage { #m = new Map<string, string>(); getItem(k: string) { return this.#m.get(k) ?? null; } setItem(k: string, v: string) { this.#m.set(k, String(v)); } removeItem(k: string) { this.#m.delete(k); } key(i: number) { return [...this.#m.keys()][i] ?? null; } clear() { this.#m.clear(); } get length() { return this.#m.size; } raw() { return Object.fromEntries(this.#m); } }

test('cópia de teste guarda tudo com prefixo e não toca no salvamento oficial', () => {
  const s = new FakeStorage(); s.setItem('genesis-reborn-rpg-v3', 'OFICIAL');
  installTestNamespace(FakeStorage.prototype as unknown as Storage, 'teste:');
  assert.equal(s.getItem('genesis-reborn-rpg-v3'), null, 'não enxerga o salvamento oficial');
  s.setItem('genesis-reborn-rpg-v3', 'TESTE');
  assert.equal(s.getItem('genesis-reborn-rpg-v3'), 'TESTE');
  assert.equal(s.length, 1); assert.equal(s.key(0), 'genesis-reborn-rpg-v3');
  s.clear();
  assert.deepEqual(s.raw(), { 'genesis-reborn-rpg-v3': 'OFICIAL' }, 'limpar a cópia de teste preserva o oficial');
});
