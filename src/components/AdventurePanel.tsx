"use client";
import { useState } from 'react';
import { useGame, currentAdventure } from '@/lib/store';
import { ACHIEVEMENTS, DAILY_POOL, FACTIONS, PETS, REP_LEVELS, REP_MAX, REP_PETS, SPECS, SPEC_LEVEL, dailyReward, repPercent, repRank, specChangeCost, unlockedPets, type Faction, type PetId } from '@/lib/adventure';
import Currency from './Currency';

const TABS = [['daily', '☀', 'Do dia'], ['feats', '🏆', 'Conquistas'], ['rep', '♥', 'Reputação'], ['spec', '✦', 'Especialização'], ['pets', '🐾', 'Mascotes']] as const;
type Tab = typeof TABS[number][0];
const PET_ICON: Record<PetId, string> = { boar: '🐗', spider: '🕷', wolf: '🐺', golem: '🪨', wraith: '👻', dragon: '🐉' };

/** Painel único das novidades da 1.10: botões grandes e pouco texto. */
export default function AdventurePanel({ initial = 'daily' }: { initial?: Tab }) {
  const hero = useGame(s => s.hero), completed = useGame(s => s.education.completed), [tab, setTab] = useState<Tab>(initial), adv = currentAdventure({ hero, education: { completed } }), reward = dailyReward(hero.level);
  return <div className="panel-body adventure-panel">
    <div className="tabs adventure-tabs">{TABS.map(([id, icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><span aria-hidden>{icon}</span> {label}</button>)}</div>

    {tab === 'daily' && <section className="adventure-list">
      <p className="small-note">Novas tarefas todo dia à meia-noite. Cada uma: +{reward.xp} XP · <Currency value={reward.gold} /> · +{reward.rep} reputação.</p>
      {adv.daily.ids.map((id, i) => { const t = DAILY_POOL.find(t => t.id === id)!, done = adv.daily.progress[i] >= t.count, claimed = adv.daily.claimed[i];
        return <article key={id} className={`adventure-card ${claimed ? 'claimed' : done ? 'ready' : ''}`}>
          <span className="adventure-icon" aria-hidden>{t.type === 'code' ? '◈' : t.type === 'collect' ? '❀' : '⚔'}</span>
          <div><b>{t.label}</b><div className="adventure-meter" role="progressbar" aria-valuemin={0} aria-valuemax={t.count} aria-valuenow={adv.daily.progress[i]}><i style={{ width: `${Math.min(100, adv.daily.progress[i] / t.count * 100)}%` }} /><span>{Math.min(adv.daily.progress[i], t.count)} / {t.count}</span></div><small>{FACTIONS[t.faction].name}</small></div>
          <button className="primary" disabled={!done || claimed || hero.dead} onClick={() => useGame.getState().claimDaily(i)}>{claimed ? '✓' : 'Receber'}</button>
        </article>; })}
    </section>}

    {tab === 'feats' && <section className="adventure-grid">
      {ACHIEVEMENTS.map(a => { const got = adv.achievements.includes(a.id), worn = adv.title === a.id;
        return <button key={a.id} className={`feat ${got ? 'got' : ''} ${worn ? 'worn' : ''}`} disabled={!got} onClick={() => useGame.getState().setTitle(worn ? '' : a.id)} title={got ? (worn ? 'Tirar título' : 'Usar este título') : a.goal}>
          <span aria-hidden>{got ? '🏆' : '🔒'}</span><b>{a.name}</b><small>{a.goal}</small><em>{got ? (worn ? '✓ título em uso' : `Título: ${a.title}`) : a.pet ? `Mascote: ${PETS[a.pet]}` : `Título: ${a.title}`}</em>
        </button>; })}
    </section>}

    {tab === 'rep' && <section className="adventure-list">
      {(Object.keys(FACTIONS) as Faction[]).map(f => { const points = adv.rep[f], rank = repRank(points), next = REP_LEVELS[rank + 1];
        return <article key={f} className="adventure-card">
          <span className="adventure-icon" aria-hidden>{f === 'mercadores' ? '⚖' : f === 'ferreiros' ? '⚒' : '✧'}</span>
          <div><b>{FACTIONS[f].name} · {REP_LEVELS[rank].name}</b><div className="adventure-meter rep"><i style={{ width: `${next ? (points - REP_LEVELS[rank].min) / (next.min - REP_LEVELS[rank].min) * 100 : 100}%` }} /><span>{points} / {next?.min ?? REP_MAX}</span></div>
            <small>{repPercent(adv, f) ? <span className="stat-good">−{repPercent(adv, f)}% · {FACTIONS[f].perk}</span> : FACTIONS[f].perk}{REP_PETS[f] ? ` · Honrado: mascote ${PETS[REP_PETS[f]!]}` : ''}</small></div>
        </article>; })}
      <p className="small-note">Ganhe reputação com missões dos NPCs, missões do dia e runas.</p>
    </section>}

    {tab === 'spec' && <section className="adventure-spec">
      {hero.level < SPEC_LEVEL ? <p className="small-note">🔒 No nível {SPEC_LEVEL} você escolhe um dos dois caminhos da sua classe.</p> : <p className="small-note">{SPECS[hero.classId].some(s => s.id === adv.spec) ? <>Trocar custa <Currency value={specChangeCost(hero.level)} />.</> : 'A primeira escolha é grátis.'}</p>}
      <div className="spec-choices">{SPECS[hero.classId].map(s => { const mine = adv.spec === s.id;
        return <button key={s.id} className={`spec-card ${s.style} ${mine ? 'chosen' : ''}`} disabled={hero.level < SPEC_LEVEL || mine || hero.dead} onClick={() => useGame.getState().chooseSpec(s.id)}>
          <span aria-hidden>{s.style === 'guard' ? '🛡' : '🔥'}</span><b>{s.name}</b><em>Poder: {s.power}</em><small>{s.description}</small>{mine && <strong>✓ Seu caminho</strong>}
        </button>; })}</div>
    </section>}

    {tab === 'pets' && <section className="adventure-grid pets">
      <button className={`feat ${!adv.pet ? 'worn' : ''}`} onClick={() => useGame.getState().setPet('')}><span aria-hidden>∅</span><b>Sem mascote</b></button>
      {(Object.keys(PETS) as PetId[]).map(p => { const has = unlockedPets(adv).includes(p), source = ACHIEVEMENTS.find(a => a.pet === p)?.goal ?? `Honrado com ${FACTIONS[(Object.keys(REP_PETS) as Faction[]).find(f => REP_PETS[f] === p)!].name}`;
        return <button key={p} className={`feat ${has ? 'got' : ''} ${adv.pet === p ? 'worn' : ''}`} disabled={!has} onClick={() => useGame.getState().setPet(p)} title={has ? 'Levar este mascote' : source}>
          <span aria-hidden>{has ? PET_ICON[p] : '🔒'}</span><b>{PETS[p]}</b><small>{has ? (adv.pet === p ? '✓ seguindo você' : 'Toque para levar') : source}</small>
        </button>; })}
    </section>}
  </div>;
}
