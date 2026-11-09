import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { BAG_RECIPES, BACKPACK_SIZE, canStoreInventory, inventorySections } from './bags';
import { freshSave, migrateSave } from './game';
import { useGame } from './store';

test('cada bolsa é fabricada uma vez e a capacidade sobrevive ao save', () => {
  const save = freshSave();
  useGame.setState({
    ...save,
    encounter: null,
    hero: { ...save.hero, level: 20, gold: 200, inventory: Array(30).fill('mat-cloth-1') },
    education: { ...save.education, completed: ['arithmetic'] },
  });
  for (const { id } of BAG_RECIPES) {
    useGame.getState().craft(id);
    useGame.getState().craft(id);
  }
  const { hero, education } = useGame.getState();
  assert.equal(hero.gold, 48);
  assert.deepEqual(hero.inventory, [...Array(6).fill('mat-cloth-1'), 'bag-5', 'bag-10', 'bag-20']);
  const restored = migrateSave({ ...save, hero, education }).hero;
  const layout = inventorySections(restored.inventory, restored.equipped);
  assert.deepEqual(layout.sections.map(({ size }) => size), [24, 5, 10, 20]);
  assert.equal(layout.used, 1);
  assert.equal(layout.capacity, 59);
});

test('pilhas, equipamento e excedente de saves antigos permanecem acessíveis', () => {
  const inventory = Array.from({ length: BACKPACK_SIZE + 2 }, (_, index) => `item-${index}`);
  const worn = ['item-0'];
  const { used, overflow } = inventorySections(inventory, worn);
  assert.equal(used, BACKPACK_SIZE + 1);
  assert.deepEqual(overflow, [`item-${BACKPACK_SIZE + 1}`]);
  assert.equal(canStoreInventory(inventory, [...inventory, 'item-1'], worn), true);
  assert.equal(canStoreInventory(inventory, [...inventory, 'novo-item'], worn), false);
  assert.equal(canStoreInventory(inventory, [...inventory, 'bag-5'], worn), true);
});
