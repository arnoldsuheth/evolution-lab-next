"use client";
import {heroProportions} from "@/lib/heroModels";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Component, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";
import KingdomDetails from './KingdomDetails';
import CombatFeedback from './CombatFeedback';
import {advanceJump,isEditingTarget} from '@/lib/controls';
import BiomeDetails from "./BiomeDetails";
import MaterialCraftStand from "./MaterialCraftStand";
import OriginalPilot from "./OriginalPilot";
import ProfessionalPilot from "./ProfessionalPilot";
import Character from "./Character";
import SceneDressing from "./SceneDressing";
import MonsterModel from "./MonsterModel";
import PetFollower from "./PetFollower";
import { adventureOf, titleOf, mountSpeed, MOUNT_LEVEL, type PetId } from "@/lib/adventure";
import { doorBetween } from "@/lib/dungeon";
import { frameWorld } from "@/lib/worldCamera";
import WorldDetails, { HouseDetails } from "./WorldDetails";
import {MONSTERS,REGIONS,AGGRO_RADIUS,SAFE_TOWN_RADIUS,isAggressive} from "@/lib/campaign";
import CampaignWorld from "./CampaignWorld";
import { questMarker } from "@/lib/journey";
import { npcMarker, cleanLog } from "@/lib/quests";
import TownDistrict from "./TownDistrict";
import GatherNodes, { WorldUnlocks } from "./GatherNodes";
import ExplorationEncounters from "./ExplorationEncounters";
import TerrainSurface from "./TerrainSurface";
import { activeEquipment } from "@/lib/equipment";
import { CLASSES, ITEMS } from "@/lib/game";
import { useGame } from "@/lib/store";
import { bindCursor, cursorOn, setCombatCursor } from "@/lib/cursor";
import { ATTACK_RANGE } from "@/lib/combatEffects";
import { BUILDINGS, TREES, findPath, walkable } from "@/lib/navigation";
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
  useFrame(({camera},dt)=>{const state=useGame.getState(),enemy=MONSTERS.find(m=>m.id===state.encounter?.monsterId);const targets=[state.hero.position,...(enemy?[[enemy.x,enemy.z]]:[])];// Testa cabeça e pés do herói (e do inimigo): se a copa cobre qualquer parte, ela fica quase transparente.
 const covered=targets.some(p=>[.4,1.3,2.3].some(y=>{origin.current.set(p[0],y,p[1]);direction.current.copy(camera.position).sub(origin.current);const distance=direction.current.length();ray.current.set(origin.current,direction.current.normalize());return !!ray.current.intersectBox(bounds.current,hit.current)&&origin.current.distanceTo(hit.current)<distance;}));crown.current?.children.forEach(o=>{const m=(o as THREE.Mesh).material as THREE.MeshStandardMaterial;if(m){m.opacity=THREE.MathUtils.damp(m.opacity,covered?.12:1,10,Math.min(dt,.1));m.depthWrite=m.opacity>.95;}});});
  return <group position={[x, 0, z]} scale={size}>
    <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.2, 0.42, 3.2, 10]} /><meshStandardMaterial color="#a06a3f" roughness={0.9} /></mesh>
    <group ref={crown}>{[0, 1, 2].map(i => <mesh key={i} position={[Math.sin(i*2)*.35,2.6+i*.8,Math.cos(i*2)*.25]} scale={[1,.8,1]} castShadow><icosahedronGeometry args={[1.65-i*.3,3]} /><meshStandardMaterial transparent color={["#4fa84a", "#6fc04e", "#9ad45e"][i]} roughness={0.85} /></mesh>)}</group>
  </group>;
}
function House({ x, z, index }: { x: number; z: number; index: number }) {
  const roofMaterial=useRef<THREE.MeshStandardMaterial>(null),ray=useRef(new THREE.Ray()),origin=useRef(new THREE.Vector3()),direction=useRef(new THREE.Vector3()),hit=useRef(new THREE.Vector3()),bounds=useRef(new THREE.Box3(new THREE.Vector3(x-3.1,3,z-3.1),new THREE.Vector3(x+3.1,5.8,z+3.1)));
  useFrame(({camera},dt)=>{if(!roofMaterial.current)return;const p=useGame.getState().hero.position;origin.current.set(p[0],1.7,p[1]);direction.current.copy(camera.position).sub(origin.current);const distance=direction.current.length();ray.current.set(origin.current,direction.current.normalize());const covered=ray.current.intersectBox(bounds.current,hit.current)&&origin.current.distanceTo(hit.current)<distance;roofMaterial.current.opacity=THREE.MathUtils.damp(roofMaterial.current.opacity,covered?.28:1,10,dt);roofMaterial.current.depthWrite=roofMaterial.current.opacity>.95;});
  return <group position={[x, 0, z]} rotation={[0, index % 2 ? -0.12 : 0.1, 0]}>
    <HouseDetails index={index} />
    <mesh position={[0, 0.3, 0]} receiveShadow><boxGeometry args={[5.3, 0.65, 5]} /><meshStandardMaterial color="#77786d" flatShading /></mesh>
    <mesh position={[0, 1.9, 0]} castShadow receiveShadow><boxGeometry args={[4.7, 3.2, 4.5]} /><meshStandardMaterial color={["#f1d6a5", "#e7cbaa", "#e6d6bd", "#ebcc97"][index]} roughness={1} /></mesh>
    <mesh position={[0, 4.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[4.05, 2.8, 4]} /><meshStandardMaterial ref={roofMaterial} transparent color={index % 2 ? "#386c93" : "#b2644b"} flatShading /></mesh>
    {[-2.3, 0, 2.3].map(a => <mesh key={a} position={[a, 1.9, 2.28]} castShadow><boxGeometry args={[0.16, 3.3, 0.17]} /><meshStandardMaterial color="#4b4235" /></mesh>)}
    <mesh position={[0, 1.62, 2.3]}><boxGeometry args={[1.25, 2.7, 0.15]} /><meshStandardMaterial color="#4c4034" /></mesh>
    {[-1.45, 1.45].map(a => <group key={a} position={[a, 2.25, 2.31]}><mesh><boxGeometry args={[0.8, 0.95, 0.1]} /><meshStandardMaterial color="#efc483" emissive="#e6a858" emissiveIntensity={0.4} /></mesh><mesh><boxGeometry args={[0.07, 0.99, 0.15]} /><meshStandardMaterial color="#554737" /></mesh><mesh><boxGeometry args={[0.84, 0.08, 0.15]} /><meshStandardMaterial color="#554737" /></mesh></group>)}
    <mesh position={[1.4, 4.5, -1]} castShadow><boxGeometry args={[0.65, 2.3, 0.7]} /><meshStandardMaterial color="#797c74" /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[1.4 + i * 0.16, 5.8 + i * 0.6, -1]} scale={0.25 + i * 0.14}><sphereGeometry args={[1, 7, 6]} /><meshBasicMaterial color="#c5c9c0" transparent opacity={0.12 - i * 0.025} depthWrite={false} /></mesh>)}
  </group>;
}
function Crystal({ small = false }: { small?: boolean }) {
  const root = useRef<THREE.Group>(null); const motion = useGame(s => !s.settings.reduceMotion);
  useFrame((state, dt) => { if (root.current && motion) { root.current.rotation.y += dt * 0.3; root.current.position.y = 1.65 + Math.sin(state.clock.elapsedTime * 1.5) * 0.12; } });
  return <group scale={small ? 0.4 : 1}>
    <mesh position={[0, 0.15, 0]} receiveShadow><cylinderGeometry args={[1.4, 1.65, 0.3, 12]} /><meshStandardMaterial color="#c9d6d2" /></mesh>
    <group ref={root} position={[0, 1.65, 0]}>
      <mesh castShadow><octahedronGeometry args={[0.65]} /><meshStandardMaterial color="#8acdd4" emissive="#3f9ba9" emissiveIntensity={0.5} metalness={0.4} roughness={0.2} flatShading /></mesh>
      {[0, 1, 2].map(i => <mesh key={i} position={[Math.cos(i * 2.094) * 0.8, -0.45, Math.sin(i * 2.094) * 0.8]}><octahedronGeometry args={[0.21]} /><meshStandardMaterial color="#d0bde8" emissive="#8c70bb" emissiveIntensity={0.5} /></mesh>)}
    </group>
  </group>;
}
function Npc({ npc, interact, player }: { npc: typeof NPCS_LIVE[number]; interact: (id: NpcId) => void; player: RefObject<THREE.Vector3> }) {
  const root = useRef<THREE.Group>(null); const label = useRef<HTMLDivElement>(null); const questHero=useGame(s=>s.hero),questEducation=useGame(s=>s.education); const marker=(npc.id==="eldrin"?questMarker(questHero,questEducation,"main"):"")||npcMarker(cleanLog(questHero.quests),npc.id,questHero.level,questEducation.completed); const reduced = useGame(s => s.settings.reduceMotion);
  useFrame(state => { const close = Math.hypot(player.current.x - npc.x, player.current.z - npc.z) < 7; label.current?.classList.toggle("near", close); if (!root.current) return; root.current.rotation.y = close ? Math.atan2(player.current.x - npc.x, player.current.z - npc.z) : Math.sin(state.clock.elapsedTime * 0.15 + npc.x) * 0.3; if (!reduced && npc.id === "pip" && !close) root.current.position.x = Math.sin(state.clock.elapsedTime * 0.45) * 0.5; });
  return <group position={[npc.x, 0, npc.z]} {...cursorOn("talk")} onClick={e => { if (e.delta < 6 && e.button === 0) { e.stopPropagation(); interact(npc.id); } }}>
    {npc.id === "lion" ? <Crystal /> : <group ref={root} position={[0, 0, 0]}><Character classId={npc.classId} skinOverride={npc.id === "pip" ? "#7d9858" : undefined} look={{ ...DEFAULT_LOOK, skin: npc.id === "pip" ? 5 : 1, beard: npc.id === "eldrin" ? 5 : npc.id === "pip" ? 0 : 3, hairColor: npc.id === "eldrin" ? 4 : 2, cloth: npc.id === "eldrin" ? 4 : 0 }} equipped={npc.id==="eldrin"?["staff","tunic"]:npc.id==="borin"?["tool","tunic"]:["dagger","tunic"]} animated={!reduced} /></group>}
    <Html zIndexRange={[8, 0]} position={[0, npc.id === "lion" ? 3.2 : 3.1, 0]} center style={{ pointerEvents: "none" }}><div ref={label} className="npc-label"><span className="quest-marker main-quest">{marker}</span><strong>{npc.name}</strong><small>{npc.title}</small></div></Html>
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
function Scene({ paused, interact, report }: { paused: boolean; interact: (id: NpcId) => void; report: (text: string) => void }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null); const shadowRoot=useRef<THREE.Group>(null);const jump=useRef({height:0,velocity:0});const touch=useRef({x:0,z:0}); const heroRoot = useRef<THREE.Group>(null);
  const mounted=useGame(s=>s.mounted); const encounter=useGame(s=>s.encounter); const relocation=useGame(s=>s.relocation); const lastRelocation=useRef(relocation); const hero = useGame(s => s.hero); const riding=mounted&&hero.level>=MOUNT_LEVEL&&!hero.dead&&!encounter&&!hero.instance; const speed=4.5*(riding?mountSpeed(hero):1); const mountKind=mountSpeed(hero)>1.4?"boar":"wolf"; const adventure=adventureOf(hero); const title=titleOf(adventure); const doorNote=useRef(0); const look = useGame(s => s.look); const education = useGame(s => s.education.completed); const reduced = useGame(s => s.settings.reduceMotion);
  const low = useGame(s => s.settings.quality === "low"); const quality = useGame(s => s.settings.quality);
  const worldRegion=hero.instance?"instance":hero.region;const forest = !!hero.instance||hero.region!=="aurora"||education.includes("variables"); const mines = !!hero.instance||hero.region!=="aurora"||education.includes("conditions")&&hero.defeatedBosses.includes("boss-forest");
  const lastRegion=useRef(hero.region); const player = useRef(new THREE.Vector3(hero.position[0], 0, hero.position[1])); // Position belongs to the simulation; save checkpoints do not recreate it.
  const monsterTarget=useRef<string|null>(null); const aggroCheck=useRef(0); const gatherTarget=useRef<{id:string;x:number;z:number}|null>(null); const path = useRef<[number, number][]>([]); const pending = useRef<NpcId | null>(null); const keys = useRef(new Set<string>()); const checkpoint = useRef(0); const wasWalking = useRef(false); const [walking, setWalking] = useState(false);
  const camera = useThree(s => s.camera);const invalidate=useThree(s=>s.invalidate); const canvas=useThree(s=>s.gl.domElement);
  useEffect(()=>{bindCursor(canvas);return()=>bindCursor(null);},[canvas]); useEffect(()=>{setCombatCursor(!!encounter);},[encounter]); const temp = useRef(new THREE.Vector3()); const offset = useRef(new THREE.Vector3());
  useLayoutEffect(()=>{const c=controls.current;if(!c)return;const p=player.current;temp.current.set(p.x,1.2,p.z);offset.current.copy(temp.current).sub(c.target);camera.position.add(offset.current);c.target.copy(temp.current);c.update();invalidate();},[camera,invalidate]);
  const pausedRef = useRef(paused); useEffect(() => { pausedRef.current = paused; }, [paused]);
  const [light, setLight] = useState(0.8);
  useEffect(() => { const update = () => { const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date()); const h = Number(parts.find(p => p.type === "hour")?.value ?? 12) + Number(parts.find(p => p.type === "minute")?.value ?? 0)/60; setLight(Math.max(0.36, Math.sin((h - 6) / 12 * Math.PI))); }; update(); const id = setInterval(update, 60000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (lastRelocation.current!==relocation || Math.hypot(player.current.x - hero.position[0], player.current.z - hero.position[1]) > 6 || hero.dead || lastRegion.current!==hero.region) { player.current.set(hero.position[0], 0, hero.position[1]);jump.current={height:0,velocity:0};path.current = [];lastRegion.current=hero.region;lastRelocation.current=relocation;pending.current=null;monsterTarget.current=null;if(controls.current){temp.current.set(player.current.x,1.2,player.current.z);offset.current.copy(temp.current).sub(controls.current.target);camera.position.add(offset.current);controls.current.target.copy(temp.current);controls.current.update();invalidate();} }
  }, [hero.position, hero.dead, hero.region, relocation,player,camera,invalidate]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (pausedRef.current||e.ctrlKey||e.altKey||e.metaKey||isEditingTarget(e.target))return;if(e.code==="Space"){e.preventDefault();if(!e.repeat)keys.current.add("jump");return;} const k = e.key.toLowerCase(); if (["e"].includes(k)) { e.preventDefault(); keys.current.add(k); } };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase()); const blur = () => keys.current.clear();
    const onJump=()=>{if(!pausedRef.current)keys.current.add("jump");},onInteract=()=>{if(!pausedRef.current)keys.current.add("e");},onMove=(e:Event)=>{const p=(e as CustomEvent<{x:number;z:number}>).detail;if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z))touch.current=p;};window.addEventListener("lions-cave-jump",onJump);window.addEventListener("lions-cave-interact",onInteract);window.addEventListener("lions-cave-move",onMove);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => {window.removeEventListener("lions-cave-jump",onJump);window.removeEventListener("lions-cave-interact",onInteract);window.removeEventListener("lions-cave-move",onMove); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);
  function travel(x: number, z: number) {
    path.current = findPath([player.current.x, player.current.z], [x, z], forest, mines,worldRegion);
    if (!path.current.length) report(z < -12 && !forest ? "Conclua a primeira runa com Eldrin para abrir a floresta." : x > 15 && !mines ? "Resolva A comporta das decisões para abrir as minas." : "Escolha um ponto livre no caminho.");
  }
  function travelNear(x:number,z:number){
    const candidates=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return [x+Math.cos(a)*2.7,z+Math.sin(a)*2.7] as [number,number];});
    const routes=candidates.filter(([cx,cz])=>walkable(cx,cz,forest,mines,worldRegion)).map(p=>findPath([player.current.x,player.current.z],p,forest,mines,worldRegion)).filter(route=>route.length);
    routes.sort((a,b)=>a.length-b.length);path.current=routes[0]??[];
    if(!path.current.length){pending.current=null;monsterTarget.current=null;report('Não há caminho livre até esse alvo. Verifique os acessos da região.');}
  }
  /** Clique no monstro: seleciona o alvo. Clicar de novo no alvo (ou a tecla 1) ataca; o herói anda até o alcance. */
  function approachMonster(id:string){
    if(paused)return;const s=useGame.getState();if(s.encounter){if(s.encounter.monsterId===id)s.act({kind:'attack'});return;}
    const m=MONSTERS.find(m=>m.id===id&&m.region===hero.region&&(m.instance??null)===(hero.instance??null));if(!m)return;pending.current=null;gatherTarget.current=null;
    if(s.target===id)s.act({kind:'attack'});else s.setTarget(id);
  }
  function approachGather(id:string,x:number,z:number){
    if(paused)return;pending.current=null;monsterTarget.current=null;
    if(Math.hypot(player.current.x-x,player.current.z-z)<3){useGame.getState().move([player.current.x,player.current.z]);useGame.getState().gather(id);gatherTarget.current=null;return;}
    gatherTarget.current={id,x,z};travelNear(x,z);
  }
  function npcClick(id: NpcId) {
    monsterTarget.current=null;gatherTarget.current=null;
    if (paused) return;
    const npc = NPCS_LIVE.find(n => n.id === id)!;
    if (Math.hypot(player.current.x - npc.x, player.current.z - npc.z) < 3.5) { interact(id); return; }
    pending.current = id; travelNear(npc.x,npc.z);
  }
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); let moving = false;
    if (!paused && !hero.dead && !useGame.getState().encounter) {
      const fromZ = player.current.z;
      const k = keys.current;
      if (path.current.length) { const p = path.current[0]; temp.current.set(p[0] - player.current.x, 0, p[1] - player.current.z); if (temp.current.length() < 0.14) path.current.shift(); else { const step = Math.min(temp.current.length(), dt * speed); temp.current.normalize().multiplyScalar(step); player.current.add(temp.current); moving = true; } }
      // Masmorra: a porta de código fechada segura o herói na sala atual.
      if (hero.instance && moving) { const sealed = doorBetween(hero.instance, adventure.doors, fromZ, player.current.z); if (sealed) { player.current.z = sealed.z + .6; path.current = []; monsterTarget.current = null; if (useGame.getState().queued) useGame.setState({ queued: null }); if (Date.now() - doorNote.current > 4000) { doorNote.current = Date.now(); report(`🔒 ${sealed.title}: clique na porta e resolva o código.`); } } }
      if (heroRoot.current && moving) heroRoot.current.rotation.y = Math.atan2(temp.current.x, temp.current.z);
      if (pending.current) { const npc = NPCS_LIVE.find(n => n.id === pending.current)!; if (Math.hypot(player.current.x - npc.x, player.current.z - npc.z) < 3.2) { path.current = []; const id = pending.current; pending.current = null; interact(id); } }
      {const st=useGame.getState();if(st.queued&&st.target){const m=MONSTERS.find(m=>m.id===st.target);const range=ATTACK_RANGE[st.hero.classId]??4;if(!m||(st.slain[m.id]??0)>Date.now()){useGame.setState({queued:null,target:null});monsterTarget.current=null;}else if(Math.hypot(player.current.x-m.x,player.current.z-m.z)<=range){path.current=[];monsterTarget.current=null;if(heroRoot.current)heroRoot.current.rotation.y=Math.atan2(m.x-player.current.x,m.z-player.current.z);const action=st.queued;st.move([player.current.x,player.current.z]);st.startEncounter(m.boss,m.level,m.id);useGame.setState({queued:null});if(useGame.getState().encounter)useGame.getState().act(action);}else if(monsterTarget.current!==m.id||!path.current.length){monsterTarget.current=m.id;travelNear(m.x,m.z);}}}
      if(gatherTarget.current){const g=gatherTarget.current;if(Math.hypot(player.current.x-g.x,player.current.z-g.z)<3){path.current=[];gatherTarget.current=null;useGame.getState().move([player.current.x,player.current.z]);useGame.getState().gather(g.id);}}
      if (k.has("e")) { k.delete("e"); const npc = NPCS_LIVE.find(n => Math.hypot(player.current.x - n.x, player.current.z - n.z) < 3.3); if (npc) interact(npc.id); }
    } else { keys.current.clear(); path.current = []; }
    if(!paused&&!hero.dead&&!useGame.getState().encounter){if(keys.current.delete("jump")&&jump.current.height===0)jump.current.velocity=6.2;jump.current=advanceJump(jump.current.height,jump.current.velocity,dt);}else{keys.current.delete("jump");touch.current={x:0,z:0};}
    if (moving !== wasWalking.current) { setWalking(moving); wasWalking.current = moving; }
    if(heroRoot.current){heroRoot.current.position.copy(player.current);heroRoot.current.position.y=jump.current.height;}if(shadowRoot.current){shadowRoot.current.position.set(player.current.x,.045,player.current.z);shadowRoot.current.scale.setScalar(1-jump.current.height*.13);}
    if (controls.current) { temp.current.set(player.current.x, 1.2, player.current.z); offset.current.copy(temp.current).sub(controls.current.target).multiplyScalar(reduced ? 1 : Math.min(1, dt * 6)); controls.current.target.add(offset.current); camera.position.add(offset.current); }
    // Monstros agressivos: se o herói chega perto (fora da vila), eles atacam primeiro.
    aggroCheck.current += dt;
    if(aggroCheck.current>.4&&!paused){aggroCheck.current=0;const st=useGame.getState();if(!st.encounter&&!st.challenge&&!st.hero.dead&&!(st.hero.region==='aurora'&&!st.hero.instance&&Math.hypot(player.current.x,player.current.z)<SAFE_TOWN_RADIUS)){const now=Date.now();const angry=MONSTERS.find(m=>m.region===st.hero.region&&(m.instance??null)===(st.hero.instance??null)&&isAggressive(m)&&(st.slain[m.id]??0)<=now&&!(m.instance&&st.hero.instanceProgress?.includes(m.id))&&Math.hypot(player.current.x-m.x,player.current.z-m.z)<AGGRO_RADIUS);if(angry){path.current=[];monsterTarget.current=null;st.move([player.current.x,player.current.z]);useGame.setState({target:angry.id,queued:null});st.startEncounter(angry.boss,angry.level,angry.id);if(useGame.getState().encounter)useGame.setState({notice:`${angry.name} te atacou! Use 1 para atacar ou ↩ para recuar.`});}}}
    checkpoint.current += dt;
    if (checkpoint.current > 0.7) { checkpoint.current = 0; const p = useGame.getState().hero.position; if (Math.hypot(p[0] - player.current.x, p[1] - player.current.z) > 0.05) useGame.getState().move([player.current.x, player.current.z]); }
  });
  const groundClick = (e: ThreeEvent<MouseEvent>) => { if (e.button !== 0 || e.delta > 6 || paused) return; e.stopPropagation(); if(useGame.getState().encounter)return;useGame.getState().setTarget(null);pending.current = null;monsterTarget.current=null;gatherTarget.current=null; travel(e.point.x, e.point.z); };
  const sky = new THREE.Color("#4f6f9c").lerp(new THREE.Color("#bfe8fb"),Math.max(0,Math.min(1,(light-0.36)/0.64))).getStyle();
  return <>
    <color attach="background" args={[sky]} /><fog attach="fog" args={[sky,44,96]} />
    <ambientLight intensity={0.9 + light * 0.45} /><hemisphereLight args={["#e6f3ff", "#6f7d55", 1.3]} />
    <directionalLight position={[12, 22, 8]} intensity={0.7 + light * 1.6} color="#fff0cf" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={20} shadow-camera-bottom={-25} shadow-bias={-0.001} />
    <KingdomDetails region={hero.region} low={low}/><CombatFeedback />
    <TerrainSurface onClick={groundClick} color={REGIONS[hero.region].color}/><CampaignWorld paused={paused} approach={approachMonster}/>{!hero.instance&&hero.region==="aurora"&&<BiomeDetails region="aurora"/>}{!hero.instance&&hero.region==="aurora"&&<SceneDressing quality={low?"low":quality==="high"?"high":"medium"} groundColor={REGIONS.aurora.color}/>}{hero.region==="aurora"&&!hero.instance&&<>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, -4]} onClick={groundClick} receiveShadow><planeGeometry args={[4.8, 48]} /><meshStandardMaterial color="#e6cc92" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} onClick={groundClick} receiveShadow><circleGeometry args={[5.8, 40]} /><meshStandardMaterial color="#efe6cc" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[11, 0.025, -16]} onClick={groundClick}><planeGeometry args={[25, 3]} /><meshStandardMaterial color="#8e8b76" /></mesh>
    <TownDistrict onGroundClick={groundClick}/><GatherNodes paused={paused} approach={approachGather}/><WorldUnlocks/><ExplorationEncounters paused={paused} interact={()=>interact("traveler")} report={report} /><WorldDetails night={light<0.4} low={low} reduced={reduced} />
    {BUILDINGS.map((b, i) => <House key={i} x={b.x} z={b.z} index={i%4} />)}
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
    <group ref={shadowRoot}><mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.48,24]}/><meshBasicMaterial color="#172a39" transparent opacity={.25} depthWrite={false}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.003,0]}><ringGeometry args={[.51,.55,24]}/><meshBasicMaterial color="#f8d474" transparent opacity={.55} depthWrite={false}/></mesh></group>
    <group ref={heroRoot} position={[hero.position[0], 0, hero.position[1]]}><HeroAura /><Html position={[0,3*heroProportions(hero.race).height*.74+.3,0]} center style={{pointerEvents:"none"}}><span className="player-name">{hero.name}{title&&<small>«{title}»</small>}</span></Html>{riding&&<group scale={.65}><MonsterModel kind={mountKind} boss={false} reduced={reduced}/></group>}<group position={[0,riding?.8:0,0]}><Character race={hero.race} classId={hero.classId} look={look} equipped={activeEquipment(hero,ITEMS).map(i=>i.id)} level={hero.level} combatant walking={walking&&!riding} animated={!reduced} /></group>
      {hero.classId === "hunter" && activeEquipment(hero,ITEMS).some(i=>i.category==="weapon") && <group position={[-1.3, 0, 0.5]}><mesh position={[0, 0.45, 0]}><boxGeometry args={[0.4, 0.55, 0.9]} /><meshStandardMaterial color="#b6a88a" /></mesh><mesh position={[0, 0.75, 0.5]}><coneGeometry args={[0.24, 0.65, 4]} /><meshStandardMaterial color="#d3c9af" /></mesh></group>}
    </group>
    {adventure.pet&&!hero.dead&&<PetFollower kind={adventure.pet as PetId} player={player} reduced={reduced}/>}
    <OrbitControls ref={controls} enablePan={false} enabled={!paused} enableDamping={!reduced} dampingFactor={0.08} minZoom={24} maxZoom={65} minPolarAngle={0.84} maxPolarAngle={0.84} mouseButtons={{ LEFT: undefined, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }} touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }} />
  </>;
}
export default function GameWorld(props: { paused: boolean; interact: (id: NpcId) => void; report: (text: string) => void }) {
  const quality = useGame(s => s.settings.quality);
  return <WorldBoundary><Canvas frameloop={props.paused ? "demand" : "always"} orthographic dpr={quality === "high" ? [1, 1.75] : [1, 1.25]} camera={{ position: [14, 18, 14], zoom: 42, left:-840, right:840, top:420, bottom:-420, near:.1, far:220 }} shadows={quality !== "low" ? "percentage" : false} gl={{ antialias: quality !== "low", powerPreference: "high-performance" }} fallback={<div className="world-fallback">Seu navegador não disponibilizou o WebGL. Os painéis continuam disponíveis.</div>}><Suspense fallback={null}><WorldFraming /><Scene {...props} /></Suspense></Canvas></WorldBoundary>;
}
function CharacterPreview({ classId, race, look, equipped, level,organic=false,fullGear=false }: { classId: ClassId; race: Race; look: Look; equipped: string[]; level: number;organic?:boolean;fullGear?:boolean }) {
  return <Character classId={classId} race={race} look={look} equipped={equipped} level={level} preview animated={true} organic={organic} fullGear={fullGear} />;
}
function PreviewCamera({ race }: { race: Race }) {
  const camera = useThree(s => s.camera);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  void race; // Mesmo enquadramento para comparar as alturas reais das raças.
  const target=1.5, distance=7.4;
  useEffect(()=>{camera.position.set(0,target+.08,distance);controls.current?.target.set(0,target,0);controls.current?.update();},[camera,target,distance]);
  return <OrbitControls ref={controls} target={[0,target,0]} enablePan={false} enableZoom={false} autoRotate={false} enableDamping={false} minDistance={distance} maxDistance={distance} minPolarAngle={Math.PI/2-.035} maxPolarAngle={Math.PI/2-.035} touches={{ONE:THREE.TOUCH.ROTATE}} />;
}
export function CreatorStage({ classId, race=CLASSES[classId].race, look, equipped, level=1,organic=false,professional=false,original=false,materialPreview=false,animation="Idle",fullGear=false }: { classId: ClassId; race?: Race; look: Look; equipped: string[]; level?: number;organic?:boolean;professional?:boolean;original?:boolean;materialPreview?:boolean;animation?:string;fullGear?:boolean }) {
  return <WorldBoundary><Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.7, 5.4], fov: 36 }} gl={{ antialias: true }}><color attach="background" args={["#bdd9e8"]} /><ambientLight intensity={1.1} /><hemisphereLight args={["#c8dce4", "#504130", 1.8]} /><directionalLight position={[3, 5, 4]} intensity={2.1} color="#f3e9da" castShadow /><directionalLight position={[-4, 3, -3]} intensity={1.15} color="#94b3d1" /><Suspense fallback={null}>{original?<OriginalPilot/>:professional?<ProfessionalPilot animation={animation}/>:<CharacterPreview classId={classId} race={race} look={look} equipped={equipped} level={level} organic={organic} fullGear={fullGear} />}</Suspense><Suspense fallback={null}>{materialPreview?<MaterialCraftStand/>:<mesh position={[0, -0.18, 0]} receiveShadow><cylinderGeometry args={[1.15, 1.35, 0.26, 32]} /><meshStandardMaterial color="#354047" metalness={0.3} roughness={0.6} /></mesh>}</Suspense><PreviewCamera race={race} /></Canvas></WorldBoundary>;
}


