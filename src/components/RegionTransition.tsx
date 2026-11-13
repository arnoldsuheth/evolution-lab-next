"use client";
import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useGame } from '@/lib/store';
import { REGIONS } from '@/lib/campaign';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Ao trocar de região (viagem, portão ou derrota), cobre o mundo enquanto o lugar novo carrega, em vez da tela vazia. */
export default function RegionTransition() {
  const region = useGame(s => s.hero.region), instance = useGame(s => s.hero.instance ?? null), dead = useGame(s => s.hero.dead);
  const loading = useProgress(s => s.active);
  const place = instance ? 'masmorra' : region, last = useRef(place), [shown, setShown] = useState<{ at: number; name: string } | null>(null);
  useEffect(() => {
    if (last.current === place) return; last.current = place;
    const name = instance ? 'Masmorra' : REGIONS[region as keyof typeof REGIONS]?.name ?? 'Lovelace Kingdom';
    setShown({ at: Date.now(), name });
  }, [place, region, instance]);
  // Some quando o carregamento termina (no mínimo 1,4 s, para o mundo montar; no máximo 12 s, para nunca prender o jogador).
  useEffect(() => {
    if (!shown) return;
    const wait = loading ? 12000 - (Date.now() - shown.at) : Math.max(0, 1400 - (Date.now() - shown.at));
    const t = window.setTimeout(() => setShown(null), Math.max(0, wait));
    return () => window.clearTimeout(t);
  }, [shown, loading]);
  if (!shown) return null;
  return <div className="region-transition" role="status" aria-live="polite">
    <span className="rt-emblem" aria-hidden="true" style={{ backgroundImage: `url(${base}/lovelace-icon-512.png)` }} />
    <p className="rt-kicker">{dead ? 'Lion leva você em segurança para' : 'Viajando para'}</p>
    <h2>{shown.name}</h2>
    <span className="rt-bar" aria-hidden="true"><i /></span>
  </div>;
}
