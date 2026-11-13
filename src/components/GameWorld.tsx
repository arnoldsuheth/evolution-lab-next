"use client";
import { PRECURSORS, precursorForNpc } from "@/lib/precursorCatalog";
import { hasAllArtifacts, LOVELACE_QUESTS } from "@/lib/precursors";
import {heroProportions} from "@/lib/heroModels";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, useProgress } from "@react-three/drei";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";
import KingdomDetails from './KingdomDetails';
import CombatFeedback from './CombatFeedback';
import {advanceJump,isEditingTarget,MOVEMENT_REST,movementRelativeToCamera,movementStep} from '@/lib/controls';
import BiomeDetails from "./BiomeDetails";
import MaterialCraftStand from "./MaterialCraftStand";
import OriginalPilot from "./OriginalPilot";
import ProfessionalPilot from "./ProfessionalPilot";
import Character from "./Character";
import SceneDressing from "./SceneDressing";
import MonsterModel from "./MonsterModel";
import { MergedParts, type Part } from "./MergedParts";
import CityDog from "./CityDog";
import PetFollower from "./PetFollower";
import { adventureOf, titleOf, mountOf, mountSpeed, MOUNT_LEVEL, type PetId } from "@/lib/adventure";
import { doorBetween } from "@/lib/dungeon";
import { PLAZA_RADIUS, CITADEL_SECTORS, TOWN_SERVICES, type Interior, type InteriorPanel, type TownService } from "@/lib/town";
import { FLIGHT_HEIGHT, frameWorld, WORLD_ORBIT, WORLD_ZOOM, worldCameraOptions, worldCameraTargetHeight } from "@/lib/worldCamera";
import WorldDetails, { HouseDetails } from "./WorldDetails";
import {MONSTERS,REGIONS,AGGRO_RADIUS,SAFE_TOWN_RADIUS,isAggressive,monsterRequirement} from "@/lib/campaign";
import CampaignWorld from "./CampaignWorld";
import { questMarker } from "@/lib/journey";
import { npcMarker, cleanLog } from "@/lib/quests";
import TrainerDistrict from "./TrainerDistrict";
import CityMarket from "./CityMarket";
import { type MarketStall } from "@/lib/cityMarket";
import TownDistrict from "./TownDistrict";
import FlyingMount from "./FlyingMount";
import { guideStop, routeToPoint, type GuideRequest } from "@/lib/questNavigation";
import RacialCity from "./RacialCity";
import CityRoutes from "./CityRoutes";
import {insideCity,oppositeGateSide,roadAt,type CityGate} from "@/lib/overland";
import {isNewCity,isRacialCity} from "@/lib/kingdomCities";
import CodeSpots from "./CodeSpots";
import GatherNodes, { WorldUnlocks } from "./GatherNodes";
import ExplorationEncounters from "./ExplorationEncounters";
import PavingMaterial from "./PavingMaterial";
import {biomeOf,flightRelief} from "@/lib/biomes";
import ScenicRoutes from "./ScenicRoutes";
import DiscoverySite from "./DiscoverySite";
import { scenicTrailPath } from "@/lib/scenicTrails";
import {monsterPoint} from "@/lib/patrols";
import Wildlands from "./Wildlands";
import TerrainSurface from "./TerrainSurface";
import { activeEquipment } from "@/lib/equipment";
import { CLASSES, ITEMS, hunterCompanion } from "@/lib/game";
import { useGame } from "@/lib/store";
import { ContactShadow } from "./GroundFx";
import RegionParticles from "./RegionParticles";
import WorldHorizon from "./WorldHorizon";
import { bindCursor, cursorOn, setCombatCursor } from "@/lib/cursor";
import { isRangedClass } from "@/lib/combatEffects";
import { attackRange } from "@/lib/combat";
import { BUILDINGS, TREES, findPath, followRoadPath, walkable } from "@/lib/navigation";
import { NPCS_LIVE, type NpcId, type Look, type ClassId, type Race } from "@/lib/game";

