"use client";
import {useId} from 'react';
import type {ClassId} from '@/lib/game';
import {ART_BASE,CLASS_CROPS,type ArtCrop} from '@/lib/artwork';
export function ApprovedArtwork({crop,name,className='game-artwork',inset=0}:{crop:ArtCrop;name:string;className?:string;inset?:number}){
 const clipId=useId().replace(/:/g,'');
 const dimensions=crop.sheet==='items'?[1536,1024]:crop.sheet==='equipment'?[1217,1293]:[1217,1292];
 return <svg className={className} viewBox="0 0 100 100" role="img" aria-label={name} preserveAspectRatio="xMidYMid meet"><svg x={inset} y={inset} width={100-inset*2} height={100-inset*2} viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`} preserveAspectRatio="xMidYMid meet" overflow="hidden"><defs><clipPath id={clipId}>{crop.outline?<polygon points={crop.outline}/>:<rect x={crop.x} y={crop.y} width={crop.w} height={crop.h}/>}</clipPath></defs><image clipPath={`url(#${clipId})`} href={`${ART_BASE}/art/${crop.sheet==='classes'?'classes':crop.sheet==='equipment'?'equipment':'items'}-approved.webp`} width={dimensions[0]} height={dimensions[1]}/></svg></svg>;
}
export function ClassPortrait({classId}:{classId:ClassId}){return <ApprovedArtwork crop={CLASS_CROPS[classId]} name={`Retrato da classe ${classId}`} className="class-portrait"/>;}

