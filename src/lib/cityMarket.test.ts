import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { cityMarket, marketStocks } from './cityMarket';
import { ITEMS, freshSave } from './game';
import { RACIAL_CITIES } from './kingdomCities';
import { findPath, walkable } from './navigation';
import { useGame } from './store';

test('todos os mercados têm seis balcões sólidos e acessíveis pelo lado da compra', () => {
  for (const region of [...Object.keys(RACIAL_CITIES), 'goddard']) {
    const stalls = cityMarket(region);
    assert.equal(stalls.length, 6, region);
    for (const {id,point,approach} of stalls) {
      assert.equal(walkable(...point, region), false, `${region} · ${id}`);
      assert.ok(findPath([0,5], approach, region).length > 0, `${region} · ${id}`);
      assert.ok(Object.values(ITEMS).some(item => marketStocks(id,item)), id);
    }
  }
});

test('o mercado respeita estoque, distância e desbloqueio da Aurora', () => {
  const state = freshSave();
  const fruit = ITEMS['food-fruit-1'];
  const stall = cityMarket('aurora').find(({id})=>id==='fruit')!;
  useGame.setState({...state, encounter:null, hero:{...state.hero, gold:100, position:stall.approach}});
  const buy = (id: string, market: typeof stall.id) => useGame.getState().buy(id, market);
  buy(fruit.id, 'fruit');
  assert.equal(useGame.getState().hero.gold, 100);
  useGame.setState({education:{...state.education, completed:['arrays']}});
  buy('food-bread-1', 'fruit');
  assert.equal(useGame.getState().hero.gold, 100);
  buy(fruit.id, 'fruit');
  assert.ok(useGame.getState().hero.inventory.includes(fruit.id));
  assert.equal(useGame.getState().hero.gold, 100-fruit.price);
  useGame.setState(s=>({hero:{...s.hero,position:[0,5]}}));
  buy(fruit.id, 'fruit');
  assert.equal(useGame.getState().hero.gold, 100-fruit.price);
});
