import {experienceProgress} from '@/lib/experience';
export default function ExperienceBar({hero}:{hero:{xp:number;level:number}}){
 const p=experienceProgress(hero.xp,hero.level),n=(v:number)=>v.toLocaleString('pt-BR');
 return <section className="experience-hud" aria-label="Experiência do personagem">
  <div className="experience-track" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent} aria-valuetext={`${n(p.earned)} de ${n(p.required)} XP. Faltam ${n(p.remaining)} XP. Total ${n(p.total)} XP. ${p.percent}%.`}>
   <span className="experience-fill" style={{width:`${p.percent}%`}}/>
   <div className="experience-inline"><strong>NV {p.level}{p.nextLevel?` → ${p.nextLevel}`:' · máximo'}</strong><span>{n(p.earned)} / {n(p.required)} XP · {p.percent}%</span><span>{p.nextLevel?`Faltam ${n(p.remaining)}`:'Máximo'} <small>· Total {n(p.total)}</small></span></div>
  </div>
 </section>;
}
