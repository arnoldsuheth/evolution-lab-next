"use client";

import { Html } from '@react-three/drei';
import { type ThreeEvent } from '@react-three/fiber';
import { cityMarket, marketOpen, type MarketStall } from '@/lib/cityMarket';
import { cursorOn } from '@/lib/cursor';
import { useGame } from '@/lib/store';

export default function CityMarket({ region, paused, approach, open }: {
  region: string;
  paused: boolean;
  approach: (x: number, z: number, action: () => void) => void;
  open: (id: MarketStall) => void;
}) {
  const position = useGame(s => s.hero.position);
  const unlocked = useGame(s => marketOpen(region, s.education.completed));
  const stalls = cityMarket(region);
  if (!stalls.length) return null;
  const closest = stalls.reduce((near, stall) =>
    Math.hypot(position[0] - stall.point[0], position[1] - stall.point[1]) <
    Math.hypot(position[0] - near.point[0], position[1] - near.point[1]) ? stall : near);

  return <group>
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[(stalls[0].point[0]+stalls.at(-1)!.point[0])/2, .031, stalls[0].point[1] - .2]}>
      <planeGeometry args={[Math.abs(stalls[0].point[0]-stalls.at(-1)!.point[0])+3, 2.5]} />
      <meshStandardMaterial color="#b3a082" roughness={.94} />
    </mesh>
    {stalls.map(stall => {
      const [x,z] = stall.point;
      const interact = (event: ThreeEvent<MouseEvent>) => {
        if (paused || event.button !== 0 || event.delta > 6) return;
        event.stopPropagation();
        approach(...stall.approach, () => open(stall.id));
      };

      return <group key={stall.id} position={[x,0,z]} {...cursorOn('point')} onClick={interact}>
        <mesh position={[0,.52,0]} castShadow><boxGeometry args={[2.05,1.04,1]} /><meshStandardMaterial color="#825a3e" /></mesh>
        <mesh position={[0,1.03,0]}><boxGeometry args={[2.25,.12,1.16]} /><meshStandardMaterial color="#b88956" /></mesh>
        {[-.95,.95].map(side => <mesh key={side} position={[side,1.22,.42]}><boxGeometry args={[.1,2.44,.1]} /><meshStandardMaterial color="#68503b" /></mesh>)}
        {Array.from({length:7}, (_,index) => <mesh key={index} position={[(index-3)*.35,2.35,0]} rotation={[-.19,0,0]} castShadow>
          <boxGeometry args={[.35,.09,1.56]} /><meshStandardMaterial color={index%2 ? '#ead5ad' : stall.color} />
        </mesh>)}
        {unlocked && [-.66,0,.66].map((offset,index) => <mesh key={offset} position={[offset,1.22,.01]} rotation={[.13,index*.24,.08]}>
          {stall.id==='fruit' ? <sphereGeometry args={[.16,10,8]} /> : stall.id==='bread' ? <capsuleGeometry args={[.13,.25,4,8]} /> : stall.id==='shields' ? <cylinderGeometry args={[.22,.22,.08,8]} /> : <boxGeometry args={stall.id==='weapons'?[.12,.16,.72]:[.38,.22,.42]} />}
          <meshStandardMaterial color={stall.id==='fruit'?(index===1?'#a7a24f':'#bb5644'):stall.id==='bread'?'#cb9652':stall.id==='clothing'?stall.color:'#a0a8ae'} />
        </mesh>)}
        {closest.id===stall.id && Math.hypot(position[0]-x,position[1]-z)<6 &&
          <Html center position={[0,2.85,0]} style={{pointerEvents:'none'}}><span className="town-sign">{stall.name}{unlocked?'':' · Fechada'}</span></Html>}
      </group>;
    })}
  </group>;
}
