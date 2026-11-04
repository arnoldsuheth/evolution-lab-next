"use client";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Component, Suspense, useEffect, useRef, useState, type ReactNode, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";
import Character from "./Character";
import WorldDetails, { HouseDetails } from "./WorldDetails";
import {REGIONS} from "@/lib/campaign";
import CampaignWorld from "./CampaignWorld";
import { questMarker } from "@/lib/journey";
import ExplorationEncounters from "./ExplorationEncounters";
import TerrainSurface from "./TerrainSurface";
import { activeEquipment } from "@/lib/equipment";
import { CLASSES, ITEMS } from "@/lib/game";
import { useGame } from "@/lib/store";
import { BUILDINGS, TREES, findPath, walkable } from "@/lib/navigation";
import { NPCS_LIVE, type NpcId, type Look, type ClassId, type Race } from "@/lib/game";

export class WorldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="world-fallback"><h2>O portal 3D não abriu</h2><p>Ative a aceleração gráfica e recarregue. Seu progresso continua disponível nos painéis.</p><button onClick={() => window.location.reload()}>Tentar novamente</button></div> : this.props.children; }
}
const DEFAULT_LOOK: Look = { body: 2, hair: 2, beard: 2, moustache: 1, skin: 1, hairColor: 2, eyes: 0, face: 1, nose: 1, brows: 1, scar: 0, tattoo: 0, accessory: 0, cloth: 1 };
function Stone({ position, size = 1, color = "#777e79" }: { position: [number, number, number]; size?: number; color?: string }) { return <mesh position={position} scale={[size, size * 0.6, size * 0.8]} castShadow receiveShadow><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={color} flatShading roughness={0.96} /></mesh>; }
function Tree({ x, z, size = 1 }: { x: number; z: number; size?: number }) {
  return <group position={[x, 0, z]} scale={size}>
    <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.16, 0.38, 3.2, 7]} /><meshStandardMaterial color="#64503e" flatShading /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[Math.sin(i*2)*.35,2.6+i*.8,Math.cos(i*2)*.25]} scale={[1,.8,1]} castShadow><icosahedronGeometry args={[1.65-i*.3,1]} /><meshStandardMaterial color={["#314d43", "#426b50", "#5a805b"][i]} flatShading /></mesh>)}
  </group>;
}
function House({ x, z, index }: { x: number; z: number; index: number }) {
  return <group position={[x, 0, z]} rotation={[0, index % 2 ? -0.12 : 0.1, 0]}>
    <HouseDetails index={index} />
    <mesh position={[0, 0.3, 0]} receiveShadow><boxGeometry args={[5.3, 0.65, 5]} /><meshStandardMaterial color="#77786d" flatShading /></mesh>
    <mesh position={[0, 1.9, 0]} castShadow receiveShadow><boxGeometry args={[4.7, 3.2, 4.5]} /><meshStandardMaterial color={["#b1a187", "#b4a18a", "#c0b29a", "#a99b81"][index]} roughness={1} /></mesh>
    <mesh position={[0, 4.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[4.05, 2.8, 4]} /><meshStandardMaterial color={index % 2 ? "#495d65" : "#70534d"} flatShading /></mesh>
    {[-2.3, 0, 2.3].map(a => <mesh key={a} position={[a, 1.9, 2.28]} castShadow><boxGeometry args={[0.16, 3.3, 0.17]} /><meshStandardMaterial color="#4b4235" /></mesh>)}
    <mesh position={[0, 1.38, 2.3]}><boxGeometry args={[1.1, 2.15, 0.15]} /><meshStandardMaterial color="#4c4034" /></mesh>
    {[-1.45, 1.45].map(a => <group key={a} position={[a, 2.25, 2.31]}><mesh><boxGeometry args={[0.8, 0.95, 0.1]} /><meshStandardMaterial color="#efc483" emissive="#e6a858" emissiveIntensity={0.4} /></mesh><mesh><boxGeometry args={[0.07, 0.99, 0.15]} /><meshStandardMaterial color="#554737" /></mesh><mesh><boxGeometry args={[0.84, 0.08, 0.15]} /><meshStandardMaterial color="#554737" /></mesh></group>)}
    <mesh position={[1.4, 4.5, -1]} castShadow><boxGeometry args={[0.65, 2.3, 0.7]} /><meshStandardMaterial color="#797c74" /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[1.4 + i * 0.16, 5.8 + i * 0.6, -1]} scale={0.25 + i * 0.14}><sphereGeometry args={[1, 7, 6]} /><meshBasicMaterial color="#c5c9c0" transparent opacity={0.12 - i * 0.025} depthWrite={false} /></mesh>)}
  </group>;
}
function Crystal({ small = false }: { small?: boolean }) {
  const root = useRef<THREE.Group>(null); const motion = useGame(s => !s.settings.reduceMotion);
  useFrame((state, dt) => { if (root.current && motion) { root.current.rotation.y += dt * 0.3; root.current.position.y = 1.65 + Math.sin(state.clock.elapsedTime * 1.5) * 0.12; } });
  return <group scale={small ? 0.4 : 1}>
    <mesh position={[0, 0.15, 0]} receiveShadow><cylinderGeometry args={[1.4, 1.65, 0.3, 12]} /><meshStandardMaterial color="#677a79" /></mesh>
    <group ref={root} position={[0, 1.65, 0]}>
      <mesh castShadow><octahedronGeometry args={[0.65]} /><meshStandardMaterial color="#8acdd4" emissive="#3f9ba9" emissiveIntensity={0.5} metalness={0.4} roughness={0.2} flatShading /></mesh>
      {[0, 1, 2].map(i => <mesh key={i} position={[Math.cos(i * 2.094) * 0.8, -0.45, Math.sin(i * 2.094) * 0.8]}><octahedronGeometry args={[0.21]} /><meshStandardMaterial color="#d0bde8" emissive="#8c70bb" emissiveIntensity={0.5} /></mesh>)}
    </group>
  </group>;
}
function Npc({ npc, interact, player }: { npc: typeof NPCS_LIVE[number]; interact: (id: NpcId) => void; player: RefObject<THREE.Vector3> }) {
  const root = useRef<THREE.Group>(null); const questHero=useGame(s=>s.hero),questEducation=useGame(s=>s.education); const marker=npc.id==="eldrin"?questMarker(questHero,questEducation,"main"):""; const reduced = useGame(s => s.settings.reduceMotion);
  useFrame(state => { if (!root.current) return; const close = Math.hypot(player.current.x - npc.x, player.current.z - npc.z) < 5; root.current.rotation.y = close ? Math.atan2(player.current.x - npc.x, player.current.z - npc.z) : Math.sin(state.clock.elapsedTime * 0.15 + npc.x) * 0.3; if (!reduced && npc.id === "pip" && !close) root.current.position.x = Math.sin(state.clock.elapsedTime * 0.45) * 0.5; });
  return <group position={[npc.x, 0, npc.z]} onClick={e => { if (e.delta < 6 && e.button === 0) { e.stopPropagation(); interact(npc.id); } }}>
    {npc.id === "lion" ? <Crystal /> : <group ref={root} position={[0, 0, 0]}><Character classId={npc.classId} skinOverride={npc.id === "pip" ? "#7d9858" : undefined} look={{ ...DEFAULT_LOOK, skin: npc.id === "pip" ? 5 : 1, beard: npc.id === "eldrin" ? 5 : npc.id === "pip" ? 0 : 3, hairColor: npc.id === "eldrin" ? 4 : 2, cloth: npc.id === "eldrin" ? 4 : 0 }} equipped={["tunic"]} animated={!reduced} /></group>}
    <Html zIndexRange={[8, 0]} position={[0, npc.id === "lion" ? 3.2 : 3.1, 0]} center distanceFactor={14} style={{ pointerEvents: "none" }}><div className="npc-label"><span className="quest-marker main-quest">{marker}</span><strong>{npc.name}</strong><small>{npc.title}</small></div></Html>
  </group>;
}
function Scene({ paused, interact, report }: { paused: boolean; interact: (id: NpcId) => void; report: (text: string) => void }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null); const heroRoot = useRef<THREE.Group>(null);
  const hero = useGame(s => s.hero); const look = useGame(s => s.look); const education = useGame(s => s.education.completed); const reduced = useGame(s => s.settings.reduceMotion);
  const low = useGame(s => s.settings.quality === "low");
  const forest = hero.region!=="aurora"||education.includes("variables"); const mines = hero.region!=="aurora"||education.includes("conditions")&&hero.defeatedBosses.includes("boss-forest");
  const lastRegion=useRef(hero.region); const player = useRef(new THREE.Vector3(hero.position[0], 0, hero.position[1])); // Position belongs to the simulation; save checkpoints do not recreate it.
  const path = useRef<[number, number][]>([]); const pending = useRef<NpcId | null>(null); const keys = useRef(new Set<string>()); const checkpoint = useRef(0); const wasWalking = useRef(false); const [walking, setWalking] = useState(false);
  const camera = useThree(s => s.camera); const temp = useRef(new THREE.Vector3()); const offset = useRef(new THREE.Vector3());
  const pausedRef = useRef(paused); useEffect(() => { pausedRef.current = paused; }, [paused]);
  const [light, setLight] = useState(0.8);
  useEffect(() => { const update = () => { const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date()); const h = Number(parts.find(p => p.type === "hour")?.value ?? 12) + Number(parts.find(p => p.type === "minute")?.value ?? 0)/60; setLight(Math.max(0.22, Math.sin((h - 6) / 12 * Math.PI))); }; update(); const id = setInterval(update, 60000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (Math.hypot(player.current.x - hero.position[0], player.current.z - hero.position[1]) > 6 || hero.dead || lastRegion.current!==hero.region) { player.current.set(hero.position[0], 0, hero.position[1]); path.current = [];lastRegion.current=hero.region; }
  }, [hero.position, hero.dead, hero.region, player]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (pausedRef.current || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)) return; const k = e.key.toLowerCase(); if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "e"].includes(k)) { e.preventDefault(); keys.current.add(k); } };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase()); const blur = () => keys.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);
  function travel(x: number, z: number) {
    path.current = findPath([player.current.x, player.current.z], [x, z], forest, mines,hero.region);
    if (!path.current.length) report(z < -12 && !forest ? "Conclua a primeira runa com Eldrin para abrir a floresta." : x > 15 && !mines ? "Resolva A comporta das decisões para abrir as minas." : "Escolha um ponto livre no caminho.");
  }
  function npcClick(id: NpcId) {
    if (paused) return;
    const npc = NPCS_LIVE.find(n => n.id === id)!;
    if (Math.hypot(player.current.x - npc.x, player.current.z - npc.z) < 3.5) { interact(id); return; }
    pending.current = id; travel(npc.x + (npc.x > 0 ? -2 : 2), npc.z + 1);
  }
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); let moving = false;
    if (!paused && !hero.dead && !useGame.getState().encounter) {
      const k = keys.current; const x = Number(k.has("d") || k.has("arrowright")) - Number(k.has("a") || k.has("arrowleft")); const z = Number(k.has("s") || k.has("arrowdown")) - Number(k.has("w") || k.has("arrowup"));
      if (x || z) { path.current = []; pending.current = null; temp.current.set(x, 0, z).normalize().multiplyScalar(dt * 4.5); if (walkable(player.current.x + temp.current.x, player.current.z, forest, mines,hero.region)) player.current.x += temp.current.x; if (walkable(player.current.x, player.current.z + temp.current.z, forest, mines,hero.region)) player.current.z += temp.current.z; moving = true; }
      else if (path.current.length) { const p = path.current[0]; temp.current.set(p[0] - player.current.x, 0, p[1] - player.current.z); if (temp.current.length() < 0.14) path.current.shift(); else { const step = Math.min(temp.current.length(), dt * 4.5); temp.current.normalize().multiplyScalar(step); player.current.add(temp.current); moving = true; } }
      if (heroRoot.current && moving) heroRoot.current.rotation.y = Math.atan2(temp.current.x, temp.current.z);
      if (pending.current) { const npc = NPCS_LIVE.find(n => n.id === pending.current)!; if (Math.hypot(player.current.x - npc.x, player.current.z - npc.z) < 3.2) { path.current = []; const id = pending.current; pending.current = null; interact(id); } }
      if (k.has("e")) { k.delete("e"); const npc = NPCS_LIVE.find(n => Math.hypot(player.current.x - n.x, player.current.z - n.z) < 3.3); if (npc) interact(npc.id); }
    } else { keys.current.clear(); path.current = []; }
    if (moving !== wasWalking.current) { setWalking(moving); wasWalking.current = moving; }
    if (heroRoot.current) heroRoot.current.position.copy(player.current);
    if (controls.current) { temp.current.set(player.current.x, 1.2, player.current.z); offset.current.copy(temp.current).sub(controls.current.target).multiplyScalar(reduced ? 1 : Math.min(1, dt * 6)); controls.current.target.add(offset.current); camera.position.add(offset.current); }
    checkpoint.current += dt;
    if (checkpoint.current > 0.7) { checkpoint.current = 0; const p = useGame.getState().hero.position; if (Math.hypot(p[0] - player.current.x, p[1] - player.current.z) > 0.05) useGame.getState().move([player.current.x, player.current.z]); }
  });
  const groundClick = (e: ThreeEvent<MouseEvent>) => { if (e.button !== 0 || e.delta > 6 || paused) return; e.stopPropagation(); pending.current = null; travel(e.point.x, e.point.z); };
  const sky = new THREE.Color("#26374a").lerp(new THREE.Color("#b4c6c0"),Math.max(0,Math.min(1,(light-0.22)/0.78))).getStyle();
  return <>
    <color attach="background" args={[sky]} /><fog attach="fog" args={[sky,38,88]} />
    <ambientLight intensity={0.48 + light * 0.52} /><hemisphereLight args={["#d1e0de", "#59624d", 1.15]} />
    <directionalLight position={[12, 22, 8]} intensity={0.6 + light * 1.5} color="#ffe5bb" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={20} shadow-camera-bottom={-25} shadow-bias={-0.001} />
    <TerrainSurface onClick={groundClick} color={REGIONS[hero.region].color}/><CampaignWorld paused={paused}/>{hero.region==="aurora"&&<>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, -4]} onClick={groundClick} receiveShadow><planeGeometry args={[4.8, 48]} /><meshStandardMaterial color="#a8997c" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} onClick={groundClick} receiveShadow><circleGeometry args={[5.8, 32]} /><meshStandardMaterial color="#a5a18a" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[11, 0.025, -16]} onClick={groundClick}><planeGeometry args={[25, 3]} /><meshStandardMaterial color="#8e8b76" /></mesh>
    <ExplorationEncounters paused={paused} interact={()=>interact("traveler")} report={report} /><WorldDetails night={light<0.4} low={low} reduced={reduced} />
    {BUILDINGS.map((b, i) => <House key={i} x={b.x} z={b.z} index={i} />)}
    {TREES.map((t, i) => <Tree key={i} {...t} />)}
    {[-1, 1].flatMap(side => [0, 1, 2, 3, 4].map(i => <Tree key={`${side}-${i}`} x={side * (17 + i % 2 * 3)} z={10 - i * 6} size={0.9 + i * 0.11} />))}
    {Array.from({ length: 22 }, (_, i) => <Stone key={i} position={[Math.sin(i * 7.3) * 25, 0.2, -30 + Math.cos(i * 4.1) * 4]} size={1.6 + i % 3} color="#697879" />)}
    {Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[Math.sin(i * 3.7) * 15, 0.13, 10 + Math.cos(i * 4.2) * 3]} rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[0.55, 7]} /><meshStandardMaterial color="#809367" /></mesh>)}
    <Stone position={[22, 0.5, -20]} size={3} color="#77767d" />
    {[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[21 + Math.cos(i * 2) * 2, 1 + i * 0.2, -20 + Math.sin(i * 2) * 1.3]} scale={[0.45, 1.2, 0.45]}><octahedronGeometry /><meshStandardMaterial color="#b19fca" emissive="#66527e" emissiveIntensity={0.5} /></mesh>)}
    {NPCS_LIVE.map(npc => <Npc key={npc.id} npc={npc} interact={npcClick} player={player} />)}

    {education.includes("loops") && [-1, 1].flatMap(side => [0, 1, 2, 3].map(i => <group key={`lamp-${side}-${i}`} position={[side * 2.8, 0, -14 - i * 3]}><mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.06, 0.1, 1.4, 6]} /><meshStandardMaterial color="#564a3a" /></mesh><mesh position={[0, 1.5, 0]}><octahedronGeometry args={[0.19]} /><meshStandardMaterial color="#edce8b" emissive="#d4ac57" emissiveIntensity={1.4} /></mesh></group>))}
    {!forest && <group position={[0, 0, -12]}><mesh position={[0, 1.5, 0]}><boxGeometry args={[5, 3, 0.15]} /><meshStandardMaterial color="#a7b8d7" emissive="#756eaa" emissiveIntensity={0.4} transparent opacity={0.3} /></mesh><Html zIndexRange={[8, 0]} position={[0, 3.8, 0]} center><span className="gate-label">A primeira runa abre a floresta</span></Html></group>}
    {!mines && <mesh position={[15, 1.3, -16]}><boxGeometry args={[0.2, 2.6, 6]} /><meshStandardMaterial color="#b8a3cf" transparent opacity={0.25} /></mesh>}
    </>}
    <group ref={heroRoot} position={[hero.position[0], 0, hero.position[1]]}><Character race={hero.race} classId={hero.classId} look={look} equipped={activeEquipment(hero,ITEMS).map(i=>i.id)} level={hero.level} walking={walking} animated={!reduced} />
      {hero.classId === "hunter" && activeEquipment(hero,ITEMS).some(i=>i.category==="weapon") && <group position={[-1.3, 0, 0.5]}><mesh position={[0, 0.45, 0]}><boxGeometry args={[0.4, 0.55, 0.9]} /><meshStandardMaterial color="#b6a88a" /></mesh><mesh position={[0, 0.75, 0.5]}><coneGeometry args={[0.24, 0.65, 4]} /><meshStandardMaterial color="#d3c9af" /></mesh></group>}
    </group>
    <OrbitControls ref={controls} enablePan={false} enabled={!paused} enableDamping={!reduced} dampingFactor={0.08} minZoom={24} maxZoom={65} minPolarAngle={0.84} maxPolarAngle={0.84} mouseButtons={{ LEFT: undefined, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }} touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }} />
  </>;
}
export default function GameWorld(props: { paused: boolean; interact: (id: NpcId) => void; report: (text: string) => void }) {
  const quality = useGame(s => s.settings.quality);
  return <WorldBoundary><Canvas frameloop={props.paused ? "demand" : "always"} orthographic shadows={quality !== "low"} dpr={quality === "high" ? [1, 1.75] : [1, 1.25]} camera={{ position: [14, 18, 14], zoom: 42, near:.1, far:180 }} gl={{ antialias: quality !== "low", powerPreference: "high-performance" }} fallback={<div className="world-fallback">Seu navegador não disponibilizou o WebGL. Os painéis continuam disponíveis.</div>}><Suspense fallback={null}><Scene {...props} /></Suspense></Canvas></WorldBoundary>;
}
function CharacterPreview({ classId, race, look, equipped, level }: { classId: ClassId; race: Race; look: Look; equipped: string[]; level: number }) {
  return <Character classId={classId} race={race} look={look} equipped={equipped} level={level} preview animated={false} />;
}
function PreviewCamera({ race }: { race: Race }) {
  const camera = useThree(s => s.camera);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const height = {human:1.1,orc:1.14,dwarf:0.82,elf:1.2,gnome:0.69}[race];
  const target=1.68*height, distance=6.5*height;
  useEffect(()=>{camera.position.set(0,target+.08,distance);controls.current?.target.set(0,target,0);controls.current?.update();},[camera,target,distance]);
  return <OrbitControls ref={controls} target={[0,target,0]} enablePan={false} enableZoom={false} autoRotate={false} enableDamping={false} minDistance={distance} maxDistance={distance} minPolarAngle={Math.PI/2-.035} maxPolarAngle={Math.PI/2-.035} touches={{ONE:THREE.TOUCH.ROTATE}} />;
}
export function CreatorStage({ classId, race=CLASSES[classId].race, look, equipped, level=1 }: { classId: ClassId; race?: Race; look: Look; equipped: string[]; level?: number }) {
  return <WorldBoundary><Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.7, 5.4], fov: 36 }} gl={{ antialias: true }}><color attach="background" args={["#121b23"]} /><ambientLight intensity={1.1} /><hemisphereLight args={["#c8dce4", "#504130", 1.8]} /><directionalLight position={[3, 5, 4]} intensity={2.1} color="#f3e9da" castShadow /><directionalLight position={[-4, 3, -3]} intensity={1.15} color="#94b3d1" /><CharacterPreview classId={classId} race={race} look={look} equipped={equipped} level={level} /><mesh position={[0, -0.18, 0]} receiveShadow><cylinderGeometry args={[1.15, 1.35, 0.26, 32]} /><meshStandardMaterial color="#354047" metalness={0.3} roughness={0.6} /></mesh><PreviewCamera race={race} /></Canvas></WorldBoundary>;
}
