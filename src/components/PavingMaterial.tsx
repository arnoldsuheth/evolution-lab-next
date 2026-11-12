"use client";
import { useEffect, useMemo } from 'react';
import { createPavingTextures } from '@/lib/pavingMaterial';

export default function PavingMaterial({ color, relief = true }: { color: string; relief?: boolean }) {
  const textures = useMemo(() => createPavingTextures(), []);
  useEffect(() => () => { textures.map.dispose(); textures.bumpMap.dispose(); }, [textures]);
  return <meshStandardMaterial color={color} map={textures.map} bumpMap={relief ? textures.bumpMap : null} bumpScale={.075} roughness={.88} />;
}