export class WorldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="world-fallback"><h2>O portal 3D não abriu</h2><p>Ative a aceleração gráfica e recarregue. Seu progresso continua disponível nos painéis.</p><button onClick={() => window.location.reload()}>Tentar novamente</button></div> : this.props.children; }
}
const DEFAULT_LOOK: Look = { body: 2, hair: 0, beard: 2, moustache: 1, skin: 1, hairColor: 2, eyes: 0, face: 1, nose: 1, brows: 1, scar: 0, tattoo: 0, accessory: 0, cloth: 1, helmet: 1, ears: 0 };
function Stone({ position, size = 1, color = "#777e79" }: { position: [number, number, number]; size?: number; color?: string }) { return <mesh position={position} scale={[size, size * 0.6, size * 0.8]} castShadow receiveShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>; }
function Tree({ x, z, size = 1 }: { x: number; z: number; size?: number }) {
  const crown=useRef<THREE.Group>(null),ray=useRef(new THREE.Ray()),origin=useRef(new THREE.Vector3()),direction=useRef(new THREE.Vector3()),hit=useRef(new THREE.Vector3()),bounds=useRef(new THREE.Box3(new THREE.Vector3(x-2.1*size,1.2*size,z-2.1*size),new THREE.Vector3(x+2.1*size,5.8*size,z+2.1*size)));
  // 5.0: vento leve. A copa balança a partir da base, cada árvore no seu ritmo (desligado com Reduzir movimento).
  useFrame(({clock})=>{const g=crown.current;if(!g||useGame.getState().settings.reduceMotion)return;const t=clock.elapsedTime+x*.37+z*.21;g.rotation.z=Math.sin(t*.9)*.03+Math.sin(t*2.3)*.008;g.rotation.x=Math.cos(t*.7)*.02;});
  useFrame(({camera},dt)=>{const state=useGame.getState(),enemy=MONSTERS.find(m=>m.id===state.encounter?.monsterId);const targets=[state.hero.position,...(enemy?[state.encounter?.position??[enemy.x,enemy.z]]:[])];const near=targets.some(p=>Math.hypot(p[0]-x,p[1]-z)<9*size),crowns=crown.current?.children??[];if(!near&&crowns.every(o=>((o as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity>=1))return; // longe do herói: nada a esconder
// Testa cabeça e pés do herói (e do inimigo): se a copa cobre qualquer parte, ela fica quase transparente.
 const covered=targets.some(p=>[.4,1.3,2.3].some(y=>{origin.current.set(p[0],y,p[1]);direction.current.copy(camera.position).sub(origin.current);const distance=direction.current.length();ray.current.set(origin.current,direction.current.normalize());return !!ray.current.intersectBox(bounds.current,hit.current)&&origin.current.distanceTo(hit.current)<distance;}));crown.current?.children.forEach(o=>{const m=(o as THREE.Mesh).material as THREE.MeshStandardMaterial;if(m){m.opacity=THREE.MathUtils.damp(m.opacity,covered?.12:1,10,Math.min(dt,.1));if(m.opacity>.995)m.opacity=1;m.depthWrite=m.opacity>.95;const see=m.opacity<1;if(m.transparent!==see){m.transparent=see;m.needsUpdate=true;}}});});
  return <group position={[x, 0, z]} scale={size}>
    <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.2, 0.42, 3.2, 10]} /><meshStandardMaterial color="#a06a3f" roughness={0.9} /></mesh>
    <group ref={crown}>{[0, 1, 2].map(i => <mesh key={i} position={[Math.sin(i*2)*.35,2.6+i*.8,Math.cos(i*2)*.25]} scale={[1,.8,1]} castShadow={i===0}><icosahedronGeometry args={[1.65-i*.3,2]} /><meshStandardMaterial color={["#4fa84a", "#6fc04e", "#9ad45e"][i]} roughness={0.85} /></mesh>)}</group>
  </group>;
}
/** Peças paradas da casa, juntas em poucas malhas (mesma aparência, bem menos desenhos). */
const WALLS = ["#f1d6a5", "#e7cbaa", "#e6d6bd", "#ebcc97"];
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const HOUSE_CAST = [0, 1, 2, 3].map(index => (): Part[] => [
  { g: box(4.7, 3.2, 4.5), p: [0, 1.9, 0], c: WALLS[index] },
  ...[-2.3, 0, 2.3].map((a): Part => ({ g: box(0.16, 3.3, 0.17), p: [a, 1.9, 2.28], c: "#4b4235" })),
  { g: box(0.65, 2.3, 0.7), p: [1.4, 4.5, -1], c: "#797c74" },
  { g: new THREE.CylinderGeometry(0.38, 0.34, 0.79, 10), p: [2.08, 0.68, 1.73], c: "#7d6247" },
]);
const HOUSE_FIXED = (): Part[] => [
  { g: box(5.3, 0.65, 5), p: [0, 0.3, 0], c: "#77786d" },
  { g: box(1.25, 2.7, 0.15), p: [0, 1.62, 2.3], c: "#4c4034" },
  ...[-1.45, 1.45].flatMap((a): Part[] => [{ g: box(0.07, 0.99, 0.15), p: [a, 2.25, 2.31], c: "#554737" }, { g: box(0.84, 0.08, 0.15), p: [a, 2.25, 2.31], c: "#554737" }]),
  { g: box(0.08, 0.72, 0.1), p: [-1.9, 3.15, 2.38], c: "#5b4b35" },
  { g: new THREE.OctahedronGeometry(0.11), p: [-1.9, 2.88, 2.48], c: "#cbb98a" },
  ...[-1.5, 1.5].flatMap((x): Part[] => [{ g: new THREE.ConeGeometry(0.22, 0.2, 4), p: [x, 1.89, 2.45], c: "#4d554e" }, { g: box(0.3, 0.06, 0.27), p: [x, 1.42, 2.45], c: "#4d554e" }]),
  ...[-0.23, 0.23].map((y): Part => ({ g: new THREE.CylinderGeometry(0.39, 0.39, 0.07, 10), p: [2.08, 0.68 + y, 1.73], c: "#4f5c57" })),
  { g: box(1.8, 0.25, 0.5), p: [0, 0.22, 2.65], c: "#8a8b78" },
];
const HOUSE_WINDOWS = (): Part[] => [-1.45, 1.45].map(a => ({ g: box(0.8, 0.95, 0.1), p: [a, 2.25, 2.31], c: "#efc483" }));
const HOUSE_LANTERNS = (): Part[] => [-1.5, 1.5].map(x => ({ g: box(0.27, 0.39, 0.24), p: [x, 1.65, 2.45], c: "#b09962" }));
const CITADEL_FACADE = (index: number): Part[] => [
  { g: box(4.7, 3.25, 4.5), p: [0, 1.65, 0], c: "#66718a" },
  { g: box(5.15, .32, 4.92), p: [0, .17, 0], c: "#303c58" },
  { g: box(4.9, .23, 4.7), p: [0, 3.22, 0], c: "#b99855" },
  { g: box(1.18, 1.92, .12), p: [0, 1.1, 2.27], c: "#20203b" },
  ...[-1.82, 1.82].flatMap((x): Part[] => [
    { g: box(.63, 3.35, .4), p: [x, 1.78, 2.25], c: "#3c4967" },
    { g: box(.8, .16, .49), p: [x, 3.46, 2.26], c: "#d2ac61" },
    { g: box(.5, 1.2, .07), p: [x * .58, 2.25, 2.29], c: "#79c9d2" },
  ]),
  { g: box(1.28, .68, .08), p: [0, 2.63, 2.32], c: ["#342251", "#254264", "#503766", "#29346a"][index] },
  { g: new THREE.OctahedronGeometry(.16), p: [0, 2.62, 2.41], c: "#e9c478" },
];
function House({ x, z, index, citadel }: { x: number; z: number; index: number; citadel: boolean }) {
  const roofMaterial=useRef<THREE.MeshStandardMaterial>(null),ray=useRef(new THREE.Ray()),origin=useRef(new THREE.Vector3()),direction=useRef(new THREE.Vector3()),hit=useRef(new THREE.Vector3()),bounds=useRef(new THREE.Box3(new THREE.Vector3(x-3.1,3,z-3.1),new THREE.Vector3(x+3.1,5.8,z+3.1)));
  useFrame(({camera},dt)=>{if(!roofMaterial.current)return;const p=useGame.getState().hero.position;origin.current.set(p[0],1.7,p[1]);direction.current.copy(camera.position).sub(origin.current);const distance=direction.current.length();ray.current.set(origin.current,direction.current.normalize());const covered=ray.current.intersectBox(bounds.current,hit.current)&&origin.current.distanceTo(hit.current)<distance;roofMaterial.current.opacity=THREE.MathUtils.damp(roofMaterial.current.opacity,covered?.28:1,10,dt);roofMaterial.current.depthWrite=roofMaterial.current.opacity>.95;});
  return <group position={[x, 0, z]} rotation={[0, index % 2 ? -0.12 : 0.1, 0]}>
    {citadel ? <>
      <MergedParts parts={() => CITADEL_FACADE(index)} castShadow receiveShadow />
      <mesh position={[0, 4.04, 0]} castShadow><boxGeometry args={[4.45, 1.45, 4.22]} /><meshStandardMaterial ref={roofMaterial} transparent color="#293654" /></mesh>
      <MergedParts parts={() => [-1.7, -.57, .57, 1.7].flatMap((x): Part[] => [
        { g: box(.55, .53, .52), p: [x, 5.02, 2.03], c: "#55668a" },
        { g: box(.55, .53, .52), p: [x, 5.02, -2.03], c: "#55668a" },
      ])} castShadow />
    </> : <>
    <HouseDetails index={index} />
    <MergedParts parts={HOUSE_CAST[index]} castShadow receiveShadow />
    <MergedParts parts={HOUSE_FIXED} receiveShadow />
    <MergedParts parts={HOUSE_WINDOWS} emissive="#e6a858" emissiveIntensity={0.4} />
    <MergedParts parts={HOUSE_LANTERNS} emissive="#b68c43" emissiveIntensity={0.35} />
    <mesh position={[0, 4.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[4.05, 2.8, 4]} /><meshStandardMaterial ref={roofMaterial} transparent color={citadel ? "#263453" : index % 2 ? "#386c93" : "#b2644b"} flatShading /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[1.4 + i * 0.16, 5.8 + i * 0.6, -1]} scale={0.25 + i * 0.14}><sphereGeometry args={[1, 7, 6]} /><meshBasicMaterial color="#c5c9c0" transparent opacity={0.12 - i * 0.025} depthWrite={false} /></mesh>)}
    </>}
  </group>;
}
function CitadelInterior({ room, onGroundClick, read }: {
  room: Interior;
  onGroundClick: (event: ThreeEvent<MouseEvent>) => void;
  read: () => void;
}) {
  const near = useGame(s => Math.hypot(s.hero.position[0] - room.x, s.hero.position[1] - room.z + 1.1) < 5);
  return <group position={[room.x, 0, room.z]}>
    <mesh position={[0,.04,0]} receiveShadow onClick={onGroundClick}>
      <boxGeometry args={[room.w * 2,.08,room.d * 2]} /><PavingMaterial color="#b7a894" />
    </mesh>
    <MergedParts parts={() => [
      { g: box(room.w * 2,2.4,.35), p: [0,1.2,-2.3], c: "#626e88" },
      ...[-1,1].flatMap((side): Part[] => [
        { g: box(.35,1.25,4.6), p: [side*(room.w - .2),.625,0], c: "#626e88" },
        { g: box(1.8,.7,.3), p: [side*1.7,.35,2.35], c: "#626e88" },
        { g: box(1.65,1.5,.28), p: [side*1.55,.9,-2.03], c: "#513927" },
        ...Array.from({length:6},(_,i): Part => ({g:box(.19,.32,.22),p:[side*(.88+i*.23),1.13,-1.83],c:[room.accent,"#547f87","#884a59"][i%3]})),
      ]),
    ]} castShadow receiveShadow />
    <group position={[0,0,-1.1]} {...cursorOn("point")} onClick={event=>{
      if(event.button!==0||event.delta>6)return;
      event.stopPropagation();
      read();
    }}>
      <mesh position={[0,.55,0]}><boxGeometry args={[1.45,1.1,.65]} /><meshStandardMaterial color={room.id === "workshop" ? "#535865" : "#784e2f"} /></mesh>
      {room.id === "workshop" ? <mesh position={[0,1.28,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.26,.075,6,12]} /><meshStandardMaterial color={room.accent} metalness={.5} /></mesh>
        : room.id === "academy" ? <mesh position={[0,1.32,0]}><octahedronGeometry args={[.23]} /><meshStandardMaterial color={room.accent} emissive="#287183" emissiveIntensity={.5} /></mesh>
        : <mesh position={[0,1.12,0]}><boxGeometry args={[.74,.09,.42]} /><meshStandardMaterial color="#f6dfab" emissive="#684d31" emissiveIntensity={.25}/></mesh>}
      {near&&<Html center position={[0,1.65,0]} style={{pointerEvents:"none"}}><span className="town-sign">{room.label}</span></Html>}
    </group>
  </group>;
}

