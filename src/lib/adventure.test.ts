import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { freshSave, migrateSave, stats, ITEMS } from './game';
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => {} } });
import { useGame, currentAdventure } from './store';
import { adventureOf, cleanAdventure, dailyFor, dayKey, DAILY_POOL, rareNow, RARE_WINDOW_MS, restCap, repRank, discounted, SPECS, unlockedPets, HEARTH_MS } from './adventure';
import { DOORS, doorBetween, tryDoor } from './dungeon';
import { resolveCombat } from './combat';
import { MONSTERS } from './campaign';

function reset() { useGame.setState({ ...freshSave(), mounted: false, relocation: 0, encounter: null, challenge: null, cooldowns: {}, slain: {}, gathered: {}, rareSeen: 0, target: null, queued: null }); useGame.getState().createCharacter('Viajante', 'paladin', 'normal'); }
const adv = () => adventureOf(useGame.getState().hero);

test('missões do dia: sempre uma de código, iguais no mesmo dia e diferentes por herói', () => {
  const a = dailyFor('2026-11-06', 'heroi-a', 5, ['variables']);
  assert.equal(a.length, 3); assert.equal(a[0], 'd-code'); assert.equal(new Set(a).size, 3);
  assert.deepEqual(dailyFor('2026-11-06', 'heroi-a', 5, ['variables']), a);
  assert.ok(a.every(id => DAILY_POOL.some(t => t.id === id)));
  assert.match(dayKey(Date.UTC(2026, 10, 6, 12)), /^2026-11-06$/);
});

test('missão do dia avança com lutas e coleta e paga uma única vez', () => {
  reset(); useGame.getState().tick(0);
  assert.equal(useGame.getState().hero.adventure, undefined, 'o relógio não grava nada sozinho');
  const ids = currentAdventure(useGame.getState()).daily.ids; assert.equal(ids.length, 3);
  // Força uma tarefa de coleta de ervas para testar o caminho completo.
  useGame.setState(s => ({ hero: { ...s.hero, position: [-18, 6], adventure: { ...currentAdventure(s), daily: { ...currentAdventure(s).daily, ids: ['d-code', 'd-herb', 'd-any'], progress: [0, 2, 0], claimed: [false, false, false] } } } }));
  useGame.getState().gather('herb-0');
  assert.equal(adv().daily.progress[1], 3); assert.equal(adv().gathers, 1);
  const before = useGame.getState().hero;
  useGame.getState().claimDaily(1);
  const after = useGame.getState().hero;
  assert.ok(after.xp > before.xp); assert.ok(after.gold > before.gold); assert.equal(adv().daily.claimed[1], true); assert.equal(adv().dailyDone, 1); assert.equal(adv().rep.mercadores, 60);
  useGame.getState().claimDaily(1); assert.equal(useGame.getState().hero.gold, after.gold);
  useGame.getState().claimDaily(0); assert.equal(adv().daily.claimed[0], false);
});

test('resolver uma runa conta para a missão de código e dá reputação aos sábios', () => {
  reset(); useGame.getState().tick(0);
  const result = useGame.getState().solve('variables', 'let nivel = 1;');
  assert.equal(result.passed, true); assert.equal(adv().daily.progress[0], 1); assert.equal(adv().rep.sabios, 80);
});

test('pedra de retorno leva à praça e só volta a funcionar depois da recarga', () => {
  reset(); useGame.setState(s => ({ hero: { ...s.hero, region: 'ruins', position: [10, -10] } }));
  useGame.getState().hearth();
  assert.equal(useGame.getState().hero.region, 'aurora'); assert.deepEqual(useGame.getState().hero.position, [0, 5]); assert.equal(useGame.getState().relocation, 1);
  assert.ok(adv().hearthAt > Date.now() + HEARTH_MS - 5000);
  useGame.setState(s => ({ hero: { ...s.hero, region: 'ruins', position: [10, -10] } }));
  useGame.getState().hearth(); assert.equal(useGame.getState().hero.region, 'ruins');
  useGame.setState(s => ({ hero: { ...s.hero, adventure: { ...adventureOf(s.hero), hearthAt: 0 } }, encounter: { id: 'x', name: 'X', hp: 9, maxHp: 9, power: 1, reward: 1, elite: false } }));
  useGame.getState().hearth(); assert.equal(useGame.getState().hero.region, 'ruins');
});

