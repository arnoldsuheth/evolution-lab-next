"use client";
import {useEffect,useState,useSyncExternalStore,type FormEvent} from 'react';
import {usePathname} from 'next/navigation';
import {CLOUD_READY} from '@/lib/cloudClient';
import {startCloudSync,useCloud,loginWithPassword,disconnectCloud,chooseJourney,syncNow} from '@/lib/cloudSync';
import {useGame} from '@/lib/store';
function subscribeEmail(update:()=>void){window.addEventListener('storage',update);window.addEventListener('lions-cave-login-email',update);return()=>{window.removeEventListener('storage',update);window.removeEventListener('lions-cave-login-email',update);};}
const rememberedEmail=()=>{try{return localStorage.getItem('lions-cave-login-email')??'';}catch{return'';}};
export function CloudRuntime(){useEffect(()=>startCloudSync(),[]);return null;}
export default function CloudAccount(){
 const account=useCloud(),hero=useGame(s=>s.hero),saveError=useGame(s=>s.saveError),savedEmail=useSyncExternalStore(subscribeEmail,rememberedEmail,()=>''),[email,setEmail]=useState<string|null>(null),[change,setChange]=useState(false),[password,setPassword]=useState(''),[show,setShow]=useState(false),[create,setCreate]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{await loginWithPassword((email??savedEmail).trim(),password,create);setPassword('');}catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar.');}finally{setBusy(false);}}
 return <section className="cloud-account" aria-label="Conta e salvamento online"><h3>Sua jornada em qualquer aparelho.</h3>{!account.userId?<form onSubmit={submit}>
  <p>Use a mesma conta no computador e no celular. A cópia local continua disponível.</p>
  {!CLOUD_READY&&<p role="status">Sincronização em preparação. Por enquanto, sua jornada fica neste aparelho.</p>}
  {(!savedEmail||change||create)?<label>E-mail da sua conta<input type="email" autoComplete="username" required value={email??savedEmail} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>:<div className="remembered-account"><span>{savedEmail}</span><button type="button" onClick={()=>setChange(true)}>Trocar conta</button></div>}
  <label>Senha<div className="password-field"><input type={show?'text':'password'} minLength={create?8:1} autoComplete={create?'new-password':'current-password'} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><button type="button" onClick={()=>setShow(!show)} aria-pressed={show}>{show?'Ocultar':'Mostrar'}</button></div></label>
  <button type="submit" className="primary" disabled={!CLOUD_READY||busy}>{busy?'Aguarde…':create?'Criar minha conta':'Entrar e sincronizar'}</button><button type="button" disabled={busy} onClick={()=>{setCreate(!create);setError('');}}>{create?'Já tenho conta':'Primeiro acesso: criar conta'}</button>
  <small>O e-mail pode ficar lembrado neste aparelho. O navegador pode oferecer para salvar a senha; o jogo não guarda sua senha em texto aberto.</small>
 </form>:<><p>Conectado: <strong>{account.email}</strong></p><p role="status">{account.message||'Conferindo salvamento…'}</p>{account.lastSaved&&<small>Último salvamento: {new Date(account.lastSaved).toLocaleString('pt-BR')}</small>}
  {['choose','conflict'].includes(account.status)&&<div className="save-choice"><div><b>Neste aparelho</b><span>{hero.name} · nível {hero.level} · {hero.xp} XP</span>{saveError&&<small>Esta cópia precisa de recuperação antes de ser enviada.</small>}</div><div><b>Na conta</b><span>{account.remote?account.remote.state.hero.name+' · nível '+account.remote.state.hero.level+' · '+account.remote.state.hero.xp+' XP':'Ainda não há jornada'}</span></div><p>Escolha a jornada inteira. Itens e moedas não serão somados. Antes de substituir uma versão, será guardada uma cópia.</p><button disabled={!!saveError} onClick={()=>void chooseJourney('local')}>Usar jornada deste aparelho</button>{account.remote&&<button className="primary" onClick={()=>void chooseJourney('cloud')}>Continuar jornada da conta</button>}</div>}
  {!['loading','choose','conflict'].includes(account.status)&&<button onClick={()=>void syncNow()}>Sincronizar agora</button>}<button disabled={account.status==='loading'} onClick={()=>void disconnectCloud()}>Desconectar conta</button>
 </>}{error&&<p role="alert">{error}</p>}{account.message&&!account.userId&&<p role="status">{account.message}</p>}</section>;
}
export function CloudGate(){const status=useCloud(s=>s.status),pathname=usePathname();if(/\/visual-lab\/?$/.test(pathname)||!['loading','choose','conflict'].includes(status))return null;return <div className="cloud-gate"><div role="dialog" aria-modal="true" aria-label="Conferir salvamento"><CloudAccount/></div></div>;}
export function CloudIndicator(){const status=useCloud(s=>s.status),user=useCloud(s=>s.userId);return <span className="cloud-indicator">{!user?'◇ Salvo neste aparelho':status==='synced'?'☁ Salvo na conta':status==='pending'?'☁ Salvamento pendente':status==='offline'?'◇ Sem conexão · cópia local':status==='loading'?'☁ Conferindo conta…':'◇ Confira sua conta nas configurações'}</span>;}
