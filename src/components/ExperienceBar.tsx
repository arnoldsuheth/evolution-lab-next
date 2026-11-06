import {experienceProgress} from '@/lib/experience';
export default function ExperienceBar({hero}:{hero:{xp:number;level:number}}){
 const p=experienceProgress(hero.xp,hero.level),n=(v:number)=>v.toLocaleString('pt-BR');
 return <section className="experience-hud" aria-label="Experiência do personagem">
  <div className="experience-caption"><strong>XP · Nível {p.level}{p.nextLevel?` → ${p.nextLevel}`:' · máximo'}</strong><span>Total: {n(p.total)} XP</span></div>
  <div className="experience-track" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent} aria-valuetext={p.nextLevel?`${n(p.earned)} de ${n(p.required)} XP neste nível. Faltam ${n(p.remaining)} XP. ${p.percent}%.`:'Nível máximo alcançado. 100%.'}>
   <span className="experience-fill" style={{width:`${p.percent}%`}}/><span className="experience-numbers">{p.nextLevel?`${n(p.earned)} / ${n(p.required)} XP`:'Nível máximo alcançado'} · {p.percent}%</span>
  </div>
  <small>{p.nextLevel?`Faltam ${n(p.remaining)} XP para o nível ${p.nextLevel}`:'Você alcançou o nível máximo da campanha.'}</small>
 </section>;
}
