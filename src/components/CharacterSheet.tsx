"use client";
import dynamic from 'next/dynamic';
import {useEffect,useRef,useState} from 'react';
import {useGame} from '@/lib/store';
import {CLASSES,RACES,ITEMS,stats} from '@/lib/game';
import {equipmentForSlot} from '@/lib/equipment';
import {ATTRIBUTE_KEYS,ATTRIBUTE_INFO,attributePoints,cleanAttributes} from '@/lib/attributes';
import {SLOT_NAMES,type Slot} from '@/lib/catalogue';
import {ItemArtwork} from './GameArtwork';
const Stage=dynamic(()=>import('./GameWorld').then(m=>m.CreatorStage),{ssr:false});
const slots:Slot[]=['head','chest','shoulders','hands','legs','feet','weapon','offhand','belt','charm','ring','trinket','back','pet'];
export default function CharacterSheet({edit,bag}:{edit:()=>void;bag:()=>void}){
 const picker=useRef<HTMLElement>(null);
 const hero=useGame(s=>s.hero),look=useGame(s=>s.look),encounter=useGame(s=>s.encounter),challenge=useGame(s=>s.challenge);
 const [selected,setSelected]=useState<string|null>(null),[selectedSlot,setSelectedSlot]=useState<Slot|null>(null);
 const gear=hero.equipped.filter(id=>hero.inventory.includes(id)).map(id=>ITEMS[id]).filter(Boolean),limits=stats(hero),item=selected?ITEMS[selected]:undefined,choices=selectedSlot?equipmentForSlot(hero,selectedSlot,ITEMS):[],points=attributePoints(hero),allocated=cleanAttributes(hero.attributeAllocation,hero.level);
 useEffect(()=>{if(selectedSlot)picker.current?.scrollIntoView({block:"nearest"});},[selectedSlot]);
 return <section className="character-sheet">
  <div className="sheet-identity"><h3>{hero.name}</h3><p>{RACES[hero.race]} · {CLASSES[hero.classId].name} · Nível {hero.level}</p></div>
  <div className="sheet-model"><Stage classId={hero.classId} race={hero.race} look={look} level={hero.level} equipped={gear.map(i=>i.id)}/><small>Arraste para girar o personagem</small></div>
  <div className="sheet-equipment" aria-label="Equipamentos usados">{slots.map(slot=>{const equipped=gear.find(i=>i.slot===slot||slot==='weapon'&&i.slot==='twohand');return <button key={slot} data-slot={slot} data-rarity={equipped?.rarity} onClick={()=>{setSelectedSlot(slot);setSelected(equipped?.id??null);}} aria-label={`${SLOT_NAMES[slot]}: ${equipped?.name??'vazio'}`} aria-pressed={selectedSlot===slot}>{equipped?<ItemArtwork item={equipped}/>:<span aria-hidden="true">◇</span>}<small>{SLOT_NAMES[slot]}</small></button>;})}</div>
  {selectedSlot&&<section ref={picker} className="slot-picker" aria-label={`Itens para ${SLOT_NAMES[selectedSlot]}`}><header><strong>{SLOT_NAMES[selectedSlot]} · mochila</strong><button onClick={()=>setSelectedSlot(null)} aria-label="Fechar seleção de equipamento">×</button></header><div className="slot-choices">{choices.map(candidate=><button key={candidate.id} data-rarity={candidate.rarity} disabled={hero.dead||!!encounter||!!challenge} title={`${candidate.name} · ATQ +${candidate.power} · DEF +${candidate.defense}`} onClick={()=>{useGame.getState().equip(candidate.id);setSelected(candidate.id);}}><ItemArtwork item={candidate}/><strong>{candidate.name}</strong><small>ATQ +{candidate.power} · DEF +{candidate.defense}</small><small>NV {candidate.minLevel} · Equipar</small></button>)}</div>{!choices.length&&<p>Nenhum item compatível disponível na mochila para este slot.</p>}</section>}
  <section className="attribute-editor" aria-label="Distribuir atributos"><header><strong>Atributos</strong><span>{points} ponto(s) disponível(is)</span></header><p>3 pontos por nível conquistado. Os níveis anteriores já estão incluídos.</p><div>{ATTRIBUTE_KEYS.map(key=><label key={key} title={ATTRIBUTE_INFO[key].effect}><span>{ATTRIBUTE_INFO[key].label}<small>{ATTRIBUTE_INFO[key].name}</small></span><b>{limits[key]} <small>+{allocated[key]}</small></b><button aria-label={`Aumentar ${ATTRIBUTE_INFO[key].name}`} disabled={points<1||hero.dead||!!encounter||!!challenge} onClick={()=>useGame.getState().allocateAttribute(key)}>+</button><small className="attribute-effect">{ATTRIBUTE_INFO[key].effect}</small></label>)}</div></section>
  <dl className="sheet-stats">{[['Ataque',limits.attack],['Defesa',limits.defense],['Força',limits.strength],['Agilidade',limits.agility],['Destreza',limits.dexterity],['Inteligência',limits.intelligence],['HP',`${Math.round(hero.hp)} / ${limits.maxHp}`],['MP',`${Math.round(hero.mp)} / ${limits.maxMp}`]].map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
  <div className="sheet-detail" aria-live="polite">{item?<><strong>{item.name}</strong><p>{item.description}</p><small>ATQ +{item.power} · DEF +{item.defense} · Nível {item.minLevel}</small><button disabled={hero.dead||!!encounter||!!challenge} onClick={()=>{useGame.getState().equip(item.id);setSelected(null);}}>Desequipar · mover para mochila</button></>:<p>Toque em um equipamento para examinar seus atributos.{gear.some(i=>i.slot==='twohand')?' Sua arma ocupa as duas mãos.':''}</p>}</div>
  <footer><button onClick={bag}>Abrir mochila</button>{hero.level>=30&&gear.some(i=>i.mount)&&<button onClick={()=>useGame.getState().toggleMount()}>Montar / desmontar</button>}{hero.dead&&<button onClick={edit}>Criar próximo personagem</button>}<small>{hero.dead?'Seu aprendizado permanece na próxima jornada.':'Raça e classe permanecem até o fim desta jornada. Um novo personagem pode ser criado após a morte.'}</small></footer>
 </section>;
}

