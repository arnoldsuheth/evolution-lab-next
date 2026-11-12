import { cityMarket } from '@/lib/cityMarket';

export default function MarketMap({region}: {region:string}) {
  const stalls=cityMarket(region);
  if (!stalls.length) return null;
  return <g><title>Mercado da cidade</title>{stalls.map(({id,point:[x,z],color,name}) =>
    <rect key={id} x={x-.73} y={z-.42} width="1.46" height=".84" rx=".15" fill={color} stroke="#ffdfaa" strokeWidth=".21"><title>{name}</title></rect>)}</g>;
}
