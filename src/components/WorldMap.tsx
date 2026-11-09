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
  const [region, setRegion] = useState<RegionId | "atlas">("atlas");
  const [selection, setSelection] = useState("");
  const reason = region === "atlas" ? undefined : regionRequirement(hero, education, region);
  const sector = CITADEL_SECTORS.find(entry => entry.name === selection);
  const position = region === hero.region && !hero.instance ? hero.position : undefined;
  const shown: RegionId = region === "atlas" ? hero.region : region;
  const route = region === "aurora" && sector && position
    ? findPath(position, sector.entrance, education.completed.includes("variables"), education.completed.includes("conditions") && hero.defeatedBosses.includes("boss-forest"))
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
        {CITADEL_SECTORS.map(({ name, short }) => <button key={name} aria-label={name} aria-pressed={selection === name} className={selection === name ? "active" : ""} onClick={() => setSelection(selection === name ? "" : name)}>{short}</button>)}
      </nav>
      <small>{!sector ? "Toque em um setor para ver a rota. O ponto claro mostra sua posição." : route.length ? `Rota em ciano até ${sector.name}.` : !position ? "Entre na Cidadela para traçar a rota." : `Destino selecionado — ${sector.name}.`}</small>
    </> : <>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Mapa de ${REGIONS[shown].name}`}>
        <rect x="1" y="1" width="98" height="98" rx="6" fill={REGIONS[shown].color} />
        {!reason && MONSTERS.filter(m => m.region === shown && !m.instance).map(m => <g key={m.id}>
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

/** Lovelace (prévia 4): atlas com regiões coloridas, nível recomendado e rotas a partir da Cidadela. */
const ATLAS: { id: RegionId; x: number; y: number; rx: number; ry: number; fill: string; icon: string }[] = [
  { id: "aurora", x: 50, y: 66, rx: 21, ry: 13, fill: "#8a5cff", icon: "⚛" },
  { id: "ruins", x: 20, y: 34, rx: 16, ry: 11, fill: "#3fae5a", icon: "🌳" },
  { id: "frontier", x: 80, y: 30, rx: 16, ry: 11, fill: "#d9a93b", icon: "⚒" },
  { id: "heart", x: 52, y: 13, rx: 15, ry: 8, fill: "#c2455a", icon: "◆" },
];
function KingdomAtlas({ here, open, locked }: { here?: RegionId; open: (id: RegionId) => void; locked: (id: RegionId) => string | undefined }) {
  const home = ATLAS[0];
  return <div className="kingdom-atlas">
    <svg viewBox="0 0 100 82" role="img" aria-label="Atlas do Reino de Lovelace">
      <defs><radialGradient id="atlas-land" cx="50%" cy="55%" r="70%"><stop offset="0" stopColor="#5f8f4a" /><stop offset="1" stopColor="#2c4a33" /></radialGradient></defs>
      <rect width="100" height="82" rx="3" fill="url(#atlas-land)" />
      <path d="M0 6 L14 0 L30 4 L44 0 L62 3 L78 0 L100 5 L100 0 L0 0Z" fill="#8c8f99" opacity=".7" />
      <path d="M80 82 Q90 70 100 72 L100 82Z" fill="#3a83b8" opacity=".85" />
      {ATLAS.slice(1).map(r => <path key={"route-" + r.id} d={`M${home.x} ${home.y} Q${(home.x + r.x) / 2 + (r.x < 50 ? -6 : 6)} ${(home.y + r.y) / 2} ${r.x} ${r.y}`} stroke="#f3dfb4" strokeWidth=".8" strokeDasharray="1.6 1.2" fill="none" opacity=".85" />)}
      {ATLAS.map(r => { const lock = locked(r.id); return <g key={r.id} className={`atlas-region ${lock ? "locked" : ""} ${here === r.id ? "here" : ""}`} onClick={() => open(r.id)} role="button" tabIndex={0} aria-label={`${REGIONS[r.id].name}, nível ${REGIONS[r.id].level}${lock ? ", bloqueada" : ""}`} onKeyDown={e => { if (e.key === "Enter") open(r.id); }}>
        <ellipse cx={r.x} cy={r.y} rx={r.rx} ry={r.ry} fill={lock ? "#555b66" : r.fill} fillOpacity=".55" stroke={lock ? "#9aa0aa" : r.fill} strokeWidth=".8" />
        <text x={r.x} y={r.y - 1.5} textAnchor="middle" className="atlas-name">{r.icon} {r.id === "aurora" ? "Cidadela do Conhecimento" : REGIONS[r.id].name}</text>
        <text x={r.x} y={r.y + 3.5} textAnchor="middle" className="atlas-level">{lock ? "🔒 " : ""}Nível {REGIONS[r.id].level}+</text>
        {here === r.id && <circle cx={r.x} cy={r.y + 7} r="1.4" fill="#8ee5ff" stroke="#fff" strokeWidth=".4" />}
      </g>; })}
      <text x="5" y="10" className="atlas-compass">✦ N</text>
    </svg>
    <small>Toque numa região para ver os detalhes. As trilhas tracejadas mostram as rotas a partir da Cidadela; o ponto azul é você.</small>
  </div>;
}
