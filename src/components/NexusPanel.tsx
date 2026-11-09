"use client";
import {useGame} from '@/lib/store';
import {cleanNexus,nexusGoal,NEXUS_SECONDS} from '@/lib/nexus';
/** Cristal de Lion: barra de carga do Nexus e o botão da Aura do Herói. */
export default function NexusPanel(){
 const hero=useGame(s=>s.hero),n=cleanNexus(hero.nexus),goal=nexusGoal(hero.level),pct=Math.min(100,Math.round(n.charge/goal*100));
 return <section className="nexus-panel" aria-label="Cristal da praça">
  <h4>✦ Cristal da praça</h4>
  {n.aura>0?<p>Aura ativa: <b>{Math.floor(n.aura/60)}:{String(n.aura%60).padStart(2,'0')}</b> · +12% ATQ · +12% DEF · +10% HP</p>:<p>Cada XP que você ganha carrega o cristal. Cheio, ele concede a Aura do Herói por {NEXUS_SECONDS/60} minutos de jogo.</p>}
  <div className="nexus-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={n.charge}><i style={{width:`${n.aura>0?100:pct}%`}}/><span>{n.aura>0?'Aura ativa':`${n.charge} / ${goal} XP · ${pct}%`}</span></div>
  <button className="primary" disabled={n.aura>0||n.charge<goal||hero.dead} onClick={()=>useGame.getState().claimNexus()}>{n.aura>0?'Aura em uso':n.charge<goal?'Ainda carregando':'Receber a Aura do Herói'}</button>
 </section>;
}
