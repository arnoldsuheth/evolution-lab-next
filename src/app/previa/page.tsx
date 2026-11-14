"use client";
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { TIER_NAMES, type Tier, PREVIEW_CLASSES, PREVIEW_HEROES, PREVIEW_MOVES, PREVIEW_RACES, PREVIEW_LOWPOLY, type Move } from '@/components/PreviewScene';

const Scene = dynamic(() => import('@/components/PreviewScene'), { ssr: false, loading: () => <p style={{ color: '#fff', padding: 24 }}>Carregando a prévia…</p> });

/** Prévia dos personagens e árvores novos (não faz parte do jogo). */
export default function Previa() {
  const [move, setMove] = useState<Move>('Idle_Loop'), [tier, setTier] = useState<Tier>(0), [classes, setClasses] = useState(() => typeof window !== 'undefined' && window.location.search.includes('classes'));
  return <main style={{ position: 'fixed', inset: 0, background: '#0d1430', fontFamily: 'system-ui, sans-serif' }}>
    <Scene move={move} classes={classes} tier={tier} />
    <div style={{ position: 'absolute', top: 10, left: 10, right: 10, color: '#fff', textShadow: '0 1px 3px #000' }}>
      <b style={{ fontSize: 18 }}>Prévia · personagens e natureza novos</b> <button onClick={() => setClasses(c => !c)} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2c27a', background: classes ? '#e2c27a' : '#1b2550cc', color: classes ? '#1b2550' : '#fff', fontWeight: 600 }}>{classes ? 'Ver as 3 fileiras' : 'Ver uma classe de cada (grátis)'}</button>
      <div style={{ fontSize: 13, opacity: .9 }}>{classes ? PREVIEW_CLASSES.map(c => `${c.name} (${c.race})`).join(' · ') + ' · Atrás: monstros Imp e Puglin — só com o grátis' : <>Meio: {PREVIEW_HEROES.map(h => h.name).join(' · ')} · Atrás: {PREVIEW_RACES.map(h => h.name).join(' · ')} · Na frente (grátis antigo): {PREVIEW_LOWPOLY.map(h => h.name).join(' · ')} — arraste para girar, pinça para zoom</>}</div>
    </div>
    {classes && <div style={{ position: 'absolute', bottom: 64, left: 0, right: 0, display: 'flex', gap: 6, justifyContent: 'center' }}>{TIER_NAMES.map((t, i) => <button key={t} onClick={() => setTier(i as Tier)} style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #9ad0ff', background: tier === i ? '#9ad0ff' : '#1b2550cc', color: tier === i ? '#1b2550' : '#fff', fontWeight: 700 }}>Equipamento {t}</button>)}</div>}
    <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', padding: '0 8px' }}>
      {(Object.keys(PREVIEW_MOVES) as Move[]).map(m => <button key={m} onClick={() => setMove(m)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2c27a', background: move === m ? '#e2c27a' : '#1b2550cc', color: move === m ? '#1b2550' : '#fff', fontWeight: 600 }}>{PREVIEW_MOVES[m]}</button>)}
    </div>
  </main>;
}
