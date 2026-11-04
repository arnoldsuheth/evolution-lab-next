"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Sky, Text } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { useGame } from "@/lib/store";
import { armorColors, beardColors } from "@/lib/appearance";
import { canMoveTo, nearNpc, NPCS } from "@/lib/collision";

type Interaction = "shop" | "mentor" | null;

type Props = {
  openShop: () => void;
  openMission: () => void;
  proximity: (target: Interaction) => void;
};

function Dwarf({ openShop, openMission, proximity }: Props) {
  const root = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const nearby = useRef<Interaction>(null);
  const clock = useRef(0);

  const camera = useThree(s => s.camera);
  const equipped = useGame(s => s.hero.equipped);
  const appearance = useGame(s => s.appearance);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.repeat) return;

      const key = e.key.toLowerCase();

      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
      }

      if (key === "e" && nearby.current) {
        if (nearby.current === "shop") openShop();
        if (nearby.current === "mentor") openMission();
      }

      keys.current.add(key);
    };

    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [openShop, openMission]);

  useFrame((_, dt) => {
    if (!root.current) return;

    const k = keys.current;
    const x = Number(k.has("d") || k.has("arrowright")) -
      Number(k.has("a") || k.has("arrowleft"));
    const z = Number(k.has("s") || k.has("arrowdown")) -
      Number(k.has("w") || k.has("arrowup"));

    const current = root.current.position;
    const walking = x !== 0 || z !== 0;

    if (walking) {
      const direction = new THREE.Vector3(x, 0, z).normalize();
      const next = current.clone().addScaledVector(
        direction, Math.min(dt, 0.05) * 4
      );

      if (canMoveTo(next.x, current.z)) current.x = next.x;
      if (canMoveTo(current.x, next.z)) current.z = next.z;

      root.current.rotation.y = Math.atan2(direction.x, direction.z);
      clock.current += dt * 10;
    }

    const swing = walking ? Math.sin(clock.current) * 0.48 : 0;

    if (leftLeg.current) leftLeg.current.rotation.x =
      THREE.MathUtils.lerp(leftLeg.current.rotation.x, swing, 0.18);

    if (rightLeg.current) rightLeg.current.rotation.x =
      THREE.MathUtils.lerp(rightLeg.current.rotation.x, -swing, 0.18);

    if (leftArm.current) leftArm.current.rotation.x =
      THREE.MathUtils.lerp(leftArm.current.rotation.x, -swing * 0.6, 0.18);

    if (rightArm.current) rightArm.current.rotation.x =
      THREE.MathUtils.lerp(rightArm.current.rotation.x, swing * 0.6, 0.18);

    let nearest: Interaction = null;

    for (const npc of NPCS) {
      if (nearNpc(current.x, current.z, npc)) {
        nearest = npc.id;
        break;
      }
    }

    if (nearest !== nearby.current) {
      nearby.current = nearest;
      proximity(nearest);
    }

    const destination = new THREE.Vector3(current.x + 6, 7, current.z + 9);
    camera.position.lerp(destination, Math.min(1, dt * 5));
    camera.lookAt(current.x, 1.2, current.z);
  });

  const armor = armorColors[appearance.armor] ?? armorColors.blue;
  const beard = beardColors[appearance.beard] ?? beardColors.copper;

  return (
    <group ref={root}>
      {/* Torso */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <cylinderGeometry args={[0.66, 0.78, 1.2, 12]} />
        <meshStandardMaterial color={armor} roughness={0.72} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.66, 0]} castShadow>
        <cylinderGeometry args={[0.78, 0.78, 0.19, 12]} />
        <meshStandardMaterial color="#4a3025" />
      </mesh>
      <mesh position={[0, 0.66, 0.78]}>
        <boxGeometry args={[0.29, 0.24, 0.09]} />
        <meshStandardMaterial color="#d8ae5d" metalness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.92, 0]} castShadow>
        <sphereGeometry args={[0.53, 16, 14]} />
        <meshStandardMaterial color="#d49f7d" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.82, 0.51]} castShadow>
        <sphereGeometry args={[0.15, 12, 10]} />
        <meshStandardMaterial color="#c48d6d" />
      </mesh>

      {/* Beard */}
      <mesh position={[0, 1.45, 0.38]} castShadow>
        <coneGeometry args={[0.47, 0.85, 12]} />
        <meshStandardMaterial color={beard} />
      </mesh>

      {/* Eyes */}
      {[-0.19, 0.19].map(x => (
        <mesh key={x} position={[x, 1.99, 0.477]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshStandardMaterial color="#242b32" />
        </mesh>
      ))}

      {/* Helmet */}
      <mesh position={[0, 2.27, 0]} castShadow>
        <cylinderGeometry args={[0.53, 0.59, 0.28, 12]} />
        <meshStandardMaterial
          color={equipped.includes("helmet") ? "#d5ad54" : "#778894"}
          metalness={0.65}
          roughness={0.4}
        />
      </mesh>

      {/* Shoulder guards and arms */}
      {([-1, 1] as const).map(side => (
        <group key={side} position={[side * 0.78, 1.42, 0]}
          ref={side === -1 ? leftArm : rightArm}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <sphereGeometry args={[0.35, 12, 10]} />
            <meshStandardMaterial color="#8f9299" metalness={0.55} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.25, 0.65, 9]} />
            <meshStandardMaterial color={armor} />
          </mesh>
          <mesh position={[0, -0.79, 0]} castShadow>
            <sphereGeometry args={[0.23, 10, 10]} />
            <meshStandardMaterial color="#c88d67" />
          </mesh>

          {side === 1 && equipped.includes("axe") && (
            <group position={[0, -1.0, 0]}>
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 1.1, 8]} />
                <meshStandardMaterial color="#69482f" />
              </mesh>
              <mesh position={[0.25, 0.55, 0]}>
                <boxGeometry args={[0.55, 0.5, 0.13]} />
                <meshStandardMaterial color="#bccbd1" metalness={0.8} />
              </mesh>
            </group>
          )}

          {side === -1 && equipped.includes("shield") && (
            <mesh position={[0, -0.55, 0.28]}
              rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.52, 0.52, 0.15, 8]} />
              <meshStandardMaterial color="#b58c48" metalness={0.55} />
            </mesh>
          )}
        </group>
      ))}

      {/* Legs and boots */}
      {([-1, 1] as const).map(side => (
        <group key={side} position={[side * 0.35, 0.67, 0]}
          ref={side === -1 ? leftLeg : rightLeg}>
          <mesh position={[0, -0.23, 0]} castShadow>
            <cylinderGeometry args={[0.23, 0.27, 0.55, 9]} />
            <meshStandardMaterial color="#514038" />
          </mesh>
          <mesh position={[0, -0.53, 0.11]} castShadow>
            <boxGeometry args={[0.39, 0.33, 0.58]} />
            <meshStandardMaterial color="#2c2726" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function House({ x, z, color }: {
  x: number; z: number; color: string;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[3.4, 0.55, 3.4]} />
        <meshStandardMaterial color="#77736a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.67, 0]} castShadow>
        <boxGeometry args={[3, 2.4, 3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 3.2, 0]}
        rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.7, 1.85, 4]} />
        <meshStandardMaterial color="#58382e" />
      </mesh>
      {[-1.43, 1.43].map(a => (
        <mesh key={a} position={[a, 1.7, 1.52]} castShadow>
          <boxGeometry args={[0.16, 2.4, 0.2]} />
          <meshStandardMaterial color="#493126" />
        </mesh>
      ))}
      <mesh position={[0, 0.95, 1.54]}>
        <boxGeometry args={[0.85, 1.7, 0.09]} />
        <meshStandardMaterial color="#33241d" />
      </mesh>
      <mesh position={[0.95, 1.9, 1.54]}>
        <boxGeometry args={[0.58, 0.65, 0.08]} />
        <meshStandardMaterial color="#f1c67d" emissive="#a85c20"
          emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function Tree({ x, z, scale = 1 }: {
  x: number; z: number; scale?: number;
}) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.34, 2, 8]} />
        <meshStandardMaterial color="#664530" />
      </mesh>
      {[2.1, 2.8, 3.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <coneGeometry args={[1.25 - i * 0.2, 2, 8]} />
          <meshStandardMaterial color={i === 1 ? "#426b49" : "#315a3b"} />
        </mesh>
      ))}
    </group>
  );
}

