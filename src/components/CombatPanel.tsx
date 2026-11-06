"use client";
import {useState} from 'react';
import {useGame} from '@/lib/store';
import {ITEMS} from '@/lib/game';
import {itemRequirement,countItem} from '@/lib/equipment';
export default function CombatPanel({paused=false}:{paused?:boolean}){
 const hero=useGame(s=>s.hero),enemy=useGame(s=>s.encounter),now=useGame(s=>s.now),cooldowns=useGame(s=>s.cooldowns),[choice,setChoice]=useState('');
 if(hero.dead||!enemy||paused)return null;
 const options=Object.values(ITEMS).filter(i=>!!i.effect&&hero.inventory.includes(i.id)&&!itemRequirement(hero,i)&&!i.effect?.teleport);
 const selected=options.find(i=>i.id===choice)?.id??options[0]?.id??'';
 return <section className="combat-target" aria-label="Alvo em combate"><header><strong>{enemy.name}</strong><small>NV {enemy.level??hero.level}</small><button onClick={()=>useGame.getState().flee()}>Recuar</button></header><div className="meter"><div className="meter-fill" style={{width:`${enemy.hp/enemy.maxHp*100}%`,background:'#a75d68'}}/><span>HP</span><b>{enemy.hp} / {enemy.maxHp}</b></div>
 {enemy.bleed&&<small>Sangramento · {enemy.bleed.turns}</small>}
 <details><summary>Poções e provisões</summary><div className="combat-supplies"><select aria-label="Consumível de combate" value={selected} onChange={e=>setChoice(e.target.value)}>{!options.length&&<option value="">Nenhum disponível</option>}{options.map(i=><option key={i.id} value={i.id}>{i.name} ×{countItem(hero.inventory,i.id)}</option>)}</select><button disabled={!selected||(cooldowns.consumable??0)>now} onClick={()=>useGame.getState().useItem(selected)}>Usar</button></div></details></section>;
}