test('XP descansado enche na vila, tem limite e dobra o XP da próxima luta', () => {
  reset(); useGame.setState(s => ({ hero: { ...s.hero, position: [0, 5] } }));
  useGame.getState().tick(60); assert.ok(useGame.getState().restPending > 0); assert.equal(adv().rested, 0);
  useGame.getState().tick(100000); assert.equal(adv().rested, restCap(1));
  useGame.setState(s => ({ hero: { ...s.hero, position: [-4, -18] }, education: { ...s.education, completed: ['variables'] } }));
  const xp = useGame.getState().hero.xp;
  useGame.getState().startEncounter(false, 1, 'forest-wolf');
  useGame.setState(s => ({ encounter: { ...s.encounter!, hp: 1 } }));
  useGame.getState().attack();
  const gained = useGame.getState().hero.xp - xp;
  assert.ok(adv().rested < restCap(1)); assert.ok(gained >= 2 * 25, `ganhou ${gained}`);
  assert.match(useGame.getState().notice, /descansado/);
  assert.equal(adv().kinds.wolf, 1);
});

test('conquistas liberam título e mascote', () => {
  reset(); useGame.setState(s => ({ hero: { ...s.hero, kills: 1, adventure: { ...adventureOf(s.hero), kinds: { boar: 10 } } } }));
  useGame.getState().tick(0);
  assert.ok(adv().achievements.includes('first')); assert.ok(adv().achievements.includes('boar'));
  assert.equal(adv().title, 'first'); assert.match(useGame.getState().notice, /Conquista/);
  assert.deepEqual(unlockedPets(adv()), ['boar']);
  useGame.getState().setPet('boar'); assert.equal(adv().pet, 'boar');
  useGame.getState().setPet('dragon'); assert.equal(adv().pet, 'boar');
  useGame.getState().setTitle('boar'); assert.equal(adv().title, 'boar');
  useGame.getState().setTitle('debug'); assert.equal(adv().title, 'boar');
});

test('reputação dá desconto nas lojas e níveis claros', () => {
  assert.equal(repRank(0), 0); assert.equal(repRank(750), 2); assert.equal(repRank(3000), 4);
  assert.equal(discounted(100, 10), 90); assert.equal(discounted(0, 20), 0);
  reset();
  const item = Object.values(ITEMS).find(i => i.source === 'shop' && i.minLevel === 1 && !i.classId && !i.classes && i.price >= 20)!;
  useGame.setState(s => ({ hero: { ...s.hero, gold: 1000, adventure: { ...adventureOf(s.hero), rep: { mercadores: 3000, ferreiros: 0, sabios: 0 } } } }));
  useGame.getState().buy(item.id);
  assert.equal(useGame.getState().hero.gold, 1000 - discounted(item.price, 20));
});

test('especialização no nível 10 muda atributos e só a troca custa bronze', () => {
  reset(); const [guard, fury] = SPECS.paladin;
  useGame.getState().chooseSpec(guard.id); assert.equal(adv().spec, '');
  useGame.setState(s => ({ hero: { ...s.hero, level: 10, gold: 500 } }));
  const base = stats(useGame.getState().hero);
  useGame.getState().chooseSpec(guard.id); assert.equal(adv().spec, guard.id); assert.equal(useGame.getState().hero.gold, 500);
  const guarded = stats(useGame.getState().hero); assert.ok(guarded.defense > base.defense); assert.ok(guarded.maxHp > base.maxHp);
  useGame.getState().chooseSpec(fury.id); assert.equal(adv().spec, fury.id); assert.ok(useGame.getState().hero.gold < 500);
  assert.ok(stats(useGame.getState().hero).attack > base.attack);
});

test('chefe entra na fase 2 abaixo da metade da vida e bate mais forte', () => {
  const hero = { ...freshSave().hero, created: true, level: 10, hp: 500, stamina: 100 };
  const boss = { id: 'b', name: 'Chefe', hp: 1000, maxHp: 1000, power: 60, reward: 1, elite: true, kind: 'golem' as const, turn: 0 };
  const calm = resolveCombat(hero, boss); assert.equal(calm.phaseChange, false); assert.equal(calm.enemy.phase, undefined);
  const low = resolveCombat(hero, { ...boss, hp: 510 }); assert.equal(low.phaseChange, true); assert.equal(low.enemy.phase, 2);
  const angry = resolveCombat(hero, { ...boss, hp: 900, phase: 2 }), normal = resolveCombat(hero, { ...boss, hp: 900 });
  assert.ok(angry.received > normal.received);
});

