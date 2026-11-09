"use client";
import { useGame } from "@/lib/store";
import { FLYING_MOUNTS, FLYING_MOUNT_PRICE, MOUNT_VENDOR } from "@/lib/flyingMounts";
import { MOUNTS, mountOf, mountAvailable } from "@/lib/adventure";
/** Lovelace (prévia 7): painéis agrupados com abas. Crônicas = Códice + Jornada + Aventura; Estudos e Legado. */
export const PANEL_GROUPS = [
  { title: 'Crônicas do Reino', tabs: [{ id: 'codex', label: 'Códice' }, { id: 'journey', label: 'Jornada' }, { id: 'adventure', label: 'Aventura' }] },
  { title: 'Estudos e Legado', tabs: [{ id: 'academy', label: 'Estudos' }, { id: 'ancestors', label: 'Legado' }] },
] as const;
export const groupOf = (panel: string) => PANEL_GROUPS.find(g => g.tabs.some(t => t.id === panel));
export function PanelGroupTabs({ active, go }: { active: string; go: (panel: never) => void }) {
  const group = groupOf(active);
  if (!group) return null;
  return <nav className="panel-group-tabs" role="tablist" aria-label={group.title}>
    {group.tabs.map(t => <button key={t.id} role="tab" aria-selected={t.id === active} className={t.id === active ? 'active' : ''} onClick={() => go(t.id as never)}>{t.label}</button>)}
  </nav>;
}

const MOUNT_ICON: Record<string, string> = { wolf: '🐺', boar: '🐗', griffin: '🦅', dragon: '🐉' };
/** Montarias de nível 15, 25 e 50: a melhor liberada é usada ao montar. */
export function MountsPanel() {
  const hero = useGame(s => s.hero), mounted = useGame(s => s.mounted), current = mountOf(hero);
  const vendor=hero.region==="goddard"&&Math.hypot(hero.position[0]-MOUNT_VENDOR[0],hero.position[1]-MOUNT_VENDOR[1])<=4;
  return <div className="panel-body mounts-panel">
    {vendor&&<section><h4>Estábulo aéreo de Goddard</h4><p>Nível 50 · 15 prata · qualquer classe</p>
      <div className="tabs">{FLYING_MOUNTS.map(m=><button key={m.id} type="button" disabled={hero.level<50||hero.gold<FLYING_MOUNT_PRICE||hero.flyingMount===m.id} onClick={()=>useGame.getState().buyFlyingMount(m.id)}>{m.name}{hero.flyingMount===m.id?" · escolhida":""}</button>)}</div>
    </section>}
    <p>Ao montar, você usa a melhor montaria que já liberou. Montar fica fora de combate e de masmorras.</p>
    <div className="mount-list">{MOUNTS.map(m => { const open = mountAvailable(hero,m), active = current?.id === m.id; return <article key={m.id} className={`mount-card${open ? '' : ' locked'}${active ? ' active' : ''}`}>
      <span className="mount-icon" aria-hidden>{MOUNT_ICON[m.id]}</span>
      <div><h4>{m.id==="griffin"?(FLYING_MOUNTS.find(v=>v.id===hero.flyingMount)?.name??"Voadora de Goddard"):m.name}</h4><p>{m.id==="griffin"&&!hero.flyingMount?"Adquira no estábulo aéreo de Goddard.":m.text}</p><small>{open ? `Velocidade ×${m.speed}` : `Requer nível ${m.level}${m.id==="dragon"?" e a escama":""}`}{active ? ' · em uso' : ''}</small></div>
      <b className="mount-level">Nível {m.level}</b></article>; })}</div>
    <button className="primary" disabled={!current} onClick={() => useGame.getState().toggleMount()}>{mounted ? 'Desmontar' : current ? `Montar ${current.name}` : `Nível ${MOUNTS[0].level} para montar`}</button>
  </div>;
}
