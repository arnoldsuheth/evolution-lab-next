import {EXT_CURSOS,ACORDES} from '../data/catalogo.js';
import {safeURL} from './core.mjs';
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const text=(x,n=500)=>typeof x==='string'?x.slice(0,n):'';
const num=(x,max=100000)=>Number.isFinite(+x)?Math.min(max,Math.max(0,Math.floor(+x))):0;
const date=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
export function legacyPreview(raw){
 if(typeof raw!=='string'||raw.length>2_000_000)throw Error('Use uma cópia de progresso em JSON com até 2 MB.');
 let s;try{s=JSON.parse(raw);}catch{throw Error('O texto não é um JSON válido. Copie o progresso no Perfil do Lab original.');}
 if(!object(s)||!s.v||!['ext','livros','violao','prospectos'].some(k=>Object.hasOwn(s,k)))throw Error('Não reconheci o progresso do Evolution original.');
 const entries=[],warnings=[];
 if(Array.isArray(s.livros))s.livros.slice(0,1000).forEach((b,i)=>{if(!object(b)||!text(b.titulo).trim())return;const id=/^[-\w.]{1,90}$/.test(b.id)&&!['__proto__','constructor','prototype'].includes(b.id)?b.id:'import-'+i;const pags=num(b.pags),pag=num(b.pag);entries.push({collection:'books',id,label:text(b.titulo,180),value:{titulo:text(b.titulo,180),autor:text(b.autor,120),tema:text(b.tema,100),status:['quero','lendo','lido'].includes(b.status)?b.status:'quero',pag,pags:Math.max(pag,pags),nota:num(b.nota,5),fav:!!b.fav,area:!!b.area,notas:text(b.notas,10000),frases:Array.isArray(b.frases)?b.frases.filter(x=>typeof x==='string').slice(0,200).map(x=>text(x,1000)):[],origem:text(b.origem,250),url:safeURL(b.url),fim:text(b.fim,10),source:'Importado do Lab original'}});});
 if(object(s.ext))for(const c of EXT_CURSOS){const r=s.ext[c.id];if(!object(r))continue;const value={a:{},m:{}};c.mods.forEach((m,mi)=>{if(m.aulas)m.aulas.forEach((a,ai)=>{if(r.a?.[mi+':'+ai]===true)value.a[mi+':'+ai]=true;});else value.m[mi]=num(r.m?.[mi],m.n);});entries.push({collection:'external',id:c.id,label:c.nome,value});}
 const v=s.violao;if(object(v)){
 if(object(v.treinos))for(const [day,min]of Object.entries(v.treinos).slice(0,4000)){try{if(date(day))entries.push({collection:'guitar',id:'d'+day,label:'Treino · '+day,value:{minutes:num(min,1440),date:day}});}catch{warnings.push('Uma data de treino inválida foi ignorada.');}}
 if(object(v.acordes))ACORDES.forEach((a,i)=>{if(Object.hasOwn(v.acordes,a))entries.push({collection:'guitar',id:'c'+i,label:'Acorde '+a,value:{level:num(v.acordes[a],2)}});});
 if(v.meta)entries.push({collection:'guitar',id:'meta',label:'Meta semanal',value:{minutes:num(v.meta,10080)}});
 if(Array.isArray(v.musicas))v.musicas.slice(0,1000).forEach((m,i)=>{if(object(m)&&text(m.nome))entries.push({collection:'songs',id:'import-'+i,label:text(m.nome,180),value:{nome:text(m.nome,180),fonte:text(m.fonte,180),st:['q','a','d'].includes(m.st)?m.st:'q',tr:num(m.tr)}});});
 }
 if(Array.isArray(s.prospectos))s.prospectos.slice(0,1000).forEach((p,i)=>{if(!object(p)||!text(p.nome))return;const id=/^[-\w.]{1,90}$/.test(p.id)&&!['__proto__','constructor','prototype'].includes(p.id)?p.id:'import-'+i;entries.push({collection:'prospects',id,label:text(p.nome,120),value:{nome:text(p.nome,120),etapa:['pedido','iniciativa','apresentado'].includes(p.etapa)?p.etapa:'pedido',ideia:text(p.ideia,3000),acao:text(p.acao,300),prazo:/^\d{4}-\d{2}-\d{2}$/.test(p.prazo)?p.prazo:'',url:safeURL(p.url),arquivado:!!p.arquivado}});});
 const keys=new Set();const unique=entries.filter(e=>{const key=e.collection+':'+e.id;if(keys.has(key)){warnings.push('Um identificador duplicado foi ignorado.');return false;}keys.add(key);return true;});
 return {entries:unique,warnings,counts:Object.fromEntries(['books','external','guitar','songs','prospects'].map(k=>[k,unique.filter(x=>x.collection===k).length]))};
}
