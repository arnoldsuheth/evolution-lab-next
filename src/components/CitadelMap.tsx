"use client";

import { INSTANCES } from "@/lib/instances";
import { MONSTERS } from "@/lib/campaign";
import { BUILDINGS } from "@/lib/navigation";
import { CITADEL_SECTORS, ROADS, TOWN_SERVICES, type Point } from "@/lib/town";

export function CitadelMap({ position, local = false, route = [], selected }: {
  position?: Point;
  local?: boolean;
  route?: Point[];
  selected?: string;
}) {
  const cave = INSTANCES.cavern;
  const view = local && position ? `${position[0] - 13} ${position[1] - 13} 26 26` : "-37 -43 74 66";
  return (
    <svg viewBox={view} role="img" aria-label={local ? "Minimapa da Cidadela" : "Mapa da Cidadela"}>
      <rect x="-110" y="-110" width="220" height="220" fill="#16283b" />
      <path d="M-44 -44H17L12 -21L-44 -16ZM18 -26H40V-8H19Z" fill="#253b46" />
      <g strokeLinecap="round">
        <path d="M-1.5 -16H23.5" stroke="#85795d" strokeWidth="3" />
        {ROADS.map(({ id, a, b, width, kind }) => (
          <line key={id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={width} stroke={kind === "road" ? "#8e836b" : "#685f58"} />
        ))}
      </g>
      <circle r="5.8" fill="#8e836b" stroke="#ccb079" strokeWidth=".4" />
      <circle r="1.25" fill="#6bd4dd" />
      {BUILDINGS.map(({ x, z, w, d }) => <rect key={x} x={x - w} y={z - d} width={w * 2} height={d * 2} rx=".5" fill="#3c4f73" stroke="#a28a61" strokeWidth=".35" />)}
      {!!route.length && position && (
        <polyline points={[position, ...route].map(point => point.join(",")).join(" ")} fill="none" stroke="#72e5eb" strokeWidth=".6" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {CITADEL_SECTORS.map(({ short, name, x, z, entrance }) => {
        const active = name === selected;
        return <g key={name}>
          <circle cx={active ? entrance[0] : x} cy={active ? entrance[1] : z} r={active ? 1.05 : .7} fill={active ? "#72e5eb" : "#ebca87"} />
          {!local && <text x={x + (x < 0 ? -1.5 : 1.5)} y={z + .45} textAnchor={x < 0 ? "end" : "start"}>{short}</text>}
        </g>;
      })}
      {TOWN_SERVICES.map(({ id, name, short, x, z }) => (
        <g key={id} transform={`translate(${x},${z})`}>
          <title>{name}</title>
          <rect x="-.65" y="-.65" width="1.3" height="1.3" rx=".2" fill={selected === name ? "#72e5eb" : "#f0d199"} />
          {!local && <text x={x < 0 ? -1.3 : 1.3} y=".45" textAnchor={x < 0 ? "end" : "start"}>{short}</text>}
        </g>
      ))}
      {!local && MONSTERS.filter(monster => monster.region === "aurora" && !monster.instance).map(monster => (
        <circle key={monster.id} cx={monster.x} cy={monster.z} r={monster.boss ? 1 : .55} fill={monster.boss ? "#efbd65" : "#df756d"}>
          <title>{monster.name} · nível {monster.level}</title>
        </circle>
      ))}
      <g transform={`translate(${cave.x},${cave.z})`}>
        <path d="M-1.2 .65 0 -1.2 1.2 .65Z" fill={selected === cave.name ? "#72e5eb" : "#ebca87"} />
        {!local && <text x="2" y=".5">Caverna · {cave.level}+</text>}
      </g>
      {!local && <g>
        <text x="0" y="-29.5" textAnchor="middle">Floresta</text>
        <text x="23.5" y="-18" textAnchor="middle">Minas</text>
        <text x="0" y="22" textAnchor="middle">Entrada sul</text>
        <text x="32" y="-29.5" textAnchor="middle">↑ N</text>
      </g>}
      {position && <circle cx={position[0]} cy={position[1]} r={local ? 1 : .8} fill="#fff7db" stroke="#16283b" strokeWidth=".4" />}
    </svg>
  );
}
