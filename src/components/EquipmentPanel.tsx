"use client";
import CharacterSheet from "./CharacterSheet";
import Currency from "./Currency";
import {adventureOf,discounted,repPercent} from "@/lib/adventure";
import WorkshopServices from "./WorkshopServices";
import { QuestDialog } from "./QuestDialog";
import {currency} from "@/lib/economy";
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/lib/store';
import {ItemArtwork} from './GameArtwork';
import { ITEMS,CLASSES,stats } from '@/lib/game';
import { CATEGORY_NAMES,SLOT_NAMES,LEVEL_BANDS,type Item } from '@/lib/catalogue';
import { activeEquipment,bagCount,countItem,isEquipment,itemRequirement } from '@/lib/equipment';

function itemStats(item:Item){
 const values:[number|undefined,string][]=[
  [item.power,'ATQ'],[item.defense,'DEF'],
  [item.effect?.hp??item.hp,'HP'],[item.effect?.mp??item.mp,'MP'],
  [item.effect?.stamina??item.stamina,'EST'],[item.companion,'PET'],
 ];
 const stats=values.filter(([value])=>!!value).map(([value,label])=>`${(value??0)>0?'+':''}${value} ${label}`);
 if(item.effect?.buff&&item.effect.amount)stats.push(`+${item.effect.amount} ${{attack:'ATQ',defense:'DEF',regen:'REGEN'}[item.effect.buff]}`);
 if(item.effect?.teleport)stats.push('Retorno');
 return stats;
}

function SlotSilhouette({slot}:{slot:string}){
 const paths:Record<string,string>={
  head:'M5 19V10a7 7 0 0 1 14 0v9l-5-2v-5h-4v5Z M5 10h14',
  shoulders:'M3 8l5-3 4 3 4-3 5 3-2 7-5-2h-4l-5 2Z',
  chest:'M8 3l4 2 4-2 5 5-4 3v10H7V11L3 8Z',
  hands:'M6 12V5h3v6-8h3v8-7h3v8-5h3v9l-4 5H9l-5-7 2-2 3 3',
  legs:'M6 3h12v18h-5l-1-11-1 11H6Z',
  feet:'M6 3h8v11l6 3v4H4v-6l2-2Z',
  weapon:'M7 17L19 3l2 2L9 19 M5 14l6 6 M7 18l-4 4',
  offhand:'M12 3l8 3v7c0 4-8 8-8 8s-8-4-8-8V6Z M12 7v10 M8 11h8',
  belt:'M3 9h18v7H3Z M9 8h6v9H9Z',
  charm:'M5 3l7 10 7-10 M8 16l4-4 4 4-4 5Z',
  ring:'M8 9l4-6 4 6-4 3Z M8 10a7 7 0 1 0 8 0',
  trinket:'M12 2l3 6 6 4-6 4-3 6-3-6-6-4 6-4Z',
  back:'M8 3h8l4 18-8-3-8 3Z M8 3l4 5 4-5',
  pet:'M8 14c-6 8 14 8 8 0l-4-3Z M5 9h1 M9 5h1 M14 5h1 M18 9h1',
 };
 return <svg className="slot-silhouette" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[slot]??paths.trinket}/></svg>;
}

function EquipmentComparison({item}:{item:Item}){
 const hero=useGame(s=>s.hero);
 if(!isEquipment(item))return null;
 const occupied=item.slot==='twohand'?['weapon','offhand','twohand']:item.slot==='weapon'||item.slot==='offhand'?[item.slot,'twohand']:[item.slot];
 const worn=hero.equipped.filter(id=>hero.inventory.includes(id)).map(id=>ITEMS[id]).filter(piece=>piece&&occupied.includes(piece.slot));
 const effective=activeEquipment(hero,ITEMS).filter(piece=>occupied.includes(piece.slot));
 const fields=[['power','ATQ'],['defense','DEF'],['hp','HP'],['mp','MP'],['companion','PET']] as const;
 return <section className="equipment-comparison" aria-label="Comparação com o equipamento atual"><div className="compare-pieces"><div><small>Equipado</small>{worn.length?worn.map(piece=><div key={piece.id}><ItemArtwork item={piece}/><strong>{piece.name}</strong>{!effective.some(active=>active.id===piece.id)&&<small>Sem bônus ativo</small>}</div>):<p>Slot vazio</p>}</div><div><small>Selecionado</small><ItemArtwork item={item}/><strong>{item.name}</strong></div></div><div className="compare-numbers">{fields.map(([key,label])=>{const before=effective.reduce((sum,piece)=>sum+(piece[key]??0),0),after=item[key]??0,delta=after-before;if(before===0&&after===0)return null;return <div key={key}><span>{label}</span><span>{before} → {after}</span><b className={delta>0?'stat-good':delta<0?'stat-bad':'stat-same'}>{delta>0?'+':''}{delta}</b></div>;})}</div>{item.slot==='twohand'&&<small>Esta arma substitui as duas mãos.</small>}</section>;
}

