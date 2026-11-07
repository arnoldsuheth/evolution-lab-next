"use client";
import { useState } from 'react';
import { CONCEPTS } from '@/lib/apprentice';

/** "Pense assim": a ideia do tema com uma comparação do dia a dia, um exemplo e uma perguntinha de um clique. */
export default function ConceptCard({ concept, startOpen = true }: { concept?: string; startOpen?: boolean }) {
  const card = concept ? CONCEPTS[concept] : undefined, [pick, setPick] = useState<string | null>(null), [open, setOpen] = useState(startOpen);
  if (!card) return null;
  const right = pick === card.answer;
  return <section className={`concept-card ${open ? 'open' : ''}`}>
    <button type="button" className="concept-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
      <span className="concept-emoji" aria-hidden>{card.emoji}</span>
      <span><small>PENSE ASSIM</small><b>{card.title}</b></span>
      <i aria-hidden>{open ? '▾' : '▸'}</i>
    </button>
    {open && <div className="concept-body">
      <p>{card.idea}</p>
      <div className="concept-example"><code>{card.example}</code><span>→ {card.result}</span></div>
      <div className="concept-quiz">
        <p>🤔 {card.question}</p>
        <div>{card.options.map(o => <button key={o} type="button" className={pick === o ? (right ? 'right' : 'wrong') : ''} onClick={() => setPick(o)}>{o}</button>)}</div>
        {pick && <p className={`concept-answer ${right ? 'right' : 'wrong'}`} aria-live="polite">{right ? '✅ ' + card.right : '💡 ' + card.wrong}</p>}
      </div>
    </div>}
  </section>;
}
