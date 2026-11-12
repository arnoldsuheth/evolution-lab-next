"use client";
import {useGame} from '@/lib/store';
import {NPCS_LIVE,type NpcId} from '@/lib/game';
import type {GuideTarget} from '@/lib/questNavigation';
import Currency from './Currency';
import {QUESTS,cleanLog,goal,questLockReason,questStatus} from '@/lib/quests';

/** Missões de clique oferecidas por este NPC (no topo da conversa). */
export function QuestDialog({npc}:{npc:NpcId}){
 const hero=useGame(s=>s.hero),lessons=useGame(s=>s.education.completed),log=cleanLog(hero.quests);
 const mine=QUESTS.filter(q=>q.giver===npc).map(q=>({q,status:questStatus(log,q,hero.level,lessons)})).filter(({status})=>status!=='done');
 const next=mine.find(m=>m.status==='locked');
 if(!mine.some(m=>m.status!=='locked')&&!next)return null;
 return <section className="quest-dialog" aria-label="Missões deste personagem">
  {mine.filter(m=>m.status!=='locked').map(({q,status})=><article key={q.id} className={`quest-offer ${status}`}>
   <span className="quest-badge">{status==='ready'?'?':status==='available'?'!':'…'}</span>
   <div><h4>{q.title}</h4><p>{status==='ready'?q.finish:q.intro}</p>
    {status!=='available'&&<ul>{q.objectives.map((o,i)=>{const value=log.active[q.id]?.[i]??0;return <li key={i} className={value>=goal(o)?'complete':''}>{value>=goal(o)?'✓':'○'} {o.label} {goal(o)>1?`${Math.min(value,goal(o))}/${goal(o)}`:''}</li>;})}</ul>}
    <small className="reward-line">+{q.reward.xp} XP · <Currency value={q.reward.gold}/></small>
    {status==='available'&&<button className="primary" onClick={()=>useGame.getState().acceptQuest(q.id)}>Aceitar missão</button>}
    {status==='ready'&&<button className="primary" onClick={()=>useGame.getState().turnInQuest(q.id)}>Entregar missão</button>}
   </div></article>)}
  {next&&!mine.some(m=>m.status==='available')&&<p className="small-note">Próxima missão aqui: {next.q.title} · {questLockReason(log,next.q,hero.level,lessons)}</p>}
 </section>;
}

/** Lista curta das missões ativas, embaixo da missão de programação. */
export function QuestTrackerList({follow}:{follow:(target:GuideTarget)=>void}){
 const hero=useGame(s=>s.hero),log=cleanLog(hero.quests),active=QUESTS.filter(q=>log.active[q.id]);
 if(!active.length)return null;
 return <ul className="quest-tracker-list">{active.map(q=>{
   const p=log.active[q.id],remaining=q.objectives.filter((o,i)=>(p[i]??0)<goal(o)),ready=!remaining.length;
   const next=remaining[0];
   const npc=ready?q.giver:next?.type==='talk'?next.npc:undefined;
   const target:GuideTarget|undefined=npc?{npc}:next&&next.type!=='talk'?{objective:next}:undefined;
   const name=NPCS_LIVE.find(person=>person.id===npc)?.name;
   return <li key={q.id} className={ready?'ready':''}>
     <b>{ready?'? ':''}{q.title}</b>
     {ready?<small>Entregue a {name}</small>:q.objectives.map((o,i)=>(p[i]??0)<goal(o)&&<small key={i}>{o.label} {goal(o)>1?`${p[i]??0}/${goal(o)}`:''}</small>)}
     {target&&<button className="quest-route-button" onClick={()=>follow(target)}>{name?`Ir até ${name}`:next?.type==='collect'?'Localizar coleta':'Localizar criaturas'}</button>}
   </li>;
 })}</ul>;
}
