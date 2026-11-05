"use client";
import dynamic from 'next/dynamic';
import {useState} from 'react';
import {useGame} from '@/lib/store';
import {CLASSES,RACES,ITEMS,stats} from '@/lib/game';
import {activeEquipment} from '@/lib/equipment';
import {SLOT_NAMES,type Slot} from '@/lib/catalogue';
import {ItemArtwork} from './GameArtwork';
const Stage=dynamic(()=>import('./GameWorld').then(m=>m.CreatorStage),{ssr:false});
const slots:Slot[]=['head','chest','shoulders','hands','legs','feet','weapon','offhand','belt','charm','ring','trinket','back','pet'];
export default function CharacterSheet({edit,bag}:{edit:()=>void;bag:()=>void}){
 const hero=useGame(s=>s.hero),look=useGame(s=>s.look);
 const [selected,setSelected]=useState<string|null>(null);
 const gear=activeEquipment(hero,ITEMS),limits=stats(hero),item=selected?ITEMS[selected]:undefined;
 return <section className="character-sheet">
  <div className="sheet-identity"><h3>{hero.name}</h3><p>{RACES[hero.race]} · {CLASSES[hero.classId].name} · Nível {hero.level}</p></div>
  <div className="sheet-model"><Stage classId={hero.classId} race={hero.race} look={look} level={hero.level} equipped={gear.map(i=>i.id)}/><small>Arraste para girar o personagem</small></div>
  <div className="sheet-equipment" aria-label="Equipamentos usados">{slots.map(slot=>{const equipped=gear.find(i=>i.slot===slot||slot==='weapon'&&i.slot==='twohand');return <button key={slot} onClick={()=>setSelected(equipped?.id??null)} aria-label={`${SLOT_NAMES[slot]}: ${equipped?.name??'vazio'}`} aria-pressed={!!equipped&&selected===equipped.id}>{equipped?<ItemArtwork item={equipped}/>:<span aria-hidden="true">◇</span>}<small>{SLOT_NAMES[slot]}</small></button>;})}</div>
  <dl className="sheet-stats">{[['Ataque',limits.attack],['Defesa',limits.defense],['Força',limits.strength],['Agilidade',limits.agility],['Destreza',limits.dexterity],['Inteligência',limits.intelligence],['HP',`${Math.round(hero.hp)} / ${limits.maxHp}`],['MP',`${Math.round(hero.mp)} / ${limits.maxMp}`]].map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
  <div className="sheet-detail" aria-live="polite">{item?<><strong>{item.name}</strong><p>{item.description}</p><small>ATQ +{item.power} · DEF +{item.defense} · Nível {item.minLevel}</small></>:<p>Toque em um equipamento para examinar seus atributos.{gear.some(i=>i.slot==='twohand')?' Sua arma ocupa as duas mãos.':''}</p>}</div>
  <footer><button onClick={bag}>Abrir mochila</button>{hero.level>=30&&gear.some(i=>i.mount)&&<button onClick={()=>useGame.getState().toggleMount()}>Montar / desmontar</button>}{hero.dead&&<button onClick={edit}>Criar próximo personagem</button>}<small>{hero.dead?'Seu aprendizado permanece na próxima jornada.':'Raça e classe permanecem até o fim desta jornada. Um novo personagem pode ser criado após a morte.'}</small></footer>
 </section>;
}
