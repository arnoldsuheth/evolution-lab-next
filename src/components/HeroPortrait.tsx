"use client";
import { Suspense, useEffect, useRef, useSyncExternalStore } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import type { ClassId, Look, Race } from '@/lib/game';
import { heroProportions } from '@/lib/heroModels';
import Character from './Character';
import { ClassPortrait } from './ApprovedArtwork';

/**
 * Retrato fiel: uma "foto" do rosto do próprio boneco 3D (raça, pele, cabelo, rosto e elmo).
 * Tira uma foto por aparência, uma de cada vez (um só contexto WebGL extra), e guarda no navegador.
 * Enquanto a foto não fica pronta, mostra a arte da classe.
 */
type Props = { classId: ClassId; race: Race; look: Look; equipped: string[]; level: number };
const PREFIX = 'lc-portrait-v3:';
const cache = new Map<string, string>(), failed = new Set<string>(), queue: string[] = [], subs = new Set<() => void>();
let owner: string | null = null, version = 0;
const emit = () => { version++; subs.forEach(f => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
function stored(key: string) {
  if (cache.has(key)) return cache.get(key)!;
  try { const v = localStorage.getItem(PREFIX + key); if (v) { cache.set(key, v); return v; } } catch { /* navegador sem armazenamento */ }
  return null;
}
function pump() { if (owner === null && queue.length) { owner = queue.shift()!; emit(); } }
function request(key: string) { if (stored(key) || failed.has(key) || owner === key || queue.includes(key)) return; queue.push(key); pump(); }
function finish(key: string, url: string | null) {
  if (url) { cache.set(key, url); try { localStorage.setItem(PREFIX + key, url); } catch { /* cheio: fica só na memória */ } } else failed.add(key);
  if (owner === key) owner = null; emit(); pump();
}
function release(key: string) { const i = queue.indexOf(key); if (i >= 0) queue.splice(i, 1); if (owner === key) { owner = null; emit(); pump(); } }
function hash(text: string) { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return (h >>> 0).toString(36); }

/** Espera os modelos carregarem e alguns quadros desenharem; então guarda a imagem. */
function Snap({ id, head }: { id: string; head: number }) {
  const { gl, camera } = useThree(), { active } = useProgress(), calm = useRef(0), start = useRef(0), sent = useRef(false);
  useEffect(() => { camera.lookAt(0, head - .04, 0); }, [camera, head]);
  useFrame(({ clock }) => {
    if (sent.current) return;
    if (!start.current) start.current = clock.elapsedTime;
    calm.current = active ? 0 : calm.current + 1;
    const late = clock.elapsedTime - start.current > 9;
    if (calm.current < 12 && !late) return;
    sent.current = true;
    let url: string | null = null;
    try { url = gl.domElement.toDataURL('image/webp', .86); if (!url.startsWith('data:image/webp')) url = gl.domElement.toDataURL('image/png'); } catch { url = null; }
    finish(id, late && active ? null : url);
  });
  return null;
}

function Studio({ id, classId, race, look, equipped, level }: Props & { id: string }) {
  const h = heroProportions(race).height, head = 2.15 * h, distance = 3.1 * h;
  return <div aria-hidden style={{ position: 'fixed', left: -4000, top: 0, width: 192, height: 192, pointerEvents: 'none' }}>
    <Canvas dpr={1} gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }} camera={{ position: [distance * .2, head + .06, distance], fov: 30 }}>
      <ambientLight intensity={1.15} /><hemisphereLight args={['#c8dce4', '#504130', 1.7]} />
      <directionalLight position={[2.5, 4, 5]} intensity={2.2} color="#f3e9da" /><directionalLight position={[-4, 3, -2]} intensity={1} color="#94b3d1" />
      <Suspense fallback={null}><Character classId={classId} race={race} look={look} equipped={equipped} level={level} preview animated={false} /></Suspense>
      <Snap id={id} head={head} />
    </Canvas>
  </div>;
}

export default function HeroPortrait(props: Props) {
  const { classId, race, look, equipped, level } = props;
  const id = hash(JSON.stringify([race, classId, look, [...equipped].sort()]));
  const live = useSyncExternalStore(subscribe, () => version + 1, () => 0) > 0; // 0 no servidor e na hidratação
  const url = live ? stored(id) : null, shooting = live && owner === id;
  useEffect(() => { request(id); return () => release(id); }, [id]);
  return <>
    {url ? <svg className="class-portrait hero-portrait" viewBox="0 0 100 100" role="img" aria-label={`Retrato do herói (${race})`}><image href={url} width="100" height="100" /></svg> : <ClassPortrait classId={classId} />}
    {!url && shooting && <Studio id={id} classId={classId} race={race} look={look} equipped={equipped} level={level} />}
  </>;
}
