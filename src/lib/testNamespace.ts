/**
 * Cópia de teste: quando NEXT_PUBLIC_TEST_NAMESPACE existe, todo o armazenamento local deste site ganha um prefixo.
 * O jogo oficial e a cópia de teste ficam no mesmo domínio (arnoldsuheth.github.io); sem isso, a cópia de teste
 * leria e alteraria o salvamento real. No jogo oficial a variável é vazia e nada muda.
 * Os métodos são trocados no protótipo de Storage (definir propriedades na própria instância criaria itens salvos).
 */
const NS = process.env.NEXT_PUBLIC_TEST_NAMESPACE ?? '';
const FLAG = '__lovelaceTestNamespace';
export function installTestNamespace(proto: Storage | undefined = typeof Storage === 'undefined' ? undefined : Storage.prototype, ns = NS) {
  if (!ns || !proto || (proto as unknown as Record<string, unknown>)[FLAG]) return;
  const get = proto.getItem, set = proto.setItem, remove = proto.removeItem, key = proto.key;
  const lengthOf = Object.getOwnPropertyDescriptor(proto, 'length')?.get;
  const realLength = (s: Storage) => (lengthOf ? lengthOf.call(s) : 0) as number;
  const own = (s: Storage) => { const out: string[] = []; for (let i = 0; i < realLength(s); i++) { const k = key.call(s, i); if (k?.startsWith(ns)) out.push(k.slice(ns.length)); } return out; };
  proto.getItem = function (this: Storage, k: string) { return get.call(this, ns + k); };
  proto.setItem = function (this: Storage, k: string, v: string) { set.call(this, ns + k, v); };
  proto.removeItem = function (this: Storage, k: string) { remove.call(this, ns + k); };
  proto.clear = function (this: Storage) { for (const k of own(this)) remove.call(this, ns + k); };
  proto.key = function (this: Storage, i: number) { return own(this)[i] ?? null; };
  Object.defineProperty(proto, 'length', { configurable: true, get(this: Storage) { return own(this).length; } });
  Object.defineProperty(proto, FLAG, { value: true });
}
installTestNamespace();
