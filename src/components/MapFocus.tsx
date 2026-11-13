import type { MapPin } from '@/lib/questNavigation';
import { minimapBearing } from '@/lib/minimap';

export default function MapFocus({ focus, local, position }: {
  focus: MapPin;
  local: boolean;
  position?: [number, number];
}) {
  const bearing = local && position ? minimapBearing(position, focus.point) : undefined;
  if (bearing) return <g transform={`translate(${bearing.point.join(' ')}) rotate(${bearing.angle})`}>
    <title>{`Direção de ${focus.name}`}</title>
    <path d="M0 -2.45 1.9 1.65 0 .85 -1.9 1.65Z" fill="#72e5eb" stroke="#09212f" strokeWidth=".6" strokeLinejoin="round" />
  </g>;
  return <g transform={`translate(${focus.point.join(' ')})`}>
    <circle r="1.25" fill="#72e5eb" stroke="#09212f" strokeWidth=".3" />
    <title>{focus.name}</title>
    {!local && <text x="1.6" y=".45">{focus.name}</text>}
  </g>;
}
