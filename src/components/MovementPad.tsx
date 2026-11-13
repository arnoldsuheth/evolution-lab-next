"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { MOVEMENT_REST, movementStick, type MovementVector } from "@/lib/controls";

const DIRECTIONS:Record<string,MovementVector>={
  ArrowUp:{x:0,z:-1}, ArrowDown:{x:0,z:1}, ArrowLeft:{x:-1,z:0}, ArrowRight:{x:1,z:0},
};
const send=(detail:MovementVector)=>window.dispatchEvent(new CustomEvent("lions-cave-move",{detail}));

export default function MovementPad() {
  const pointer=useRef<number|null>(null);
  const keys=useRef(new Set<string>());
  const [stick,setStick]=useState(MOVEMENT_REST);
  function update(x:number,z:number){
    const distance=Math.max(1,Math.hypot(x,z));
    setStick({x:x/distance,z:z/distance});
    send(movementStick(x,z));
  }
  function reset(){
    pointer.current=null;
    keys.current.clear();
    setStick(MOVEMENT_REST);
    send(MOVEMENT_REST);
  }
  useEffect(()=>{
    window.addEventListener("blur",reset);
    return ()=>{window.removeEventListener("blur",reset);send(MOVEMENT_REST);};
  },[]);
  function point(event:PointerEvent<HTMLButtonElement>){
    const bounds=event.currentTarget.getBoundingClientRect(),range=bounds.width*.36;
    update((event.clientX-bounds.left-bounds.width/2)/range,(event.clientY-bounds.top-bounds.height/2)/range);
  }
  function keyboard(){
    let x=0,z=0;
    for(const key of keys.current){x+=DIRECTIONS[key].x;z+=DIRECTIONS[key].z;}
    update(x,z);
  }
  return <button type="button" className="movement-pad" aria-label="Mover personagem"
    aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight" title="Arraste para mover ou use as setas com o controle em foco"
    onPointerDown={event=>{
      if(pointer.current!==null||event.button!==0)return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointer.current=event.pointerId;
      point(event);
    }}
    onPointerMove={event=>{if(pointer.current===event.pointerId)point(event);}}
    onPointerUp={event=>{if(pointer.current===event.pointerId)reset();}}
    onPointerCancel={event=>{if(pointer.current===event.pointerId)reset();}}
    onLostPointerCapture={event=>{if(pointer.current===event.pointerId)reset();}}
    onBlur={reset}
    onKeyDown={event=>{if(!Object.hasOwn(DIRECTIONS,event.key))return;event.preventDefault();if(pointer.current===null){keys.current.add(event.key);keyboard();}}}
    onKeyUp={event=>{if(!keys.current.delete(event.key))return;event.preventDefault();keyboard();}}>
    <span className="movement-pad-directions" aria-hidden="true"><i>▲</i><i>▶</i><i>▼</i><i>◀</i></span>
    <span className="movement-pad-thumb" aria-hidden="true" style={{transform:`translate(${stick.x*76}%,${stick.z*76}%)`}} />
  </button>;
}
