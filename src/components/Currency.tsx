import {currency} from '@/lib/economy';
/** Moedas como ícones: ouro, prata e bronze, só com o número (o nome fica para leitores de tela). */
const COIN={gold:['#f3c64a','#fff0a8','#9a6b12'],silver:['#c9d2d8','#ffffff','#6d7880'],bronze:['#c07a45','#f3c08a','#6e3f1d']} as const;
function Coin({kind}:{kind:keyof typeof COIN}){const [fill,shine,edge]=COIN[kind];return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="10" fill={fill} stroke={edge} strokeWidth="2"/><circle cx="12" cy="12" r="6.5" fill="none" stroke={edge} strokeOpacity=".55"/><path d="M8 8.5a5 5 0 0 1 5-2" stroke={shine} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;}
export function splitCoins(value:number){const total=Math.max(0,Math.floor(Number.isFinite(value)?value:0));return {gold:Math.floor(total/10000),silver:Math.floor(total%10000/100),bronze:total%100};}
export default function Currency({value}:{value:number}){const c=splitCoins(value),parts=(['gold','silver','bronze'] as const).filter(k=>c[k]>0||(k==='bronze'&&!c.gold&&!c.silver));
 return <span className="aurora-currency" aria-label={`Moedas da Aurora: ${currency(value)}`}>{parts.map(k=><span key={k} className={`coin coin-${k}`}><Coin kind={k}/>{c[k]}</span>)}</span>;}