const CATEGORY_CHIPS:[string,string][]=[['all','Todos'],['weapon','Armas'],['armor','Armaduras'],['accessory','Joias'],['consumable','Poções'],['food','Alimentos'],['material','Materiais']];
/** Diferença do atributo principal contra o que já está equipado no mesmo espaço (+ é melhor). */
function upgradeDelta(hero:ReturnType<typeof useGame.getState>['hero'],item:Item){
 if(!isEquipment(item))return null;
 const occupied=item.slot==='twohand'?['weapon','offhand','twohand']:item.slot==='weapon'||item.slot==='offhand'?[item.slot,'twohand']:[item.slot];
 const worn=activeEquipment(hero,ITEMS).filter(piece=>occupied.includes(piece.slot));
 const key=item.power>0||worn.some(p=>p.power>0)&&!item.defense?'power':'defense';
 const before=worn.reduce((sum,piece)=>sum+(piece[key]??0),0),after=item[key]??0;
 if(!before&&!after)return null;
 return {delta:after-before,label:key==='power'?'ATQ':'DEF',empty:!worn.length};
}
function DeltaBadge({info}:{info:ReturnType<typeof upgradeDelta>}){
 if(!info)return null;const {delta,label}=info;
 return <span className={`item-delta ${delta>0?'stat-good':delta<0?'stat-bad':'stat-same'}`} aria-label={delta>0?`Melhor que o equipado: +${delta} ${label}`:delta<0?`Pior que o equipado: ${delta} ${label}`:`Igual ao equipado em ${label}`}>{delta>0?'▲+':delta<0?'▼':'='}{delta!==0?delta:''} {label}</span>;
}

