"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { MONSTERS, REGIONS, regionRequirement, type RegionId } from "@/lib/campaign";
import { findPath } from "@/lib/navigation";
import { CITADEL_SECTORS } from "@/lib/town";
import { CitadelMap } from "./CitadelMap";

export default function WorldMap() {
  const hero = useGame(s => s.hero);
  const education = useGame(s => s.education);
  const [region, setRegion] = useState<RegionId>(hero.region);
  const [selection, setSelection] = useState("");
  const reason = regionRequirement(hero, education, region);
  const sector = CITADEL_SECTORS.find(entry => entry.name === selection);
  const position = region === hero.region && !hero.instance ? hero.position : undefined;
  const route = region === "aurora" && sector && position
    ? findPath(position, sector.entrance, education.completed.includes("variables"), education.completed.includes("conditions") && hero.defeatedBosses.includes("boss-forest"))
    : [];
  const map = (coordinate: number) => 50 + coordinate * .95;
  return <section className="panel-body world-map">
    <nav className="tabs" aria-label="Regiões">
      {(Object.keys(REGIONS) as RegionId[]).map(id => <button key={id} className={region === id ? "active" : ""} onClick={() => setRegion(id)}>{id === "aurora" ? "Cidadela" : REGIONS[id].name} · {REGIONS[id].level}+</button>)}
    </nav>
    {reason && <p>Região bloqueada. {reason}</p>}
    {region === "aurora" ? <>
      <CitadelMap position={position} route={route} selected={selection} />
      <nav className="tabs citadel-map-sectors" aria-label="Destinos da Cidadela">
        {CITADEL_SECTORS.map(({ name, short }) => <button key={name} aria-label={name} aria-pressed={selection === name} className={selection === name ? "active" : ""} onClick={() => setSelection(selection === name ? "" : name)}>{short}</button>)}
      </nav>
      <small>{!sector ? "Toque em um setor para ver a rota. O ponto claro mostra sua posição." : route.length ? `Rota em ciano até ${sector.name}.` : !position ? "Entre na Cidadela para traçar a rota." : `Destino selecionado — ${sector.name}.`}</small>
    </> : <>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Mapa de ${REGIONS[region].name}`}>
        <rect x="1" y="1" width="98" height="98" rx="6" fill={REGIONS[region].color} />
        {!reason && MONSTERS.filter(m => m.region === region && !m.instance).map(m => <g key={m.id}>
          <circle cx={map(m.x)} cy={map(m.z)} r={m.boss ? 2 : 1.3} fill={m.boss ? "#efbd65" : "#bf5352"} />
          <text x={map(m.x) + 2} y={map(m.z)}>{m.level}</text>
        </g>)}
        {position && <circle cx={map(position[0])} cy={map(position[1])} r="1.8" fill="#8ee5ff" stroke="white" strokeWidth=".5" />}
        {reason && <rect x="1" y="1" width="98" height="98" rx="6" fill="#172a36" opacity=".8" />}
      </svg>
      <small>Azul indica sua posição, vermelho indica criaturas e dourado indica chefes. Os números indicam o nível.</small>
    </>}
  </section>;
}
