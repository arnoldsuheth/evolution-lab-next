"use client";
import { useState } from "react";
import { useGame } from "@/lib/store";
import { LESSONS } from "@/lib/game";
import {
  BLITZ_PASS, BLITZ_SIZE, KIND_LABEL, LEVEL_LABEL, autoHint, battleConcepts, blitzReward, checkAnswer, correctText,
  dayKey, displayOptions, pickQuestions, type PracticeQuestion,
} from "@/lib/practice";

/** Uma pergunta do treino. Tudo por toque: escolher, completar, ordenar ou apontar a linha com erro. */
export function QuestionView({ q, showHint, onDone, compact = false }: { q: PracticeQuestion; showHint: boolean; onDone: (correct: boolean) => void; compact?: boolean }) {
  const [order] = useState(() => displayOptions(q));
  const [picked, setPicked] = useState<number[]>([]);
  const [answered, setAnswered] = useState<null | boolean>(null);
  const [hint, setHint] = useState(showHint);
  function answer(value: string | number | string[]) { if (answered !== null) return; const ok = checkAnswer(q, value); setAnswered(ok); }
  const blank = (line: string) => line.split("___").flatMap((part, i, all) => i < all.length - 1 ? [part, <mark key={i}>___</mark>] : [part]);
  return <div className={`practice-question kind-${q.kind} ${compact ? "compact" : ""}`}>
    <div className="practice-meta"><span className="practice-kind">{KIND_LABEL[q.kind]}</span><span className={`practice-level level-${q.level}`}>{LEVEL_LABEL[q.level]}</span></div>
    <p className="practice-prompt">{q.prompt}</p>
    {q.code && <pre className="practice-code">{q.code.map((line, i) => <code key={i}>{q.kind === "fill" ? blank(line) : line}</code>)}</pre>}
    {q.kind === "bug" && <div className="practice-lines" role="group" aria-label="Linhas do código">{order.map(i => <button key={i} disabled={answered !== null} className={answered !== null && i === q.answer ? "right" : ""} onClick={() => answer(i)}><small>Linha {i + 1}</small><code>{q.options[i]}</code></button>)}</div>}
    {q.kind === "order" && <>
      <ol className="practice-built" aria-label="Sua ordem">{picked.map((i, n) => <li key={n}><code>{q.options[i]}</code></li>)}{picked.length === 0 && <li className="empty">Toque nas linhas abaixo na ordem certa.</li>}</ol>
      {answered === null && <div className="practice-lines">{order.filter(i => !picked.includes(i)).map(i => <button key={i} onClick={() => { const next = [...picked, i]; setPicked(next); if (next.length === q.options.length) answer(next.map(n => q.options[n])); }}><code>{q.options[i]}</code></button>)}</div>}
      {answered === null && picked.length > 0 && <button className="quiet practice-undo" onClick={() => setPicked(picked.slice(0, -1))}>↶ Desfazer última</button>}
    </>}
    {(q.kind === "choice" || q.kind === "fill") && <div className="practice-options">{order.map(i => <button key={i} disabled={answered !== null} className={answered !== null && q.options[i] === q.answer ? "right" : ""} onClick={() => answer(q.options[i])}>{q.kind === "fill" ? <code>{q.options[i]}</code> : q.options[i]}</button>)}</div>}
    {answered === null ? (hint ? <p className="practice-hint">💡 {q.hint}</p> : <button className="quiet practice-hint-btn" onClick={() => setHint(true)}>💡 Ver pista</button>)
      : <div className={`practice-feedback ${answered ? "ok" : "miss"}`} aria-live="polite"><b>{answered ? "✓ Acertou!" : "○ Quase!"}</b>{!answered && <pre className="practice-answer">{correctText(q)}</pre>}<p>{q.explanation}</p><button className="primary" onClick={() => onDone(answered)}>{compact ? "Voltar à luta" : "Continuar →"}</button></div>}
  </div>;
}

