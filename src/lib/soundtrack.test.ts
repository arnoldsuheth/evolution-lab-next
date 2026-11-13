import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { renderTrack, trackFor, TRACK_IDS } from './soundtrack';

const base = { region: 'aurora', night: false, raining: false, combat: false };
test('trilha: combate vence tudo, depois lugar, chuva e noite', () => {
  assert.equal(trackFor({ ...base, combat: true, raining: true, night: true }), 'combate');
  assert.equal(trackFor(base), 'cidade');
  assert.equal(trackFor({ ...base, region: 'bosque' }), 'floresta');
  assert.equal(trackFor({ ...base, region: 'bosque', raining: true }), 'chuva');
  assert.equal(trackFor({ ...base, night: true }), 'noite');
  assert.equal(trackFor({ ...base, region: 'ogrimmar' }), 'deserto');
  assert.equal(trackFor({ ...base, region: 'iron-forge' }), 'neve');
  assert.equal(trackFor({ ...base, region: 'goddard', night: true }), 'celestial');
  assert.equal(trackFor({ ...base, region: 'heart' }), 'misterio');
  assert.equal(trackFor({ ...base, instance: true }), 'misterio');
});

test('trilha: todas são geradas como laço contínuo do tamanho certo', async () => {
  class P { value = 0; setValueAtTime() {} linearRampToValueAtTime() {} exponentialRampToValueAtTime() {} }
  class N { gain = new P(); frequency = new P(); type = ''; buffer: unknown = null; connect() {} start() {} stop() {} }
  class Offline { length: number; destination = new N(); constructor(_c: number, length: number) { this.length = length; }
    createOscillator() { return new N(); } createGain() { return new N(); } createBiquadFilter() { return new N(); } createBufferSource() { return new N(); }
    createBuffer(_c: number, frames: number) { const d = new Float32Array(frames); return { length: frames, getChannelData: () => d }; }
    startRendering() { return Promise.resolve(this.createBuffer(1, this.length)); } }
  Object.defineProperty(globalThis, 'OfflineAudioContext', { configurable: true, value: Offline });
  for (const id of TRACK_IDS) { const out = await renderTrack(id, 8000); assert.ok(out.length > 8000 * 5, id + ' tem pelo menos 5 s'); }
});
