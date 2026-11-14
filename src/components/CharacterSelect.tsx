"use client";
import Image from 'next/image';
import {useState} from 'react';
import {useGame} from '@/lib/store';
import {characterSlots} from '@/lib/characterSlots';
import {CLASSES,ITEMS,RACES} from '@/lib/game';
import HeroPortrait from './HeroPortrait';
import {activeEquipment} from '@/lib/equipment';
import CloudAccount from './CloudAccount';
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? '');
/** Lovelace · seleção de personagem (prévia 2): lista à esquerda, herói no centro, resumo e "Entrar no reino" à direita. */
/** 5.0: partículas douradas subindo na tela de início (posições fixas, sem sorteio a cada desenho). */
const MOTES=Array.from({length:22},(_,i)=>{const size=3+(i*7)%6,dur=9+(i*13)%9;return{left:`${(i*37)%100}%`,width:size,height:size,animationDuration:`${dur}s`,animationDelay:`${-((i*1.7)%dur).toFixed(1)}s`};});
export default function CharacterSelect({enter}:{enter:()=>void}){
 const state=useGame(),roster=characterSlots(state),[error,setError]=useState(''),[confirm,setConfirm]=useState<number|null>(null);
 const firstHero=roster.slots.findIndex(s=>s?.hero.created),[chosen,setChosen]=useState(firstHero>=0?firstHero:0);
 const picked=roster.slots[chosen],save=picked?.hero.created?picked:null,made=!!save;
 function play(index:number){if(useGame.getState().selectCharacter(index))enter();else setError('Termine o combate ou exercício antes de trocar. Se houver erro no salvamento, preserve uma exportação primeiro.');}
 return <main className="character-select lk-select">
  <div className="lk-start-fx" aria-hidden="true"><Image className="lk-start-art" src={base + "/ui/start-bg.webp"} width={1672} height={941} alt="" unoptimized/><i className="lk-start-shade"/><i className="lk-aurora"/><i className="lk-rune lk-rune-a"/><i className="lk-rune lk-rune-b"/>{MOTES.map((m,i)=><i key={i} className="lk-mote" style={m}/>)}</div>
  <header className="lk-select-top"><div className="lovelace-brand-banner"><i className="lk-sweep" aria-hidden="true"/><Image src={base + "/ui/logo-kingdom.webp"} width={418} height={407} alt="Lovelace Kingdom · O Reino do Conhecimento" unoptimized priority /></div><span className="eyebrow">LOVELACE KINGDOM · SUAS CAMPANHAS</span><h1>Escolha sua jornada</h1><p>Cinco personagens. Cada um com sua história, equipamentos e progresso.</p></header>
  <div className="lk-select-body">
   <section className="lk-roster" aria-label="Selecionar personagem"><h2>Selecionar Personagem</h2>
    <div className="character-slots">{roster.slots.map((s,index)=><div key={index} className={`character-slot ${index===chosen?'chosen':''}`}>
     <button aria-pressed={index===chosen} onClick={()=>{setChosen(index);setConfirm(null);}} onDoubleClick={()=>play(index)}><small>PERSONAGEM {index+1}</small>{s?.hero.created?<><HeroPortrait selection classId={s.hero.classId} race={s.hero.race} look={s.look} equipped={activeEquipment(s.hero,ITEMS).map(i=>i.id)} level={s.hero.level}/><h2>{s.hero.name}</h2><p>Nv. {s.hero.level} · {CLASSES[s.hero.classId].name}</p></>:<><span className="empty-character">＋</span><h2>Novo personagem</h2><p>Criar personagem</p></>}</button>
     {s?.hero.created&&(confirm===index?<div className="delete-confirm" role="alertdialog" aria-label={`Excluir ${s.hero.name}?`}><p>Excluir <b>{s.hero.name}</b>? Não dá para desfazer.</p><button className="danger" onClick={()=>{if(useGame.getState().deleteCharacter(index))setConfirm(null);else setError('Termine o combate ou exercício antes de excluir.');}}>Excluir</button><button onClick={()=>setConfirm(null)}>Cancelar</button></div>:<button className="delete-character" aria-label={`Excluir ${s.hero.name}`} title="Excluir personagem" onClick={()=>setConfirm(index)}>🗑</button>)}
    </div>)}</div>
   </section>
   <section className="lk-hero-stage" aria-hidden={!made}>{save?<HeroPortrait selection classId={save.hero.classId} race={save.hero.race} look={save.look} equipped={activeEquipment(save.hero,ITEMS).map(i=>i.id)} level={save.hero.level}/>:<span className="lk-empty-stage">＋</span>}</section>
   <section className="lk-hero-info">
    {save?<><h2><i aria-hidden="true">✦</i>{save.hero.name}</h2><p className="lk-class">{RACES[save.hero.race]} · {CLASSES[save.hero.classId].name} · Nv. {save.hero.level}</p><p className="lk-role">{CLASSES[save.hero.classId].role}</p>
     <ul className="lk-progress"><li><b>{save.education.completed.length}/8</b> runas restauradas</li><li><b>{save.hero.kills}</b> vitórias</li>{save.hero.mode==='hardcore'&&<li className="lk-hardcore">Hardcore · morte permanente</li>}</ul></>
     :<><h2><i aria-hidden="true">✦</i>Novo personagem</h2><p className="lk-role">Comece uma campanha independente. Escolha raça, classe e aparência.</p></>}
    <button className="lk-enter" onClick={()=>play(chosen)}>{save?(save.hero.dead?'Ver legado':'Entrar no Reino'):'Criar personagem'}</button>
   </section>
  </div>
  {error&&<p role="alert">{error}</p>}<div className="character-cloud"><CloudAccount/></div></main>;
}
