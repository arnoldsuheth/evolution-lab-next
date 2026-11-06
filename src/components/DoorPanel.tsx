"use client";
import { useState } from 'react';
import { useGame } from '@/lib/store';
import { DOORS, type tryDoor } from '@/lib/dungeon';
import { adventureOf } from '@/lib/adventure';

/** Porta de código da masmorra: escreva, execute e a sala seguinte se abre. */
export default function DoorPanel({ id, close }: { id: string; close: () => void }) {
  const door = DOORS.find(d => d.id === id), open = useGame(s => adventureOf(s.hero).doors.includes(id));
  const [code, setCode] = useState(door?.starter ?? ''), [result, setResult] = useState<ReturnType<typeof tryDoor> | null>(null), [hint, setHint] = useState(false);
  if (!door) return null;
  return <div className="panel-body door-panel">
    <span className="eyebrow">SALA {door.room} DE 3 · PORTA DE CÓDIGO</span>
    <h3>{open ? '🔓' : '🔒'} {door.title}</h3>
    <p>{door.task}</p>
    <textarea className="code-editor" spellCheck={false} value={code} onChange={e => setCode(e.target.value)} aria-label="Código da porta" rows={8} />
    <div className="door-actions">
      <button className="primary" disabled={open} onClick={() => setResult(useGame.getState().openDoor(id, code))}>▶ Executar</button>
      <button onClick={() => setHint(true)}>💡 Dica</button>
      <button onClick={() => { setCode(door.starter); setResult(null); }}>↺ Recomeçar</button>
      {open && <button className="primary" onClick={close}>Entrar na sala →</button>}
    </div>
    {hint && <p className="small-note">💡 {door.hint}</p>}
    {result && <ul className="door-results">{result.results.map(r => <li key={r.label} className={r.passed ? 'stat-good' : 'stat-bad'}>{r.passed ? '✓' : '✗'} {r.label}: {r.message}</li>)}</ul>}
    {open && <p className="stat-good">A porta está aberta. Ela fica aberta para sempre.</p>}
  </div>;
}
