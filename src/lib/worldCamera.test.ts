import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {OrthographicCamera,PerspectiveCamera,Vector3} from 'three';
import { FLIGHT_HEIGHT, frameWorld, WORLD_ZOOM, worldCameraOptions, worldCameraTargetHeight } from './worldCamera';
test('mapa mantém área jogável no desktop, iPhone e após redimensionamento',()=>{
 const camera=new OrthographicCamera();camera.zoom=worldCameraOptions(false, false).zoom!;
 for(const [width,height]of [[2048,728],[1366,768],[393,852],[852,393],[0,0]]){
  frameWorld(camera,width,height);
  assert.ok((camera.right-camera.left)/camera.zoom>=16);
  assert.ok((camera.top-camera.bottom)/camera.zoom>=20);
  assert.ok(camera.projectionMatrix.elements.every(Number.isFinite));
  camera.position.set(14,19.2,14);camera.lookAt(0,1.2,0);camera.updateMatrixWorld();
  const hero=new Vector3(0,1.2,0).project(camera);
  assert.ok(Math.abs(hero.x)<.001&&Math.abs(hero.y)<.001&&hero.z>=-1&&hero.z<=1);
 }
});


test('câmera de exploração inicia mais afastada e mantém visão mais ampla para o Hunter', () => {
 const melee = worldCameraOptions(false, false).zoom!;
 const ranged = worldCameraOptions(false, true).zoom!;
 assert.ok(WORLD_ZOOM.min < ranged && ranged < melee && melee < WORLD_ZOOM.max);
 const camera = new OrthographicCamera();
 frameWorld(camera, 852, 393);
 assert.ok((camera.top - camera.bottom) / melee > 24);
 assert.ok((camera.top - camera.bottom) / ranged >= 30);

 const ground = worldCameraTargetHeight(true, false);
 const target = new Vector3(0, ground, 0);
 const heroTop = new Vector3(0, 2.3, 0), heroFeet = new Vector3(0, 0, 0);
 const heightOnScreen = (position: [number, number, number], fov: number) => {
  const view = new PerspectiveCamera(fov, 852 / 393, .15, 135);
  view.position.set(...position).add(target);
  view.lookAt(target);
  view.updateMatrixWorld();
  return Math.abs(heroTop.clone().project(view).y - heroFeet.clone().project(view).y);
 };
 const defaultView = worldCameraOptions(true, false);
 const hunterView = worldCameraOptions(true, true);
 const previous = heightOnScreen([0, 6.1, 10.6], 56);
 const current = heightOnScreen(defaultView.position, defaultView.fov!);
 assert.ok(current < previous * .85);
 assert.ok(heightOnScreen(hunterView.position, hunterView.fov!) < current);
});

test('o foco da câmera acompanha a subida em ambas as projeções', () => {
 for (const thirdPerson of [false, true]) {
  const ground = worldCameraTargetHeight(thirdPerson, false);
  const flying = worldCameraTargetHeight(thirdPerson, true);
  assert.ok(flying > ground && flying < ground + FLIGHT_HEIGHT);
 }
});
