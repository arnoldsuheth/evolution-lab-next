"use client";
import {createContext,useContext,useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {create} from 'zustand';
import {persist,createJSONStorage} from 'zustand/middleware';
import {clampHud,cleanHud,type HudPosition} from '@/lib/hud';
const useLayout=create(persist<{positions:Record<string,HudPosition>;put:(id:string,p:HudPosition)=>void;reset:()=>void}>((set)=>({positions:{},put:(id,p)=>set(s=>({positions:{...s.positions,[id]:p}})),reset:()=>set({positions:{}})}),{name:'lions-cave-interface-v1',skipHydration:true,storage:createJSONStorage(()=>window.localStorage),merge:(saved,current)=>({...current,positions:cleanHud((saved as {positions?:unknown})?.positions)})}));
const Editing=createContext(false);
export function HudLayout({children,onEditingChange}:{children:ReactNode;onEditingChange:(editing:boolean)=>void}){
 const [editing,setEditing]=useState(false),[error,setError]=useState('');
 useEffect(()=>{void useLayout.persist.rehydrate();return useLayout.persist.onFinishHydration(()=>{});},[]);
 function toggle(){setEditing(!editing);onEditingChange(!editing);}
 function reset(){try{useLayout.getState().reset();setError('');}catch{setError('Não foi possível salvar a organização. Seu progresso não foi alterado.');}}
 return <Editing.Provider value={editing}>{children}<div className="hud-toolbar"><button onClick={toggle} aria-pressed={editing}>{editing?'✓ Travar':'▦ Interface'}</button>{editing&&<><button onClick={reset}>Aplicar HUD recomendado</button><span>Reposiciona apenas a interface. Seu personagem e progresso permanecem.</span><span>Arraste pelo título · ajuste o tamanho · depois trave</span></>}{error&&<span role="status">{error}</span>}</div></Editing.Provider>;
}
export function HudBlock({id,label,className,children}:{id:string;label:string;className:string;children:ReactNode}){
 const editing=useContext(Editing),positions=useLayout(s=>s.positions),root=useRef<HTMLElement>(null),drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
 const [size,setSize]=useState({width:0,height:0,blockWidth:0,blockHeight:0}),[error,setError]=useState('');
 useEffect(()=>{const element=root.current;if(!element)return;const resize=()=>setSize({width:window.innerWidth,height:window.innerHeight,blockWidth:element.offsetWidth,blockHeight:element.offsetHeight});const observer=new ResizeObserver(resize);observer.observe(element);resize();window.addEventListener('resize',resize);return()=>{observer.disconnect();window.removeEventListener('resize',resize);};},[]);
 const mode=size.width>1000?'desktop':size.width>size.height?'landscape':'portrait',key=id+'-'+mode,position=positions[key];
 const scale=Math.min(position?.scale??1,size.blockWidth?(size.width-16)/size.blockWidth:1);
 const style:CSSProperties=position&&size.width?{position:'fixed',left:Math.max(8,Math.min(position.x*size.width,size.width-size.blockWidth*scale-8)),top:Math.max(8,Math.min(position.y*size.height,size.height-size.blockHeight*scale-8)),right:'auto',bottom:'auto',transform:'scale('+scale+')',transformOrigin:'top left'}:{};
 function save(left:number,top:number,nextScale=scale){const box=root.current!.getBoundingClientRect(),p=clampHud(left,top,box.width,box.height,window.innerWidth,window.innerHeight);try{useLayout.getState().put(key,{x:p.x/window.innerWidth,y:p.y/window.innerHeight,scale:nextScale});}catch{setError('Não foi possível salvar esta posição.');}}
 return <aside ref={root} className={className+' hud-block '+(editing?'hud-editing':'')} style={style}>
 {editing&&<div className="hud-handle" onPointerDown={e=>{if((e.target as HTMLElement).closest('input'))return;e.preventDefault();e.stopPropagation();const b=root.current!.getBoundingClientRect();drag.current={x:e.clientX,y:e.clientY,left:b.left,top:b.top};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current)save(drag.current.left+e.clientX-drag.current.x,drag.current.top+e.clientY-drag.current.y);}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}><b>⠿ {label}</b><label>Tamanho<input aria-label={'Tamanho: '+label} type="range" min="0.7" max="1.3" step="0.05" value={position?.scale??1} onChange={e=>{const b=root.current!.getBoundingClientRect();save(b.left,b.top,Number(e.target.value));}}/></label></div>}
 <div className="hud-content" inert={editing}>{children}</div>{error&&editing&&<small role="status">{error}</small>}</aside>;
}
