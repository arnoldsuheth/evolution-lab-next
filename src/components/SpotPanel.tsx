"use client";
import { useGame } from '@/lib/store';
import { adventureOf } from '@/lib/adventure';
import { CODE_SPOTS, spotAvailable } from '@/lib/codeSpots';
import ApprenticeCode from './ApprenticeCode';

/** Ponto de código no mapa: monte o código e veja o mundo mudar. */
export default function SpotPanel({ id, close }: { id: string; close: () => void }) {
  const spot = CODE_SPOTS.find(s => s.id === id), raw = useGame(s => s.hero.adventure), built = adventureOf({ adventure: raw }).built;
  if (!spot) return null;
  const done = built.includes(id), index = CODE_SPOTS.indexOf(spot);
  const locked = done || spotAvailable(built, id) ? '' : `Primeiro faça o ponto anterior: ${CODE_SPOTS[index - 1].title}.`;
  return <div className="panel-body spot-panel">
    <div className="spot-head"><span className="spot-chip">{index + 1}/{CODE_SPOTS.length} · {spot.theme}</span><span className="spot-reward">+{spot.xp} XP · {spot.gold} ◉</span></div>
    <h3>{done ? '✓ ' : '✦ '}{spot.title}</h3>
    <p className="spot-story">{spot.story}</p>
    <ApprenticeCode key={id} builder={spot.builder} done={done} locked={locked} run={() => useGame.getState().buildSpot(id).ok} />
    {done && <div className="spot-done"><p>✨ {spot.done}</p><button className="primary" onClick={close}>Ver no mapa →</button></div>}
  </div>;
}
