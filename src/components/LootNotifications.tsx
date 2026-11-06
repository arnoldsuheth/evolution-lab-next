"use client";
import {useGame} from '@/lib/store';
import {ITEMS} from '@/lib/game';
import {ItemArtwork} from './GameArtwork';
/** Session feedback only: rewards are committed by the store before this is shown. */
export default function LootNotifications(){
 const event=useGame(s=>s.lootEvent),now=useGame(s=>s.now);
 if(!event||now-event.time>5500)return null;
 const counts=new Map<string,number>();event.items.forEach(id=>counts.set(id,(counts.get(id)??0)+1));
 return <aside key={event.time} className="loot-feed" role="status" aria-live="polite" aria-label="Recompensas recebidas"><div><span className="loot-symbol">✦</span><strong>+{event.xp.toLocaleString('pt-BR')} XP</strong></div><div><span className="loot-symbol">◉</span><strong>+{event.gold.toLocaleString('pt-BR')} bronze</strong></div>{[...counts].map(([id,count])=>ITEMS[id]&&<div key={id}><span className={`loot-art rarity-${ITEMS[id].rarity.toLowerCase()}`}><ItemArtwork item={ITEMS[id]}/></span><strong>{ITEMS[id].name} ×{count}</strong></div>)}</aside>;
}
