import { biomeOf, isWater } from '@/lib/biomes';

export default function BiomeMap({region,local}: {region:string;local:boolean}){
  const biome=biomeOf(region);
  if(!biome)return null;
  return <g>{biome.landmarks.map(mark=>{
    const {name,x,z,rx,rz,kind}=mark;
    const color=kind==='water'?'#427b92':kind==='lava'?'#af542e':kind==='ice'?'#b1c8c9':kind==='volcano'?'#9c5c52':'#716d58';
    return <g key={name} transform={`translate(${x} ${z})`}>
      <ellipse rx={rx} ry={rz} fill={color} fillOpacity=".8" stroke={kind==='ice'?'#dce8db':'#b6a784'} strokeWidth=".4"><title>{name}</title></ellipse>
      {!isWater(mark)&&<path d={`M${-.54*rx} ${.27*rz} ${-.17*rx} ${-.46*rz} 0 ${-.14*rz} ${.22*rx} ${-.59*rz} ${.62*rx} ${.27*rz}Z`}
        fill={kind==='ice'?'#e3ede9':kind==='volcano'?'#773f3a':'#514c41'} opacity=".72"/>}
      {!local&&<text y={isWater(mark)?0:rz*.43} textAnchor="middle">{name}</text>}
    </g>;
  })}</g>;
}
