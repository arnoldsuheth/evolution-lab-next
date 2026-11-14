"use client";
import { useEffect } from 'react';

/** Ordem de prioridade: quem vem antes ganha quando dois nomes ficam um em cima do outro. */
const ORDER = ['.player-name', '.npc-label', '.dog-tag', '.spot-label', '.gate-label', '.service-sign', '.town-sign', '.trail-sign', '.citadel-plaque'];

/** Esconde nomes flutuantes que encavalam na tela, mantendo o mais importante (jogador, NPC, pet, missão, lugar). */
export default function LabelDeclutter() {
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const kept: DOMRect[] = [];
      for (const sel of ORDER) document.querySelectorAll<HTMLElement>(sel).forEach(el => {
        el.classList.remove('lk-hidden-label');
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const hit = kept.some(k => r.left < k.right - 2 && r.right > k.left + 2 && r.top < k.bottom - 1 && r.bottom > k.top + 1);
        if (hit) el.classList.add('lk-hidden-label'); else kept.push(r);
      });
    };
    const id = window.setInterval(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }, 200);
    return () => { window.clearInterval(id); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
