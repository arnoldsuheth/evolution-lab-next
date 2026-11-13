"use client";

import Image from 'next/image';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import MonsterModel from './MonsterModel';
import HeroPortrait from './HeroPortrait';
import { ITEMS } from '@/lib/game';
import { activeEquipment } from '@/lib/equipment';
import { useGame } from '@/lib/store';
import { lineSeconds, PROLOGUE, PROLOGUE_BOSSES, PROLOGUE_CITIES, PROLOGUE_SEEN_KEY, type PrologueVisual } from '@/lib/prologue';

/** Se algo do Prólogo falhar, ele fecha sozinho e o jogo continua (nunca derruba a tela). */
export class PrologueBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
/** Abre o Prólogo de qualquer lugar (ex.: Menu). */
export const PROLOGUE_EVENT = 'lovelace-prologue';
const SOUND_KEY = 'lovelace-prologo-som';
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Escolhe a melhor voz em português do aparelho (Brasil primeiro). */
function portugueseVoice() {
  const voices = typeof speechSynthesis === 'undefined' ? [] : speechSynthesis.getVoices();
  const br = voices.filter(v => /pt[-_]BR/i.test(v.lang)), pt = voices.filter(v => /^pt/i.test(v.lang));
  const pick = (list: SpeechSynthesisVoice[]) => list.find(v => /Luciana|Felipe|Francisca|Thalita|Google|Natural|Premium|Enhanced/i.test(v.name)) ?? list[0];
  return pick(br) ?? pick(pt) ?? null;
}

function stored(key: string, fallback: string) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
function store(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* sem armazenamento */ } }
export function prologueSeen() { return stored(PROLOGUE_SEEN_KEY, '') === '1'; }

/** Modelo 3D girando devagar, iluminado como no palco. */
function Spinner({ kind, boss, tone, size }: { kind: string; boss?: boolean; tone: string; size: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * .45; });
  return <>
    <ambientLight intensity={.35} /><directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffe2b0" /><pointLight position={[-3, 2, -2]} intensity={14} color={tone} distance={12} />
    <group ref={g} position={[0, -1.1, 0]} scale={size}><MonsterModel kind={kind as never} boss={boss} shadow={false} /></group>
  </>;
}
function Stage3D({ kind, boss, tone, size = 1 }: { kind: string; boss?: boolean; tone: string; size?: number }) {
  return <div className="pro-stage3d"><Canvas dpr={[1, 1.6]} camera={{ position: [0, 1.2, 6.2], fov: 38 }} gl={{ alpha: true, antialias: true }}><Spinner kind={kind} boss={boss} tone={tone} size={size} /></Canvas></div>;
}

function Visual({ visual, sceneTime }: { visual: PrologueVisual; sceneTime: number }) {
  const hero = useGame(s => s.hero), look = useGame(s => s.look);
  switch (visual) {
    case 'logo': case 'end': return <div className={`pro-logo ${visual === 'end' ? 'pro-logo-end' : ''}`}><i className="pro-ring pro-ring-a" /><i className="pro-ring pro-ring-b" /><span className="pro-logo-crop"><Image src={base + '/lovelace-identidade.jpeg'} width={1536} height={1024} alt="Lovelace Kingdom" unoptimized priority /></span></div>;
    case 'loom': return <div className="pro-loom" aria-hidden="true">{Array.from({ length: 6 }, (_, r) => <div key={r} className="pro-card" style={{ animationDelay: `${r * .45}s` }}>{Array.from({ length: 12 }, (_, c) => <i key={c} className={(r * 7 + c * 3) % 4 === 0 ? 'on' : ''} style={{ animationDelay: `${r * .45 + c * .12}s` }} />)}</div>)}<div className="pro-threads" /></div>;
    case 'engine': return <div className="pro-engine" aria-hidden="true"><i className="pro-gear pro-gear-a" /><i className="pro-gear pro-gear-b" /><i className="pro-gear pro-gear-c" /><pre className="pro-note">{'Nota G · 1843\nV1 ← 1\nV2 ← n\nB ← ∑ (A₀ … Aₙ)\n→ números de Bernoulli'}</pre><b className="pro-ada">Ada Lovelace</b></div>;
    case 'runes': return <div className="pro-runes" aria-hidden="true">{['1', '0', '∧', '∨', '¬', '⊕', '→', '≡'].map((g, i) => <span key={i} style={{ animationDelay: `${i * .35}s` }}>{g}</span>)}</div>;
    case 'void': return <div className="pro-void"><div className="pro-nulls" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * .27) % 3}s` }}>null</span>)}</div><Stage3D kind="dragon" boss tone="#b0204a" size={.55} /></div>;
    case 'cities': return <div className="pro-cities">{PROLOGUE_CITIES.map((c, i) => <div key={c.name} className="pro-city" style={{ animationDelay: `${i * 1.1}s`, background: `linear-gradient(160deg, ${c.color}, #0b1020 85%)` }}><b>{c.name}</b><small>{c.people}</small></div>)}<div className="pro-city pro-citadel"><b>Cidadela do Conhecimento</b><small>O centro do reino</small></div></div>;
    case 'masters': return <div className="pro-masters">{[['Pascal', '1642 · a Pascalina, a primeira calculadora mecânica'], ['Zuse', '1941 · o Z3, primeiro computador programável'], ['Boole', '1854 · a lógica do verdadeiro e do falso']].map(([n, t], i) => <div key={n} className="pro-master" style={{ animationDelay: `${i * 1.2}s` }}><b>{n}</b><small>{t}</small></div>)}</div>;
    case 'bosses': { const b = PROLOGUE_BOSSES[Math.floor(Math.max(0, sceneTime) / 2.8) % PROLOGUE_BOSSES.length] ?? PROLOGUE_BOSSES[0]; return <div className="pro-bosses"><Stage3D kind={b.kind} boss tone="#e0a040" size={.85} /><div key={b.name} className="pro-boss-name"><b>{b.name}</b><small>{b.title}</small></div></div>; }
    case 'heart': return <div className="pro-heart"><i className="pro-vortex" aria-hidden="true" /><Stage3D kind="dragon" boss tone="#7d45ff" size={.55} /></div>;
    case 'hero': return <div className="pro-hero">{hero.classId ? <HeroPortrait selection classId={hero.classId} race={hero.race} look={look} equipped={activeEquipment(hero, ITEMS).map(i => i.id)} level={hero.level} /> : null}<b>{hero.name || 'Herói'}</b></div>;
  }
}

