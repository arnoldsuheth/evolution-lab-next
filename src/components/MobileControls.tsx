"use client";
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {useGame} from '@/lib/store';
export function worldInput(kind:string,detail?:{x:number;z:number}){window.dispatchEvent(new CustomEvent('lions-cave-'+kind,{detail}));}
export default function MobileControls({paused}:{paused:boolean}){
 const hero=useGame(s=>s.hero),encounter=useGame(s=>s.encounter),active=useRef<number|null>(null),[stick,setStick]=useState({x:0,z:0});
 const disabled=paused||hero.dead||!!encounter;
 useEffect(()=>{if(disabled)worldInput('move',{x:0,z:0});return()=>worldInput('move',{x:0,z:0});},[disabled]);
 function move(e:PointerEvent<HTMLDivElement>){if(active.current!==e.pointerId||disabled)return;const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/35,z=(e.clientY-b.top-b.height/2)/35,length=Math.hypot(x,z),scale=Math.max(1,length),next={x:Math.abs(x)<.1?0:x/scale,z:Math.abs(z)<.1?0:z/scale};setStick(next);worldInput('move',next);}
 function stop(){active.current=null;setStick({x:0,z:0});worldInput('move',{x:0,z:0});}
 return <div className="mobile-controls" aria-label="Controles de toque"><div role="group" aria-label="Controle de movimento" className={`touch-stick ${disabled?'inactive':''}`} onPointerDown={e=>{if(disabled)return;active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><span style={{transform:`translate(${disabled?0:stick.x*26}px,${disabled?0:stick.z*26}px)`}}>✥</span></div><div className="touch-actions"><button disabled={disabled} onClick={()=>worldInput('interact')}>☏<small>Interagir</small></button><button disabled={disabled} onClick={()=>worldInput('jump')}>↟<small>Pular</small></button></div></div>;
}
