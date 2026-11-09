"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { MONSTERS, REGIONS, regionRequirement, type RegionId } from "@/lib/campaign";
import { findPath } from "@/lib/navigation";
import { INSTANCES } from "@/lib/instances";
import { CITADEL_SECTORS, TOWN_SERVICES } from "@/lib/town";
import { isNewCity, cityBuildings, cityPortal } from "@/lib/kingdomCities";
import { ORE_VEINS } from "@/lib/mining";
import { CitadelMap } from "./CitadelMap";
import KingdomAtlas from "./KingdomAtlas";

const DESTINATIONS = [...CITADEL_SECTORS, ...TOWN_SERVICES];

export default function WorldMap() {
  const hero = useGame(s => s.hero);
  const education = useGame(s => s.education);
  const [region, setRegion] = useState<RegionId | "atlas">("atlas");
  const [selection, setSelection] = useState("");
  const reason = region === "atlas" ? undefined : regionRequirement(hero, education, region);
  const cave = INSTANCES.cavern;
  const caveSelected = selection === cave.name;
  const destination = caveSelected ? { name: cave.name, entrance: [cave.x, cave.z + 2] as [number, number] } : DESTINATIONS.find(entry => entry.name === selection);
  const position = region === hero.region && !hero.instance ? hero.position : undefined;
  const shown: RegionId = region === "atlas" ? hero.region : region;
  const route = region === "aurora" && destination && position
    ? findPath(position, destination.entrance, education.completed.includes("variables"), education.completed.includes("conditions") && hero.defeatedBosses.includes("boss-forest"))
    : [];
  const map = (coordinate: number) => 50 + coordinate * .95;
  return <section className="panel-body world-map">
    <nav className="tabs" aria-label="Regiões">
      <button className={region === "atlas" ? "active" : ""} onClick={() => setRegion("atlas")}>Atlas do Reino</button>
      {(Object.keys(REGIONS) as RegionId[]).map(id => <button key={id} className={region === id ? "active" : ""} onClick={() => setRegion(id)}>{id === "aurora" ? "Cidadela" : REGIONS[id].name} · {REGIONS[id].level}+</button>)}
    </nav>
    {reason && <p>Região bloqueada. {reason}</p>}
    {region === "atlas" ? <KingdomAtlas here={hero.instance ? undefined : hero.region} open={id => setRegion(id)} locked={id => regionRequirement(hero, education, id)} /> : region === "aurora" ? <>
      <CitadelMap position={position} route={route} selected={selection} />
      <nav className="tabs citadel-map-sectors" aria-label="Destinos da Cidadela">
        {DESTINATIONS.map(({ name, short }) => <button key={name} aria-label={name} aria-pressed={selection === name} className={selection === name ? "active" : ""} onClick={() => setSelection(selection === name ? "" : name)}>{short}</button>)}
        <button aria-pressed={caveSelected} className={caveSelected ? "active" : ""} onClick={() => setSelection(caveSelected ? "" : cave.name)}>Caverna · {cave.level}+</button>
      </nav>
      <small>{!destination ? "Toque em um destino para ver a rota. O ponto claro mostra sua posição." : route.length ? `Rota em ciano até ${destination.name}.` : !position ? "Entre na Cidadela para traçar a rota." : caveSelected && !education.completed.includes("variables") ? "Conclua a primeira runa para abrir o caminho pelo bosque." : `Destino selecionado — ${destination.name}.`}</small>
    </> : <>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Mapa de ${REGIONS[shown].name}`}>
        <rect x="1" y="1" width="98" height="98" rx="6" fill={REGIONS[shown].color} />
        {!reason && MONSTERS.filter(m => m.region === shown && !m.instance).map(m => <g key={m.id}>
          <circle cx={map(m.x)} cy={map(m.z)} r={m.boss ? 2 : 1.3} fill={m.boss ? "#efbd65" : "#bf5352"} />
          <text x={map(m.x) + 2} y={map(m.z)}>{m.level}</text>
        </g>)}
        {isNewCity(shown) && cityBuildings(shown).map(b=><rect key={b.x+":"+b.z} x={map(b.x-b.w)} y={map(b.z-b.d)} width={b.w*1.9} height={b.d*1.9} fill="#cdbd9f" stroke="#574844" strokeWidth=".45"/>)}
        {isNewCity(shown) && <circle cx={map(cityPortal(shown)[0])} cy={map(cityPortal(shown)[1])} r="2.2" fill="#d7b6ff"><title>Portal de Goddard</title></circle>}
        {Object.values(INSTANCES).filter(place=>place.region===shown).map(place=><circle key={place.name} cx={map(place.x)} cy={map(place.z)} r="2" fill="#d4afe6"><title>{place.name}</title></circle>)}
        {ORE_VEINS.filter(vein=>vein.region===shown&&!vein.instance).map(vein=><circle key={vein.id} cx={map(vein.x)} cy={map(vein.z)} r="1.6" fill={vein.color}><title>{vein.name}</title></circle>)}
        {position && <circle cx={map(position[0])} cy={map(position[1])} r="1.8" fill="#8ee5ff" stroke="white" strokeWidth=".5" />}
        {reason && <rect x="1" y="1" width="98" height="98" rx="6" fill="#172a36" opacity=".8" />}
      </svg>
      <small>Azul indica sua posição, vermelho indica criaturas e dourado indica chefes. Lilás indica portais e entradas de exploração. Os números indicam o nível.</small>
    </>}
  </section>;
}
