"use client";
import {useId} from 'react';
import type {ClassId} from '@/lib/game';
import {ART_BASE,CLASS_CROPS,type ArtCrop} from '@/lib/artwork';
export type ItemFx='none'|'epic'|'mythic';
/** Chamas atrás do ícone (Mítico): sobem pelas bordas sem cobrir o item. */
export function FireFx({size}:{size:number}){const k=size/100;return <g className="fx-fire" aria-hidden>{[[16,0],[34,.35],[50,.15],[66,.5],[84,.25],[8,.6],[92,.8]].map(([x,d],i)=><path key={i} className="fx-flame" style={{animationDelay:`${d}s`}} d={`M${x*k} ${96*k}c${-7*k} ${-6*k} ${-6*k} ${-16*k} 0 ${-26*k}c${1*k} ${8*k} ${8*k} ${10*k} ${6*k} ${18*k}c${-1*k} ${5*k} ${-3*k} ${7*k} ${-6*k} ${8*k}z`} fill={i%2?'#ff8a1f':'#ffc23a'}/>)}</g>;}
export function ApprovedArtwork({crop,name,className='game-artwork',inset=0,hue=0,fx}:{crop:ArtCrop;name:string;className?:string;inset?:number;hue?:number;fx?:ItemFx}){
 const clipId=useId().replace(/:/g,'');
 const dimensions=crop.sheet==='items'?[1536,1024]:crop.sheet==='equipment'?[1217,1293]:[1217,1292];
 return <svg className={fx?`${className} fx-${fx}`:className} viewBox="0 0 100 100" role="img" aria-label={name} preserveAspectRatio="xMidYMid meet">{fx==='mythic'&&<FireFx size={100}/>}<svg x={inset} y={inset} width={100-inset*2} height={100-inset*2} viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`} preserveAspectRatio="xMidYMid meet" overflow="hidden"><defs><clipPath id={clipId}>{crop.outline?<polygon points={crop.outline}/>:<rect x={crop.x} y={crop.y} width={crop.w} height={crop.h}/>}</clipPath></defs><image style={hue ? {filter: `hue-rotate(${hue}deg)`} : undefined} clipPath={`url(#${clipId})`} href={`${ART_BASE}/art/${crop.sheet==='classes'?'classes':crop.sheet==='equipment'?'equipment':'items'}-approved.webp`} width={dimensions[0]} height={dimensions[1]}/></svg></svg>;
}
export function ClassPortrait({classId}:{classId:ClassId}){return <ApprovedArtwork crop={CLASS_CROPS[classId]} name={`Retrato da classe ${classId}`} className="class-portrait"/>;}