/** 5.0: céu em degradê (azul profundo no alto, cor do bioma no horizonte). Acompanha a câmera e fica atrás de tudo. */
function SkyDome({ top, horizon }: { top: string; horizon: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(100, 32, 16), p = g.getAttribute("position"), colors = new Float32Array(p.count * 3);
    const a = new THREE.Color(horizon), b = new THREE.Color(top), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const t = Math.max(0, Math.min(1, p.getY(i) / 100)); c.copy(a).lerp(b, Math.pow(t, .55)).toArray(colors, i * 3); }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3)); return g;
  }, [top, horizon]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ camera }) => { mesh.current?.position.copy(camera.position); });
  return <mesh ref={mesh} geometry={geometry} renderOrder={-10} raycast={() => null} frustumCulled={false}><meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} depthTest={false} fog={false} /></mesh>;
}
function CitadelSectors() {
  return <>{CITADEL_SECTORS.map(sector => <CitadelSign key={sector.name} {...sector} />)}</>;
}
function CitadelSign({name, x, z}: {name: string; x: number; z: number}) {
  const near = useGame(s => Math.hypot(s.hero.position[0] - x, s.hero.position[1] - z) < 8);
  return <group position={[x, 0, z]}>
    <mesh position={[0, 1.85, 0]}><boxGeometry args={[.13, 3.7, .13]} /><meshStandardMaterial color="#4d4269" /></mesh>
    <mesh position={[0, 3.4, 0]}><boxGeometry args={[.95, .8, .08]} /><meshStandardMaterial color="#281842" emissive="#39205e" emissiveIntensity={.45} /></mesh>
    <mesh position={[0, 3.8, 0]}><boxGeometry args={[1.06, .075, .12]} /><meshStandardMaterial color="#c9a052" /></mesh>
    {near && <Html position={[0, 4.05, 0]} center zIndexRange={[4, 0]} style={{pointerEvents:"none"}}><span className="town-sign">{name}</span></Html>}
  </group>;
}

