"use client";
import type {ClassId} from '@/lib/game';
import {ART_BASE,CLASS_CROPS,type ArtCrop} from '@/lib/artwork';
export function ApprovedArtwork({crop,name,className='game-artwork'}:{crop:ArtCrop;name:string;className?:string}){
 const dimensions=crop.sheet==='items'?[1536,1024]:crop.sheet==='equipment'?[1217,1293]:[1217,1292];
 return <svg className={className} viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`} role="img" aria-label={name} preserveAspectRatio="xMidYMid meet"><image href={`${ART_BASE}/art/${crop.sheet==='classes'?'classes':crop.sheet==='equipment'?'equipment':'items'}-approved.webp`} width={dimensions[0]} height={dimensions[1]}/></svg>;
}
export function ClassPortrait({classId}:{classId:ClassId}){return <ApprovedArtwork crop={CLASS_CROPS[classId]} name={`Retrato da classe ${classId}`} className="class-portrait"/>;}
