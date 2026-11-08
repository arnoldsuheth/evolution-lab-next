"use client";
import {ART_BASE} from "@/lib/artwork";
/** Emblema do jogo: a cabeça do Caramelo (logo de Caramelo’s Cave). */
export default function LionMark() { return <span className="brand-emblem caramelo-emblem" aria-hidden="true" style={{backgroundImage:`url(${ART_BASE}/caramelo-emblem.png)`}}/>; }