/** A + D: missão relâmpago de 3 perguntas, no nível que o jogador alcançou nesta runa. */
export function PracticeCard({ concept, locked }: { concept: string; locked?: boolean }) {
  const mastery = useGame(s => s.education.practice?.[concept]);
  const now = useGame(s => s.now), claimedDay = useGame(s => s.education.blitz?.[concept]);
  const claimed = !!now && claimedDay === dayKey(now);
  const [run, setRun] = useState<null | { questions: PracticeQuestion[]; index: number; score: number; startLevel: number }>(null);
  const [summary, setSummary] = useState<null | { score: number; reward: { xp: number; gold: number } | null; from: number; to: number }>(null);
  const level = mastery?.level ?? 1, reward = blitzReward(level);
  const title = LESSONS.find(l => l.id === concept)?.concept ?? concept;
  if (locked) return null;
  function start() { setSummary(null); setRun({ questions: pickQuestions(concept, mastery, BLITZ_SIZE), index: 0, score: 0, startLevel: level }); }
  function next(correct: boolean) {
    if (!run) return; const g = useGame.getState(); g.practiceAnswer(concept, correct);
    const score = run.score + (correct ? 1 : 0);
    if (run.index + 1 < run.questions.length) { setRun({ ...run, index: run.index + 1, score }); return; }
    const got = g.finishBlitz(concept, score); setRun(null);
    setSummary({ score, reward: got, from: run.startLevel, to: useGame.getState().education.practice?.[concept]?.level ?? 1 });
  }
  if (run) { const q = run.questions[run.index]; return <section className="practice-card running" aria-label="Missão relâmpago"><header><b>⚡ Missão relâmpago · {title}</b><span>Pergunta {run.index + 1} de {run.questions.length}</span></header><div className="practice-progress">{run.questions.map((_, i) => <i key={i} className={i < run.index ? "done" : i === run.index ? "now" : ""} />)}</div><QuestionView key={q.id + run.index} q={q} showHint={autoHint(mastery)} onDone={next} /></section>; }
  return <section className="practice-card" aria-label="Missão relâmpago">
    <header><b>⚡ Missão relâmpago</b><span className={`practice-level level-${level}`}>Treino {LEVEL_LABEL[level]}</span></header>
    {summary ? <div className="practice-summary"><p><b>{summary.score} de {BLITZ_SIZE}</b> {summary.score >= BLITZ_PASS ? "Muito bem!" : "Faltou pouco."}{summary.reward ? ` +${summary.reward.xp} XP e +${summary.reward.gold} bronze.` : ""}</p>{summary.to !== summary.from && <p>{summary.to > summary.from ? `⬆ Seu treino subiu para ${LEVEL_LABEL[summary.to as 1 | 2 | 3]}.` : `⬇ O treino ficou ${LEVEL_LABEL[summary.to as 1 | 2 | 3]} para você firmar a base.`}</p>}</div>
      : <p>3 perguntas rápidas sobre {title}, cerca de 1 minuto. Escolher, completar, ordenar e achar o erro.</p>}
    <div className="practice-actions"><button className="primary" onClick={start}>{summary ? "Treinar de novo" : "Começar"}</button><small>{claimed ? "Recompensa de hoje já recebida · treino livre" : `Acerte ${BLITZ_PASS} de ${BLITZ_SIZE}: +${reward.xp} XP · +${reward.gold} bronze`}</small></div>
  </section>;
}

/** C: pergunta rápida no meio da luta. Acertar dá o Golpe do saber (+ataque por alguns segundos). */
export function BattleQuestion() {
  const completed = useGame(s => s.education.completed), practice = useGame(s => s.education.practice), ready = useGame(s => (s.cooldowns.insight ?? 0) <= s.now);
  const [q, setQ] = useState<PracticeQuestion | null>(null);
  function open() { const concepts = battleConcepts(completed), concept = concepts[Math.floor(Math.random() * concepts.length)]; setQ(pickQuestions(concept, practice?.[concept], 1)[0] ?? null); }
  function done(correct: boolean) { if (!q) return; const g = useGame.getState(); g.practiceAnswer(q.concept, correct); g.battleInsight(correct); setQ(null); }
  return <>
    <button className="combat-insight" disabled={!ready || !!q} onClick={open} aria-label="Pergunta de batalha: acerte para ganhar ataque" title="Pergunta de batalha">🧠</button>
    {q && <div className="battle-question" role="dialog" aria-label="Pergunta de batalha"><header><b>🧠 Pergunta de batalha</b><button className="quiet" aria-label="Fechar pergunta" onClick={() => setQ(null)}>×</button></header><QuestionView q={q} compact showHint={autoHint(practice?.[q.concept])} onDone={done} /></div>}
  </>;
}