export default function EquipmentPanel({shop=false,vendor="borin",edit=()=>{}}:{shop?:boolean;vendor?:"borin"|"elara"|"dorin"|"mira";edit?:()=>void}){
 const mounted=useGame(s=>s.mounted);const hero=useGame(s=>s.hero),shopCut=repPercent(adventureOf(hero),'mercadores'),completed=useGame(s=>s.education.completed),encounter=useGame(s=>s.encounter);
 const detail=useRef<HTMLElement>(null);
 const [inspected,setInspected]=useState<string|null>(null);
 const [side,setSide]=useState<'buy'|'sell'>('buy');
 const [slotFilter,setSlotFilter]=useState<string|null>(null);
 const [filtersOpen,setFiltersOpen]=useState(false);
 const [view,setView]=useState(shop?'shop':'bag'),[query,setQuery]=useState(''),[category,setCategory]=useState('all'),[classFilter,setClassFilter]=useState('mine'),[rarity,setRarity]=useState('all'),[band,setBand]=useState('all'),[locked,setLocked]=useState(true),[page,setPage]=useState(0);
 const inventory=hero.inventory,limits=stats(hero);

 const all=Object.values(ITEMS);const matching=all.filter(item=>{
  if(view==='bag'||view==='sell'){if(bagCount(hero,item.id)<=0)return false;}
  if(view==='bag'&&slotFilter&&item.slot!==slotFilter&&!(slotFilter==='weapon'&&item.slot==='twohand'))return false;
  if(view==='shop'&&item.source!=='shop')return false;
  if(view==='shop'&&countItem(inventory,item.id)>=Math.max(1,item.maxStack))return false; // já tem: só aparece para vender
  if(view!=='bag'&&view!=='sell'&&item.source==='forge')return false; // versões do ferreiro só aparecem quando você as tem
  if(shop&&view==='shop'&&vendor==='mira'&&!['consumable','food'].includes(item.category))return false;
  if(shop&&view==='shop'&&vendor==='elara'&&!['mage','hunter','prophet'].includes(item.classId??'')&&!['cloth','bow','staff','wand','focus','charm'].includes(item.visual))return false;
  if(shop&&view==='shop'&&vendor==='dorin'&&!['paladin','warrior','engineer'].includes(item.classId??'')&&!['ore','parts','gadget','tool','shield'].includes(item.visual))return false;
  if(view==='forge'&&!item.ingredients&&!item.recipe)return false;
  if(query&&!`${item.name} ${item.description} ${item.id}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))return false;
  if(category!=='all'&&item.category!==category||rarity!=='all'&&item.rarity!==rarity||band!=='all'&&item.minLevel!==Number(band))return false;
  if(classFilter==='mine'&&(item.classId&&item.classId!==hero.classId||item.classes&&!item.classes.includes(hero.classId)))return false;
  if(!locked&&itemRequirement(hero,item))return false;return true;
 }).sort((a,b)=>a.minLevel-b.minLevel||a.name.localeCompare(b.name,'pt-BR'));
 const pages=Math.max(1,Math.ceil(matching.length/24)),safePage=Math.min(page,pages-1),entries=matching.slice(safePage*24,safePage*24+24);
 const sellable=shop&&view==='shop'?all.filter(item=>bagCount(hero,item.id)>0&&item.sellPrice>0&&(!query||`${item.name} ${item.description}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')):[];
 const inspectedItem=side==='sell'?sellable.find(item=>item.id===inspected):matching.find(item=>item.id===inspected);
 useEffect(()=>{if(!inspectedItem)return;detail.current?.focus({preventScroll:true});detail.current?.scrollTo({top:0});},[inspectedItem]);
 const inspect=(id:string,from:'buy'|'sell'=view==='sell'?'sell':'buy')=>{setSide(from);setInspected(id);};
 const select=(setter:(v:string)=>void)=>(e:React.ChangeEvent<HTMLSelectElement>)=>{setter(e.target.value);setPage(0);};
 const renderDetails=(item:typeof ITEMS[string])=>{const owned=countItem(inventory,item.id),equipped=hero.equipped.includes(item.id),reason=itemRequirement(hero,item);const fee=item.ingredients?Math.max(item.sellPrice+1,Math.ceil((item.craftGold??0)*(1-limits.craftDiscount/100))):0;const missing=Object.entries(item.ingredients??{}).some(([id,n])=>countItem(inventory,id)<n)||hero.materials<(item.recipe??0)||hero.gold<fee;return <><span className="eyebrow">{item.rarity} · {CATEGORY_NAMES[item.category]}</span><h4><button className="item-name" onClick={()=>inspect(item.id)}>{item.name}</button></h4><div className="item-requirements"><b className={hero.level<item.minLevel?'requirement-fail':''}>Nível {item.minLevel}+</b><span>{item.classId?CLASSES[item.classId].name:item.classes?item.classes.map(c=>CLASSES[c].name).join(' / '):'Universal'}</span><span>{SLOT_NAMES[item.slot]}{item.armor?` · ${item.armor}`:''}</span></div><p>{item.description}</p><div className="item-attributes">{item.power>0&&<span className="stat-good">+{item.power} ATQ</span>}{item.defense>0&&<span className="stat-good">+{item.defense} DEF</span>}{!!item.hp&&<span className={item.hp>0?"stat-good":"stat-bad"}>{item.hp>0?"+":""}{item.hp} HP</span>}{!!item.mp&&<span className={item.mp>0?"stat-good":"stat-bad"}>{item.mp>0?"+":""}{item.mp} MP</span>}{!!item.companion&&<span className="stat-good">+{item.companion} companheiro</span>}</div>{isEquipment(item)&&owned>0&&<small>Condição: {hero.durability?.[item.id]??100}%</small>}{owned>0&&<small>{(view==='bag'||view==='sell'?bagCount(hero,item.id):owned)} disponível(is){equipped?' · 1 no personagem':''}</small>}{reason&&<span className="requirement-fail">{reason}</span>}
 {view==='forge'&&<div className="recipe-list">{item.profession&&!hero.professions?.[item.profession]&&<small className="requirement-fail">Aprenda o ofício de aprendiz com Borin.</small>}{Object.entries(item.ingredients??{}).map(([id,n])=><small key={id} className={countItem(inventory,id)<n?'requirement-fail':''}>{ITEMS[id]?.name}: {countItem(inventory,id)} / {n}</small>)}{!!item.recipe&&<small>Fragmentos: {hero.materials} / {item.recipe}</small>}<small>Custo: <Currency value={fee}/></small>{!completed.includes('arithmetic')&&<small>Conclua O armazém de Borin para usar a forja.</small>}</div>}
 {item.effect&&<p className="item-effects">{Object.entries(item.effect).map(([key,value])=>`${({hp:"Restaura HP",mp:"Restaura MP",stamina:"Restaura estamina",buff:"Bônus",amount:"Potência",duration:"Duração (s)",teleport:"Retorno à Aurora"} as Record<string,string>)[key]??key}: ${value===true?"sim":value}`).join(" · ")}</p>}<p className="item-price">Preço de compra: <strong>{currency(discounted(item.price,shopCut))}</strong>{shopCut>0&&<span className="stat-good"> −{shopCut}%</span>}{item.sellPrice>0&&<> · Venda: {currency(item.sellPrice)}</>}</p><div className="item-actions">{view==='shop'&&side==='sell'?<button disabled={equipped||!item.sellPrice||hero.dead||!!encounter} onClick={()=>{useGame.getState().sell(item.id);if(bagCount(useGame.getState().hero,item.id)<=0)setInspected(null);}}>Vender 1 · <Currency value={item.sellPrice}/></button>:view==='shop'?<button disabled={hero.dead||!!encounter||!!reason||hero.gold<discounted(item.price,shopCut)||owned>=item.maxStack} onClick={()=>useGame.getState().buy(item.id)}>Comprar · <Currency value={discounted(item.price,shopCut)}/></button>:view==='forge'?<button disabled={hero.dead||!!encounter||hero.level<item.minLevel||missing||owned>=item.maxStack||!completed.includes('arithmetic')||!!item.profession&&!hero.professions?.[item.profession]} onClick={()=>useGame.getState().craft(item.id)}>Fabricar</button>:view==='sell'?<button disabled={equipped||!item.sellPrice||hero.dead||!!encounter} onClick={()=>useGame.getState().sell(item.id)}>{equipped?'Desequipe antes de vender':`Vender 1 · ${item.sellPrice} ◉`}</button>:view==='bag'?<>{item.mount&&equipped&&<button disabled={hero.dead||!!encounter||hero.level<30} onClick={()=>useGame.getState().toggleMount()}>{mounted?"Desmontar":"Montar"}</button>}{item.effect?<button disabled={!!reason} onClick={()=>useGame.getState().useItem(item.id)}>Usar 1</button>:isEquipment(item)?<button disabled={hero.dead||!!encounter||equipped||!!reason} className={equipped?'selected':''} onClick={()=>useGame.getState().equip(item.id)}>{equipped?'Já equipado':'Equipar'}</button>:<small>{item.category==='material'?'Utilizado nas receitas da oficina.':'Guardado na sua coleção.'}</small>}</>:<small>Obtenção: {item.source==='shop'?'loja de Borin':item.source==='trophy'?'chefes':item.source==='chest'?'baú oculto':'saque de encontro'}{item.ingredients?' ou fabricação':''}</small>}</div></>;};
 const card=(item:Item,from:'buy'|'sell')=>{const stats=itemStats(item);const price=from==='sell'?item.sellPrice:view==='forge'?Math.max(item.sellPrice+1,Math.ceil((item.craftGold??0)*(1-limits.craftDiscount/100))):shop?discounted(item.price,shopCut):item.price;const priceLabel=from==='sell'?'Venda':view==='forge'?'Custo':'Valor';const count=from==='sell'||view==='bag'?bagCount(hero,item.id):countItem(inventory,item.id);const delta=from==='buy'&&(view==='shop'||view==='catalogue'||view==='bag')?upgradeDelta(hero,item):null;
  return <button type="button" className={`item-icon rarity-${item.rarity.toLowerCase()} ${inspected===item.id&&side===from?'is-inspected':''}`} key={`${from}-${item.id}`} id={`item-${from}-${item.id}`} aria-label={`${from==='sell'?'Vender':'Examinar'} ${item.name}${stats.length?`, ${stats.join(", ")}`:""}${price>0?`, ${priceLabel.toLowerCase()} ${currency(price)}`:""}`} aria-pressed={inspected===item.id&&side===from} onClick={()=>inspect(item.id,from)}><span className="item-icon-art"><ItemArtwork item={item}/></span><span className="item-icon-name">{item.name}</span><span className="item-icon-stats" title={stats.join(' · ')}>{stats.length?stats.slice(0,2).join(' · '):CATEGORY_NAMES[item.category]}</span><span className="item-icon-meta"><span className={`item-level ${hero.level<item.minLevel?'requirement-fail':''}`} title={`Pode usar a partir do nível ${item.minLevel}`}>Nv {item.minLevel}</span><DeltaBadge info={delta}/></span>{price>0&&<span className="item-icon-price" title={`${priceLabel}: ${currency(price)}`}><Currency value={price}/></span>}{count>0&&<span className="item-icon-count">×{count}</span>}{hero.equipped.includes(item.id)&&from!=='sell'&&<span className="item-icon-equipped" aria-label="Equipado">✓</span>}</button>;};
 const views=shop&&vendor!=='borin'?[['shop','Comprar e vender'],['quests','Missões']]:shop?[['shop','Comprar e vender'],['forge','Fabricar'],['quests','Oficina'],['catalogue','Acervo']]:[['bag','Equipamento'],['character','Atributos'],['catalogue','Acervo']];
 return <div className="panel-body equipment-panel equipment-icons">
 
 <div className="inventory-toolbar"><div className="tabs">{views.map(([id,label])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id);setInspected(null);setPage(0);}} title={label} aria-label={label}><span aria-hidden="true">{({shop:"◈",forge:"⚒",sell:"◉",quests:"!",catalogue:"▦",bag:"▣",character:"♙"} as Record<string,string>)[id]}</span><small>{label}</small></button>)}</div><span className="currency" aria-label="Suas moedas"><Currency value={hero.gold}/></span>{view!=='character'&&view!=='quests'&&<button type="button" className="inventory-search" aria-label="Buscar e filtrar itens" aria-expanded={filtersOpen} aria-controls="inventory-filter-options" onClick={()=>setFiltersOpen(!filtersOpen)}><span aria-hidden="true">⌕</span></button>}</div>
 {view==='character'?<CharacterSheet edit={edit} bag={()=>setView('bag')}/>:view==='quests'?<div className="shop-quests"><QuestDialog npc={vendor}/>{vendor==="borin"&&<WorkshopServices/>}</div>:<>
 <div className="category-chips" role="tablist" aria-label="Categorias">{CATEGORY_CHIPS.map(([id,label])=><button key={id} type="button" role="tab" aria-selected={category===id} className={category===id?'active':''} onClick={()=>{setCategory(id);setPage(0);setInspected(null);}}>{label}</button>)}</div>
 <div id="inventory-filter-options" className="inventory-filters" hidden={!filtersOpen}><div className="catalogue-controls"><label>Buscar<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder="Nome, material ou tipo de item"/></label><label>Tipo<select value={category} onChange={select(setCategory)}><option value="all">Todos os tipos</option>{Object.entries(CATEGORY_NAMES).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>Classe<select value={classFilter} onChange={select(setClassFilter)}><option value="mine">Minha classe e universais</option><option value="all">Todas as classes</option></select></label><label>Nível mínimo<select value={band} onChange={select(setBand)}><option value="all">Todas as faixas</option>{LEVEL_BANDS.map(n=><option key={n} value={n}>Nível {n}+</option>)}</select></label><label>Raridade<select value={rarity} onChange={select(setRarity)}><option value="all">Todas</option>{['Comum','Incomum','Raro','Épico','Lendário','Mítico'].map(r=><option key={r}>{r}</option>)}</select></label></div>
 <label className="check-row"><input type="checkbox" checked={locked} onChange={e=>{setLocked(e.target.checked);setPage(0);}}/>Mostrar itens que ainda não posso usar</label></div>
 <div className="catalogue-summary"><b>{matching.length.toLocaleString('pt-BR')} {view==='bag'?'na mochila':'itens'}{slotFilter&&view==='bag'?` · ${SLOT_NAMES[slotFilter as keyof typeof SLOT_NAMES]}`:''}</b><span>Nv. {hero.level}</span></div>

 <div className={`unified-inventory ${view==='bag'&&!shop?'with-loadout':''}`}>
 {view==='bag'&&!shop&&<aside className="inventory-loadout" aria-label="Equipamento do personagem"><header><strong>{hero.name}</strong><small>Nível {hero.level} · {CLASSES[hero.classId].name}</small></header><div className="loadout-slots">{['head','shoulders','chest','weapon','hands','offhand','belt','legs','feet','charm','ring','trinket','back','pet'].map(slot=>{const piece=hero.equipped.map(id=>ITEMS[id]).find(i=>i&&(i.slot===slot||slot==='weapon'&&i.slot==='twohand'));return <button type="button" key={slot} data-slot={slot} data-rarity={piece?.rarity} className={slotFilter===slot?'selected':''} aria-pressed={slotFilter===slot} aria-label={`${SLOT_NAMES[slot as keyof typeof SLOT_NAMES]}: ${piece?.name??'vazio'}`} title={piece?.name??SLOT_NAMES[slot as keyof typeof SLOT_NAMES]} onClick={()=>{setSlotFilter(slotFilter===slot?null:slot);setInspected(null);setPage(0);}}>{piece?<ItemArtwork item={piece}/>:<SlotSilhouette slot={slot}/>}<small>{SLOT_NAMES[slot as keyof typeof SLOT_NAMES]}</small></button>;})}</div>{slotFilter&&hero.equipped.map(id=>ITEMS[id]).filter(i=>i&&(i.slot===slotFilter||slotFilter==='weapon'&&i.slot==='twohand')).map(piece=><button key={piece.id} className="loadout-clear" disabled={hero.dead||!!encounter} onClick={()=>useGame.getState().equip(piece.id)}>Desequipar {piece.name}</button>)}{slotFilter&&<button className="loadout-clear" onClick={()=>setSlotFilter(null)}>Mostrar toda a mochila</button>}</aside>}
 <div className={`item-browser ${inspectedItem?'has-selection':''} ${shop&&view==='shop'?'shop-browser':''}`}>
 {shop&&view==='shop'?<div className="shop-split"><section className="shop-side" aria-label="Itens à venda"><h3>Loja <small>{matching.length}</small></h3><div className="item-icon-grid">{entries.map(item=>card(item,'buy'))}{!entries.length&&<div className="empty-state">Nada novo para comprar com esses filtros.</div>}</div></section><section className="shop-side shop-bag" aria-label="Sua mochila para vender"><h3>Sua mochila <small>toque para vender</small></h3><div className="item-icon-grid">{sellable.map(item=>card(item,'sell'))}{!sellable.length&&<div className="empty-state">Nada para vender. Itens equipados não aparecem aqui: desequipe para vender.</div>}</div></section></div>
 :<div className="item-icon-grid" aria-label="Itens disponíveis">{entries.map(item=>card(item,view==='sell'?'sell':'buy'))}{!entries.length&&<div className="empty-state">{view==='bag'&&!query&&!slotFilter?'Sua mochila está vazia. Equipamentos em uso aparecem ao lado.':'Nenhum item corresponde aos filtros.'}</div>}</div>}
 {inspectedItem&&<section ref={detail} tabIndex={-1} className="item-detail-panel" aria-label={`Detalhes de ${inspectedItem.name}`}><button type="button" className="item-detail-close icon-button" aria-label="Fechar detalhes do item" onClick={()=>{const id=inspected;setInspected(null);requestAnimationFrame(()=>document.getElementById(`item-${side}-${id}`)?.focus());}}>×</button><EquipmentComparison item={inspectedItem}/><div className="item-detail-art" data-rarity={inspectedItem.rarity}><ItemArtwork item={inspectedItem}/></div>{renderDetails(inspectedItem)}</section>}
 </div></div>
 <div className="catalogue-pagination"><button disabled={safePage===0} onClick={()=>setPage(safePage-1)}>← Anterior</button><span>Página {safePage+1} de {pages}</span><button disabled={safePage>=pages-1} onClick={()=>setPage(safePage+1)}>Próxima →</button></div>
 <details className="progression-help"><summary>Como funcionam os requisitos?</summary><p>O nível indicado é mínimo: uma peça antiga pode continuar em uso. Itens de outra classe ou acima do seu nível ficam na mochila sem conceder bônus. Armas de duas mãos ocupam ambas. Cada slot aceita uma peça. Atributos são calculados somente com equipamento válido, inclusive após carregar um save antigo.</p><p>Os modelos 3D compartilham formas por tipo; o acervo não contém uma arte exclusiva para cada item.</p></details>
 {inventory.some(id=>!ITEMS[id])&&<p className="small-note">Itens antigos desconhecidos foram preservados: {inventory.filter(id=>!ITEMS[id]).join(', ')}.</p>}</>}</div>;
}


