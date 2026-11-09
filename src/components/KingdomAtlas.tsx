"use client";

import { useState } from "react";
import type { RegionId } from "@/lib/campaign";

const LOCATIONS = [
  { id: "goddard", name: "Goddard", x: 51, y: 10, detail: "Capital flutuante dos Precursores. Missões da história e montarias voadoras. Acesso pelos portais das cinco cidades." , region: "goddard" },
  { id: "iron-forge", name: "Iron Forge", x: 13, y: 29, detail: "Cidade dos anões, no gelo. Treinadores de Guerreiro, Engenheiro, Hunter e Paladino." , region: "iron-forge" },
  { id: "gnomolandia", name: "Gnomolândia", x: 36, y: 39, detail: "Cidade dos gnomos, no gelo. Treinadores de Mago, Shaman, Hunter e Hacker." , region: "gnomolandia" },
  { id: "bosque", name: "Bosque Arcano", x: 86, y: 29, detail: "Cidade dos elfos, entre bosques e cordilheiras. Treinadores de Hunter, Mago, Profeta, Hacker e Dualista." , region: "bosque" },
  { id: "cidadela", name: "Cidadela humana", x: 72, y: 42, detail: "Cidade dos humanos. Consulte o mapa local para ver as áreas que já estão jogáveis.", region: "aurora" },
  { id: "ogrimmar", name: "Ogrimmar", x: 23, y: 72, detail: "Cidade dos orcs, nas Terras Rubras. Treinadores de Shaman e Guerreiro." , region: "ogrimmar" },
  { id: "nullarion", name: "Nullarion", x: 84, y: 88, detail: "Reino no extremo do Vulcão. O chefe mestre, nível 60, encerra a campanha.", region: "heart" },
] satisfies { id: string; name: string; x: number; y: number; detail: string; region?: RegionId }[];

export default function KingdomAtlas({ here, open, locked }: {
  here?: RegionId;
  open: (id: RegionId) => void;
  locked: (id: RegionId) => string | undefined;
}) {
  const [selection, select] = useState(LOCATIONS[4]);
  const { region } = selection;
  const reason = region && locked(region);
  return <div className="kingdom-atlas">
    <div className="kingdom-atlas-map" role="group" aria-label="Cidades e biomas do Atlas">
      <svg viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">
        <rect width="600" height="400" fill="#263c43" />
        <path d="M19 101 54 72 171 64 265 85 308 127 301 177 324 216 278 249 171 215 65 205 21 168Z" fill="#597986" stroke="#9bb5ba" />
        <path d="M308 127 351 82 435 66 559 69 585 108 575 170 542 218 490 251 415 284 324 216 301 177Z" fill="#4c643e" stroke="#9f9f64" />
        <path d="M34 244 113 210 175 235 231 224 278 249 319 267 355 260 415 284 389 329 337 322 276 344 166 371 48 365 17 306Z" fill="#7a4736" stroke="#ca885c" />
        <path d="M415 284 490 251 565 278 586 342 549 383 447 381 389 329Z" fill="#79392d" stroke="#dd8b57" />
        <path d="M264 43 281 23 342 20 371 40 336 62 304 68Z" fill="#7a7893" stroke="#d8caeb" />
        <path d="M138 288 Q265 314 318 281 Q363 250 415 284 M78 116 Q125 149 216 156 Q252 163 324 216 M516 116 Q487 137 432 168 Q370 177 324 216 M324 216 Q371 241 415 284 Q451 312 504 352" fill="none" stroke="#e4c38f" strokeWidth="2.5" strokeDasharray="7 5" />
        <path d="M306 40 78 116 M306 40 216 156 M306 40 516 116 M306 40 432 168 M306 40 138 288" fill="none" stroke="#d7b6f5" strokeWidth="1.4" strokeDasharray="3 6" />
      </svg>
      <span className="atlas-biome" style={{ left: "24%", top: "18%" }}>Gelo</span>
      <span className="atlas-biome" style={{ left: "79%", top: "17%" }}>Bosques e cordilheiras</span>
      <span className="atlas-biome" style={{ left: "22%", top: "59%" }}>Terras Rubras</span>
      <span className="atlas-biome" style={{ left: "84%", top: "73%" }}>Vulcão</span>
      {LOCATIONS.map(location => <button type="button" key={location.id}
        className="atlas-location" style={{ left: location.x + "%", top: location.y + "%" }}
        aria-pressed={selection.id === location.id} onClick={() => select(location)}>
        {location.region && location.region === here && <span aria-label="Sua posição">● </span>}{location.name}
      </button>)}
    </div>
    <small>Rotas terrestres em dourado. Portais para Goddard em lilás.</small>
    <div className="atlas-location-info" aria-live="polite">
      <strong>{selection.name}</strong>
      <p>{selection.detail}</p>
      {region ? <>
        {reason && <small>{reason}</small>}
        <button type="button" onClick={() => open(region)}>Ver mapa local</button>
      </> : <small>Local planejado. A área jogável ainda está em construção.</small>}
    </div>
  </div>;
}