function Crystal({ small = false }: { small?: boolean }) {
  const root = useRef<THREE.Group>(null); const motion = useGame(s => !s.settings.reduceMotion);
  const core = useRef<THREE.MeshStandardMaterial>(null), halo = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (root.current && motion) { root.current.rotation.y += dt * 0.3; root.current.position.y = 1.65 + Math.sin(t * 1.5) * 0.12; }
    // 5.0: o cristal pulsa com luz própria e uma auréola respira em volta.
    const pulse = motion ? .5 + .5 * Math.sin(t * 2.1) : .5;
    if (core.current) core.current.emissiveIntensity = .55 + pulse * .75;
    if (halo.current) { halo.current.scale.setScalar(1.15 + pulse * .25); (halo.current.material as THREE.MeshBasicMaterial).opacity = .1 + pulse * .12; }
  });
  return <group scale={small ? 0.4 : 1}>
    <mesh position={[0, 0.15, 0]} receiveShadow><cylinderGeometry args={[1.4, 1.65, 0.3, 12]} /><meshStandardMaterial color="#c9d6d2" /></mesh>
    <group ref={root} position={[0, 1.65, 0]}>
      {[0, 1, 2].map(index => (
        <mesh key={index} rotation={[Math.PI / 3, index * Math.PI / 3, 0]}>
          <torusGeometry args={[1.04 + index * .085, .028, 5, 36]} />
          <meshStandardMaterial color="#c9a05c" metalness={.62} roughness={.38} />
        </mesh>
      ))}
      <mesh castShadow><octahedronGeometry args={[0.65]} /><meshStandardMaterial ref={core} color="#8acdd4" emissive="#4fc3d2" emissiveIntensity={0.8} metalness={0.4} roughness={0.2} flatShading /></mesh>
      <mesh ref={halo} raycast={() => null}><sphereGeometry args={[.72, 20, 14]} /><meshBasicMaterial color="#7fe6f2" transparent opacity={.15} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      {!small && <pointLight color="#6fe0ee" intensity={2.2} distance={9} decay={2} />}
      {[0, 1, 2].map(i => <mesh key={i} position={[Math.cos(i * 2.094) * 0.8, -0.45, Math.sin(i * 2.094) * 0.8]}><octahedronGeometry args={[0.21]} /><meshStandardMaterial color="#d0bde8" emissive="#8c70bb" emissiveIntensity={0.5} /></mesh>)}
    </group>
  </group>;
}
const PRECURSOR_LOOKS: Partial<Record<NpcId, Partial<Look>>> = {
  lovelace: { hair: 3, hairColor: 2, body: 1 },
  borin: { hair: 4, hairColor: 4, beard: 2, brows: 2, body: 4 },
  eldrin: { hair: 1, hairColor: 4, beard: 5, body: 2 },
  turing: { hair: 2, hairColor: 0, brows: 1, body: 1 },
  "von-neumann": { hair: 1, hairColor: 1, moustache: 1, body: 3 },
  pascal: { hair: 3, hairColor: 0, moustache: 2, body: 2 },
  leibniz: { hair: 5, hairColor: 4, body: 3 },
  jacquard: { hair: 2, hairColor: 3, beard: 3, body: 4 },
  hollerith: { hair: 1, hairColor: 2, moustache: 3, body: 2 },
  zuse: { hair: 4, hairColor: 0, brows: 3, body: 1 },
};
function Npc({ npc, interact, player, labeled }: { npc: typeof NPCS_LIVE[number]; interact: (id: NpcId) => void; player: RefObject<THREE.Vector3>; labeled: boolean }) {
  const root = useRef<THREE.Group>(null); const shade = useRef(-1); const marker = useGame(({ hero, education }) => {
    if (npc.id === "chamber") return hasAllArtifacts(hero) && !hero.chamberComplete ? "!" : "";
    const precursor = precursorForNpc(npc.id);
    const mainMarker = npc.id === "eldrin" ? questMarker(hero, education, "main") : "";
    return mainMarker || npcMarker(cleanLog(hero.quests), npc.id, hero.level, education.completed)
      || ((npc.id === "lovelace" && (hero.lovelaceProgress ?? 0) < LOVELACE_QUESTS.length)
        || (precursor && (hero.precursorProgress?.[precursor] ?? 0) < PRECURSORS[precursor].quests.length) ? "!" : "");
  });
  const reduced = useGame(s => s.settings.reduceMotion);
  // 5.0: o NPC respira e vira o rosto para o herói quando ele chega perto (volta devagar quando ele se afasta).
  const body = useRef<THREE.Group>(null);
  useFrame((state, dt) => { const b = body.current; if (!b || reduced) return; const t = state.clock.elapsedTime + npc.x * .3;
    b.scale.y = 1 + Math.sin(t * 1.6) * .012; const dx = player.current.x - npc.x, dz = player.current.z - npc.z, near = Math.hypot(dx, dz) < 6;
    const goal = near ? Math.atan2(dx, dz) : 0; let diff = goal - b.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); b.rotation.y += diff * Math.min(1, dt * 3); });
  useFrame(state => { const close = Math.hypot(player.current.x - npc.x, player.current.z - npc.z) < 7; if (!root.current) return;
    // Longe do herói o personagem não faz sombra (desenha metade das vezes); confere 2x por segundo.
    if (state.clock.elapsedTime - shade.current > .5) { shade.current = state.clock.elapsedTime; const shadow = Math.hypot(player.current.x - npc.x, player.current.z - npc.z) < 16; root.current.traverse(o => { if (!(o as THREE.Mesh).isMesh) return; if (o.userData.shadow0 === undefined) o.userData.shadow0 = o.castShadow; o.castShadow = shadow && o.userData.shadow0; }); } root.current.rotation.y = close ? Math.atan2(player.current.x - npc.x, player.current.z - npc.z) : Math.sin(state.clock.elapsedTime * 0.15 + npc.x) * 0.3; if (!reduced && npc.id === "pip" && !close) root.current.position.x = Math.sin(state.clock.elapsedTime * 0.45) * 0.5; });
  return <group position={[npc.x, 0, npc.z]} {...cursorOn("talk")} onClick={e => { if (e.delta < 6 && e.button === 0) { e.stopPropagation(); interact(npc.id); } }}>
    {npc.id === "chamber" ? <group position={[0, 1, 0]}>
      <mesh><torusGeometry args={[.82, .1, 8, 28]} /><meshStandardMaterial color="#c9a052" emissive="#62409b" emissiveIntensity={.65} /></mesh>
      <mesh position={[0, -.93, 0]}><boxGeometry args={[1.8, .14, .75]} /><meshStandardMaterial color="#243249" /></mesh>
    </group> : npc.id === "lion" ? <Crystal /> : <group ref={root} position={[0, 0, 0]}><ContactShadow radius={.75} opacity={.34} /><group ref={body}><Character classId={npc.classId} race={npc.id==="borin"?"dwarf":npc.id==="pip"?"gnome":npc.id==="elara"?"elf":npc.id==="dorin"?"dwarf":"human"} skinOverride={npc.id === "pip" ? "#7d9858" : undefined} look={{ ...DEFAULT_LOOK, skin: npc.id === "pip" ? 5 : 1, beard: npc.id === "eldrin" ? 5 : (npc.id === "pip" || npc.id === "lovelace") ? 0 : 3, hair: npc.id === "lovelace" ? 3 : DEFAULT_LOOK.hair, hairColor: npc.id === "eldrin" ? 4 : 2, cloth: npc.id === "lovelace" ? 3 : npc.id === "eldrin" ? 4 : 0, ...PRECURSOR_LOOKS[npc.id] }} equipped={npc.id==="eldrin"?["staff","tunic"]:npc.id==="borin"?["tool","tunic"]:["dagger","tunic"]} animated={!reduced} /></group></group>}
    {labeled && <Html zIndexRange={[8, 0]} position={[0, npc.id === "borin" || npc.id === "dorin" ? 2.05 : npc.id === "pip" ? 1.6 : 2.85, 0]} center style={{ pointerEvents: "none" }}><div className="npc-label near"><span className="quest-marker main-quest">{marker}</span><strong>{npc.name}</strong></div></Html>}
  </group>;
}
/** Aura do Herói: anel dourado e brilhos girando em volta do herói enquanto o bônus do Nexus estiver ativo. */
function HeroAura() {
  const active = useGame(s => (s.hero.nexus?.aura ?? 0) > 0), root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { const g = root.current; if (!g) return; const t = clock.elapsedTime; g.rotation.y = t * 1.2; g.children.forEach((c, i) => { if (i > 0) c.position.y = .3 + ((t * .8 + i * .37) % 2.2); }); });
  if (!active) return null;
  return <group ref={root}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .06, 0]}><ringGeometry args={[.85, 1.05, 40]} /><meshBasicMaterial color="#ffd86b" transparent opacity={.8} depthWrite={false} /></mesh>{Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[Math.cos(i * .785) * .95, .3, Math.sin(i * .785) * .95]}><octahedronGeometry args={[.07]} /><meshBasicMaterial color={i % 2 ? "#fff3b0" : "#ffc23a"} /></mesh>)}</group>;
}
function WorldFraming() {
  const camera=useThree(s=>s.camera),size=useThree(s=>s.size);
  useLayoutEffect(()=>{if(camera instanceof THREE.OrthographicCamera)frameWorld(camera,size.width,size.height);},[camera,size.width,size.height]);
  return null;
}
function Scene({ paused, interact, openService, openMarket, report, thirdPerson, guide, endGuide }: { guide: GuideRequest | null; endGuide: () => void; thirdPerson: boolean; paused: boolean; interact: (id: NpcId) => void; openService: (id: TownService | InteriorPanel | "mounts" | "journey" | "workshop") => void; report: (text: string) => void; openMarket: (id: MarketStall) => void }) {
  // Pausado (janela aberta) o mundo não desenha; só tira uma "foto" nova se algo terminar de carregar ou a tela mudar de tamanho.
  const advance = useThree(s => s.advance), size = useThree(s => s.size), loading = useProgress(s => s.active);
  useEffect(() => { if (!paused || loading) return; const id = requestAnimationFrame(t => advance(t)); return () => cancelAnimationFrame(id); }, [paused, loading, size, advance]);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null); const shadowRoot=useRef<THREE.Group>(null);const jump=useRef({height:0,velocity:0});const movement=useRef(MOVEMENT_REST);const canvasPointer=useRef(""); const heroRoot = useRef<THREE.Group>(null);
  const mounted=useGame(s=>s.mounted); const encounter=useGame(s=>s.encounter); const relocation=useGame(s=>s.relocation); const lastRelocation=useRef(relocation); const hero = useGame(s => s.hero); const riding=mounted&&hero.level>=MOUNT_LEVEL&&!hero.dead&&!encounter&&!hero.instance; const walkMode = useGame(s => s.walking); const speed=4.5*(riding?mountSpeed(hero):walkMode?.55:1); const mount=mountOf(hero);const airborne=riding&&(mount?.id==="dragon"||mount?.id==="griffin"&&!!hero.flyingMount);const mountKind=mount?.id==="dragon"?"dragon":mount?.id==="boar"?"boar":"wolf"; const adventure=adventureOf(hero); const title=hero.chamberComplete ? "Guardião dos Dez Artefatos" : titleOf(adventure); const doorNote=useRef(0); const look = useGame(s => s.look); const education = useGame(s => s.education.completed); const reduced = useGame(s => s.settings.reduceMotion);
  const gear = activeEquipment(hero, ITEMS);
  const companion = hunterCompanion(hero, gear);
  const low = useGame(s => s.settings.quality === "low"); const quality = useGame(s => s.settings.quality);
  const worldRegion=hero.instance?"instance":hero.region;
  const lastRegion=useRef(hero.region); const player = useRef(new THREE.Vector3(hero.position[0], 0, hero.position[1])); // Position belongs to the simulation; save checkpoints do not recreate it.
  const handledGuide=useRef<{request:GuideRequest; region:string} | null>(null);
  const stop=guide?.heroId===hero.id?guideStop(hero,guide.target,useGame.getState()):undefined;
  const monsterTarget=useRef<string|null>(null); const aggroCheck=useRef(0); const gatherTarget=useRef<{id:string;x:number;z:number}|null>(null); const path = useRef<[number, number][]>([]); const pending = useRef<{ x: number; z: number; open: () => void; range?: number } | null>(null); const keys = useRef(new Set<string>()); const checkpoint = useRef(0); const wasWalking = useRef(false); const [walking, setWalking] = useState(false);
  const compact = size.width < 1000 || size.height < 550;
  const desktopCamera = thirdPerson && !compact;
  const guideNpc = stop && 'npc' in stop.target && !stop.portal && !stop.campaign ? stop.target.npc : undefined;
  const nearbyNames = NPCS_LIVE.map(npc=>({
    id:npc.id, distance:Math.hypot(npc.x-hero.position[0],npc.z-hero.position[1]),
  })).filter(npc=>npc.id!==guideNpc && npc.distance < (compact ? 5.4 : 7.5))
    .sort((a,b)=>a.distance-b.distance).slice(0,compact?2:4);
  const labeledNpcs = new Set(encounter ? [] : nearbyNames.map(npc=>npc.id));
  const camera = useThree(s => s.camera);const invalidate=useThree(s=>s.invalidate); const canvas=useThree(s=>s.gl.domElement);
  useEffect(()=>{
    const rememberPointer=(event:PointerEvent)=>{canvasPointer.current=event.pointerType;};
    bindCursor(canvas);
    canvas.addEventListener("pointerdown",rememberPointer);
    return ()=>{canvas.removeEventListener("pointerdown",rememberPointer);bindCursor(null);};
  },[canvas]); useEffect(()=>{setCombatCursor(!!encounter);},[encounter]); const temp = useRef(new THREE.Vector3()); const offset = useRef(new THREE.Vector3());
  useLayoutEffect(()=>{const c=controls.current;if(!c)return;const p=player.current;temp.current.set(p.x,worldCameraTargetHeight(thirdPerson, false),p.z);offset.current.copy(temp.current).sub(c.target);camera.position.add(offset.current);c.target.copy(temp.current);c.update();invalidate();},[camera,invalidate,thirdPerson]);
  const pausedRef = useRef(paused); useEffect(() => { pausedRef.current = paused; }, [paused]);
  const [light, setLight] = useState(0.8);
  useEffect(() => { const update = () => { const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date()); const h = Number(parts.find(p => p.type === "hour")?.value ?? 12) + Number(parts.find(p => p.type === "minute")?.value ?? 0)/60; setLight(Math.max(0.36, Math.sin((h - 6) / 12 * Math.PI))); }; update(); const id = setInterval(update, 60000); return () => clearInterval(id); }, []);
  useLayoutEffect(() => {
    if (lastRelocation.current!==relocation || Math.hypot(player.current.x - hero.position[0], player.current.z - hero.position[1]) > 6 || hero.dead || lastRegion.current!==hero.region) { player.current.set(hero.position[0], 0, hero.position[1]);jump.current={height:0,velocity:0};path.current = [];lastRegion.current=hero.region;lastRelocation.current=relocation;pending.current=null;monsterTarget.current=null;if(controls.current){temp.current.set(player.current.x,worldCameraTargetHeight(thirdPerson, airborne),player.current.z);offset.current.copy(temp.current).sub(controls.current.target);camera.position.add(offset.current);controls.current.target.copy(temp.current);controls.current.update();invalidate();} }
  }, [hero.position, hero.dead, hero.region, relocation,player,camera,invalidate,thirdPerson,airborne]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (pausedRef.current||e.ctrlKey||e.altKey||e.metaKey||isEditingTarget(e.target))return;if(e.code==="Space"){e.preventDefault();if(!e.repeat)keys.current.add("jump");return;} const k = e.key.toLowerCase(); if (["e"].includes(k)) { e.preventDefault(); keys.current.add(k); } };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase()); const blur = () => {keys.current.clear();movement.current=MOVEMENT_REST;};
    const onJump=()=>{if(!pausedRef.current)keys.current.add("jump");},onInteract=()=>{if(!pausedRef.current)keys.current.add("e");},onMove=(e:Event)=>{const p=(e as CustomEvent<{x:number;z:number}>).detail;if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z))movement.current=pausedRef.current?MOVEMENT_REST:p;};window.addEventListener("lions-cave-jump",onJump);window.addEventListener("lions-cave-interact",onInteract);window.addEventListener("lions-cave-move",onMove);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => {window.removeEventListener("lions-cave-jump",onJump);window.removeEventListener("lions-cave-interact",onInteract);window.removeEventListener("lions-cave-move",onMove); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);
  function travel(x: number, z: number) {
    path.current = findPath([player.current.x, player.current.z], [x, z], worldRegion,airborne);
    if (!path.current.length) report("Toque em um ponto livre do terreno ou escolha uma cidade no mapa.");
  }
  function travelNear(x:number,z:number){
    path.current=routeToPoint([player.current.x,player.current.z],[x,z],hero);
    if(!path.current.length){pending.current=null;monsterTarget.current=null;report('Não há caminho livre até esse alvo. Verifique os acessos da região.');}
  }
  /** Clique no monstro: seleciona o alvo. Clicar de novo no alvo (ou a tecla 1) ataca; o herói anda até o alcance. */
  function approachMonster(id:string){
    if(paused)return;const s=useGame.getState();if(s.encounter){if(s.encounter.monsterId===id)s.act({kind:'attack'});return;}
    const m=MONSTERS.find(m=>m.id===id&&m.region===hero.region&&(m.instance??null)===(hero.instance??null));if(!m)return;endGuide();pending.current=null;gatherTarget.current=null;
    if(s.target===id)s.act({kind:'attack'});else s.setTarget(id);
  }
  function approachGather(id:string,x:number,z:number){
    if(paused)return;endGuide();pending.current=null;monsterTarget.current=null;
    if(Math.hypot(player.current.x-x,player.current.z-z)<3){useGame.getState().move([player.current.x,player.current.z]);useGame.getState().gather(id);gatherTarget.current=null;return;}
    gatherTarget.current={id,x,z};travelNear(x,z);
  }
  function approachInteraction(x: number, z: number, open: () => void, onBlocked?: () => void) {
    const state = useGame.getState();
    if (paused || hero.dead || state.encounter) return;
    state.setTarget(null);
    monsterTarget.current = null;
    gatherTarget.current = null;
    pending.current = null;
    path.current = [];
    if (Math.hypot(player.current.x - x, player.current.z - z) < 3.2) {
      useGame.getState().move([player.current.x, player.current.z]);
      open();
      return;
    }
    pending.current = { x, z, open };
    travelNear(x, z);
    if(!path.current.length)onBlocked?.();
  }
  function followRoad(point:[number,number]) {
    const state=useGame.getState();
    if(paused||state.encounter||state.hero.dead)return;
    state.setTarget(null);
    pending.current=null;
    gatherTarget.current=null;
    monsterTarget.current=null;
    const exit=roadAt(state.hero.region,player.current.x,player.current.z);
    if(exit?.end[0]===point[0]&&exit.end[1]===point[1]) {
      crossBoundary();
      return;
    }
    const route=roadAt(state.hero.region,...point);
    path.current=route?followRoadPath([player.current.x,player.current.z],route,state.hero.region,airborne):[];
    if(!path.current.length){
      report("Caminho até a estrada indisponível. Aproxime-se do portão e tente novamente.");
      endGuide();
    }
  }
  function crossBoundary() {
    if(hero.instance)return false;
    const road=roadAt(hero.region,player.current.x,player.current.z);
    if(!road)return false;
    const state=useGame.getState();
    if(state.hero.region!==hero.region)return false;
    state.move([player.current.x,player.current.z]);
    state.overlandTravel(road.to);
    const arrived=useGame.getState().hero;
    if(arrived.region===hero.region)return false;
    player.current.set(arrived.position[0],0,arrived.position[1]);
    path.current=[];
    pending.current=null;
    handledGuide.current=null;
    if(guide&&'road' in guide.target)endGuide();
    return true;
  }
  function crossGate(gate:CityGate) {
    if(paused||useGame.getState().encounter||hero.dead)return;
    endGuide();
    useGame.getState().setTarget(null);
    pending.current=null;
    gatherTarget.current=null;
    monsterTarget.current=null;
    travel(...oppositeGateSide(gate,[player.current.x,player.current.z]));
  }
  function npcClick(id: NpcId) {
    const npc = NPCS_LIVE.find(n => n.id === id);
    if (npc && !paused && !useGame.getState().encounter) endGuide();
    if (npc) approachInteraction(npc.x, npc.z, () => interact(id));
  }
  function serviceClick(id: TownService) {
    const service = TOWN_SERVICES.find(entry => entry.id === id);
    if (service && !paused && !useGame.getState().encounter) endGuide();
    if (service) approachInteraction(service.x, service.z, () => openService(id));
  }
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); let moving = false;
    if (!paused && !hero.dead && !useGame.getState().encounter) {
      const input=movement.current;
      if (!input.x && !input.z && guide && (handledGuide.current?.request !== guide || handledGuide.current.region !== hero.region)) {
        handledGuide.current = { request: guide, region: hero.region };
        if (stop?.overland) followRoad(stop.point);
        else if (stop && 'scenic' in stop.target) {
          const [x,z]=stop.point;
          const state=useGame.getState();
          state.setTarget(null);
          monsterTarget.current=null;gatherTarget.current=null;pending.current=null;
          const origin:[number,number]=[player.current.x,player.current.z];
          path.current=scenicTrailPath(origin,hero.region,airborne);
          const arrive=()=>{endGuide();report(`Você chegou a ${stop.name}.`);};
          if(Math.hypot(origin[0]-x,origin[1]-z)<.55){path.current=[];arrive();}
          else if(path.current.length)pending.current={x,z,range:.55,open:arrive};
          else {endGuide();report('Caminho até a trilha indisponível.');}
        }
        else if (stop) approachInteraction(...stop.point, () => {
          const state = useGame.getState();
          if (stop.portal || stop.campaign || stop.leaveInstance || stop.enterInstance) {
            if (stop.portal) state.skyTravel(stop.portal);
            if (stop.campaign) state.travelRegion(stop.campaign);
            if (stop.leaveInstance) state.leaveInstance();
            if (stop.enterInstance) state.enterInstance(stop.enterInstance);
            const arrived = useGame.getState().hero;
            if (arrived.region === hero.region && arrived.instance === hero.instance) endGuide();
            else {
              player.current.set(arrived.position[0], 0, arrived.position[1]);
              // An expedition pin ends on entry. Guides to a creature inside continue.
              if ('instance' in stop.target && stop.enterInstance) endGuide();
              handledGuide.current = null;
            }
          } else {
            endGuide();
            if ('discovery' in stop.target) state.openDiscovery();
            else if (stop.gather) state.gather(stop.gather);
            else if (stop.monster) state.setTarget(stop.monster);
            else if ('npc' in stop.target) interact(stop.target.npc);
            else if ('trainer' in stop.target) {
              if (state.hero.classInitiated === false) state.trainClass(stop.target.trainer);
              else openService('journey');
            }
          }
        }, endGuide);
        else endGuide();
      }
      if(useGame.getState().hero.region!==hero.region)return;
      const fromZ = player.current.z;
      const k = keys.current;
      if(input.x||input.z){
        if(guide)endGuide();
        path.current=[];pending.current=null;gatherTarget.current=null;monsterTarget.current=null;
        const state=useGame.getState();
        if(state.queued)state.setTarget(state.target);
        const orbitTarget=controls.current?.target??player.current;
        const direction=movementRelativeToCamera(input,camera.position.x-orbitTarget.x,camera.position.z-orbitTarget.z);
        const playerPosition=player.current;
        const [x,z]=movementStep(playerPosition.x,playerPosition.z,direction.x*speed*dt,direction.z*speed*dt,
          (nextX,nextZ)=>walkable(nextX,nextZ,worldRegion,airborne));
        temp.current.set(x-playerPosition.x,0,z-playerPosition.z);
        moving=temp.current.lengthSq()>0;
        playerPosition.add(temp.current);
      } else {
        if (path.current.length && !walkable(...path.current[0],worldRegion, airborne)) path.current=[];
        if (path.current.length) { const p = path.current[0]; temp.current.set(p[0] - player.current.x, 0, p[1] - player.current.z); if (temp.current.length() < 0.14) path.current.shift(); else { const step = Math.min(temp.current.length(), dt * speed); temp.current.normalize().multiplyScalar(step); player.current.add(temp.current); moving = true; } }
      }
      if (moving && crossBoundary()) return;
      // Masmorra: a porta de código fechada segura o herói na sala atual.
      if (hero.instance && moving) { const sealed = doorBetween(hero.instance, adventure.doors, fromZ, player.current.z); if (sealed) { player.current.z = sealed.z + .6; path.current = []; monsterTarget.current = null; if (useGame.getState().queued) useGame.setState({ queued: null }); if (Date.now() - doorNote.current > 4000) { doorNote.current = Date.now(); report(`🔒 ${sealed.title}: clique na porta e resolva o código.`); } } }
      if (heroRoot.current && moving) heroRoot.current.rotation.y = Math.atan2(temp.current.x, temp.current.z);
      const interaction = pending.current;
      if (interaction && Math.hypot(player.current.x - interaction.x, player.current.z - interaction.z) < (interaction.range ?? 3.2)) {
        path.current = [];
        pending.current = null;
        useGame.getState().move([player.current.x, player.current.z]);
        interaction.open();
      }
      const state=useGame.getState();
      if(state.queued&&state.target){
        const monster=MONSTERS.find(m=>m.id===state.target);
        const now=Date.now();
        if(!monster||(state.slain[monster.id]??0)>now){
          useGame.setState({queued:null,target:null});monsterTarget.current=null;
        }else{
          const [x,z]=monsterPoint(monster,now,state.hero.position),action=state.queued;
          if(Math.hypot(player.current.x-x,player.current.z-z)<=attackRange(state.hero,action)){
            path.current=[];monsterTarget.current=null;
            if(heroRoot.current)heroRoot.current.rotation.y=Math.atan2(x-player.current.x,z-player.current.z);
            state.move([player.current.x,player.current.z]);
            state.startEncounter(monster.boss,monster.level,monster.id,action);
            useGame.setState({queued:null});
            if(useGame.getState().encounter)useGame.getState().act(action);
          }else if(monsterTarget.current!==monster.id||!path.current.length){
            monsterTarget.current=monster.id;
            travelNear(x,z);
          }
        }
      }
      if(gatherTarget.current){const g=gatherTarget.current;if(Math.hypot(player.current.x-g.x,player.current.z-g.z)<3){path.current=[];gatherTarget.current=null;useGame.getState().move([player.current.x,player.current.z]);useGame.getState().gather(g.id);}}
      if (k.has("e")) { k.delete("e"); const npc = NPCS_LIVE.find(n => Math.hypot(player.current.x - n.x, player.current.z - n.z) < 3.3); if (npc) { useGame.getState().move([player.current.x, player.current.z]); interact(npc.id); } }
    } else { keys.current.clear(); path.current = []; pending.current = null; handledGuide.current = null; if (guide && useGame.getState().encounter) endGuide(); }
    if(!paused&&!hero.dead&&!useGame.getState().encounter){if(keys.current.delete("jump")&&jump.current.height===0)jump.current.velocity=6.2;jump.current=advanceJump(jump.current.height,jump.current.velocity,dt);}else{keys.current.delete("jump");movement.current=MOVEMENT_REST;}
    if (moving !== wasWalking.current) { setWalking(moving); wasWalking.current = moving; }
    const relief=airborne?flightRelief(hero.region,player.current.x,player.current.z):0;
    if(heroRoot.current){heroRoot.current.position.copy(player.current);heroRoot.current.position.y=jump.current.height+(airborne?FLIGHT_HEIGHT+relief:0);}if(shadowRoot.current){shadowRoot.current.position.set(player.current.x,.045,player.current.z);shadowRoot.current.scale.setScalar(1-jump.current.height*.13);}
    if (controls.current) {
      const orbit = controls.current;
      temp.current.set(player.current.x, worldCameraTargetHeight(thirdPerson, airborne)+relief, player.current.z);
      offset.current.copy(temp.current).sub(orbit.target).multiplyScalar(reduced ? 1 : Math.min(1, dt * 8));
      orbit.target.add(offset.current);
      camera.position.add(offset.current);
    }
    // Monstros agressivos: se o herói chega perto (fora da vila), eles atacam primeiro.
    aggroCheck.current += dt;
    if(aggroCheck.current>.4&&!paused){
      aggroCheck.current=0;
      const st=useGame.getState(),p=player.current;
      const safe=!st.hero.instance&&(insideCity(st.hero.region,p.x,p.z)
        ||st.hero.region==='aurora'&&Math.hypot(p.x,p.z)<SAFE_TOWN_RADIUS);
      if(!safe&&!airborne&&!st.encounter&&!st.challenge&&!st.hero.dead){
        const now=Date.now();
        const angry=MONSTERS.find(m=>{
          if(m.region!==st.hero.region||(m.instance??null)!==(st.hero.instance??null)
            ||!isAggressive(m)||(st.slain[m.id]??0)>now||Math.hypot(p.x-m.x,p.z-m.z)>AGGRO_RADIUS+2)return false;
          const [x,z]=monsterPoint(m,now,st.hero.position);
          return Math.hypot(p.x-x,p.z-z)<AGGRO_RADIUS
            &&!monsterRequirement(st.hero,st.education,m.id)
            &&(!st.hero.instance||!doorBetween(st.hero.instance,adventure.doors,p.z,z))
            &&[.25,.5,.75].every(t=>walkable(p.x+(x-p.x)*t,p.z+(z-p.z)*t,worldRegion));
        });
        if(angry){
          st.move([p.x,p.z]);
          st.startEncounter(angry.boss,angry.level,angry.id);
          if(useGame.getState().encounter){
            path.current=[];monsterTarget.current=null;
            useGame.setState({target:angry.id,queued:null,notice:`${angry.name} te atacou! Toque em Atacar ou Recuar.`});
          }
        }
      }
    }
    checkpoint.current += dt;
    if (checkpoint.current > 0.7) { checkpoint.current = 0; const p = useGame.getState().hero.position; if (Math.hypot(p[0] - player.current.x, p[1] - player.current.z) > 0.05) useGame.getState().move([player.current.x, player.current.z]); }
  });
  const groundClick = (e: ThreeEvent<MouseEvent>) => { if (e.button !== 0 || e.delta > 6 || paused) return; e.stopPropagation(); if(canvasPointer.current==="touch" || useGame.getState().encounter)return;endGuide();useGame.getState().setTarget(null);pending.current = null;monsterTarget.current=null;gatherTarget.current=null; travel(e.point.x, e.point.z); };
  const horizon = hero.instance ? undefined : biomeOf(hero.region)?.horizon;
  const sky = new THREE.Color("#596882").lerp(new THREE.Color(horizon??"#c2d9d9"),
    Math.max(0,Math.min(1,(light-.36)/.64))).getStyle();
  const distanceFog = hero.instance ? [28, 70] as const : [42, 112] as const;
  return <>
    {stop && <group position={[stop.point[0],.12,stop.point[1]]}>
      <mesh rotation={[-Math.PI / 2,0,0]} raycast={() => null}><ringGeometry args={[.9,1.2,32]} /><meshBasicMaterial color="#63ebff" depthTest={false} /></mesh>
      <Html center position={[0,4.25,0]} zIndexRange={[12,0]} style={{pointerEvents:"none"}}><strong className="quest-world-pin">{stop.name}</strong></Html>
    </group>}
    <color attach="background" args={[sky]} /><fog attach="fog" args={[sky,...distanceFog]} /><SkyDome top={new THREE.Color("#101833").lerp(new THREE.Color("#3f6db5"),Math.round(Math.max(0,Math.min(1,(light-.3)/.7))*20)/20).getStyle()} horizon={sky} />{!hero.instance&&<><RegionParticles region={hero.region} light={light} /><WorldHorizon region={hero.region} /></>}
    {/* 5.0: luz com mais contraste: sol quente, céu azulado, chão terroso e uma luz fria de recorte por trás. */}
    <ambientLight intensity={.14+light*.14} /><hemisphereLight args={["#b9d4ff", "#5b4a33", .8+light*.35]} />
    <directionalLight position={[14, 9, -16]} intensity={.3+light*.35} color="#9fb8ff" />
    <directionalLight position={[-13, 23, 10]} intensity={1.15+light*1.95} color="#ffd8a4" castShadow shadow-mapSize={quality==="high"?[2048,2048]:[1024,1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={20} shadow-camera-bottom={-25} shadow-bias={-0.00035} shadow-normalBias={.035} />
    <GatherNodes paused={paused} approach={approachGather}/>
    {hero.region!=="goddard"&&<KingdomDetails region={hero.region} low={low}/>}<CombatFeedback />
    {hero.region==="goddard"&&!hero.instance?<group position={[0,-.35,-4.5]}>
      <mesh onClick={groundClick} receiveShadow><boxGeometry args={[39,.7,34]}/><meshStandardMaterial color={REGIONS.goddard.color}/></mesh>
      <mesh position={[0,-2.7,0]} rotation={[Math.PI,0,0]} scale={[1,.7,.85]}><coneGeometry args={[22,6,7]}/><meshStandardMaterial color="#4e5068" flatShading/></mesh>
    </group>:<TerrainSurface region={hero.instance?"instance":hero.region} onClick={groundClick} color={REGIONS[hero.region].color}/>}
    {!hero.instance&&<><Wildlands region={hero.region} low={low}/><ScenicRoutes region={hero.region} ground={groundClick}/><DiscoverySite region={hero.region} paused={paused} approach={(x,z,open)=>{endGuide();approachInteraction(x,z,open);}}/></>}
    {!hero.instance&&isRacialCity(hero.region)&&<TrainerDistrict city={hero.region} paused={paused} approach={approachInteraction} openJourney={()=>openService("journey")}/>}
    {!hero.instance&&<CityMarket region={hero.region} paused={paused} approach={approachInteraction} open={openMarket}/>}
    {!hero.instance&&<CityRoutes region={hero.region} paused={paused} ground={groundClick} cross={crossGate}
      followRoad={point=>{endGuide();followRoad(point);}} approach={(x,z,open)=>{endGuide();approachInteraction(x,z,open);}}/>}
    {!hero.instance&&isNewCity(hero.region)&&<RacialCity city={hero.region} paused={paused} approach={approachInteraction} openService={openService} openStory={()=>interact("eldrin")}/>}<CampaignWorld paused={paused} approach={approachMonster} approachGate={(x,z,open)=>{endGuide();approachInteraction(x,z,open);}}/>{!hero.instance&&hero.region==="aurora"&&<BiomeDetails region="aurora"/>}{!hero.instance&&hero.region==="aurora"&&<SceneDressing quality={low?"low":quality==="high"?"high":"medium"} groundColor={REGIONS.aurora.color}/>}{hero.region==="aurora"&&!hero.instance&&<>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]} onClick={groundClick} receiveShadow><circleGeometry args={[PLAZA_RADIUS, 40]} /><PavingMaterial color="#c7b08c" relief={!low} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[11, 0.025, -16]} onClick={groundClick}><planeGeometry args={[25, 3]} /><meshStandardMaterial color="#8e8b76" /></mesh>
    <group position={[0, .04, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.8, 3.9, 48]} /><meshBasicMaterial color="#c2a15e" side={THREE.DoubleSide} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[4.05, 4.1, 48]} /><meshBasicMaterial color="#5aabb1" side={THREE.DoubleSide} /></mesh>
    </group>
    <CitadelSectors />
    <TownDistrict onGroundClick={groundClick} onService={serviceClick}/><CodeSpots night={light<0.4}/><CityDog/><WorldUnlocks/><ExplorationEncounters paused={paused} interact={()=>interact("traveler")} report={report} /><WorldDetails night={light<0.4} low={low} reduced={reduced} />
    {BUILDINGS.map((b, i) => "id" in b ? <CitadelInterior key={b.id} room={b} onGroundClick={groundClick} read={()=>{
      const state = useGame.getState();
      if(paused || hero.dead || state.encounter) return;
      const {x,z} = player.current;
      pending.current = null;
      monsterTarget.current = null;
      gatherTarget.current = null;
      state.setTarget(null);
      if(z < b.z + 1.6 && Math.hypot(x - b.x, z - b.z + 1.1) < 1.6){
        path.current = [];
        state.move([x,z]);
        openService(b.panel);
      } else {
        travel(b.x,b.z);
        if(path.current.length) pending.current = { x:b.x, z:b.z, range:.7, open:()=>openService(b.panel) };
      }
    }} /> : <House key={i} x={b.x} z={b.z} index={i%4} citadel={i >= 4} />)}
    {TREES.map((t, i) => <Tree key={i} {...t} />)}
    {[-1, 1].flatMap(side => [0, 1, 2, 3, 4].map(i => <Tree key={`${side}-${i}`} x={side * (17 + i % 2 * 3)} z={10 - i * 6} size={0.9 + i * 0.11} />))}
    {Array.from({ length: 22 }, (_, i) => <Stone key={i} position={[Math.sin(i * 7.3) * 25, 0.2, -30 + Math.cos(i * 4.1) * 4]} size={1.6 + i % 3} color="#697879" />)}
    {Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[Math.sin(i * 3.7) * 15, 0.13, 10 + Math.cos(i * 4.2) * 3]} rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[0.55, 7]} /><meshStandardMaterial color="#809367" /></mesh>)}
    <Stone position={[22, 0.5, -20]} size={3} color="#77767d" />
    {[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[21 + Math.cos(i * 2) * 2, 1 + i * 0.2, -20 + Math.sin(i * 2) * 1.3]} scale={[0.45, 1.2, 0.45]}><octahedronGeometry /><meshStandardMaterial color="#b19fca" emissive="#66527e" emissiveIntensity={0.5} /></mesh>)}
    {NPCS_LIVE.map(npc => <Npc key={npc.id} npc={npc} interact={npcClick} player={player} labeled={labeledNpcs.has(npc.id)} />)}

    {education.includes("loops") && [-1, 1].flatMap(side => [0, 1, 2, 3].map(i => <group key={`lamp-${side}-${i}`} position={[side * 2.8, 0, -14 - i * 3]}><mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.06, 0.1, 1.4, 6]} /><meshStandardMaterial color="#564a3a" /></mesh><mesh position={[0, 1.5, 0]}><octahedronGeometry args={[0.19]} /><meshStandardMaterial color="#edce8b" emissive="#d4ac57" emissiveIntensity={1.4} /></mesh></group>))}
    </>}
    <group ref={shadowRoot}><mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.48,24]}/><meshBasicMaterial color="#172a39" transparent opacity={.25} depthWrite={false}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.003,0]}><ringGeometry args={[.51,.55,24]}/><meshBasicMaterial color="#f8d474" transparent opacity={.55} depthWrite={false}/></mesh></group>
    <group ref={heroRoot} rotation={[0, thirdPerson ? Math.PI : 0, 0]} position={[hero.position[0], 0, hero.position[1]]}><ContactShadow radius={.8} opacity={.4} /><HeroAura />{!compact&&<Html position={[0,3*heroProportions(hero.race).height*.74+.3,0]} center style={{pointerEvents:"none"}}><span className="player-name">{hero.name}{title&&<small>«{title}»</small>}</span></Html>}{riding&&<group scale={.65}>{airborne&&mountKind!=="dragon"&&hero.flyingMount?<FlyingMount id={hero.flyingMount} reduced={reduced}/>:<MonsterModel kind={mountKind} boss={false} reduced={reduced}/>}</group>}<group position={[0,riding?(mountKind==="dragon"?1.23:.8):0,0]}><Character race={hero.race} classId={hero.classId} look={look} equipped={gear.map(item=>item.id)} level={hero.level} combatant walking={walking&&!riding} animated={!reduced} /></group>
    </group>
    {companion&&!hero.dead&&!airborne&&<PetFollower kind={companion} player={player} reduced={reduced} combat/>}
    {adventure.pet&&!hero.dead&&<PetFollower kind={adventure.pet as PetId} player={player} reduced={reduced}/>}
    <OrbitControls ref={controls} enablePan={false} enabled={!paused} enableDamping={!reduced} dampingFactor={0.08} minZoom={WORLD_ZOOM.min} maxZoom={WORLD_ZOOM.max} minDistance={desktopCamera ? 5.5 : 8} maxDistance={desktopCamera ? 32 : thirdPerson ? 25 : 13} minPolarAngle={WORLD_ORBIT.minPolarAngle} maxPolarAngle={WORLD_ORBIT.maxPolarAngle} rotateSpeed={WORLD_ORBIT.rotateSpeed} mouseButtons={{ LEFT: undefined, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }} touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }} />
  </>;
}
export default function GameWorld(props: { guide: GuideRequest | null; endGuide: () => void; paused: boolean; interact: (id: NpcId) => void; openService: (id: TownService | InteriorPanel | "mounts" | "journey" | "workshop") => void; report: (text: string) => void; openMarket: (id: MarketStall) => void }) {
  const quality = useGame(s => s.settings.quality);
  const thirdPerson = useGame(s => s.hero.region === "aurora" && !s.hero.instance);
  const rangedView = useGame(s => isRangedClass(s.hero.classId));
  const cameraOptions = useMemo(() => worldCameraOptions(thirdPerson, rangedView), [thirdPerson, rangedView]);
  return <WorldBoundary><Canvas key={thirdPerson ? "citadel" : "region"} frameloop={props.paused ? "never" : "always"} orthographic={!thirdPerson} dpr={quality === "high" ? [1, 1.75] : [1, 1.25]} camera={cameraOptions} shadows={quality !== "low" ? "percentage" : false} gl={{ antialias: quality !== "low", powerPreference: "high-performance" }} fallback={<div className="world-fallback">Seu navegador não disponibilizou o WebGL. Os painéis continuam disponíveis.</div>}><Suspense fallback={null}><WorldFraming /><Scene {...props} thirdPerson={thirdPerson} /></Suspense></Canvas></WorldBoundary>;
}
function CharacterPreview({ classId, race, look, equipped, level,organic=false,fullGear=false }: { classId: ClassId; race: Race; look: Look; equipped: string[]; level: number;organic?:boolean;fullGear?:boolean }) {
  return <Character classId={classId} race={race} look={look} equipped={equipped} level={level} preview animated={true} organic={organic} fullGear={fullGear} />;
}
function PreviewCamera({ race }: { race: Race }) {
  const camera = useThree(s => s.camera);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  void race; // Mesmo enquadramento para comparar as alturas reais das raças.
  const aspect = useThree(s => s.size.width / Math.max(1, s.size.height));
  const target = 1.5;
  const distance = 7.4 / Math.max(.55, Math.min(1, aspect));
  useEffect(()=>{camera.position.set(0,target+.08,distance);controls.current?.target.set(0,target,0);controls.current?.update();},[camera,target,distance]);
  return <OrbitControls ref={controls} target={[0,target,0]} enablePan={false} enableZoom={false} autoRotate={false} enableDamping={false} minDistance={distance} maxDistance={distance} minPolarAngle={Math.PI/2-.035} maxPolarAngle={Math.PI/2-.035} touches={{ONE:THREE.TOUCH.ROTATE}} />;
}
export function CreatorStage({ classId, race=CLASSES[classId].race, look, equipped, level=1,organic=false,professional=false,original=false,materialPreview=false,animation="Idle",fullGear=false }: { classId: ClassId; race?: Race; look: Look; equipped: string[]; level?: number;organic?:boolean;professional?:boolean;original?:boolean;materialPreview?:boolean;animation?:string;fullGear?:boolean }) {
  return <WorldBoundary><Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.7, 5.4], fov: 36 }} gl={{ antialias: true }}><color attach="background" args={["#bdd9e8"]} /><ambientLight intensity={1.1} /><hemisphereLight args={["#c8dce4", "#504130", 1.8]} /><directionalLight position={[3, 5, 4]} intensity={2.1} color="#f3e9da" castShadow /><directionalLight position={[-4, 3, -3]} intensity={1.15} color="#94b3d1" /><Suspense fallback={null}>{original?<OriginalPilot/>:professional?<ProfessionalPilot animation={animation}/>:<CharacterPreview classId={classId} race={race} look={look} equipped={equipped} level={level} organic={organic} fullGear={fullGear} />}</Suspense><Suspense fallback={null}>{materialPreview?<MaterialCraftStand/>:<mesh position={[0, -0.18, 0]} receiveShadow><cylinderGeometry args={[1.15, 1.35, 0.26, 32]} /><meshStandardMaterial color="#354047" metalness={0.3} roughness={0.6} /></mesh>}</Suspense><PreviewCamera race={race} /></Canvas></WorldBoundary>;
}


