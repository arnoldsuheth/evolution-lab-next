import { PRECURSOR_IDS, PRECURSORS, type PrecursorId } from '@/lib/precursorCatalog';
import { useState } from 'react';
import { useGame } from '@/lib/store';
import { CHAMBER_CHALLENGE, cleanLovelaceProgress, hasAllArtifacts, LOVELACE_QUESTS } from '@/lib/precursors';

export default function LovelacePanel() {
  const progress = useGame(s => cleanLovelaceProgress(s.hero.lovelaceProgress));
  const quest = LOVELACE_QUESTS[progress];
  return <section className="panel-body precursor-panel">
    <p className="eyebrow">O Legado dos Precursores · {progress} de {LOVELACE_QUESTS.length} missões</p>
    <p>“O conhecimento do reino foi dividido em dez artefatos. Para recuperar o primeiro, precisamos ensinar o leitor da biblioteca a seguir instruções.”</p>
    {quest ? <LovelaceChallenge key={progress} step={progress} quest={quest} /> : <LovelaceArtifact />}
    <LovelaceHistory />
  </section>;
}

export function PrecursorCodex() {
  const hero = useGame(s => s.hero);
  const progress = cleanLovelaceProgress(hero.lovelaceProgress);
  const count = Number(progress === LOVELACE_QUESTS.length) + PRECURSOR_IDS.filter(id => hero.precursorProgress?.[id] === PRECURSORS[id].quests.length).length;
  return <section className="panel-body precursor-panel">
    <p className="eyebrow">O Legado dos Precursores · Códice · {count} de 10 artefatos</p>
    <h3>Lovelace · Guardiã dos Códigos</h3>
    <p>{progress} de {LOVELACE_QUESTS.length} missões concluídas</p>
    <ol>{LOVELACE_QUESTS.map((quest, index) => <li key={quest.title}>
      <strong>{quest.title}</strong> · {index < progress ? quest.concept + ' praticado' : index === progress ? 'Disponível com Lovelace' : 'Bloqueada'}
    </li>)}</ol>
    {progress === LOVELACE_QUESTS.length && <LovelaceArtifact />}
    {PRECURSOR_IDS.map(id => {
      const entry = PRECURSORS[id];
      const completed = hero.precursorProgress?.[id] ?? 0;
      return <details key={id}>
        <summary>{entry.name} · {completed}/{entry.quests.length} · {entry.sector}</summary>
        <p>{entry.history} <a href={entry.source}>Fonte histórica</a></p>
        <ol>{entry.quests.map((quest, step) => <li key={quest.title}>{quest.title} · {step < completed ? 'Concluída' : step === completed ? 'Disponível' : 'Bloqueada'}</li>)}</ol>
        <p>{entry.artifact} · {completed === entry.quests.length ? 'Recuperado' : 'Pendente'}</p>
      </details>;
    })}
    <details>
      <summary>Linha do tempo dos precursores</summary>
      <ol>{[...PRECURSOR_IDS.map(id => PRECURSORS[id]), { year: 1843, name: 'Lovelace' }]
        .sort((left, right) => left.year - right.year)
        .map(({ year, name }) => <li key={name}>{year} · {name}</li>)}</ol>
    </details>
    <p>{hero.chamberComplete ? 'Câmara restaurada · Guardião dos Dez Artefatos' : count === 10 ? 'Câmara aberta · procure o portal no setor norte' : 'A Câmara abre com os dez artefatos.'}</p>
    <LovelaceHistory />
  </section>;
}

function LovelaceArtifact() {
  return <div className="quest-task">
      <svg width="76" height="64" viewBox="0 0 76 64" role="img" aria-label="Livro dourado com uma runa ciano">
        <path d="M8 14c10-4 20-3 30 4 10-7 20-8 30-4v36c-11-4-21-2-30 5-9-7-19-9-30-5z" fill="#352059" stroke="#e1b85f" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M38 18v37M15 23c5-1 10 0 15 3m-15 5c5-1 10 0 15 3m-15 5c5-1 10 0 15 3" fill="none" stroke="#e1b85f" strokeWidth="2" strokeLinecap="round"/>
        <path d="m53 23 6 8-6 8-6-8z" fill="#38dded"/>
      </svg><h3>Códice de Lovelace</h3>
      <p>Primeiro artefato recuperado. Conquista registrada · Guardião do Primeiro Código.</p>
    </div>;
}

