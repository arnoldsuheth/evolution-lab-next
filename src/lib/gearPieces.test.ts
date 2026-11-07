import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {gearLook,GEAR_PIECES,rarityTier} from './gearPieces';
test('raridades viram três níveis visuais',()=>{assert.equal(rarityTier('Comum'),'common');assert.equal(rarityTier('Épico'),'epic');assert.equal(rarityTier('Mítico'),'mythic');assert.equal(rarityTier('Lendário'),'mythic');assert.equal(rarityTier(undefined),'common');});
test('peças equipadas aparecem no corpo e a melhor raridade define a aura',()=>{
 const look=gearLook([{slot:'shoulders',rarity:'Épico'},{slot:'feet',rarity:'Comum'},{slot:'weapon',rarity:'Mítico'},{slot:'consumable',rarity:'Comum'}]);
 assert.deepEqual(look.slots.map(s=>s.slot).sort(),['feet','shoulders']);
 assert.equal(look.best,'mythic');assert.equal(look.armor,'epic');
});
test('peças de braços e pernas existem nos dois lados',()=>{for(const slot of ['shoulders','hands','legs','feet'] as const){const bones=(GEAR_PIECES[slot]??[]).map(p=>p.bone);assert.ok(bones.some(b=>b.endsWith('.l'))&&bones.some(b=>b.endsWith('.r')),slot);}});
