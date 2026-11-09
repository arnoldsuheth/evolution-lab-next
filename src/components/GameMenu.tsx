"use client";
import {useEffect,useRef,useState} from 'react';
import AudioControls from './AudioControls';
import {CloudIndicator} from './CloudAccount';
import {useGame} from '@/lib/store';
import {adventureOf,MOUNT_LEVEL} from '@/lib/adventure';

export type MenuPanel='mounts'|'codex'|'bank'|'wagon'|'adventure'|'map'|'journal'|'journey'|'bag'|'talents'|'academy'|'character'|'ancestors'|'settings';
/** Tudo o que antes ficava espalhado pela tela, num só lugar. A ordem segue o que o jogador mais usa. */
export const MENU_ITEMS:{id:MenuPanel;label:string;icon:string;hint:string}[]=[
 // Lovelace: Runas abrem pelo diário e pelo Mestre das Runas; Mapa pelo minimapa; Descansar no cristal.
 {id:'journey',label:'Crônicas',icon:'◇',hint:'Códice, Jornada e Aventura'},
 {id:'bag',label:'Personagem',icon:'♙',hint:'Mochila, equipamento e atributos'},
 {id:'talents',label:'Talentos',icon:'✧',hint:'Habilidades da classe'},
 {id:'academy',label:'Estudos e Legado',icon:'⌘',hint:'Projetos e antepassados'},
];
export const MENU_EDIT_EVENT='lions-cave-hud-edit';

export default function GameMenu({hidden=false,open:openPanel,keys,rest,canRest,switchCharacter,location,version,error,onOpenChange}:{onOpenChange?:(open:boolean)=>void;hidden?:boolean;open:(panel:MenuPanel)=>void;keys:Record<string,string>;rest:()=>void;canRest:boolean;switchCharacter:()=>void;location:string;version:string;error:boolean}){
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null);
 // Menu aberto também pausa o mundo atrás (avisa a página).
 useEffect(()=>{onOpenChange?.(open&&!hidden);},[open,hidden,onOpenChange]);
 const level=useGame(s=>s.hero.level),mounted=useGame(s=>s.mounted),hearthAt=useGame(s=>adventureOf(s.hero).hearthAt),now=useGame(s=>s.now),hearthLeft=Math.max(0,Math.ceil((hearthAt-now)/60000));
 useEffect(()=>{if(!open)return;const close=(e:Event)=>{if(e instanceof KeyboardEvent?e.key==='Escape':!root.current?.contains(e.target as Node))setOpen(false);};window.addEventListener('keydown',close);window.addEventListener('pointerdown',close);return()=>{window.removeEventListener('keydown',close);window.removeEventListener('pointerdown',close);};},[open]);
 const choose=(action:()=>void)=>{setOpen(false);action();};
 void rest; void canRest; // descanso fica no cristal da vila (interação no mundo)
 if(hidden)return null;
 return <div ref={root} className={`game-menu ${open?'open':''}`}>
  <div className="zone-name" aria-live="polite">{location}</div>
  <button className="game-menu-toggle" aria-expanded={open} aria-controls="game-menu-panel" onClick={()=>setOpen(!open)}><span aria-hidden>☰</span> Menu</button>
  {open&&<div id="game-menu-panel" className="game-menu-panel" role="menu" aria-label="Menu do jogo">
   <div className="game-menu-grid">{MENU_ITEMS.map(item=><button key={item.id} role="menuitem" onClick={()=>choose(()=>openPanel(item.id))}><span className="menu-icon" aria-hidden>{item.icon}</span><b>{item.label}</b><small>{item.hint}</small>{keys[item.id]&&<kbd>{keys[item.id]}</kbd>}</button>)}
    <button role="menuitem" disabled={hearthLeft>0} title="Pedra de retorno: volta à praça da vila" onClick={()=>choose(()=>useGame.getState().hearth())}><span className="menu-icon" aria-hidden>⌂</span><b>Retornar</b><small>{hearthLeft?`Pronta em ${hearthLeft} min`:'Pedra de retorno'}</small></button>
    <button role="menuitem" disabled={level<MOUNT_LEVEL} title={level<MOUNT_LEVEL?`Montaria no nível ${MOUNT_LEVEL}`:'Andar mais rápido'} onClick={()=>choose(()=>openPanel('mounts'))}><span className="menu-icon" aria-hidden>🐺</span><b>{mounted?'Montado':'Montarias'}</b><small>{level<MOUNT_LEVEL?`Nível ${MOUNT_LEVEL}`:'Mais rápido'}</small></button>
    <button role="menuitem" onClick={()=>choose(()=>openPanel('bank'))}><span className="menu-icon" aria-hidden>🏦</span><b>Banco</b><small>Guardar com juros</small></button>
    <button role="menuitem" onClick={()=>choose(()=>openPanel('wagon'))}><span className="menu-icon" aria-hidden>🐴</span><b>Carroça</b><small>Viagem · 2,5 prata</small></button></div>
   <div className="game-menu-row"><AudioControls/><button onClick={()=>choose(switchCharacter)}>Trocar personagem</button><button onClick={()=>choose(()=>openPanel('settings'))}>⚙ Configurações</button><button onClick={()=>choose(()=>window.dispatchEvent(new Event(MENU_EDIT_EVENT)))}>▦ Organizar a tela</button></div>
   <p className="game-menu-help">Clique no chão para andar · clique no monstro para lutar · roda ou pinça dá zoom</p>
   <footer><span>LOVELACE KINGDOM {version}</span><span>{error?'Exportação necessária':<CloudIndicator/>}</span></footer>
  </div>}
 </div>;
}

