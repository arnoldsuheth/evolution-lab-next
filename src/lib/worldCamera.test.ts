import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {OrthographicCamera,Vector3} from 'three';
import {frameWorld} from './worldCamera';
test('mapa mantém área jogável no desktop, iPhone e após redimensionamento',()=>{
 const camera=new OrthographicCamera();camera.zoom=42;
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
