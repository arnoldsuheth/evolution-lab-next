import { cityDefences, overlandRoads } from '@/lib/overland';
import { cityPortal, GODDARD_PORTAL_PLAZA_WIDTH } from '@/lib/kingdomCities';
import { REGIONS, type RegionId } from '@/lib/campaign';

export default function MapRoads({region}:{region:RegionId}) {
  const {walls,gates}=cityDefences(region);
  if(!walls.length)return null;
  const [px,pz]=region==='goddard'?[0,-7]:cityPortal(region);
  const plazaWidth=region==='goddard'?GODDARD_PORTAL_PLAZA_WIDTH:6;
  return <g>
    {overlandRoads(region).map(road=><g key={road.to}>
      <polyline points={road.points.map(point=>point.join(',')).join(' ')} fill="none" stroke="#d7b680" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={road.end[0]} cy={road.end[1]} r="1.2" fill="#e2b878"><title>Estrada · {REGIONS[road.to].name}</title></circle>
    </g>)}
    {walls.map(({a,b})=><line key={a.join(',')+'-'+b.join(',')} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#273445" strokeWidth="1.35"/>)}
    {gates.map(gate=><rect key={gate.name} x={gate.point[0]-.65} y={gate.point[1]-.65} width="1.3" height="1.3" rx=".2" fill="#f0dbb5"><title>{gate.name}</title></rect>)}
    <rect x={px-plazaWidth/2} y={pz-2.6} width={plazaWidth} height="5.2" rx=".65" fill="#80989c" fillOpacity=".58" stroke="#a4d9d6" strokeWidth=".3"><title>Praça dos Portais</title></rect>
  </g>;
}
