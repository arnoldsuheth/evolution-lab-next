"use client";
import { MONSTERS } from '@/lib/campaign';
import { monsterPoint } from '@/lib/patrols';
import {attackRange,basicAttack,COMBO_WINDOW_MS,SUPREMO_MAX} from '@/lib/combat';
import {HUNTER_ARROW} from '@/lib/catalogue';
import {useEffect,useState} from 'react';
import {useGame} from '@/lib/store';
import {SKILLS,classPowerRequirement,effectiveSkillRank} from '@/lib/skills';
import {autoAttackStep,ATTACK_SLOT,BAR_SLOTS,barForKey,hotbarIndex,isEditingTarget,keyForBar} from '@/lib/controls';
import {ITEMS,CLASSES} from '@/lib/game';
import {specOf,WOLF_FORM_LEVEL} from '@/lib/adventure';
import {itemRequirement,countItem} from '@/lib/equipment';
import {SkillArtwork,ItemArtwork} from './GameArtwork';
import type {CSSProperties} from 'react';
/** 5.0: clarão de ativação (e "CRÍTICO") que reinicia a cada uso, pela hora do golpe. */
function CastFx({at,crit,combo,supremo}:{at:number|null;crit?:boolean;combo?:boolean;supremo?:boolean}){const word=supremo?'SUPREMO!':combo?'COMBO':crit?'CRÍTICO':'';return at?<><span key={at} className={`fx-cast${supremo?' fx-cast-supremo':combo?' fx-cast-combo':''}`} aria-hidden="true"/>{word&&<span key={'c'+at} className={`fx-crit${combo||supremo?' fx-word-arcane':''}`} aria-hidden="true">{word}</span>}</>:null;}
const cdStyle=(frac:number)=>({'--cd':`${Math.round(Math.max(0,Math.min(1,frac))*360)}deg`}) as CSSProperties;
const RES_LABEL={mp:'SEM MP',stamina:'SEM STM'} as const;
function Controls({identity}:{identity:string|null}){
 const hero=useGame(s=>s.hero),wolfForm=useGame(s=>s.wolfForm),now=useGame(s=>s.now),cooldowns=useGame(s=>s.cooldowns),walking=useGame(s=>s.walking),sitting=useGame(s=>s.sitting),[automatic,setAutomatic]=useState(false),[food,setFood]=useState(''),[potion,setPotion]=useState(''),[utilities,setUtilities]=useState(false);
 const attack=basicAttack(hero),arrows=countItem(hero.inventory,HUNTER_ARROW),powerLock=classPowerRequirement(hero);
 const encounter=useGame(s=>s.encounter);
 const ev=useGame(s=>s.battleEvent),fresh=ev&&now-ev.time<1500?ev:null;
 const supremo=useGame(s=>s.supremo),lastSkill=useGame(s=>s.lastSkill),supremoFull=supremo>=SUPREMO_MAX,supremoStyle={'--sup':`${Math.round(supremo/SUPREMO_MAX*360)}deg`} as CSSProperties;
 const comboFor=(id?:string)=>!!id&&!!lastSkill&&lastSkill.id!==id&&now-lastSkill.time<=COMBO_WINDOW_MS;
 const castAt=(kind:'attack'|'power'|'skill',skill?:string)=>fresh&&fresh.kind===kind&&(!skill||fresh.skill===skill)?fresh.time:null;
 const monster=identity ? MONSTERS.find(m=>m.id===identity&&m.region===hero.region&&(m.instance??null)===(hero.instance??null)) : undefined;
 const point=monster&&monsterPoint(monster,now,hero.position);
 const inRange=!!encounter||!!point&&Math.hypot(hero.position[0]-point[0],hero.position[1]-point[1])<=attackRange(hero)+.5; // mesma folga que o ataque aceita na loja
 const rangeLabel=monster ? (inRange?'Ao alcance':'Fora de alcance') : undefined;
 const canAuto=hero[attack.resource]>=attack.cost&&(!attack.bow||arrows>0);
 const attackLabel=attack.bow?`Disparar · ${arrows} flechas`:attack.weapon?'Atacar':'Socar';
 useEffect(()=>{if(!automatic||!identity)return;const stop=()=>setAutomatic(false),visibility=()=>{if(document.hidden)stop();};const timer=setInterval(()=>{const s=useGame.getState(),attack=basicAttack(s.hero),step=autoAttackStep({identity:s.encounter?.monsterId??s.target,dead:s.hero.dead,stamina:s.hero.stamina,canAttack:s.hero[attack.resource]>=attack.cost&&(!attack.bow||s.hero.inventory.includes(HUNTER_ARROW)),encounter:!!s.encounter,queued:!!s.queued,hidden:document.hidden},identity);if(step==='stop')stop();else if(step==='attack')s.attack();else if(step==='approach')s.act({kind:'attack'});},700);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',visibility);return()=>{clearInterval(timer);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',visibility);};},[automatic,identity]);
 const usable=Object.values(ITEMS).filter(i=>i.effect&&!i.effect.teleport&&hero.inventory.includes(i.id)&&!itemRequirement(hero,i)),foods=usable.filter(i=>i.category==='food'),potions=usable.filter(i=>i.category==='consumable');
 const quick=(kind:'food'|'potion')=>{const list=kind==='food'?foods:potions,id=(kind==='food'?food:potion),item=list.find(i=>i.id===id)??list[0],left=Math.max(0,Math.ceil(((cooldowns.consumable??0)-now)/1000));return <div className={`quick-item quick-${kind}`}><button className="quick-use" aria-label={`${kind==='food'?'Usar alimento':'Usar poção'}${item?': '+item.name:''}`} disabled={!item||left>0} title={item?.name??'Sem itens na mochila'} onClick={()=>item&&useGame.getState().useItem(item.id)}>{item?<ItemArtwork item={item}/>:<span>{kind==='food'?'♨':'♜'}</span>}<small>{left?left+'s':item?'×'+countItem(hero.inventory,item.id):kind==='food'?'Alimento':'Poção'}</small></button><select aria-label={kind==='food'?'Escolher alimento rápido':'Escolher poção rápida'} disabled={!list.length} value={item?.id??''} onChange={e=>kind==='food'?setFood(e.target.value):setPotion(e.target.value)}>{!list.length&&<option value="">Vazio</option>}{list.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></div>;};
 const positions=[[1,1],[1,2],[1,3],[2,1],[2,3],[3,1],[3,2],[3,3],[4,2]];
 return <section className={`combat-pad combat-console ${!identity?'without-target':''} ${automatic?'auto-active':''}`} aria-label="Controle de combate"><div className="combat-console-head"><span>{automatic?'Ataque automático':'Combate'}</span>{!powerLock&&<button className={`class-power${supremoFull?" supremo-ready":""}`} style={supremoStyle} disabled={hero.mp<18} onClick={()=>useGame.getState().act({kind:'power'})} aria-label={'Poder da classe: '+(specOf(hero)?.power??CLASSES[hero.classId].skill)} title={'R · '+(specOf(hero)?.power??CLASSES[hero.classId].skill)}>✦</button>}</div><div className="combat-console-grid">
 {attack.bow&&<div className="hunter-desktop-status"><b>{arrows} flechas</b>{rangeLabel&&<span>{rangeLabel}</span>}</div>}
 <button className="desktop-attack" aria-label={`1: ${attackLabel}`} title={`1 · ${attackLabel}`} disabled={!identity} onClick={()=>useGame.getState().act({kind:'attack'})}><kbd>1</kbd><span aria-hidden="true">⚔</span><CastFx at={castAt('attack')} crit={fresh?.critical}/></button>
 <button className="auto-attack" aria-pressed={automatic} aria-label={automatic?'Parar ataque automático':'Iniciar ataque automático'} title="Ataque automático · toque novamente para parar" disabled={!identity||!canAuto&&!automatic} onClick={()=>{setAutomatic(!automatic);if(!automatic)useGame.getState().act({kind:'attack'});}}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
   <path d="m4 4 5 1 9 9-3 3-9-9-2-4Zm16 0-5 1-3 3m-3 3-3 3 3 3 3-3m-8 2 4 4m8-4 4 4M4 20l2-2m12 0 2 2"/>
  </svg><small>{automatic?'PARAR':'AUTO'}</small></button>
 {Array.from({length:BAR_SLOTS},(_,i)=>{const key=keyForBar(i),id=hero.hotbar[i],item=id?.startsWith('item:')?ITEMS[id.slice(5)]:undefined,skill=SKILLS[id],rank=skill?effectiveSkillRank(hero,skill.id):0,left=skill?Math.max(0,Math.ceil(((cooldowns[skill.id]??0)-now)/1000)):item?Math.max(0,Math.ceil(((cooldowns.consumable??0)-now)/1000)):0,available=item?hero.inventory.includes(item.id)&&!itemRequirement(hero,item)&&!item.effect?.teleport:skill&&rank>0&&hero[skill.resource]>=skill.cost;
 const broke=!!skill&&rank>0&&hero[skill.resource]<skill.cost,frac=skill&&left>0?((cooldowns[skill.id]??0)-now)/(skill.cooldown*1000):left>0?1:0,cast=skill?castAt('skill',skill.id):null;
 return <button className={`console-skill${left > 0 ? " recharging" : ""}${!item && !skill ? " empty-skill" : ""}${available&&!left?" is-ready":""}${broke?" no-resource":""}${available&&!left&&comboFor(skill?.id)?" combo-ready":""}`} key={key} style={{gridRow:positions[i][0],gridColumn:positions[i][1],...cdStyle(frac)}} disabled={!available||left>0} aria-label={`${key}: ${item?.name??skill?.name??'Vincule em Talentos'}`} title={item?.name??skill?.description??'Escolha uma habilidade em Talentos e vincule à barra'} onClick={()=>{if(item)useGame.getState().useItem(item.id);else if(skill)useGame.getState().act({kind:'skill',skill:skill.id});}}><kbd>{key}</kbd>{item?<ItemArtwork item={item}/>:skill?<SkillArtwork skill={skill}/>:<span>◇</span>}{left>0&&<b className="cooldown-cover">{left}</b>}{broke&&skill&&<em className="fx-broke">{RES_LABEL[skill.resource as 'mp'|'stamina']??'SEM RECURSO'}</em>}<CastFx at={cast} crit={!!cast&&fresh?.critical} combo={!!cast&&fresh?.combo}/></button>;})}
 {quick('food')}{quick('potion')}</div>
 <div className={`radial-hud${utilities?" utilities-open":""}`} aria-label="Controles de toque">
  {[0,1,2].map(i=>{
    const id=hero.hotbar[i];
    const item=id?.startsWith('item:')?ITEMS[id.slice(5)]:undefined;
    const skill=SKILLS[id];
    const action=item??skill;
    const cooldown=item?'consumable':skill?.id;
    const left=cooldown?Math.max(0,Math.ceil(((cooldowns[cooldown]??0)-now)/1000)):0;
    const available=item ? hero.inventory.includes(item.id)&&!itemRequirement(hero,item)&&!item.effect?.teleport
      : skill&&effectiveSkillRank(hero,skill.id)>0&&hero[skill.resource]>=skill.cost;
    const broke=!!skill&&effectiveSkillRank(hero,skill.id)>0&&hero[skill.resource]<skill.cost,frac=skill&&left>0?((cooldowns[skill.id]??0)-now)/(skill.cooldown*1000):left>0?1:0,cast=skill?castAt('skill',skill.id):null;
    return <button key={'r'+i} style={cdStyle(frac)} className={`radial-skill radial-skill-${i+1}${left>0?' recharging':''}${action?'':' empty-skill'}${available&&!left?' is-ready':''}${broke?' no-resource':''}${available&&!left&&comboFor(skill?.id)?' combo-ready':''}`}
      disabled={!available||left>0} aria-label={`Atalho ${i+1}: ${action?.name??'vazio, escolha em Talentos'}`}
      onClick={()=>{if(item)useGame.getState().useItem(item.id);else if(skill)useGame.getState().act({kind:'skill',skill:skill.id});}}>
      {item?<ItemArtwork item={item}/>:skill?<SkillArtwork skill={skill}/>:<span>◇</span>}
      <small>{i+1}</small>{left>0&&<b className="cooldown-cover">{left}s</b>}<CastFx at={cast} crit={!!cast&&fresh?.critical} combo={!!cast&&fresh?.combo}/>
    </button>;
  })}
  {!powerLock&&<button className={`radial-power${supremoFull?" supremo-ready":""}`} style={supremoStyle} disabled={hero.mp<18} onClick={()=>useGame.getState().act({kind:'power'})} aria-label={'Poder da classe: '+(specOf(hero)?.power??CLASSES[hero.classId].skill)}>✦<small>{supremoFull?'Supremo':'Poder'}</small><CastFx at={castAt('power')} crit={fresh?.critical} supremo={!!castAt('power')&&fresh?.supremo}/></button>}
  {attack.bow&&<div className={`hunter-ammo${arrows===0?' empty':''}`}><b>{arrows}</b> flechas</div>}
  <button className={`radial-attack${attack.bow&&monster?(inRange?' target-in-range':' target-out-of-range'):''}`} disabled={!identity} aria-label={attackLabel} onClick={()=>useGame.getState().act({kind:'attack'})}><span aria-hidden="true">{attack.bow?'↗':attack.weapon?'⚔':'✊'}</span><b>{attack.bow?(rangeLabel??"Disparar"):attackLabel}</b><CastFx at={castAt('attack')} crit={fresh?.critical}/></button>
  <button className="radial-auto" aria-pressed={automatic} disabled={!identity||!canAuto&&!automatic} onClick={()=>{setAutomatic(!automatic);if(!automatic)useGame.getState().act({kind:'attack'});}} aria-label={automatic?'Parar ataque automático':'Ataque automático'}>◎<small>{automatic?'Parar':'Auto'}</small></button>
  <button className="radial-more" aria-expanded={utilities} aria-label={utilities?"Recolher ações rápidas":"Mostrar ações rápidas"} onClick={()=>setUtilities(!utilities)}>{utilities?'×':'⋯'}<small>Ações</small></button>
  <button className="radial-run" aria-pressed={!walking} onClick={()=>useGame.getState().toggleWalk()} aria-label={walking?'Correr':'Caminhar'}>{walking?'🚶':'🏃'}<small>{walking?'Andar':'Correr'}</small></button>
  <button className="radial-sit" aria-pressed={sitting} disabled={!!identity&&!!useGame.getState().encounter} onClick={()=>useGame.getState().toggleSit()} aria-label={sitting?'Levantar':'Sentar para recuperar'}>🧘<small>{sitting?'Levantar':'Sentar'}</small></button>
  {hero.classId==='shaman'&&hero.level>=WOLF_FORM_LEVEL&&<button className="radial-wolf" aria-pressed={wolfForm} disabled={!!useGame.getState().encounter||!!hero.instance} onClick={()=>useGame.getState().toggleWolf()} aria-label={wolfForm?'Voltar à forma normal':'Forma de Lobo'}>🐺<small>{wolfForm?'Voltar':'Lobo'}</small></button>}
  {(['food','potion'] as const).map(kind=>{const list=kind==='food'?foods:potions,id=kind==='food'?food:potion,item=list.find(i=>i.id===id)??list[0],left=Math.max(0,Math.ceil(((cooldowns.consumable??0)-now)/1000));return <button key={kind} className={`radial-${kind}`} disabled={!item||left>0} onClick={()=>item&&useGame.getState().useItem(item.id)} aria-label={(kind==='food'?'Comer: ':'Poção: ')+(item?.name??'nenhum')}>{item?<ItemArtwork item={item}/>:<span>{kind==='food'?'🍞':'🧪'}</span>}<small>{left?left+'s':item?'×'+countItem(hero.inventory,item.id):'—'}</small></button>;})}
 </div></section>;
}
export default function CombatHotbar({paused}:{paused:boolean}){
 const dead=useGame(s=>s.hero.dead),enemy=useGame(s=>s.encounter),target=useGame(s=>s.target);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(paused||e.repeat||e.altKey||e.ctrlKey||e.metaKey||isEditingTarget(e.target))return;const s=useGame.getState(),index=hotbarIndex(e.key);if(index===ATTACK_SLOT||e.key.toLowerCase()==='f'){e.preventDefault();s.act({kind:'attack'});}else if(index>0){e.preventDefault();const id=s.hero.hotbar[barForKey(e.key)];if(id){if(id.startsWith('item:'))s.useItem(id.slice(5));else s.act({kind:'skill',skill:id});}}else if(e.key.toLowerCase()==='r'){e.preventDefault();s.act({kind:'power'});}else if(e.key.toLowerCase()==='l'&&s.hero.classId==='shaman'&&!Object.values(s.settings.keybindings??{}).includes('l')){e.preventDefault();s.toggleWolf();}else if(e.key==='Escape'&&!s.encounter)s.setTarget(null);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[paused]);
 const identity=enemy?.monsterId??target;
 if(dead||paused)return null;
 return <Controls key={identity??"peace"} identity={identity??null}/>;
}
