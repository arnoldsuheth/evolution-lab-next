"use client";
import { useState } from 'react';
import { useGame } from '@/lib/store';
import { adventureOf } from '@/lib/adventure';
import { ITEMS } from '@/lib/game';
import { DOG_FULL_MS, DOG_LEVELS, DOG_NAME, FOOD_GAIN, TREAT_GAIN, TREAT_PRICE, dogFood, dogHungry, dogLevel, nextDogLevel } from '@/lib/dog';

/** Janela do Caramelo: amizade, humor e comida. */
export default function DogPanel() {
  const raw = useGame(s => s.hero.adventure), inventory = useGame(s => s.hero.inventory), gold = useGame(s => s.hero.gold);
  const dog = adventureOf({ adventure: raw }).dog, [now] = useState(() => Date.now()), [say, setSay] = useState('');
  const level = dogLevel(dog.friendship), next = nextDogLevel(dog.friendship), food = dogFood(inventory);
  const hungry = dogHungry(dog, now), full = dog.friendship >= 100, wait = Math.max(0, Math.ceil((dog.fedAt + DOG_FULL_MS - now) / 1000));
  const feed = (kind: 'food' | 'treat') => setSay(useGame.getState().feedDog(kind).message);
  const mood = full ? 'Companheiro fiel: ele te protege com o olhar.' : hungry ? 'Está com fome e te olha com aqueles olhos de pidão. 🍖' : `Barriga cheia! Pede de novo em uns ${wait}s.`;
  return <div className="panel-body dog-panel">
    <div className="dog-head">
      <div className="dog-face" aria-hidden>🐕</div>
      <div>
        <span className="eyebrow">VIRA-LATA DA PEDRA DA AURORA</span>
        <h3>{DOG_NAME} <small>{level.face} {level.name}</small></h3>
        <p className="dog-mood">{mood}</p>
      </div>
    </div>
    <div className="dog-friend" role="meter" aria-label="Amizade" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dog.friendship}>
      <div className="dog-friend-top"><b>Amizade</b><span>{dog.friendship}/100</span></div>
      <div className="dog-friend-bar"><i style={{ width: `${dog.friendship}%` }} />{DOG_LEVELS.slice(1).map(l => <em key={l.min} style={{ left: `${l.min}%` }} title={l.name} />)}</div>
      <small>{next ? `Próximo: ${next.face} ${next.name} em ${next.min - dog.friendship} pontos` : 'Amizade completa! 🏅'}</small>
    </div>
    <p className="dog-line">{say || level.line}</p>
    <div className="dog-actions">
      <button className="primary" disabled={!food || full} onClick={() => feed('food')}>🍖 Dar {food ? ITEMS[food]?.name.split(' ').slice(0, 2).join(' ') ?? 'comida' : 'comida'} <small>+{FOOD_GAIN}</small></button>
      <button disabled={gold < TREAT_PRICE || full} onClick={() => feed('treat')}>🦴 Petisco · {TREAT_PRICE} moedas <small>+{TREAT_GAIN}</small></button>
    </div>
    {!food && !full && <p className="small-note">Sem comida na mochila: compre pão, ensopado ou frutas com a Mira. Comida de verdade vale mais amizade que petisco.</p>}
    <p className="small-note">Ele segue você pelas ruas da cidade. Quanto maior a amizade, mais perto ele anda e mais rápido abana o rabo.</p>
  </div>;
}