function Rock({ x, z, s = 1 }: {
  x: number; z: number; s?: number;
}) {
  return (
    <mesh position={[x, 0.3 * s, z]}
      scale={[s, s * 0.7, s]} castShadow>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#92918b" roughness={1} />
    </mesh>
  );
}

function Torch({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 1.7, 8]} />
        <meshStandardMaterial color="#62432b" />
      </mesh>
      <mesh position={[0, 1.83, 0]}>
        <coneGeometry args={[0.25, 0.62, 9]} />
        <meshStandardMaterial color="#ffb343"
          emissive="#ff7b16" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 1.8, 0]}
        color="#ffae61" intensity={2} distance={5} />
    </group>
  );
}

function NPC({ x, label, color }: {
  x: number; label: string; color: string;
}) {
  return (
    <group position={[x, 0, -3]}>
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[0.43, 0.53, 1.4, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.43, 12, 12]} />
        <meshStandardMaterial color="#d4a077" />
      </mesh>
      <mesh position={[0, 0.025, 0]}
        rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.82, 32]} />
        <meshBasicMaterial color="#f6d58a"
          transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <Billboard position={[0, 2.75, 0]}>
        <Text fontSize={0.29} color="#fff4c3"
          outlineWidth={0.018} outlineColor="#20242c"
          anchorX="center">
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

export default function GameWorld(props: Props) {
  return (
    <Canvas shadows camera={{ position: [6, 7, 9], fov: 48 }}
      gl={{ antialias: true }}>

      <color attach="background" args={["#a8c4d4"]} />
      <fog attach="fog" args={["#a8c4d4", 22, 50]} />

      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#dceeff", "#6d624b", 1.3]} />

      <directionalLight position={[8, 15, 5]}
        intensity={2.3} castShadow
        shadow-mapSize={[1024, 1024]} />

      <Sky sunPosition={[6, 9, 4]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#58784d" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.016, 0]} receiveShadow>
        <planeGeometry args={[4.2, 28]} />
        <meshStandardMaterial color="#ae9c85" roughness={1} />
      </mesh>

      <House x={-7} z={-6} color="#ac8d70" />
      <House x={7} z={-6} color="#917b66" />
      <House x={-7} z={6} color="#bf9670" />
      <House x={7} z={6} color="#a99c83" />

      <Tree x={-11} z={-9} scale={1.2} />
      <Tree x={11} z={-9} />
      <Tree x={-11} z={9} />
      <Tree x={11} z={10} scale={1.1} />

      <Rock x={-10} z={-2} />
      <Rock x={10} z={2} s={1.3} />
      <Rock x={-10} z={3} s={0.7} />
      <Rock x={9.5} z={-10} s={0.8} />

      <Torch x={-2.25} z={-5} />
      <Torch x={2.25} z={-5} />

      <NPC x={-3} label="Mercador" color="#986037" />
      <NPC x={3} label="Mestre das Runas" color="#69549f" />

      <Dwarf {...props} />
    </Canvas>
  );
}