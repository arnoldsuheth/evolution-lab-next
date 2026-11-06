"use client";
import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import MonsterModel from './MonsterModel';
import type { PetId } from '@/lib/adventure';

/** Mascote: um bichinho em miniatura que segue o herói com um pequeno atraso. Só enfeite, não luta. */
export default function PetFollower({ kind, player, reduced }: { kind: PetId; player: RefObject<THREE.Vector3>; reduced: boolean }) {
  const root = useRef<THREE.Group>(null), goal = useRef(new THREE.Vector3()), last = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const g = root.current, p = player.current; if (!g || !p) return;
    goal.current.set(p.x + .95, 0, p.z + .75);
    const far = g.position.distanceTo(goal.current);
    if (far > 8) g.position.copy(goal.current); // depois de teleportar, aparece junto
    else if (far > .25) { last.current.copy(g.position); g.position.lerp(goal.current, Math.min(1, delta * 3.2)); const dx = g.position.x - last.current.x, dz = g.position.z - last.current.z; if (Math.abs(dx) + Math.abs(dz) > .002) g.rotation.y = Math.atan2(dx, dz); }
    g.position.y = reduced ? 0 : Math.abs(Math.sin(state.clock.elapsedTime * 6)) * (far > .3 ? .12 : .03);
  });
  return <group ref={root} scale={kind === 'dragon' ? .34 : .46}><MonsterModel kind={kind} boss={false} reduced={reduced} /></group>;
}
