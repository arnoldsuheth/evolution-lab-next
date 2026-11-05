import {OrthographicCamera} from 'three';
/** Explicit world-space framing, independent of initial canvas measurements. */
export function frameWorld(camera:OrthographicCamera,width:number,height:number){
 const aspect=Math.max(1,width)/Math.max(1,height),viewHeight=Math.max(20,16/aspect);
 camera.left=-viewHeight*aspect*21;camera.right=viewHeight*aspect*21;
 camera.top=viewHeight*21;camera.bottom=-viewHeight*21;
 camera.near=.1;camera.far=220;camera.updateProjectionMatrix();
}
