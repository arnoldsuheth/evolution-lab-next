"use client";
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { PREVIEW_HEROES, PREVIEW_MOVES, type Move } from '@/components/PreviewScene';

const Scene = dynamic(() => import('@/components/PreviewScene'), { ssr: false, loading: () => <p style={{ color: '#fff', padding: 24 }}>Carregando a prévia…</p> });

/** Prévia dos personagens e árvores novos (não faz parte do jogo). */
export default function Previa() {
  const [move, setMove] = useState<Move>('Idle_Loop');
  return <main style={{ position: 'fixed', inset: 0, background: '#0d1430', fontFamily: 'system-ui, sans-serif' }}>
    <Scene move={move} />
    <div style={{ position: 'absolute', top: 10, left: 10, right: 10, color: '#fff', textShadow: '0 1px 3px #000' }}>
      <b style={{ fontSize: 18 }}>Prévia · personagens e natureza novos</b>
      <div style={{ fontSize: 13, opacity: .9 }}>{PREVIEW_HEROES.map(h => h.name).join(' · ')} — arraste para girar, pinça para zoom</div>
    </div>
    <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', padding: '0 8px' }}>
      {(Object.keys(PREVIEW_MOVES) as Move[]).map(m => <button key={m} onClick={() => setMove(m)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2c27a', background: move === m ? '#e2c27a' : '#1b2550cc', color: move === m ? '#1b2550' : '#fff', fontWeight: 600 }}>{PREVIEW_MOVES[m]}</button>)}
    </div>
  </main>;
}
