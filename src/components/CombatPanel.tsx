"use client";
import {useGame} from '@/lib/store';
import {ITEMS} from '@/lib/game';
import {itemRequirement,countItem} from '@/lib/equipment';
import {ItemArtwork} from './GameArtwork';
import {STATUS_NAMES} from '@/lib/combat';

/** Chefes e raros mostram a regra que seguem: um if/else de verdade, com a linha ativa acesa. */
function PhaseRule({angry}:{angry:boolean}){return <div className={`phase-card ${angry?'angry':''}`} aria-label={angry?'Fase 2: o chefe está furioso':'Fase 1'}><span>{angry?'⚠ Fase 2':'Regra do chefe'}</span><code className={angry?'on':''}>{'if (vida < metade) { furia(); }'}</code><code className={angry?'':'on'}>{'else { atacar(); }'}</code></div>;}

/**
 * Sem painel de vida do monstro: nome, vida e estamina/mana ficam em cima dele no mundo.
 * Aqui só ficam botões: recuar e até três poções/provisões, como ícones com a quantidade.
 */
export default function CombatPanel({paused=false}:{paused?:boolean}){
 const hero=useGame(s=>s.hero),enemy=useGame(s=>s.encounter),now=useGame(s=>s.now),cooldowns=useGame(s=>s.cooldowns);
 if(hero.dead||!enemy||paused)return null;
 const options=Object.values(ITEMS).filter(i=>!!i.effect&&hero.inventory.includes(i.id)&&!itemRequirement(hero,i)&&!i.effect?.teleport).slice(0,3);
 const waiting=(cooldowns.consumable??0)>now;
 return <div className="combat-tools" aria-label="Ações de combate">
  <button className="combat-flee" onClick={()=>useGame.getState().flee()} aria-label="Recuar do combate" title="Recuar">↩</button>
  {options.map(i=><button key={i.id} className="combat-supply" disabled={waiting} onClick={()=>useGame.getState().useItem(i.id)} aria-label={`Usar ${i.name}`} title={i.name}><ItemArtwork item={i}/><b>{countItem(hero.inventory,i.id)}</b></button>)}
  {enemy.elite&&<PhaseRule angry={enemy.phase===2}/>}{enemy.bleed&&<span className="combat-status" title="Inimigo sangrando">🩸{enemy.bleed.turns}</span>}
  {enemy.heroStatus&&<span className={`combat-status hero-status ${enemy.heroStatus.kind}`} title={STATUS_NAMES[enemy.heroStatus.kind]}>{({poison:"☠",slow:"🐌",freeze:"❄",burn:"🔥"} as const)[enemy.heroStatus.kind]}{enemy.heroStatus.turns}</span>}
 </div>;
}
