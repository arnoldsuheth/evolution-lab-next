"use client";
import { useState } from 'react';
import { useGame } from '@/lib/store';
import { DOORS, type tryDoor } from '@/lib/dungeon';
import { adventureOf } from '@/lib/adventure';
import { DOOR_APPRENTICE } from '@/lib/apprentice';
import ApprenticeCode from './ApprenticeCode';

/** Porta de código da masmorra: monte com botões (ou digite) e a sala seguinte se abre. */
export default function DoorPanel({ id, close }: { id: string; close: () => void }) {
  const door = DOORS.find(d => d.id === id), open = useGame(s => adventureOf(s.hero).doors.includes(id));
  const [code, setCode] = useState(door?.starter ?? ''), [result, setResult] = useState<ReturnType<typeof tryDoor> | null>(null), [hint, setHint] = useState(false);
  const builder = DOOR_APPRENTICE[id], [typing, setTyping] = useState(false);
  if (!door) return null;
  const run = (c: string) => { const r = useGame.getState().openDoor(id, c); setResult(r); return r.passed; };
  return <div className="panel-body door-panel">
    <span className="eyebrow">SALA {door.room} DE 3 · PORTA DE CÓDIGO</span>
    <h3>{open ? '🔓' : '🔒'} {door.title}</h3>
    {builder && !typing ? <>
      <ApprenticeCode key={id} builder={builder} done={open} run={run} />
      <button className="quiet mode-toggle" onClick={() => setTyping(true)}>⌨ Prefiro digitar o código (Modo Desafio)</button>
    </> : <>
      {builder && <button className="quiet mode-toggle" onClick={() => setTyping(false)}>🧩 Voltar a montar com botões (Modo Aprendiz)</button>}
      <p>{door.task}</p>
      <textarea className="code-editor" spellCheck={false} value={code} onChange={e => setCode(e.target.value)} aria-label="Código da porta" rows={8} />
      <div className="door-actions">
        <button className="primary" disabled={open} onClick={() => run(code)}>▶ Executar</button>
        <button onClick={() => setHint(true)}>💡 Dica</button>
        <button onClick={() => { setCode(door.starter); setResult(null); }}>↺ Recomeçar</button>
      </div>
      {hint && <p className="small-note">💡 {door.hint}</p>}
    </>}
    {result && !result.passed && <ul className="door-results">{result.results.map(r => <li key={r.label} className={r.passed ? 'stat-good' : 'stat-bad'}>{r.passed ? '✓' : '✗'} {r.label}: {r.message}</li>)}</ul>}
    {open && <div className="spot-done"><p>🔓 A porta está aberta e fica aberta para sempre.</p><button className="primary" onClick={close}>Entrar na sala →</button></div>}
  </div>;
}