function LovelaceHistory() {
  return <details>
      <summary>Registro histórico · Ada Lovelace</summary>
      <p>Em 1843, Lovelace publicou sua tradução do texto de Luigi Menabrea sobre a Máquina Analítica de Charles Babbage. Sua Nota G inclui uma tabela de cálculo dos números de Bernoulli.</p>
      <a href="https://www.computerhistory.org/babbage/adalovelace">Computer History Museum</a>
    </details>;
}

function LovelaceChallenge({ step, quest }: { step: number; quest: typeof LOVELACE_QUESTS[number] }) {
  const [code, setCode] = useState('starter' in quest ? String(quest.starter) : '');
  const [feedback, setFeedback] = useState<string | null>(null);
  const submit = (answer: string | number) => setFeedback(useGame.getState().submitLovelace(step, answer));
  return <div className="quest-task precursor-challenge">
    <small>{quest.concept}</small>
    <h3>{quest.title}</h3>
    <p>{quest.task}</p>
    {'choices' in quest ? <div className="precursor-options">
      {quest.choices.map((choice, index) => <button key={choice} onClick={() => submit(index)}>{choice}</button>)}
    </div> : <>
      <label htmlFor="precursor-code">Código da runa</label>
      <textarea id="precursor-code" className="code-editor" rows={4} maxLength={2400} spellCheck={false} value={code} onChange={event => setCode(event.target.value)} />
      <button className="primary" onClick={() => submit(code)}>Testar instruções</button>
    </>}
    <p role="status">{feedback}</p>
  </div>;
}

export function PrecursorPanel({ id }: { id: PrecursorId }) {
  const current = useGame(s => s.hero.precursorProgress?.[id] ?? 0);
  const entry = PRECURSORS[id];
  const quest = entry.quests[current];
  return <section className="panel-body precursor-panel">
    <p className="eyebrow">{entry.sector} · {current}/{entry.quests.length}</p>
    <p>{entry.history} <a href={entry.source}>Fonte histórica</a></p>
    {quest ? <ChoiceTrial key={current} trial={quest} submit={answer => useGame.getState().submitPrecursor(id, current, answer)} />
      : <div className="quest-task"><h3>{entry.artifact}</h3><p>Artefato registrado no Códice deste personagem.</p></div>}
  </section>;
}

export function ChamberPanel() {
  const unlocked = useGame(s => hasAllArtifacts(s.hero));
  const complete = useGame(s => s.hero.chamberComplete);
  return <section className="panel-body precursor-panel">
    <p className="eyebrow">Portal dos Dez Artefatos</p>
    {!unlocked ? <p>Recupere os dez artefatos e volte ao portal. O Códice mostra o progresso de cada precursor.</p> : <>
      <h3>Acervo da Câmara</h3>
      <ul><li>Códice de Lovelace</li>{PRECURSOR_IDS.map(id => <li key={id}>{PRECURSORS[id].artifact}</li>)}</ul>
      {complete ? <p>Conquista registrada · o título Guardião dos Dez Artefatos aparece acima do personagem.</p>
        : <ChoiceTrial trial={CHAMBER_CHALLENGE} submit={answer => useGame.getState().submitChamber(answer)} />}
    </>}
  </section>;
}

function ChoiceTrial({ trial, submit }: { trial: { title?: string; task: string; choices: readonly string[] }; submit: (answer: number) => string | null }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  return <div className="quest-task precursor-challenge">
    {trial.title && <h3>{trial.title}</h3>}
    <p>{trial.task}</p>
    <div className="precursor-options">{trial.choices.map((choice, index) =>
      <button key={choice} onClick={() => setFeedback(submit(index))}>{choice}</button>)}</div>
    <p role="status">{feedback}</p>
  </div>;
}
