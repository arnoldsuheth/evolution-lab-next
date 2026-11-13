/** 5.0: trilhas originais do Lovelace, geradas no próprio aparelho (nada é baixado). Uma por região/momento + combate. */
export type TrackId = 'cidade' | 'floresta' | 'chuva' | 'deserto' | 'neve' | 'noite' | 'misterio' | 'celestial' | 'combate';

type Voice = OscillatorType;
type Spec = {
  bpm: number; steps: number; // 32 passos = 4 compassos de 8
  chords: number[][]; // um acorde por 8 passos (notas MIDI)
  melody: number[]; // 0 = pausa
  lead: Voice; pad: Voice; arp?: number[]; // arpejo: índices do acorde por passo
  drums?: { kick: number[]; snare: number[]; hat: number[] }; // passos com batida
  drone?: number; bright: number; // corte do filtro (Hz)
};

const minor = (root: number) => [root, root + 7, root + 12, root + 15];
const major = (root: number) => [root, root + 7, root + 12, root + 16];
const SPECS: Record<Exclude<TrackId, 'cidade'>, Spec> = {
  // Floresta: flauta pentatônica tranquila, arpejo leve.
  floresta: { bpm: 74, steps: 32, chords: [major(48), major(53), minor(45), major(55)], melody: [72, 0, 74, 76, 0, 79, 76, 0, 74, 0, 72, 69, 0, 72, 0, 0, 76, 0, 79, 81, 79, 76, 0, 74, 72, 0, 74, 0, 69, 0, 72, 0], lead: 'sine', pad: 'triangle', arp: [0, 2, 1, 3], bright: 2200 },
  // Chuva: mais lenta e em menor, notas espaçadas.
  chuva: { bpm: 58, steps: 32, chords: [minor(45), major(41), major(48), major(43)], melody: [69, 0, 0, 72, 0, 0, 71, 0, 69, 0, 0, 0, 65, 0, 67, 0, 69, 0, 0, 74, 0, 72, 0, 0, 71, 0, 69, 0, 0, 0, 0, 0], lead: 'sine', pad: 'sine', bright: 1500 },
  // Deserto / Ogrimmar: tambores tribais e escala frígia sobre um bordão grave.
  deserto: { bpm: 96, steps: 32, chords: [minor(40), [41, 48, 53, 56], minor(40), [38, 45, 50, 53]], melody: [64, 0, 65, 0, 68, 67, 65, 0, 64, 0, 0, 62, 64, 0, 0, 0, 67, 0, 68, 0, 71, 0, 68, 67, 65, 0, 64, 0, 65, 64, 62, 0], lead: 'sawtooth', pad: 'triangle', drums: { kick: [0, 6, 8, 14, 16, 22, 24, 30], snare: [4, 12, 20, 28], hat: [] }, drone: 28, bright: 1300 },
  // Neve / Iron Forge: sinos esparsos e acordes abertos.
  neve: { bpm: 64, steps: 32, chords: [[50, 57, 64, 69], [48, 55, 62, 67], [45, 52, 59, 64], [47, 54, 61, 66]], melody: [81, 0, 0, 79, 0, 0, 76, 0, 0, 0, 74, 0, 76, 0, 0, 0, 79, 0, 0, 81, 0, 83, 0, 0, 81, 0, 0, 0, 76, 0, 0, 0], lead: 'triangle', pad: 'sine', arp: [3, 2, 1, 2], bright: 3200 },
  // Noite: almofadas suaves, quase sem melodia.
  noite: { bpm: 52, steps: 32, chords: [minor(45), [41, 48, 53, 57], [43, 50, 55, 59], minor(40)], melody: [0, 0, 76, 0, 0, 0, 74, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 74, 0, 0, 0, 72, 0, 71, 0, 0, 0, 0, 0, 0, 0], lead: 'sine', pad: 'sine', bright: 1200 },
  // Mistério / Ruínas e Coração: tons inteiros, arcano.
  misterio: { bpm: 60, steps: 32, chords: [[48, 54, 58, 64], [50, 56, 60, 66], [46, 52, 56, 62], [48, 54, 58, 64]], melody: [72, 0, 0, 78, 0, 76, 0, 0, 74, 0, 0, 0, 70, 0, 72, 0, 0, 0, 78, 0, 80, 0, 0, 76, 0, 0, 74, 0, 0, 0, 0, 0], lead: 'triangle', pad: 'sine', drone: 36, bright: 1700 },
  // Goddard: celestial, arpejos brilhantes em maior.
  celestial: { bpm: 84, steps: 32, chords: [major(52), major(57), [54, 61, 66, 69], major(59)], melody: [76, 0, 80, 83, 0, 88, 0, 0, 85, 0, 83, 0, 81, 0, 0, 0, 80, 0, 81, 83, 0, 85, 88, 0, 87, 0, 0, 83, 0, 0, 0, 0], lead: 'sine', pad: 'triangle', arp: [0, 1, 2, 3, 2, 1], bright: 4200 },
  // Combate: rápido, bumbo e caixa, baixo marcado em menor.
  combate: { bpm: 132, steps: 32, chords: [minor(45), [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 56]], melody: [69, 0, 72, 0, 76, 74, 72, 0, 69, 0, 72, 74, 76, 0, 77, 76, 74, 0, 72, 0, 71, 72, 74, 0, 76, 0, 74, 72, 71, 0, 68, 0], lead: 'square', pad: 'sawtooth', arp: [0, 0, 2, 0, 1, 0, 2, 3], drums: { kick: [0, 3, 8, 11, 16, 19, 24, 27, 30], snare: [4, 12, 20, 28], hat: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30] }, drone: 33, bright: 2600 },
};

