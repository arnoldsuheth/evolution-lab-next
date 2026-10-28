export const PREFIX='evolab-next:v1:';
export const COLLECTIONS=['prog','claude','tasks','projects','skills','reviews','prefs','sessions','external','books','guitar','songs','sites','prospects'];
export class ConflictError extends Error{constructor(collection,id){super('Esta atividade mudou em outra aba. Sua tentativa foi preservada para revisão.');this.name='ConflictError';this.collection=collection;this.id=id;}}
export const clone=x=>JSON.parse(JSON.stringify(x));
export const safeURL=s=>{try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
export function empty(){return Object.fromEntries(COLLECTIONS.map(k=>[k,{}]));}
export function createRepository(storage,clock=()=>new Date().toISOString()){
 const key=(c,id)=>{if(!COLLECTIONS.includes(c)||(!/^[-\w:.]{1,120}$/.test(String(id))||['__proto__','constructor','prototype'].includes(String(id))))throw Error('Identificador de atividade inválido.');return PREFIX+c+':'+id;};
 function get(c,id){const raw=storage.getItem(key(c,id));if(raw===null)return {version:0,value:null,history:[]};let r;try{r=JSON.parse(raw);}catch{throw Error('Há um registro local ilegível. Exporte uma cópia antes de tentar recuperá-lo.');}if(!Number.isSafeInteger(r.version)||r.version<1||!Object.hasOwn(r,'value'))throw Error('Registro local incompatível. Nenhum dado foi sobrescrito.');return r;}
 function set(c,id,value,expectedVersion){const old=get(c,id);if(old.version!==expectedVersion)throw new ConflictError(c,id);const history=old.value===null?[]:[{version:old.version,updatedAt:old.updatedAt,value:clone(old.value)},...(old.history||[])].slice(0,8);const r={version:old.version+1,updatedAt:clock(),value:clone(value),history};storage.setItem(key(c,id),JSON.stringify(r));return r;}
 function all(){const out=empty();for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(PREFIX))continue;const tail=k.slice(PREFIX.length),sep=tail.indexOf(':'),c=tail.slice(0,sep),id=tail.slice(sep+1);if(COLLECTIONS.includes(c)){const r=get(c,id);if(r.value!==null)out[c][id]=clone(r.value);}}return out;}
 function inventory(){const rows=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(PREFIX))continue;const tail=k.slice(PREFIX.length),sep=tail.indexOf(':'),c=tail.slice(0,sep),id=tail.slice(sep+1);if(COLLECTIONS.includes(c))rows.push({collection:c,id,...get(c,id)});}return rows;}
 function versions(){return Object.fromEntries(inventory().map(r=>[r.collection+':'+r.id,r.version]));}
 function exportData(){return {kind:'EvolutionLabNext',schemaVersion:1,exportedAt:clock(),data:all()};}
 function restore(c,id,version){const old=get(c,id),record=old.history.find(x=>x.version===version);if(!record)throw Error('Versão anterior não encontrada neste aparelho.');return set(c,id,record.value,old.version);}
 return {get,set,all,versions,inventory,exportData,restore};
}
export function studyPlan(state,minutes,now=new Date()){
 const today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),due=Object.entries(state.tasks).filter(([,t])=>!t.done).sort((a,b)=>(a[1].due||'9999').localeCompare(b[1].due||'9999'));
 const ids=Object.keys(state.prog).filter(k=>state.prog[k]?.courseV2?.completed),next=Array.from({length:71},(_,i)=>i).find(i=>!ids.includes(String(i)))??0;
 const collegeMinutes=due[0]?Math.min(20,Math.floor(minutes/3)):0;const plan=[];if(due[0])plan.push({type:'fac',title:due[0][1].title,href:'#faculdade',minutes:collegeMinutes,context:due[0][1].due&&due[0][1].due<today?'Prazo informado já passou':'Tarefa cadastrada por você'});
 plan.push({type:'prog',title:'Continuar Programação · aula '+(next+1),href:'#prog-'+next,minutes:Math.max(10,minutes-collegeMinutes-(minutes>=60?10:0)),context:'Entender, praticar e registrar uma entrega'});
 if(minutes>=60)plan.push({type:'review',title:'Revisar um erro ou conceito recente',href:'#revisoes',minutes:10,context:'Uma nova tentativa, com resultado conferido'});
 return plan;
}
export function courseDone(s,key){return Object.values(s[key]||{}).filter(r=>r?.courseV2?.completed).length;}
export function nextReview(now,level){const d=new Date(now);d.setUTCDate(d.getUTCDate()+[1,3,7,14][Math.min(3,Math.max(0,level))]);return d.toISOString();}
