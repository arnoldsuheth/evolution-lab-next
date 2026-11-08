"use client";
import {useState} from 'react';
import {useGame} from '@/lib/store';
import {characterSlots} from '@/lib/characterSlots';
import {CLASSES,ITEMS,RACES} from '@/lib/game';
import HeroPortrait from './HeroPortrait';
import {activeEquipment} from '@/lib/equipment';
import CloudAccount from './CloudAccount';
export default function CharacterSelect({enter}:{enter:()=>void}){
 const state=useGame(),roster=characterSlots(state),[error,setError]=useState(''),[confirm,setConfirm]=useState<number|null>(null);
 return <main className="character-select"><header><span className="eyebrow">CARAMELO’S CAVE · SUAS CAMPANHAS</span><h1>Escolha sua jornada</h1><p>Cinco personagens. Cada um com sua história, equipamentos e progresso.</p></header><div className="character-slots">{roster.slots.map((save,index)=><div key={index} className="character-slot"><button onClick={()=>{if(useGame.getState().selectCharacter(index))enter();else setError('Termine o combate ou exercício antes de trocar. Se houver erro no salvamento, preserve uma exportação primeiro.');}}><small>PERSONAGEM {index+1}</small>{save?.hero.created?<><HeroPortrait selection classId={save.hero.classId} race={save.hero.race} look={save.look} equipped={activeEquipment(save.hero,ITEMS).map(i=>i.id)} level={save.hero.level}/><h2>{save.hero.name}</h2><p>{RACES[save.hero.race]} · {CLASSES[save.hero.classId].name}</p><span>Nível {save.hero.level} · {save.education.completed.length}/8 runas</span><b>{save.hero.dead?'Ver legado':'Continuar campanha'} →</b></>:<><span className="empty-character">＋</span><h2>Novo personagem</h2><p>Comece uma campanha independente</p><b>Criar personagem →</b></>}</button>{save?.hero.created&&(confirm===index?<div className="delete-confirm" role="alertdialog" aria-label={`Excluir ${save.hero.name}?`}><p>Excluir <b>{save.hero.name}</b>? Não dá para desfazer.</p><button className="danger" onClick={()=>{if(useGame.getState().deleteCharacter(index))setConfirm(null);else setError('Termine o combate ou exercício antes de excluir.');}}>Excluir</button><button onClick={()=>setConfirm(null)}>Cancelar</button></div>:<button className="delete-character" aria-label={`Excluir ${save.hero.name}`} title="Excluir personagem" onClick={()=>setConfirm(index)}>🗑</button>)}</div>)}</div>{error&&<p role="alert">{error}</p>}<div className="character-cloud"><CloudAccount/></div></main>;
}
