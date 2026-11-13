"use client";
import {useGame} from '@/lib/store';
import {ITEMS} from '@/lib/game';
import {ItemArtwork} from './GameArtwork';
import {lootHighlight} from '@/lib/combat';
/** Session feedback only: rewards are committed by the store before this is shown. */
export default function LootNotifications(){
 const event=useGame(s=>s.lootEvent),now=useGame(s=>s.now);
 if(!event||now-event.time>5500)return null;
 const rare=lootHighlight(event.items);
 const counts=new Map<string,number>();event.items.forEach(id=>counts.set(id,(counts.get(id)??0)+1));
 return <aside key={event.time} className="loot-feed" role="status" aria-live="polite" aria-label="Recompensas recebidas"><div><span className="loot-symbol">✦</span><strong>+{event.xp.toLocaleString('pt-BR')} XP</strong></div><div><span className="loot-symbol">◉</span><strong>+{event.gold.toLocaleString('pt-BR')} bronze</strong></div>{rare&&<div className={`loot-rare-banner loot-rare-${rare}`}><strong>{rare==='mitico'?'✦ Item Mítico!':'✦ Item Épico!'}</strong></div>}{[...counts].map(([id,count])=>ITEMS[id]&&<div key={id} className={ITEMS[id].rarity==='Mítico'?'loot-row-mitico':ITEMS[id].rarity==='Épico'?'loot-row-epico':undefined}><span className={`loot-art rarity-${ITEMS[id].rarity.toLowerCase()}`}><ItemArtwork item={ITEMS[id]}/></span><strong>{ITEMS[id].name} ×{count}{ITEMS[id].rarity!=='Comum'&&<small className="loot-rarity">{ITEMS[id].rarity}</small>}</strong></div>)}</aside>;
}
