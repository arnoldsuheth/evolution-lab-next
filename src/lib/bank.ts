/**
 * Banco da Aurora: guarde bronze e receba juros simples por dia guardado.
 * Juros modestos: 1% ao dia, no máximo 30 dias contados por vez e no máximo 5 prata de juros por dia.
 * Tudo puro e testado; o store só aplica.
 */
export interface BankState { balance: number; since: number }
export const FRESH_BANK: BankState = { balance: 0, since: 0 };
export const BANK_RATE = 0.01, BANK_MAX_DAYS = 30, BANK_DAILY_CAP = 500, BANK_MIN_DEPOSIT = 100;
const DAY = 86_400_000;
export function cleanBank(input: unknown): BankState {
  const b = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const n = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  return { balance: Math.min(n(b.balance), 1e9), since: n(b.since) };
}
/** Juros já ganhos até agora (ainda não somados ao saldo). */
export function bankInterest(bank: BankState, now: number) {
  if (bank.balance <= 0 || bank.since <= 0 || now <= bank.since) return 0;
  const days = Math.min(BANK_MAX_DAYS, Math.floor((now - bank.since) / DAY));
  return days * Math.min(BANK_DAILY_CAP, Math.floor(bank.balance * BANK_RATE));
}
/** Soma os juros ao saldo e recomeça a contagem (feito a cada depósito ou saque). */
export function settle(bank: BankState, now: number): BankState {
  const interest = bankInterest(bank, now);
  return { balance: bank.balance + interest, since: bank.balance + interest > 0 ? now : 0 };
}
export function deposit(bank: BankState, wallet: number, amount: number, now: number) {
  const value = Math.floor(amount);
  if (!Number.isFinite(value) || value < BANK_MIN_DEPOSIT) return { ok: false as const, message: 'O banco aceita a partir de 1 prata.' };
  if (value > wallet) return { ok: false as const, message: 'Você não tem tudo isso na bolsa.' };
  const settled = settle(bank, now);
  return { ok: true as const, bank: { balance: settled.balance + value, since: now }, wallet: wallet - value };
}
export function withdraw(bank: BankState, wallet: number, amount: number, now: number) {
  const settled = settle(bank, now), value = Math.min(Math.floor(amount), settled.balance);
  if (!Number.isFinite(value) || value <= 0) return { ok: false as const, message: 'Não há nada para sacar.' };
  const balance = settled.balance - value;
  return { ok: true as const, bank: { balance, since: balance > 0 ? now : 0 }, wallet: wallet + value };
}
