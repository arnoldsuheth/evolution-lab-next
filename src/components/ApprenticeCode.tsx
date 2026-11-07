"use client";
import { Fragment, useState } from 'react';
import { answers, checkPicks, fillCode, meaningOf, type Builder } from '@/lib/apprentice';

/**
 * Código montado com botões: toque numa lacuna e escolha a peça. Errou? A explicação aparece
 * na hora, em português simples. Depois de 2 erros, "Me mostra como" monta e explica tudo.
 */
export default function ApprenticeCode({ builder, run, done = false, locked = '' }: { builder: Builder; run: (code: string) => boolean; done?: boolean; locked?: string }) {
  const [picks, setPicks] = useState<(string | null)[]>(() => builder.blanks.map(() => null));
  const [active, setActive] = useState(0), [fails, setFails] = useState(0), [notes, setNotes] = useState<string[]>([]), [shown, setShown] = useState(false), [passed, setPassed] = useState(false);
  const lines = builder.code.split('\n');
  function pick(option: string) {
    const next = picks.map((p, i) => i === active ? option : p); setPicks(next); setNotes([]);
    const empty = next.findIndex(p => !p); if (empty >= 0) setActive(empty);
  }
  function execute() {
    const check = checkPicks(builder, picks);
    if (!check.complete) { setActive(check.missing[0]); setNotes(['Ainda falta preencher a lacuna destacada.']); return; }
    if (!check.ok) { setFails(f => f + 1); setNotes(check.wrong.map(w => w.message)); setActive(check.wrong[0].index); return; }
    const ok = run(fillCode(builder, picks)); setPassed(ok); if (ok) setShown(true); // acertou: mostra o que cada linha faz
    setNotes(ok ? [] : ['O código está certo, mas algo impediu a execução. Veja a mensagem abaixo.']);
  }
  function showMe() { setPicks(answers(builder)); setShown(true); setNotes([]); }
  return <div className="apprentice">
    <p className="apprentice-goal"><b>Objetivo</b>{builder.simple}</p>
    {!passed && !done && <p className="apprentice-how">👉 Toque no <b>?</b> e escolha a peça que completa. Embaixo de cada peça está o que ela quer dizer.</p>}
    {builder.words && <div className="apprentice-words">{builder.words.map(([w, m]) => <span key={w}><code>{w}</code>{m}</span>)}</div>}
    <pre className="apprentice-code" aria-label="Código com lacunas">{lines.map((line, li) => <div key={li} className="apprentice-line"><span className="ln">{li + 1}</span><span>{line.split(/(\{\d+\})/).map((part, pi) => {
      const m = part.match(/^\{(\d+)\}$/); if (!m) return <Fragment key={pi}>{part}</Fragment>;
      const i = Number(m[1]), wrong = picks[i] && notes.length > 0 && picks[i] !== builder.blanks[i].answer;
      return <button key={pi} type="button" className={`slot ${active === i ? 'active' : ''} ${picks[i] ? 'filled' : ''} ${wrong ? 'wrong' : ''}`} onClick={() => setActive(i)} aria-label={`Lacuna ${i + 1}${picks[i] ? ': ' + picks[i] : ''}`}>{picks[i] ?? '?'}</button>;
    })}</span>{shown && builder.explain[li] && <small className="explain">{builder.explain[li]}</small>}</div>)}</pre>
    {!passed && !done && <div className="apprentice-options" role="group" aria-label={`Peças para a lacuna ${active + 1}`}><small>Lacuna {active + 1}: escolha uma peça</small><div>{builder.blanks[active].options.map(o => <button key={o} type="button" className={picks[active] === o ? 'chosen' : ''} onClick={() => pick(o)}><code>{o}</code>{meaningOf(o) && <small>{meaningOf(o)}</small>}</button>)}</div></div>}
    {notes.length > 0 && <div className="apprentice-notes" aria-live="polite">{notes.map((n, i) => <p key={i}>💡 {n}</p>)}</div>}
    {locked && <p className="apprentice-locked">🔒 {locked}</p>}
    <div className="apprentice-actions">
      <button className="primary" disabled={!!locked || passed || done} onClick={execute}>▶ Executar</button>
      {fails >= 2 && !shown && !passed && <button className="quiet" onClick={showMe}>🪄 Me mostra como</button>}
      {!passed && <button className="quiet" onClick={() => { setPicks(builder.blanks.map(() => null)); setActive(0); setNotes([]); setShown(false); }}>↺ Limpar</button>}
    </div>
    {shown && !passed && <p className="small-note">Montei para você e expliquei cada linha. Leia com calma e aperte ▶ Executar.</p>}
    {passed && <p className="apprentice-learned">✅ Funcionou! Leia em verde o que cada linha faz: é isso que você acabou de aprender.</p>}
  </div>;
}
