"use client";
import { useEffect, useState, type CSSProperties } from 'react';
import { useGame } from '@/lib/store';
import { regionWeather, type Weather } from '@/lib/weather';

const rand = (n: number) => { const x = Math.sin(n * 45.164 + 94.673) * 43758.5453; return x - Math.floor(x); };
/** Posições fixas perto das bordas (esquerda, direita, topo), nunca no meio da tela. */
const SPOTS = Array.from({ length: 18 }, (_, i) => {
  const side = i % 3, along = rand(i) * 100, depth = rand(i + 50) * 13;
  const pos = side === 0 ? { left: `${depth}%`, top: `${along}%` } : side === 1 ? { right: `${depth}%`, top: `${along}%` } : { top: `${depth * .7}%`, left: `${15 + along * .7}%` };
  return { ...pos, size: 8 + rand(i + 9) * 14, delay: -(rand(i + 3) * 9), dur: 6 + rand(i + 4) * 7 };
});

/** 5.0: clima na tela do celular (chuva, neve, fuligem, poeira), bem de leve e só nas bordas. Não recebe toque. */
export default function ScreenWeather() {
  const region = useGame(s => s.hero.region), instance = useGame(s => s.hero.instance);
  const enabled = useGame(s => s.settings.screenWeather !== false && !s.settings.reduceMotion), low = useGame(s => s.settings.quality === 'low');
  const [weather, setWeather] = useState<Weather>(() => regionWeather(region));
  useEffect(() => { const update = () => setWeather(regionWeather(region)); update(); const t = window.setInterval(update, 5000); return () => window.clearInterval(t); }, [region]);
  if (!enabled || instance || weather.kind === 'clear' || weather.strength < .05) return null;
  const spots = low ? SPOTS.filter((_, i) => i % 2 === 0) : SPOTS;
  return <div className={`screen-weather sw-${weather.kind}`} style={{ opacity: Math.min(1, weather.strength) } as CSSProperties} aria-hidden="true">
    {spots.map((s, i) => <i key={i} style={{ left: s.left, right: s.right, top: s.top, width: s.size, height: weather.kind === 'rain' ? s.size * 1.25 : s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />)}
  </div>;
}