test('monstro raro aparece por 3 minutos, é mais forte e paga melhor uma vez por janela', () => {
  const start = Math.ceil(Date.now() / RARE_WINDOW_MS) * RARE_WINDOW_MS;
  const rare = rareNow(start + 1000, 'aurora')!; assert.ok(rare); assert.equal(rareNow(start + 4 * 60_000, 'aurora'), null);
  assert.deepEqual(rareNow(start + 2000, 'aurora'), rare);
  const realNow = Date.now; Date.now = () => start + 1000;
  try {
  const now = rareNow(Date.now(), 'aurora')!;
  reset(); const m = MONSTERS.find(x => x.id === now.monsterId)!;
  useGame.setState(s => ({ hero: { ...s.hero, level: 10, position: [m.x + 1, m.z] }, education: { ...s.education, completed: ['variables', 'conditions'], }, }));
  useGame.setState(s => ({ hero: { ...s.hero, defeatedBosses: ['boss-forest'] } }));
  useGame.getState().startEncounter(false, m.level, m.id);
  const enemy = useGame.getState().encounter!; assert.ok(enemy.rare !== undefined); assert.ok(enemy.elite); assert.match(enemy.name, /raro/);
  useGame.setState(s => ({ encounter: { ...s.encounter!, hp: 1 } })); const gold = useGame.getState().hero.gold; useGame.getState().attack();
  assert.equal(adventureOf(useGame.getState().hero).rares, 1); assert.ok(useGame.getState().hero.gold > gold);
  useGame.setState({ slain: {} }); useGame.getState().startEncounter(false, m.level, m.id); assert.equal(useGame.getState().encounter?.rare, undefined);
  } finally { Date.now = realNow; }
});

test('portas de código: o programa certo abre, a porta bloqueia o caminho e a luta', () => {
  assert.equal(DOORS.length, 6);
  const solutions: Record<string, string> = {
    'cavern-1': 'let chave = 3;', 'cavern-2': 'const tochas = 2;\nlet aberta = false;\nif (tochas >= 2) {\n aberta = true;\n}',
    'cavern-3': 'const cristais = [4, 1, 5];\nlet total = 0;\nfor (let i = 0; i < cristais.length; i++) {\n total += cristais[i];\n}',
    'monastery-1': 'let toques = 0;\nfor (let i = 0; i < 5; i++) {\n toques++;\n}', 'monastery-2': 'function selo(n) {\n return n + 10;\n}',
    'monastery-3': 'const nivel = 25;\nconst temSelo = true;\nconst passa = nivel >= 25 && temSelo;',
  };
  for (const d of DOORS) { assert.equal(tryDoor(d.id, solutions[d.id]).passed, true, d.id); assert.equal(tryDoor(d.id, d.starter).passed, false, d.id); }
  assert.ok(doorBetween('cavern', [], 8, 0)); assert.equal(doorBetween('cavern', ['cavern-1'], 8, 0), undefined);
  reset(); useGame.setState(s => ({ hero: { ...s.hero, level: 8, instance: 'cavern', position: [0, 7] }, education: { ...s.education, completed: ['variables'] } }));
  useGame.getState().startEncounter(false, 8, 'cavern-spider'); assert.equal(useGame.getState().encounter, null); assert.match(useGame.getState().notice, /Porta selada/);
  useGame.setState(s => ({ hero: { ...s.hero, position: [0, 20] } }));
  assert.equal(useGame.getState().openDoor('cavern-1', solutions['cavern-1']).passed, false); assert.equal(adv().doors.length, 0);
  useGame.setState(s => ({ hero: { ...s.hero, position: [0, 7] } }));
  const xp = useGame.getState().hero.xp;
  assert.equal(useGame.getState().openDoor('cavern-1', solutions['cavern-1']).passed, true);
  assert.deepEqual(adv().doors, ['cavern-1']); assert.ok(useGame.getState().hero.xp > xp);
});

test('saves antigos continuam iguais; dados de aventura inválidos são limpos', () => {
  const old = freshSave(); const migrated = migrateSave(old);
  assert.equal(migrated.hero.adventure, undefined);
  const dirty = migrateSave({ ...old, hero: { ...old.hero, adventure: { rested: -5, title: 'invalido', pet: 'unicornio', rep: { mercadores: 99999 }, doors: ['cavern-1', 3], daily: { day: 'x', ids: ['d-code', 'nada'], progress: [5], claimed: [true] } } } });
  const a = cleanAdventure(dirty.hero.adventure);
  assert.equal(a.rested, 0); assert.equal(a.title, ''); assert.equal(a.pet, ''); assert.equal(a.rep.mercadores, 3000); assert.deepEqual(a.doors, ['cavern-1']); assert.deepEqual(a.daily.ids, ['d-code']); assert.deepEqual(a.daily.claimed, [true]);
});
