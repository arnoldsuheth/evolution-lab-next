import { MONSTERS, REGIONS, type RegionId } from '@/lib/campaign';
import { INSTANCES, type InstanceId } from '@/lib/instances';
import { cityBuildings, isNewCity, trainerHouses } from '@/lib/kingdomCities';
import { ORE_VEINS } from '@/lib/mining';
import { areaDestinations, regionPins, type MapPin } from '@/lib/questNavigation';
import { REGION_PILLARS } from '@/lib/navigation';
import { worldViewBox } from '@/lib/worldBounds';
import MarketMap from "./MarketMap";
import MapRoads from './MapRoads';
import { CitadelMap } from './CitadelMap';

export default function AreaMap({ region, instance, position, local=false, focus, route=[], locked=false }: {
  region: RegionId; instance?: InstanceId | null; position?: [number, number]; local?: boolean;
  focus?: MapPin; route?: [number, number][]; locked?: boolean;
}) {
  if (region === 'aurora' && !instance) return <CitadelMap position={position} local={local} focus={focus} route={route} />;
  const city = !instance && isNewCity(region) ? region : undefined;
  const viewBox = local && position ? `${position[0]-13} ${position[1]-13} 26 26`
    : instance ? '-14 -25 28 39'
    : city === 'goddard' ? '-21 -23 42 37'
    : worldViewBox();
  const pins = instance ? [] : regionPins(region);
  const portals = instance ? [{ name: "Saída", point: [0,10] }] : areaDestinations(region);
  return <svg className="area-map" viewBox={viewBox} role="img" aria-label={instance ? `Mapa de ${INSTANCES[instance].name}` : `Mapa de ${REGIONS[region].name}`}>
    <rect x="-120" y="-120" width="240" height="240" fill={instance ? '#28313d' : REGIONS[region].color} />
    {city && <>
      <rect x={city==='goddard'?-18.5:-2.5} y={city==='goddard'?-15.5:-14.5} width={city==='goddard'?37:5} height={city==='goddard'?27:25} fill="#8e836b" />
      {(city==='goddard'?cityBuildings(city):[...cityBuildings(city).slice(0,2),...trainerHouses(city)]).map(({x,z,w,d}) => <rect key={x+':'+z} x={x-w} y={z-d} width={2*w} height={2*d} fill="#d5c2a3" stroke="#574844" strokeWidth=".35" />)}
    </>}
    {!instance&&<><MapRoads region={region}/><MarketMap region={region}/></>}
    {!city && !instance && REGION_PILLARS.map(({x,z})=><circle key={x+':'+z} cx={x} cy={z} r="1.6" fill="#71675e" />)}
    {!locked && MONSTERS.filter(m=>m.region===region&&(m.instance??null)===(instance??null)).map(m=><circle key={m.id} cx={m.x} cy={m.z} r={m.boss?1:.65} fill={m.boss?'#ffd077':'#b93f41'}><title>{m.name} · nível {m.level}</title></circle>)}
    {!instance && ORE_VEINS.filter(v=>v.region===region&&!v.instance).map(v=><circle key={v.id} cx={v.x} cy={v.z} r=".65" fill={v.color}><title>{v.name}</title></circle>)}
    {portals.map(({name,point:[x,z]})=><circle key={name} cx={x} cy={z} r="1.1" fill={name.startsWith("Estrada")?"#e2b878":"#7dd8d4"}><title>{name}</title></circle>)}
    {position && route.length>0 && <polyline points={[position,...route].map(p=>p.join(',')).join(' ')} fill="none" stroke="#72e5eb" strokeWidth=".65" />}
    {pins.map(({name,point:[x,z]})=><circle key={name} cx={x} cy={z} r=".75" fill="#ffe6a3" stroke="#382f2e" strokeWidth=".2"><title>{name}</title></circle>)}
    {focus && <g transform={`translate(${focus.point.join(' ')})`}><circle r="1.25" fill="#72e5eb" stroke="#09212f" strokeWidth=".3" /><title>{focus.name}</title>{!local && <text x="1.6" y=".4">{focus.name}</text>}</g>}
    {position && <circle cx={position[0]} cy={position[1]} r=".9" fill="#fff7db" stroke="#16283b" strokeWidth=".4"><title>Você</title></circle>}
  </svg>;
}
