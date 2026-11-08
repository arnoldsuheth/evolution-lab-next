"use client";
import { useState } from "react";
import { useGame } from "@/lib/store";
import { adventureOf } from "@/lib/adventure";
import { bankInterest, BANK_DAILY_CAP, BANK_MAX_DAYS, BANK_MIN_DEPOSIT, BANK_RATE } from "@/lib/bank";
import { WAGON_PRICE } from "@/lib/wagon";
import { REGIONS, regionRequirement, type RegionId } from "@/lib/campaign";
import Currency from "./Currency";

const AMOUNTS = [100, 500, 1000, 5000];

/** Banco da Aurora: guardar e sacar bronze, com juros modestos por dia. */
export function BankPanel() {
  const hero = useGame(s => s.hero), now = useGame(s => s.now);
  const bank = adventureOf(hero).bank, interest = bankInterest(bank, now || bank.since);
  const [custom, setCustom] = useState("");
  const g = useGame.getState;
  return <div className="panel-body town-service">
    <p>Guarde suas moedas no cofre do banco. Elas rendem <b>{Math.round(BANK_RATE * 100)}% ao dia</b> (até {BANK_MAX_DAYS} dias por vez, no máximo <Currency value={BANK_DAILY_CAP} /> por dia). Depósito a partir de <Currency value={BANK_MIN_DEPOSIT} />.</p>
    <dl className="bank-lines"><div><dt>Na bolsa</dt><dd><Currency value={hero.gold} /></dd></div><div><dt>No banco</dt><dd><Currency value={bank.balance} /></dd></div><div><dt>Juros até agora</dt><dd>+<Currency value={interest} /></dd></div></dl>
    <div className="bank-actions"><span>Guardar</span>{AMOUNTS.map(v => <button key={"d" + v} disabled={hero.gold < v} onClick={() => g().bankDeposit(v)}><Currency value={v} /></button>)}<button disabled={hero.gold < BANK_MIN_DEPOSIT} onClick={() => g().bankDeposit(hero.gold)}>Tudo</button></div>
    <div className="bank-actions"><span>Sacar</span>{AMOUNTS.map(v => <button key={"w" + v} disabled={bank.balance + interest < v} onClick={() => g().bankWithdraw(v)}><Currency value={v} /></button>)}<button disabled={bank.balance + interest <= 0} onClick={() => g().bankWithdraw(bank.balance + interest)}>Tudo</button></div>
    <label className="bank-custom">Outro valor (bronze)<input inputMode="numeric" value={custom} onChange={e => setCustom(e.target.value.replace(/\D/g, ""))} /><button disabled={!custom} onClick={() => { g().bankDeposit(+custom); setCustom(""); }}>Guardar</button><button disabled={!custom} onClick={() => { g().bankWithdraw(+custom); setCustom(""); }}>Sacar</button></label>
  </div>;
}

/** Carroça: viagem rápida para as regiões já liberadas. */
export function WagonPanel() {
  const hero = useGame(s => s.hero), education = useGame(s => s.education);
  return <div className="panel-body town-service">
    <p>Tobias e o cavalo Pipoca levam você mais rápido do que a pé. Cada viagem custa <b><Currency value={WAGON_PRICE} /></b>. A carroça sai da vila e espera na chegada de cada região.</p>
    <div className="wagon-list">{(Object.keys(REGIONS) as RegionId[]).map(id => { const lock = regionRequirement(hero, education, id), here = hero.region === id; return <button key={id} disabled={!!lock || here || hero.gold < WAGON_PRICE} title={lock ?? undefined} onClick={() => useGame.getState().wagonTravel(id)}><b>{REGIONS[id].name}</b><small>{here ? "Você está aqui" : lock ?? `Nível ${REGIONS[id].level}+ · `}{!here && !lock && <Currency value={WAGON_PRICE} />}</small></button>; })}</div>
  </div>;
}
