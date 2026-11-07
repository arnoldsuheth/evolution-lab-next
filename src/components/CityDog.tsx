"use client";
import { useMemo, useRef, useState, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '@/lib/store';
import { adventureOf } from '@/lib/adventure';
import { DOG_NAME, dogHungry, dogLevel } from '@/lib/dog';
import { cursorOn } from '@/lib/cursor';

/**
 * Caramelo, o vira-lata da Pedra da Aurora: segue o herói pelas ruas da cidade, senta quando ele para,
 * pede comida e mostra o quanto gosta de você (rabo, bandana, língua, corações).
 */
const HOME = new THREE.Vector3(4.4, 0, 9.6);
const CARAMEL = '#c8843f', LIGHT = '#ecc489', CREAM = '#f6e2bb', DARK = '#2a1d16';
const openDog = () => window.dispatchEvent(new CustomEvent('lions-cave-dog'));
const inTown = (x: number, z: number) => Math.abs(x) < 34 && z > -14 && z < 22;
function M({ color, rough = .9, ...rest }: { color: string; rough?: number } & Partial<THREE.MeshStandardMaterialParameters>) { return <meshStandardMaterial color={color} roughness={rough} {...rest} />; }

function DogBody({ friendship, legs, tail, head, rear, tongue }: { friendship: number; legs: RefObject<(THREE.Group | null)[]>; tail: RefObject<THREE.Group | null>; head: RefObject<THREE.Group | null>; rear: RefObject<THREE.Group | null>; tongue: boolean }) {
  const friend = friendship >= 45, loyal = friendship >= 100;
  const legSpots: [number, number][] = [[.12, .2], [-.12, .2], [.12, -.2], [-.12, -.2]];
  return <group>
    {/* tronco: costas caramelo, barriga e peito claros */}
    <group ref={rear}>
      <mesh position={[0, .46, -.02]} rotation={[Math.PI / 2, 0, 0]} castShadow><capsuleGeometry args={[.2, .42, 6, 12]} /><M color={CARAMEL} /></mesh>
      <mesh position={[0, .38, 0]} scale={[.85, .55, 1.15]}><sphereGeometry args={[.2, 14, 10]} /><M color={LIGHT} /></mesh>
      {/* rabo: base presa atrás, abana pelo grupo */}
      <group ref={tail} position={[0, .56, -.32]} rotation={[-.9, 0, 0]}>
        <mesh position={[0, .13, 0]}><capsuleGeometry args={[.045, .22, 4, 8]} /><M color={CARAMEL} /></mesh>
        <mesh position={[0, .27, 0]}><sphereGeometry args={[.05, 8, 6]} /><M color={CREAM} /></mesh>
      </group>
    </group>
    <mesh position={[0, .5, .25]} scale={[.8, .9, .7]}><sphereGeometry args={[.19, 14, 10]} /><M color={CREAM} /></mesh>
    {/* pernas com patinhas claras */}
    {legSpots.map(([x, z], i) => <group key={i} position={[x, .3, z]} ref={el => { if (legs.current) legs.current[i] = el; }}>
      <mesh position={[0, -.13, 0]}><cylinderGeometry args={[.05, .045, .28, 8]} /><M color={CARAMEL} /></mesh>
      <mesh position={[0, -.27, .02]} scale={[1, .6, 1.25]}><sphereGeometry args={[.06, 8, 6]} /><M color={CREAM} /></mesh>
    </group>)}
    {/* bandana de amigo e medalha de companheiro fiel */}
    {friend && <mesh position={[0, .6, .24]} rotation={[.5, 0, Math.PI]}><coneGeometry args={[.17, .2, 3]} /><M color="#d9473a" rough={.7} /></mesh>}
    {friend && <mesh position={[0, .66, .2]} rotation={[Math.PI / 2 - .5, 0, 0]}><torusGeometry args={[.13, .025, 6, 16]} /><M color="#c23a2f" /></mesh>}
    {loyal && <mesh position={[0, .52, .34]} rotation={[.4, 0, 0]}><cylinderGeometry args={[.045, .045, .015, 14]} /><M color="#f2c14e" metalness={.7} rough={.3} emissive="#a8781c" emissiveIntensity={.3} /></mesh>}
    {/* cabeça */}
    <group ref={head} position={[0, .76, .34]}>
      <mesh castShadow><sphereGeometry args={[.19, 16, 12]} /><M color={CARAMEL} /></mesh>
      <mesh position={[0, -.05, .15]} scale={[.85, .7, 1]}><sphereGeometry args={[.12, 12, 10]} /><M color={LIGHT} /></mesh>
      <mesh position={[0, -.02, .26]}><sphereGeometry args={[.04, 10, 8]} /><M color={DARK} rough={.3} /></mesh>
      {[-1, 1].map(s => <group key={s} position={[s * .075, .05, .155]}>
        <mesh><sphereGeometry args={[.032, 10, 8]} /><M color={DARK} rough={.2} /></mesh>
        <mesh position={[s * -.008, .012, .026]}><sphereGeometry args={[.009, 6, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>
      </group>)}
      {/* sobrancelhas claras (o "jeitinho pidão" do caramelo) */}
      {[-1, 1].map(s => <mesh key={s} position={[s * .07, .1, .15]} rotation={[0, 0, s * .35]} scale={[1, .45, .5]}><sphereGeometry args={[.03, 8, 6]} /><M color={CREAM} /></mesh>)}
      {/* orelhas: uma em pé, outra dobrada */}
      <mesh position={[.12, .17, -.02]} rotation={[-.15, 0, -.35]} scale={[1, 1, .45]}><coneGeometry args={[.075, .19, 8]} /><M color={CARAMEL} /></mesh>
      <mesh position={[-.15, .1, -.02]} rotation={[-.2, 0, 2.2]} scale={[1, 1, .45]}><coneGeometry args={[.075, .19, 8]} /><M color="#b0722f" /></mesh>
      {tongue && <mesh position={[0, -.13, .2]} rotation={[.5, 0, 0]} scale={[1, .35, 1]}><sphereGeometry args={[.045, 10, 6]} /><M color="#e8707a" rough={.5} /></mesh>}
    </group>
  </group>;
}

export default function CityDog() {
  const friendship = useGame(s => adventureOf(s.hero).dog.friendship), fedAt = useGame(s => adventureOf(s.hero).dog.fedAt);
  const reduced = useGame(s => s.settings.reduceMotion);
  const root = useRef<THREE.Group>(null), legs = useRef<(THREE.Group | null)[]>([]), tail = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null), rear = useRef<THREE.Group>(null);
  const trick = useRef<THREE.Group>(null), motion = useRef({ pos: HOME.clone(), heading: 0, still: 0, phase: 0, speed: 0, party: -9, roll: -9 }), want = useMemo(() => new THREE.Vector3(), []);
  const [near, setNear] = useState(false), [hungryNow, setHungry] = useState(false), [justFed, setJustFed] = useState(false), nearRef = useRef(false), hungryRef = useRef(false), fedRef = useRef(false);
  const level = dogLevel(friendship);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, .1), m = motion.current, g = root.current; if (!g) return;
    const s = useGame.getState(), [hx, hz] = s.hero.position, t = state.clock.elapsedTime;
    const follow = s.hero.region === 'aurora' && !s.hero.instance && inTown(hx, hz) && !s.hero.dead;
    // Tímido no começo (fica mais longe); amigo anda colado.
    const gap = friendship < 20 ? 3 : friendship < 45 ? 2.2 : 1.5;
    if (follow) { const dx = m.pos.x - hx, dz = m.pos.z - hz, d = Math.hypot(dx, dz) || 1; want.set(hx + dx / d * gap, 0, hz + dz / d * gap); }
    else want.copy(HOME);
    const ox = want.x - m.pos.x, oz = want.z - m.pos.z, dist = Math.hypot(ox, oz);
    const target = dist > .15 ? Math.min(7, dist * 2.4) : 0;
    m.speed = THREE.MathUtils.damp(m.speed, target, 6, dt);
    if (dist > 25) { m.pos.copy(want); m.speed = 0; } // teleporte do herói: ele reaparece perto
    else if (m.speed > .02 && dist > .01) { const step = Math.min(dist, m.speed * dt); m.pos.x += ox / dist * step; m.pos.z += oz / dist * step; }
    // Olha para onde anda; parado, olha para o herói.
    const lookX = m.speed > .3 ? ox : hx - m.pos.x, lookZ = m.speed > .3 ? oz : hz - m.pos.z;
    if (Math.hypot(lookX, lookZ) > .05) { const h = Math.atan2(lookX, lookZ); let diff = h - m.heading; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); m.heading += diff * Math.min(1, dt * 8); }
    g.position.set(m.pos.x, 0, m.pos.z); g.rotation.y = m.heading;
    const moving = m.speed > .25; m.still = moving ? 0 : m.still + dt;
    m.phase += dt * (moving ? 6 + m.speed * 2.2 : 0);
    const sitting = !moving && m.still > 1.2;
    // Andando: pernas alternadas. Sentado: as de trás dobram embaixo do corpo (patas no chão).
    legs.current.forEach((leg, i) => { if (!leg) return; const back = i > 1, fold = sitting && back;
      leg.rotation.x = fold ? THREE.MathUtils.damp(leg.rotation.x, -1.15, 8, dt) : moving && !reduced ? Math.sin(m.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * .7 : THREE.MathUtils.damp(leg.rotation.x, 0, 8, dt);
      if (back) leg.position.y = THREE.MathUtils.damp(leg.position.y, fold ? .2 : .3, 8, dt); });
    if (rear.current) { rear.current.rotation.x = THREE.MathUtils.damp(rear.current.rotation.x, sitting ? -.35 : 0, 6, dt); rear.current.position.y = THREE.MathUtils.damp(rear.current.position.y, sitting ? -.08 : 0, 6, dt); }
    const wagSpeed = reduced ? 0 : 5 + friendship / 100 * 13, wagSize = .35 + friendship / 100 * .45;
    if (tail.current) tail.current.rotation.z = Math.sin(t * wagSpeed) * wagSize;
    if (head.current) { head.current.rotation.x = moving ? Math.sin(m.phase * 2) * .05 : Math.sin(t * 1.4) * .04 - (sitting ? .12 : 0); head.current.rotation.z = !moving && !reduced ? Math.sin(t * .7) * .12 : 0; }
    g.position.y = moving && !reduced ? Math.abs(Math.sin(m.phase)) * .04 : 0;
    // Reações só perto do herói (para não gastar desenhando etiquetas longe).
    const isNear = Math.hypot(m.pos.x - hx, m.pos.z - hz) < 7 && s.hero.region === 'aurora' && !s.hero.instance;
    if (isNear !== nearRef.current) { nearRef.current = isNear; setNear(isNear); }
    const hungry = dogHungry({ friendship, fedAt, meals: 0 }, Date.now()) && friendship < 100;
    if (hungry !== hungryRef.current) { hungryRef.current = hungry; setHungry(hungry); }
    const recent = fedAt > 0 && Date.now() - fedAt < 5000;
    if (recent !== fedRef.current) { if (recent) m.party = t; fedRef.current = recent; setJustFed(recent); }
    // Truques: comeu = pulinho (amigo gira junto); melhor amigo sentado rola no chão de vez em quando.
    if (friendship >= 75 && sitting && m.still > 6 && t - m.roll > 9) m.roll = t;
    const tr = trick.current;
    if (tr) { const pp = (t - m.party) / 1.2, pr = (t - m.roll) / 1.3, party = !reduced && pp >= 0 && pp < 1, roll = !reduced && pr >= 0 && pr < 1;
      tr.position.y = party ? Math.sin(Math.min(1, pp * 2) * Math.PI) * (friendship >= 75 ? .45 : .28) : roll ? Math.sin(pr * Math.PI) * .12 : 0;
      tr.rotation.y = party && friendship >= 45 ? pp * Math.PI * 2 : 0;
      tr.rotation.z = roll ? pr * Math.PI * 2 : 0; }
  });

  const bubble = justFed ? '❤️' : hungryNow ? '🍖?' : level.face;
  return <group ref={root} position={HOME.toArray()} scale={1.35} {...cursorOn('point')} onClick={e => { if (e.delta > 6 || e.button !== 0) return; e.stopPropagation(); openDog(); }}>
    <group ref={trick}><DogBody friendship={friendship} legs={legs} tail={tail} head={head} rear={rear} tongue={friendship >= 45 || justFed} /></group>
    {near && <Html position={[0, 1.18, 0]} center zIndexRange={[6, 0]}>
      <button className="dog-tag" onClick={openDog} aria-label={`${DOG_NAME}: amizade ${friendship} de 100`}>
        <span className={`dog-bubble ${hungryNow ? 'begging' : ''}`}>{bubble}</span>
        <b>{DOG_NAME}</b>
      </button>
    </Html>}
  </group>;
}
