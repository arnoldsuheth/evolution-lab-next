"use client";
import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import MonsterModel from './MonsterModel';
import type { PetId } from '@/lib/adventure';
import type { HunterCompanion } from '@/lib/game';
import { useGame } from '@/lib/store';

export default function PetFollower({ kind, player, reduced, combat = false }: {
  kind: PetId | HunterCompanion;
  player: RefObject<THREE.Vector3>;
  reduced: boolean;
  combat?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const goal = useRef(new THREE.Vector3());
  const heading = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(({ clock }, delta) => {
    const pet = root.current, hero = player.current;
    if (!pet) return;

    const followDistance = Math.hypot(pet.position.x - hero.x, pet.position.z - hero.z);
    goal.current.set(hero.x + (combat ? -1.15 : .95), 0, hero.z + .75);
    const state=useGame.getState();
    const hit=combat&&!reduced ? state.battleEvent : null;
    const enemy=combat ? state.encounter?.position : undefined;
    const age = hit ? Date.now() - hit.time : Infinity;
    const attacking = hit?.companionStrike && age >= 0 && age < 470
      && Math.hypot(hero.x - hit.hx, hero.z - hit.hz) < 3;

    const opponent=attacking&&hit ? [hit.x,hit.z] : enemy;
    if(opponent){
      const [x,z]=opponent;
      heading.current.set(hero.x-x,0,hero.z-z).normalize();
      goal.current.set(x,0,z).addScaledVector(heading.current,attacking?.68:1.7);
    }

    pet.position.y = 0;
    if (!initialized.current || (followDistance > 8 && !opponent && age > 1100)) {
      pet.position.copy(goal.current);
      initialized.current = true;
    } else {
      heading.current.subVectors(goal.current, pet.position);
      const distance = heading.current.length();
      if (distance > .13) {
        pet.rotation.y = Math.atan2(heading.current.x, heading.current.z);
        pet.position.addScaledVector(heading.current, Math.min(1, (attacking ? 32 : enemy ? 15 : 8) * delta / distance));
      } else if(opponent) pet.rotation.y=Math.atan2(opponent[0]-pet.position.x,opponent[1]-pet.position.z);
    }

    const moving = pet.position.distanceToSquared(goal.current) > .08;
    const bounce = attacking ? .15 : moving ? .06 : .015;
    pet.position.y = (kind === 'owl' ? .85 : 0) + (reduced ? 0 : Math.abs(Math.sin(clock.elapsedTime * 10)) * bounce);
  });

  return <group ref={root} scale={combat ? .58 : kind === 'dragon' ? .34 : .46}>
    <MonsterModel key={kind} kind={kind} reduced={reduced} />
  </group>;
}
