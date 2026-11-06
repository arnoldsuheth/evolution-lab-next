"use client";
import {useGame} from '@/lib/store';
import {ITEMS} from '@/lib/game';
import {PROFESSIONS,repairCost,forgeCost,type Profession} from '@/lib/economy';
import {forgeStep,forgeId,bandFor,LEVEL_BANDS} from '@/lib/catalogue';
import {countItem} from '@/lib/equipment';
import Currency from './Currency';
import {adventureOf,discounted,repPercent} from '@/lib/adventure';
import {ItemArtwork} from './GameArtwork';

/** Ferreiro de Borin: aprimorar (Comum → Épico → Mítico), reparar e aprender profissões. */
export default function WorkshopServices(){
 const hero=useGame(s=>s.hero),cut=repPercent(adventureOf(hero),'ferreiros'),fee=discounted(repairCost(hero.equipped,hero.durability??{},ITEMS),cut);
 const owned=[...new Set(hero.inventory)].map(id=>ITEMS[id]).filter(item=>item&&forgeStep(item.id)&&ITEMS[forgeId(forgeStep(item.id)!.base,forgeStep(item.id)!.to)]);
 return <section className="workshop-services forge" aria-label="Ferreiro">
  <h4>⚒ Aprimorar no ferreiro</h4>
  {!owned.length&&<p className="small-note">Compre ou encontre um equipamento para aprimorar: Comum → Épico → Mítico.</p>}
  <div className="forge-list">{owned.map(item=>{const step=forgeStep(item.id)!,next=ITEMS[forgeId(step.base,step.to)],cost=forgeCost(item,next,step.to,LEVEL_BANDS[bandFor(item.minLevel)]);
   const mats=Object.entries(cost.materials),ready=hero.gold>=discounted(cost.gold,cut)&&hero.materials>=cost.fragments&&mats.every(([id,n])=>countItem(hero.inventory,id)>=n);
   const gain=[['ATQ',next.power-item.power],['DEF',next.defense-item.defense],['HP',(next.hp??0)-(item.hp??0)],['MP',(next.mp??0)-(item.mp??0)]].filter(([,d])=>Number(d)>0);
   return <article key={item.id} className={`forge-card rarity-${next.rarity.normalize('NFD').replace(/[^a-z]/gi,'').toLowerCase()}`}>
    <div className="forge-art"><ItemArtwork item={item}/><span aria-hidden>→</span><ItemArtwork item={next}/></div>
    <div><b>{next.name}</b><div className="item-attributes">{gain.map(([k,d])=><span key={k} className="stat-good">+{d} {k}</span>)}</div>
     <small className="forge-cost"><Currency value={discounted(cost.gold,cut)}/>{cut>0&&<span className="stat-good"> −{cut}%</span>} · ◆ {cost.fragments} fragmentos · {mats.map(([id,n])=><span key={id} className={countItem(hero.inventory,id)>=n?'':'stat-bad'}>{n}× {ITEMS[id]?.name??id}</span>)}</small>
     <button className="primary" disabled={!ready||hero.dead} onClick={()=>useGame.getState().upgradeItem(item.id)}>Aprimorar para {next.rarity}</button></div>
   </article>;})}</div>
  <h4>Reparos</h4>
  <button disabled={hero.dead||hero.gold<fee||fee===0} onClick={()=>useGame.getState().repair()}>Reparar equipados · <Currency value={fee}/></button>
  <h4>Profissões</h4>
  <div className="forge-professions">{(Object.entries(PROFESSIONS) as [Profession,string][]).map(([id,name])=><button key={id} disabled={!!hero.professions?.[id]||hero.gold<20||hero.dead} onClick={()=>useGame.getState().learnProfession(id)}>{name}{hero.professions?.[id]?` · nível ${hero.professions[id]}`:<> · <Currency value={20}/></>}</button>)}</div>
 </section>;
}