/** Escolhe a trilha pelo momento: combate vence tudo; depois chuva e noite; depois a região. */
export function trackFor({ region, night, raining, combat, instance }: { region: string; night: boolean; raining: boolean; combat: boolean; instance?: boolean }): TrackId {
  if (combat) return 'combate';
  if (instance || region === 'heart' || region === 'ruins') return 'misterio';
  if (region === 'goddard') return 'celestial';
  if (raining) return 'chuva';
  if (night) return 'noite';
  if (region === 'bosque' || region === 'frontier' || region === 'gnomolandia') return 'floresta';
  if (region === 'ogrimmar') return 'deserto';
  if (region === 'iron-forge') return 'neve';
  return 'cidade';
}

export const TRACK_IDS = Object.keys(SPECS) as Exclude<TrackId, 'cidade'>[];

/** Gera a trilha uma vez fora da tela (OfflineAudioContext) e devolve um laço contínuo. */
export async function renderTrack(id: Exclude<TrackId, 'cidade'>, sampleRate: number): Promise<AudioBuffer> {
  const spec = SPECS[id], beat = 60 / spec.bpm / 2, period = spec.steps * beat, tail = 4, length = Math.ceil((period + tail) * sampleRate);
  const ctx = new OfflineAudioContext(1, length, sampleRate);
  const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
  const tone = (midi: number, start: number, dur: number, level: number, type: Voice, cutoff = spec.bright) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(hz(midi), start); f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(level, start + Math.min(.08, dur * .2)); g.gain.exponentialRampToValueAtTime(.0001, start + dur);
    o.connect(f); f.connect(g); g.connect(ctx.destination); o.start(start); o.stop(start + dur + .05);
  };
  const noise = ctx.createBuffer(1, Math.ceil(sampleRate * .3), sampleRate), nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.sin(i * 12.9898) * 43758.5453 % 1; // ruído fixo (mesmo resultado sempre)
  const hit = (start: number, level: number, freq: number, dur: number, type: BiquadFilterType) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(level, start); g.gain.exponentialRampToValueAtTime(.0001, start + dur); s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(start); s.stop(start + dur + .02);
  };
  for (let step = 0; step < spec.steps; step++) {
    const at = step * beat, chord = spec.chords[Math.floor(step / 8) % spec.chords.length];
    if (step % 8 === 0) chord.forEach((m, i) => tone(m, at + i * .03, beat * 8.4, .05, spec.pad, 1200));
    if (spec.drone !== undefined && step % 8 === 0) tone(spec.drone, at, beat * 8.2, .07, 'sine', 400);
    if (spec.arp) tone(chord[spec.arp[step % spec.arp.length]] + 12, at, beat * 1.2, .035, 'triangle');
    if (spec.melody[step]) tone(spec.melody[step], at, beat * 2.4, .07, spec.lead);
    if (spec.drums) {
      if (spec.drums.kick.includes(step)) { tone(36, at, .22, .22, 'sine', 300); hit(at, .05, 120, .08, 'lowpass'); }
      if (spec.drums.snare.includes(step)) hit(at, .12, 1800, .16, 'bandpass');
      if (spec.drums.hat.includes(step)) hit(at, .03, 7000, .04, 'highpass');
    }
  }
  const rendered = await ctx.startRendering(), frames = Math.floor(period * sampleRate), out = ctx.createBuffer(1, frames, sampleRate), src = rendered.getChannelData(0), dst = out.getChannelData(0);
  dst.set(src.subarray(0, frames)); for (let i = frames; i < src.length; i++) dst[(i - frames) % frames] += src[i]; // o final volta para o começo: laço sem emenda
  return out;
}
