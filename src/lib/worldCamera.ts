import type { OrthographicCamera } from 'three';

export const WORLD_ORBIT = { minPolarAngle: .20, maxPolarAngle: 1.59, rotateSpeed: .66 };
export const WORLD_ZOOM = { min: 18, max: 58 };
export const FLIGHT_HEIGHT = 4.45;

export function worldCameraOptions(thirdPerson: boolean, rangedView: boolean) {
 const position: [number, number, number] = thirdPerson
  ? [0, 7.5, rangedView ? 16.5 : 14.2]
  : [14, 18, 14];
 if (thirdPerson) return { position, fov: rangedView ? 62 : 56, near: .15, far: 135 };
 return { position, zoom: rangedView ? 28 : 34, left: -840, right: 840, top: 420, bottom: -420, near: .1, far: 220 };
}

export function worldCameraTargetHeight(thirdPerson: boolean, airborne: boolean) {
 return (thirdPerson ? 1.65 : 1.2) + (airborne ? FLIGHT_HEIGHT * .8 : 0);
}

/** Explicit world-space framing, independent of initial canvas measurements. */
export function frameWorld(camera:OrthographicCamera,width:number,height:number){
 const aspect=Math.max(1,width)/Math.max(1,height),viewHeight=Math.max(20,16/aspect);
 camera.left=-viewHeight*aspect*21;camera.right=viewHeight*aspect*21;
 camera.top=viewHeight*21;camera.bottom=-viewHeight*21;
 camera.near=.1;camera.far=220;camera.updateProjectionMatrix();
}
