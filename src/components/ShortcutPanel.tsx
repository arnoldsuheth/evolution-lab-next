"use client";
import {useState} from 'react';
import {useGame} from '@/lib/store';
import {ITEMS} from '@/lib/game';
import {SKILLS} from '@/lib/skills';
import {HOTBAR_KEYS} from '@/lib/controls';
export default function ShortcutPanel(){
 const hero=useGame(s=>s.hero),[selected,setSelected]=useState('');
 const available=[...Object.values(SKILLS).filter(s=>s.classId===hero.classId&&s.kind==='active'&&hero.skills[s.id]>0).map(s=>({id:s.id,name:s.name})),...Array.from(new Set(hero.inventory)).filter(id=>ITEMS[id]?.effect).map(id=>({id:'item:'+id,name:ITEMS[id].name}))];
 const name=(id:string)=>id.startsWith('item:')?ITEMS[id.slice(5)]?.name:SKILLS[id]?.name;
 return <section className="shortcut-editor"><h3>Minha barra de ações</h3><p>Escolha uma habilidade ou consumível e toque no número desejado. No computador, também pode arrastar. Espaços vazios são preservados.</p><div className="shortcut-options">{available.map(a=><button key={a.id} draggable onDragStart={e=>e.dataTransfer.setData('text/plain',a.id)} aria-pressed={selected===a.id} onClick={()=>setSelected(a.id)}>{a.name}</button>)}</div>{!available.length&&<p>Aprenda uma habilidade em Talentos ou obtenha um consumível.</p>}<div className="shortcut-slots">{HOTBAR_KEYS.map((key,i)=><div key={key} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();useGame.getState().bindAction(e.dataTransfer.getData('text/plain'),i);}}><button onClick={()=>selected&&useGame.getState().bindAction(selected,i)}><kbd>{key}</kbd><span>{name(hero.hotbar[i]??'')??'Livre'}</span></button><button aria-label={`Limpar atalho ${key}`} onClick={()=>useGame.getState().bindAction('',i)}>×</button></div>)}</div></section>;
}
