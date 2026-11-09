"use client";
import {useState} from "react";
import SkillBar from "./SkillBar";
import ShortcutPanel from "./ShortcutPanel";
import {keyForBar} from '@/lib/controls';
import {SkillArtwork} from './GameArtwork';
import { useGame } from '@/lib/store';
import { CLASSES,stats } from '@/lib/game';
import { SKILLS,availableSkillPoints,skillRank,skillRequirement,type Skill } from '@/lib/skills';

/** Lovelace · árvore de talentos (prévia 2): três colunas com ícones, grau em cada nó e um cartão explicativo ao tocar. */
export default function SkillTree(){
 const hero=useGame(s=>s.hero),encounter=useGame(s=>s.encounter),[picking,setPicking]=useState<string|null>(null),[focus,setFocus]=useState<string|null>(null);
 const st=stats(hero),points=availableSkillPoints(hero),info=CLASSES[hero.classId];
 const mine=Object.values(SKILLS).filter(s=>s.classId===hero.classId);
 const sum=(list:Skill[],f:(s:Skill)=>number)=>list.reduce((a,s)=>a+f(s),0);
 const invested=sum(mine,s=>skillRank(hero,s.id)),total=sum(mine,s=>s.maxRank);
 const selected=focus?SKILLS[focus]:undefined;
 return <div className="panel-body talents-lk">
  <header className="talents-head">
   <span className="talents-class"><i aria-hidden="true">✦</i>{info.name}<small>Nv. {hero.level}</small></span>
   <span className="talents-points">Pontos de talento: <b>{points}</b></span>
   <button className="talents-respec" disabled={hero.dead||!!encounter} onClick={()=>useGame.getState().respec()} title="Redistribuir mantém XP, nível, itens e educação">↻ Redistribuir</button>
  </header>
  <div className="talents-columns">
   {info.talents.map((branch,b)=>{const list=mine.filter(s=>s.branch===b).sort((x,y)=>x.tier-y.tier);
    return <section className={`talent-col talent-col-${b}`} key={branch} aria-label={branch}>
     <h4>{branch}<small>({sum(list,s=>skillRank(hero,s.id))}/{sum(list,s=>s.maxRank)})</small></h4>
     <div className="talent-chain">{list.map(s=>{const rank=skillRank(hero,s.id),reason=skillRequirement(hero,s.id),state=rank>0?'active':reason?'locked':'open',usable=rank>0&&s.kind==='active';
      return <button key={s.id} className={`talent-node ${state} ${s.kind} ${focus===s.id?'focus':''}`} aria-pressed={focus===s.id} aria-label={`${s.name}, grau ${rank} de ${s.maxRank}`}
       draggable={usable&&!encounter} onDragStart={e=>{e.dataTransfer.setData('text/skill',s.id);e.dataTransfer.effectAllowed='move';}}
       onClick={()=>setFocus(focus===s.id?null:s.id)}><SkillArtwork skill={s}/><b>{rank}/{s.maxRank}</b>{state==='locked'&&<i className="talent-lock" aria-hidden="true">🔒</i>}</button>;})}</div>
    </section>;})}
   {selected&&<TalentCard skill={selected} picking={picking} setPicking={setPicking} close={()=>setFocus(null)}/>}
  </div>
  <footer className="talents-foot"><span>Total investido: <b>✦ {invested}/{total}</b></span><span className="talents-legend"><i className="lg-active"/>Ativo<i className="lg-locked"/>Bloqueado<i className="lg-focus"/>Selecionado</span></footer>
  {hero.talents.some(n=>n>0)&&<p className="hint-box">Seus {hero.talents.reduce((a,b)=>a+b,0)} pontos da árvore antiga foram preservados e contam no orçamento. Redistribua gratuitamente para usar a árvore nova.</p>}
  <details className="talent-extras"><summary>Barra de combate, atalhos e atributos</summary>
   <ShortcutPanel/>
   <p>Um ponto por nível após o primeiro. Cada habilidade exige nível e grau 2 na anterior do mesmo ramo. Passivas concedem atributos; ativas entram na barra de combate, com custo e recarga.</p>
   <SkillBar picking={picking} done={()=>setPicking(null)}/>
   <div className="hotbar-summary"><b>Barra de combate · {hero.hotbar.filter(Boolean).length}/10</b><p>{hero.hotbar.map(id=>SKILLS[id]?.name).filter(Boolean).join(' · ')||'Aprenda uma habilidade ativa e escolha até dez posições para a barra. As primeiras ativas da árvore abrem no nível 8; antes disso, use F e R em combate.'}</p></div>
   <div className="attributes">{Object.entries({FOR:st.strength,ATQ:st.attack,DEF:st.defense,AGI:st.agility,DEX:st.dexterity,INT:st.intelligence}).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
   <p className="small-note">Redistribuir mantém XP, nível, itens e educação. As escolhas das outras classes são lembradas, mas seus bônus só funcionam quando aquela classe está ativa.</p>
  </details>
 </div>;
}

/** Cartão explicativo do talento escolhido: o que faz, grau, custo e botões para investir e pôr na barra. */
function TalentCard({skill:s,picking,setPicking,close}:{skill:Skill;picking:string|null;setPicking:(id:string|null)=>void;close:()=>void}){
 const hero=useGame(x=>x.hero),encounter=useGame(x=>x.encounter),info=CLASSES[hero.classId];
 const rank=skillRank(hero,s.id),reason=skillRequirement(hero,s.id),usable=rank>0&&s.kind==='active',onBar=hero.hotbar.includes(s.id);
 return <aside className="talent-tip" role="dialog" aria-label={s.name}>
  <header><span className="talent-tip-icon"><SkillArtwork skill={s}/></span><div><h5>{s.name}</h5><small>{info.talents[s.branch]} · Grau {rank}/{s.maxRank}</small></div><button className="quiet" aria-label="Fechar" onClick={close}>×</button></header>
  <p>{s.description}{s.kind==='passive'?' por grau.':' · potência aumenta por grau.'}</p>
  <small className="talent-tip-meta">Nível {s.minLevel}+ · {s.kind==='active'?`Ativa · ${s.cost} ${s.resource==='mp'?'MP':'EST'} · recarga ${s.cooldown}s`:'Passiva'}</small>
  {rank===s.maxRank?<p className="talent-max">✓ Máximo alcançado</p>:<button className="primary" disabled={!!reason||!!encounter} onClick={()=>useGame.getState().learnSkill(s.id)}>{reason??'Investir 1 ponto'}</button>}
  {usable&&<div className="skill-binding"><button className={picking===s.id?'primary':''} disabled={!!encounter} onClick={()=>{if(!onBar){useGame.getState().bindSkill(s.id);return;}setPicking(picking===s.id?null:s.id);}}>{onBar?`Na barra: ${keyForBar(hero.hotbar.indexOf(s.id))} · mudar`:'Pôr na barra'}</button>{onBar&&<button className="quiet" disabled={!!encounter} onClick={()=>useGame.getState().bindSkill(s.id)}>Retirar</button>}</div>}
 </aside>;
}
