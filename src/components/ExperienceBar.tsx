import {experienceProgress} from '@/lib/experience';
import {accrueRest,cleanAdventure} from '@/lib/adventure';
import {useGame} from '@/lib/store';
export default function ExperienceBar({hero}:{hero:{xp:number;level:number;adventure?:unknown;defeatedBosses?:string[]}}){
 const pending=useGame(s=>s.restPending),rested=accrueRest(cleanAdventure(hero.adventure),hero.level,pending).rested;
 const p=experienceProgress(hero.xp,hero.level,hero.defeatedBosses?.includes("boss-master")?80:60),n=(v:number)=>v.toLocaleString('pt-BR');
 return <section className="experience-hud" aria-label="Experiência do personagem">
  <div className="experience-track" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent} aria-valuetext={`${n(p.earned)} de ${n(p.required)} XP. Faltam ${n(p.remaining)} XP. Total ${n(p.total)} XP. ${p.percent}%.`}>
   <span className="experience-fill" style={{width:`${p.percent}%`}}/>{rested>0&&p.nextLevel&&<span className="experience-rested" title={`Descansado: +${rested} XP extra nas próximas lutas`} style={{left:`${p.percent}%`,width:`${Math.min(100-p.percent,rested/p.required*100)}%`}}/>}
   <div className="experience-inline"><strong>NV {p.level}{p.nextLevel?` → ${p.nextLevel}`:' · máximo'}{rested>0&&<em className="rested-tag" title="XP descansado: as próximas lutas dão XP dobrado"> 💤 ×2</em>}</strong><span>{n(p.earned)} / {n(p.required)} XP · {p.percent}%</span><span>{p.nextLevel?`Faltam ${n(p.remaining)}`:'Máximo'} <small>· Total {n(p.total)}</small></span></div>
  </div>
 </section>;
}