export default function Prologue({ onClose }: { onClose: () => void }) {
  const [started, setStarted] = useState(false), [scene, setScene] = useState(0), [line, setLine] = useState(0), [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(() => stored(SOUND_KEY, '1') === '1'), [sceneStart, setSceneStart] = useState(0), [clock, setClock] = useState(0);
  const token = useRef(0);
  const current = PROLOGUE[scene], text = current.lines[line], last = scene === PROLOGUE.length - 1;

  const close = useCallback(() => { token.current++; if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); store(PROLOGUE_SEEN_KEY, '1'); onClose(); }, [onClose]);
  const advance = useCallback(() => {
    if (line + 1 < current.lines.length) { setLine(line + 1); return; }
    if (!last) { setScene(scene + 1); setLine(0); setSceneStart(Date.now()); }
  }, [line, current.lines.length, last, scene]);

  // Fala a linha atual; ao terminar (ou pelo tempo de leitura, se não houver voz), passa para a próxima.
  useEffect(() => {
    if (!started || paused) return;
    // Cada fala fica na tela pelo menos ~75% do tempo de leitura, mesmo que a voz termine antes (ou falhe na hora).
    const id = ++token.current, reading = lineSeconds(text) * 1000, startedAt = Date.now();
    const done = () => { if (token.current !== id) return; const wait = Math.max(450, reading * .75 - (Date.now() - startedAt)); window.setTimeout(() => token.current === id && advance(), wait); };
    let safety = window.setTimeout(done, reading);
    const synth = typeof speechSynthesis === 'undefined' ? null : speechSynthesis;
    const voice = synth ? portugueseVoice() : null;
    if (sound && synth && voice) { // sem voz em português no aparelho: só legenda, no tempo de leitura
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-BR'; u.rate = .96; u.pitch = .92;
      u.voice = voice;
      u.onend = done; u.onerror = done;
      window.clearTimeout(safety); safety = window.setTimeout(done, reading * 2.2 + 2500); // se o aparelho não avisar o fim da fala
      synth.speak(u);
    }
    return () => { window.clearTimeout(safety); synth?.cancel(); };
  }, [started, paused, sound, text, advance]);

  // Relógio da cena (para a troca dos chefes) e tecla Esc para pular.
  useEffect(() => { if (!started) return; const t = window.setInterval(() => setClock(Date.now()), 250); return () => window.clearInterval(t); }, [started]);
  useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [close]);

  const toggleSound = () => { const next = !sound; setSound(next); store(SOUND_KEY, next ? '1' : '0'); if (!next && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); };
  const begin = () => { setStarted(true); setSceneStart(Date.now()); setClock(Date.now()); };

  return <div className="prologue" role="dialog" aria-modal="true" aria-label="Prólogo do Lovelace Kingdom">
    {!started ? <div className="pro-gate">
      <Image src={base + '/lovelace-identidade.jpeg'} width={1536} height={1024} alt="" aria-hidden="true" unoptimized priority />
      <p className="pro-kicker">PRÓLOGO</p><h2>O Código Perdido</h2>
      <button className="pro-play" onClick={begin}><span aria-hidden="true">▶</span> Assistir</button>
      <p className="pro-tip">Narrado e legendado · cerca de 2 minutos</p>
      <button className="pro-skip-link" onClick={close}>Pular e jogar</button>
    </div> : <>
      <div key={current.id} className={`pro-scene pro-${current.visual}-scene`}>
        <Visual visual={current.visual} sceneTime={(clock - sceneStart) / 1000} />
        {current.title && <p className="pro-title">{current.title}</p>}
      </div>
      <p key={current.id + line} className="pro-subtitle" aria-live="polite">{text}</p>
      <div className="pro-controls">
        <button onClick={() => setPaused(!paused)} aria-label={paused ? 'Continuar' : 'Pausar'}>{paused ? '▶' : '❚❚'}</button>
        <button onClick={toggleSound} aria-label={sound ? 'Desligar narração' : 'Ligar narração'} aria-pressed={sound}>{sound ? '🔊' : '🔇'}</button>
        <span className="pro-progress" aria-hidden="true"><i style={{ width: `${(scene + (line + 1) / current.lines.length) / PROLOGUE.length * 100}%` }} /></span>
        {last ? <button className="pro-enter" onClick={close}>Entrar no Reino</button> : <button className="pro-skip" onClick={close}>Pular ⏭</button>}
      </div>
    </>}
  </div>;
}
