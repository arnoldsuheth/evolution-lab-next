import { scenicTrail } from '@/lib/scenicTrails';
import { waterwayOf, waterwaySegments } from '@/lib/waterways';
import { biomeOf, isWater } from '@/lib/biomes';

export default function BiomeMap({region,local}: {region:string;local:boolean}){
  const biome=biomeOf(region);
  if(!biome)return null;
  const river=waterwayOf(region),trail=scenicTrail(region);
  return <g>{biome.landmarks.map(mark=>{
    const {name,x,z,rx,rz,kind}=mark;
    const color=kind==='water'?'#427b92':kind==='lava'?'#af542e':kind==='ice'?'#b1c8c9':kind==='volcano'?'#9c5c52':'#716d58';
    return <g key={name} transform={`translate(${x} ${z})`}>
      <ellipse rx={rx} ry={rz} fill={color} fillOpacity=".8" stroke={kind==='ice'?'#dce8db':'#b6a784'} strokeWidth=".4"><title>{name}</title></ellipse>
      {!isWater(mark)&&<path d={`M${-.54*rx} ${.27*rz} ${-.17*rx} ${-.46*rz} 0 ${-.14*rz} ${.22*rx} ${-.59*rz} ${.62*rx} ${.27*rz}Z`}
        fill={kind==='ice'?'#e3ede9':kind==='volcano'?'#773f3a':'#514c41'} opacity=".72"/>}
      {!local&&<text y={isWater(mark)?0:rz*.43} textAnchor="middle">{name}</text>}
    </g>;
  })}
    {river&&<g>
      <polyline points={river.points.map(p=>p.join(',')).join(' ')} fill="none" stroke={river.type==='lava'?'#bb5834':'#6097a7'}
        strokeWidth={river.width} strokeLinejoin="round" strokeLinecap="round"><title>{river.name}</title></polyline>
      {waterwaySegments(river).filter(s=>s.bridge).map(s=><line key={s.cx+':'+s.cz}
        x1={s.cx-s.uz*(river.width/2+1)} x2={s.cx+s.uz*(river.width/2+1)}
        y1={s.cz+s.ux*(river.width/2+1)} y2={s.cz-s.ux*(river.width/2+1)}
        stroke="#e2c597" strokeWidth="1.6"/>)}
    </g>}
    {trail&&<polyline points={trail.points.map(p=>p.join(',')).join(' ')} fill="none" stroke="#c9b284" strokeWidth=".8" strokeDasharray="1.3 1">
      <title>{trail.name}</title>
    </polyline>}
  </g>;
}
