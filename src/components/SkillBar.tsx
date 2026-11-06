"use client";
import {BAR_SLOTS,keyForBar} from '@/lib/controls';
import {SKILLS} from '@/lib/skills';
import {useGame} from '@/lib/store';
import {SkillArtwork} from './GameArtwork';

/**
 * A barra de combate dentro dos Talentos: arraste uma habilidade até um espaço, ou toque em
 * “Pôr na barra” e depois no espaço. O espaço 1 é sempre Atacar.
 */
export default function SkillBar({picking,done}:{picking:string|null;done:()=>void}){
 const hotbar=useGame(s=>s.hero.hotbar),encounter=useGame(s=>s.encounter);
 const place=(id:string,slot:number)=>{useGame.getState().bindSkill(id,slot);done();};
 return <div className={`skill-bar ${picking?'picking':''}`} aria-label="Barra de combate">
  <div className="skill-slot fixed" title="1: Atacar (fixo)"><kbd>1</kbd><span aria-hidden>⚔</span><small>Atacar</small></div>
  {Array.from({length:BAR_SLOTS},(_,i)=>{const key=keyForBar(i),skill=SKILLS[hotbar[i]];
   return <button key={key} className={`skill-slot ${skill?'filled':''}`} disabled={!!encounter} aria-label={`${key}: ${skill?.name??'livre'}${picking?' · colocar aqui':''}`}
    onClick={()=>{if(picking)place(picking,i);}}
    onDragOver={e=>{if(e.dataTransfer.types.includes('text/skill')){e.preventDefault();e.currentTarget.classList.add('over');}}}
    onDragLeave={e=>e.currentTarget.classList.remove('over')}
    onDrop={e=>{e.preventDefault();e.currentTarget.classList.remove('over');const id=e.dataTransfer.getData('text/skill');if(id)place(id,i);}}>
    <kbd>{key}</kbd>{skill?<SkillArtwork skill={skill}/>:<span className="empty-rune" aria-hidden>◇</span>}<small>{skill?.name??'Livre'}</small></button>;})}
  {picking&&<p className="skill-bar-hint">Toque no espaço para <b>{SKILLS[picking]?.name}</b> · <button className="quiet" onClick={done}>Cancelar</button></p>}
 </div>;
}
