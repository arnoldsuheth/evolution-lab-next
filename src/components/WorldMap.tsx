"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import { REGIONS, regionRequirement, type RegionId } from "@/lib/campaign";
import { CITADEL_SECTORS, TOWN_SERVICES } from "@/lib/town";
import { areaDestinations, guideStop, regionPins, routeToPoint, scenicPin, type GuideRequest, type GuideTarget, type MapPin } from "@/lib/questNavigation";
import { isRacialCity } from "@/lib/kingdomCities";
import { INSTANCES } from "@/lib/instances";
import { findPath, followRoadPath } from "@/lib/navigation";
import { roadAt } from "@/lib/overland";
import { scenicTrailPath } from "@/lib/scenicTrails";
import { discoveryIn } from "@/lib/discoveries";
import { mountOf } from "@/lib/adventure";
import { CitadelMap } from "./CitadelMap";
import AreaMap from "./AreaMap";
import KingdomAtlas from "./KingdomAtlas";

const cave = INSTANCES.cavern;
const DESTINATIONS = [...CITADEL_SECTORS, ...TOWN_SERVICES, { name: cave.name, short: "Caverna", entrance: [cave.x,cave.z+2] as [number,number] }];

export default function WorldMap({ guide, follow }: { guide: GuideRequest | null; follow: (target: GuideTarget) => void }) {
  const hero = useGame(s => s.hero);
  const education = useGame(s => s.education);
  const mounted = useGame(s => s.mounted);
  const mount = mountOf(hero);
  const airborne = mounted && !hero.instance && (mount?.id==="dragon" || mount?.id==="griffin" && !!hero.flyingMount);
  const [region, setRegion] = useState<RegionId | "atlas" | "here">("here");
  const [selection, setSelection] = useState<MapPin>();
  const [sector, setSector] = useState("");
  const shown = region === "here" || region === "atlas" ? hero.region : region;
  const instance = region === "here" ? hero.instance : null;
  const position = shown === hero.region && (!hero.instance || instance) ? hero.position : undefined;
  const reason = region === "atlas" || shown === hero.region ? undefined : regionRequirement(hero, education, shown);
  const pins = instance ? [] : regionPins(shown);
  const exits = instance ? [] : areaDestinations(shown);
  const scenic = instance ? undefined : scenicPin(shown);
  const site = instance ? undefined : discoveryIn(shown);
  const discovery = site && hero.adventure?.discoveries?.[site.id];
  const activeStop = position && guide?.heroId === hero.id ? guideStop(hero, guide.target, useGame.getState()) : undefined;
  const focus = selection ?? activeStop;
  const destination = DESTINATIONS.find(item => item.name === sector);
  const route = useMemo(() => {
    if (!position) return [];
    if (focus && ('road' in focus.target || (focus===activeStop && activeStop.overland))) {
      const road=roadAt(hero.region,...focus.point);
      if(road)return followRoadPath(position,road,hero.region,airborne);
    }
    if (focus && "scenic" in focus.target) return scenicTrailPath(position,hero.region,airborne);
    if (focus) return routeToPoint(position, focus.point, hero);
    return destination ? findPath(position, destination.entrance) : [];
  }, [position, focus, activeStop, destination, hero, airborne]);
  function open(next: typeof region) {
    setRegion(next);
    setSelection(undefined);
    setSector("");
  }
  return <section className="panel-body world-map">
    <nav className="tabs" aria-label="Escala do mapa">
      <button className={region === "here" ? "active" : ""} onClick={() => open("here")}>Onde estou</button>
      <button className={region === "atlas" ? "active" : ""} onClick={() => open("atlas")}>Atlas do Reino</button>
    </nav>
    {reason && <p>{reason}</p>}
    {!hero.instance && shown!==hero.region && (isRacialCity(hero.region)||hero.region==='goddard') && (isRacialCity(shown)||shown==='goddard') &&
      <div className="map-route-action" aria-label="Viajar para a cidade selecionada">
        {isRacialCity(hero.region)&&isRacialCity(shown)&&<button className="primary" disabled={!!reason} onClick={()=>follow({region:shown})}>Seguir pela estrada</button>}
        <button disabled={!!reason} onClick={()=>follow({region:shown,via:'portal'})}>Seguir por portal</button>
      </div>}
    {region==='here' && !hero.instance && (isRacialCity(shown)||shown==='goddard') &&
      <div className="map-route-action"><button onClick={()=>open("atlas")}>Viajar para outra cidade</button></div>}
    {region === "atlas" ? <KingdomAtlas here={hero.instance ? undefined : hero.region} open={open} follow={follow} locked={id => regionRequirement(hero, education, id)} /> : <>
      <h3>{instance ? "Masmorra atual" : REGIONS[shown].name}</h3>
      {shown === "aurora" && !instance ? <CitadelMap position={position} route={route} focus={focus} selected={sector} />
        : <AreaMap region={shown} instance={instance} position={position} route={route} focus={focus} locked={!!reason} />}
      {focus && <div className="map-route-action"><strong>{focus.name}</strong>
        {(position || guideStop(hero, focus.target, useGame.getState())) && <button className="primary" disabled={!guideStop(hero, focus.target, useGame.getState())} onClick={() => follow(focus.target)}>Ir até {focus.name}</button>}
      </div>}
      {scenic && <nav className="tabs map-people" aria-label="Trilhas e mirantes">
        <button type="button" aria-pressed={selection?.name===scenic.name} onClick={()=>{setSelection(scenic);setSector("");}}>
          <span aria-hidden="true">◆ </span>{scenic.name}
        </button>
      </nav>}
      {site&&discovery&&<div className="map-route-action"><strong>{site.name}</strong>
        <small>{discovery==='claimed'?'Baú já aberto':discovery==='cleared'?'Vigia derrotado. Abra o baú.':site.hint}</small>
        {position&&discovery!=='claimed'&&<button onClick={()=>follow({discovery:site.id})}>Ir até a descoberta</button>}
      </div>}
      {pins.length > 0 && <nav className="tabs map-people" aria-label="Personagens desta área">
        {pins.map(pin => <button key={pin.name} aria-pressed={selection?.name === pin.name} onClick={() => { setSelection(pin); setSector(""); }}>{pin.name}</button>)}
      </nav>}
      {exits.length>0&&<details className="map-places"><summary>Estradas, portais e expedições</summary><nav className="tabs map-people" aria-label="Estradas, portais e expedições">
        {exits.map(pin=><button key={pin.name} aria-pressed={selection?.name===pin.name} onClick={()=>{setSelection(pin);setSector("");}}>{pin.name}</button>)}
      </nav></details>}
      {shown === "aurora" && !instance && <details className="map-places"><summary>Prédios e serviços</summary><nav className="tabs" aria-label="Prédios e serviços">
        {DESTINATIONS.map(item => <button key={item.name} aria-pressed={sector === item.name} onClick={() => { setSector(item.name); setSelection(undefined); }}>{item.short}</button>)}
      </nav></details>}
      <small>Ponto claro: você. Dourado: personagens. Vermelho: criaturas agressivas. Ciano: caminho.</small>
    </>}
  </section>;
}
