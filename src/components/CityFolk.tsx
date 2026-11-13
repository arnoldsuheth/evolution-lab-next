"use client";

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { NewCity } from '@/lib/kingdomCities';
import { cityFolk, FOLK_ROUTE, routePoint, type Walker } from '@/lib/cityFolk';
import { useGame } from '@/lib/store';
import Character from './Character';
import { ContactShadow } from './GroundFx';

/**
 * Moradores das cidades, montados igual aos heróis (mesmo modelo, mesmas animações).
 * Andam em duplas lado a lado por uma rota fixa da praça; em Goddard são celestiais
 * (robôs de IA prateados, com auréola, que flutuam um pouco acima do chão).
 */
function Pair({ walkers, route, offset, speed, hover }: { walkers: Walker[]; route: [number, number][]; offset: number; speed: number; hover: boolean }) {
  const root = useRef<Group>(null), reduced = useGame(s => s.settings.reduceMotion);
  useFrame(({ clock }) => {
    const g = root.current; if (!g) return;
    const t = reduced ? offset : offset + clock.elapsedTime * speed, p = routePoint(route, t);
    g.position.set(p.x, hover ? .28 + Math.sin(clock.elapsedTime * 1.6 + offset * 9) * .06 : 0, p.z);
    g.rotation.y = p.heading;
  });
  return <group ref={root}>
    {walkers.map((w, i) => <group key={i} position={[(i - (walkers.length - 1) / 2) * .95, 0, 0]}>
      {!hover && <ContactShadow radius={.62} opacity={.3} />}
      <Character race={w.race} classId={w.classId} look={w.look} celestial={w.celestial} fullGear={w.celestial} walking={!reduced} animated={!reduced} skinOverride={w.celestial ? '#c9d4e4' : undefined} />
    </group>)}
  </group>;
}

export default function CityFolk({ city, low }: { city: NewCity; low: boolean }) {
  const groups = cityFolk(city).slice(0, low ? 1 : 2), goddard = city === 'goddard';
  // Duas duplas em lados opostos da rota, no mesmo ritmo: nunca se cruzam nem se separam.
  return <group>{groups.map((walkers, i) => <Pair key={i} walkers={walkers} route={FOLK_ROUTE[goddard ? 'goddard' : 'city']} offset={i / groups.length} speed={goddard ? .012 : .016} hover={goddard} />)}</group>;
}
