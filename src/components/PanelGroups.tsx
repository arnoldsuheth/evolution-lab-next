"use client";
import { useGame } from "@/lib/store";
import { MOUNTS, mountOf } from "@/lib/adventure";
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

const MOUNT_ICON: Record<string, string> = { wolf: '🐺', boar: '🐗', griffin: '🦅' };
/** Montarias de nível 15, 25 e 50: a melhor liberada é usada ao montar. */
export function MountsPanel() {
  const level = useGame(s => s.hero.level), mounted = useGame(s => s.mounted), current = mountOf({ level });
  return <div className="panel-body mounts-panel">
    <p>Ao montar, você usa a melhor montaria que já liberou. Montar fica fora de combate e de masmorras.</p>
    <div className="mount-list">{MOUNTS.map(m => { const open = level >= m.level, active = current?.id === m.id; return <article key={m.id} className={`mount-card${open ? '' : ' locked'}${active ? ' active' : ''}`}>
      <span className="mount-icon" aria-hidden>{MOUNT_ICON[m.id]}</span>
      <div><h4>{m.name}</h4><p>{m.text}</p><small>{open ? `Velocidade ×${m.speed}` : `Libera no nível ${m.level}`}{active ? ' · em uso' : ''}</small></div>
      <b className="mount-level">Nível {m.level}</b></article>; })}</div>
    <button className="primary" disabled={!current} onClick={() => useGame.getState().toggleMount()}>{mounted ? 'Desmontar' : current ? `Montar ${current.name}` : `Nível ${MOUNTS[0].level} para montar`}</button>
  </div>;
}
