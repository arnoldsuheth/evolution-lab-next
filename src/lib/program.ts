// A deliberately small interpreter. Student code never enters eval/Function or the DOM.
export type Value = number | string | boolean | null | Value[] | { [key: string]: Value };
type Token = { text: string; kind: string; line: number };
type Expr = { kind: string; value?: Value; name?: string; op?: string; args?: Expr[]; left?: Expr; right?: Expr; keys?: string[] };
type Stmt = { kind: string; line?: number; name?: string; expr?: Expr; body?: Stmt[]; other?: Stmt[]; init?: Stmt; step?: Stmt; params?: string[]; mutable?: boolean };
/** Um passo do “passo a passo”: em qual linha uma caixa recebeu qual valor. */
export type TraceStep = { line: number; name: string; value: string };
type Signal = { value: Value } | { jump: "break" | "continue" };
const forbidden = new Set(["__proto__", "prototype", "constructor", "window", "document", "globalThis", "fetch", "eval", "Function", "localStorage", "import", "new"]);
/** Ferramentas permitidas de Math: só funções puras de números. */
const MATH: Record<string, (...n: number[]) => number> = { floor: Math.floor, ceil: Math.ceil, round: Math.round, abs: Math.abs, max: Math.max, min: Math.min };
const MAX_ARRAY = 2000, MAX_TRACE = 60;
/** Erro com a linha onde aconteceu, para o aluno saber onde olhar. */
class LessonError extends Error { line?: number; }
const fail = (message: string, line?: number) => { const text = message.charAt(0).toUpperCase() + message.slice(1), error = new LessonError(line ? `Linha ${line}: ${text}` : text); error.line = line; return error; };

function lex(code: string): Token[] {
  if (code.length > 12000) throw new Error("Seu programa excedeu o limite de 12 mil caracteres.");
  const tokens: Token[] = [];
  const re = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|(?:\d+(?:\.\d+)?)|(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?:[A-Za-z_$][\w$]*)|(?:===|!==|=>|<=|>=|==|!=|&&|\|\||\+\+|--|\+=|-=|\*=|\/=)|[{}()[\];,.?:+\-*\/%<>=!]/gy;
  let pos = 0, line = 1;
  while (pos < code.length) {
    re.lastIndex = pos;
    const match = re.exec(code);
    if (!match) {
      if (code[pos] === "`") throw fail("textos com crase (`) aparecem nos projetos. Aqui, use aspas e +: \"Olá, \" + nome.", line);
      throw fail(`símbolo não suportado perto de: ${code.slice(pos, pos + 16)}`, line);
    }
    pos = re.lastIndex;
    const text = match[0], start = line;
    line += text.split("\n").length - 1;
    if (/^\s|^\/\//.test(text) || text.startsWith("/*")) continue;
    if (text === "=>") throw fail("funções de seta (=>) ainda não existem neste laboratório. Use function nome(parametro) { ... }.", start);
    if (forbidden.has(text)) throw fail(`“${text}” não está disponível no laboratório protegido.`, start);
    tokens.push({ text, line: start, kind: /^\d/.test(text) ? "number" : /^["']/.test(text) ? "string" : /^[\w$]/.test(text) ? "name" : "symbol" });
  }
  return [...tokens, { text: "EOF", kind: "end", line }];
}

class Parser {
  tokens: Token[]; index = 0;
  constructor(code: string) { this.tokens = lex(code); }
  peek() { return this.tokens[this.index].text; }
  line() { return this.tokens[this.index].line; }
  take() { return this.tokens[this.index++]; }
  is(text: string) { if (this.peek() === text) { this.index++; return true; } return false; }
  expect(text: string) { if (!this.is(text)) throw fail(`esperado “${text}”, encontrado “${this.peek() === "EOF" ? "fim do código" : this.peek()}”.`, this.line()); }
  name() { const t = this.take(); if (t.kind !== "name") throw fail("use um nome válido.", t.line); return t.text; }
  block(): Stmt[] { this.expect("{"); const result = this.all("}"); this.expect("}"); return result; }
  all(end = "EOF"): Stmt[] { const result: Stmt[] = []; while (this.peek() !== end && this.peek() !== "EOF") result.push(this.statement()); return result; }
  statement(): Stmt { const line = this.line(); const s = this.parseStatement(); s.line = line; return s; }
  parseStatement(): Stmt {
    if (this.is(";")) return { kind: "empty" };
    const keyword = this.peek();
    if (this.is("let") || this.is("const")) {
      const name = this.name(); this.expect("="); const expr = this.expr(); this.is(";"); return { kind: "var", name, expr, mutable: keyword === "let" };
    }
    if (this.is("function")) {
      const name = this.name(); this.expect("("); const params: string[] = [];
      if (this.peek() !== ")") do { params.push(this.name()); } while (this.is(","));
      this.expect(")"); return { kind: "function", name, params, body: this.block() };
    }
    if (this.is("return")) { const expr = this.peek() === ";" || this.peek() === "}" ? { kind: "literal", value: null } : this.expr(); this.is(";"); return { kind: "return", expr }; }
    if (this.is("break") || this.is("continue")) { this.is(";"); return { kind: keyword }; }
    if (this.is("if")) {
      this.expect("("); const expr = this.expr(); this.expect(")"); const body = this.block();
      // else if é um if dentro do else: mantém a mesma regra de chaves.
      return { kind: "if", expr, body, other: this.is("else") ? (this.peek() === "if" ? [this.statement()] : this.block()) : [] };
    }
    if (this.is("for")) {
      this.expect("("); const init = this.statement(); const expr = this.expr(); this.expect(";");
      const step = this.statement(); this.expect(")"); return { kind: "for", init, expr, step, body: this.block() };
    }
    if (this.is("while")) { this.expect("("); const expr = this.expr(); this.expect(")"); return { kind: "while", expr, body: this.block() }; }
    const line = this.line(), expr = this.expr();
    if (["=", "+=", "-=", "*=", "/=", "++", "--"].includes(this.peek())) {
      if (expr.kind !== "name") throw fail("nesta oficina, atribua apenas a variáveis simples.", line);
      const op = this.take().text;
      const right: Expr = op === "++" || op === "--" ? { kind: "literal", value: 1 } : this.expr();
      this.is(";"); return { kind: "assign", name: expr.name, expr: op === "=" ? right : { kind: "binary", op: op[0], left: expr, right } };
    }
    this.is(";"); return { kind: "expr", expr };
  }
  expr(min = 0): Expr {
    let left = this.atom();
    const precedence: Record<string, number> = { "||": 1, "&&": 2, "==": 3, "===": 3, "!=": 3, "!==": 3, "<": 4, ">": 4, "<=": 4, ">=": 4, "+": 5, "-": 5, "*": 6, "/": 6, "%": 6 };
    while ((precedence[this.peek()] ?? 0) > min) {
      const op = this.take().text; left = { kind: "binary", op, left, right: this.expr(precedence[op]) };
    }
    return left;
  }
  atom(): Expr {
    let node: Expr;
    const token = this.take();
    if (token.kind === "number") node = { kind: "literal", value: Number(token.text) };
    else if (token.kind === "string") node = { kind: "literal", value: token.text.slice(1, -1).replace(/\\n/g, "\n").replace(/\\(["'\\])/g, "$1") };
    else if (["true", "false", "null"].includes(token.text)) node = { kind: "literal", value: token.text === "null" ? null : token.text === "true" };
    else if (["!", "-"].includes(token.text)) node = { kind: "unary", op: token.text, left: this.atom() };
    else if (token.text === "(") { node = this.expr(); this.expect(")"); }
    else if (token.text === "[") {
      const args: Expr[] = []; if (this.peek() !== "]") do { if (this.peek() === "]") break; args.push(this.expr()); } while (this.is(","));
      this.expect("]"); node = { kind: "array", args };
    } else if (token.text === "{") {
      const keys: string[] = []; const args: Expr[] = [];
      if (this.peek() !== "}") do { if (this.peek() === "}") break; const key = this.name(); if (forbidden.has(key)) throw fail("propriedade bloqueada.", token.line); keys.push(key); this.expect(":"); args.push(this.expr()); } while (this.is(","));
      this.expect("}"); node = { kind: "object", keys, args };
    } else if (token.kind === "name") node = { kind: "name", name: token.text };
    else throw fail(`expressão incompleta perto de “${token.text === "EOF" ? "fim do código" : token.text}”.`, token.line);
    while ([".", "[", "("].includes(this.peek())) {
      if (this.is(".")) node = { kind: "member", left: node, right: { kind: "literal", value: this.name() } };
      else if (this.is("[")) { const right = this.expr(); this.expect("]"); node = { kind: "member", left: node, right }; }
      else { this.expect("("); const args: Expr[] = []; if (this.peek() !== ")") do { args.push(this.expr()); } while (this.is(",")); this.expect(")"); node = { kind: "call", left: node, args }; }
    }
    return node;
  }
}

const show = (v: Value) => { const text = JSON.stringify(v) ?? "null"; return text.length > 80 ? text.slice(0, 77) + "…" : text; };

export function runProgram(code: string): { variables: Record<string, Value>; output: string[]; steps: number; trace: TraceStep[] } {
  const ast = new Parser(code).all();
  const variables: Record<string, Value> = Object.create(null);
  const constants = new WeakMap<Record<string, Value>, Set<string>>();
  const functions = new Map<string, Stmt>(); const output: string[] = []; const trace: TraceStep[] = [];
  let steps = 0; let depth = 0; let line = 0;
  function tick() { if (++steps > 8000) throw fail("limite de execução atingido. Verifique se seu laço consegue terminar.", line); }
  function bounded(v: Value, depth = 0): Value {
    tick();
    if (depth > 18) throw new Error("Estrutura de dados profunda demais para este laboratório.");
    if (typeof v === "string" && v.length > 16000) throw new Error("Texto acima do limite de 16 mil caracteres.");
    if (Array.isArray(v)) { if (v.length > MAX_ARRAY) throw new Error(`Lista acima do limite de ${MAX_ARRAY} itens.`); for (const item of v) bounded(item, depth + 1); }
    else if (v && typeof v === "object") for (const item of Object.values(v)) bounded(item, depth + 1);
    return v;
  }
  const num = (v: Value): number => { if (typeof v !== "number" || !Number.isFinite(v)) throw new Error("Esta operação precisa de números finitos."); return v; };
  function method(e: Expr, env: Record<string, Value>): Value {
    const member = e.left!, name = String(member.right!.value), args = e.args!.map(a => value(a, env));
    if (member.left?.kind === "name" && member.left.name === "Math" && !Object.hasOwn(env, "Math")) {
      const fn = Object.hasOwn(MATH, name) ? MATH[name] : undefined;
      if (!fn) throw new Error(`Math.${name} não está disponível. Use floor, ceil, round, abs, max ou min.`);
      return fn(...args.map(num));
    }
    const target = value(member.left!, env);
    if (Array.isArray(target)) {
      if (name === "push") { if (target.length + args.length > MAX_ARRAY) throw new Error(`Lista acima do limite de ${MAX_ARRAY} itens.`); target.push(...args.map(a => bounded(a))); return target.length; }
      if (name === "pop") return target.pop() ?? null;
      if (name === "includes") return target.some(item => JSON.stringify(item) === JSON.stringify(args[0]));
    }
    if (typeof target === "string") {
      if (name === "includes") return target.includes(String(args[0]));
      if (name === "toUpperCase") return target.toUpperCase();
      if (name === "toLowerCase") return target.toLowerCase();
    }
    throw new Error(`“.${name}()” não está disponível aqui. Em listas use push, pop ou includes; em textos, includes, toUpperCase ou toLowerCase.`);
  }
  function value(e: Expr, env: Record<string, Value>): Value {
    tick();
    if (e.kind === "literal") return e.value ?? null;
    if (e.kind === "name") { if (!Object.hasOwn(env, e.name!)) throw new Error(`A variável “${e.name}” ainda não foi declarada.`); return env[e.name!]; }
    if (e.kind === "array") return e.args!.map(a => value(a, env));
    if (e.kind === "object") return Object.fromEntries(e.keys!.map((key, i) => [key, value(e.args![i], env)]));
    if (e.kind === "unary") return e.op === "!" ? !value(e.left!, env) : -num(value(e.left!, env));
    if (e.kind === "member") {
      const object = value(e.left!, env); const key = String(value(e.right!, env));
      if (forbidden.has(key)) throw new Error("Propriedade bloqueada.");
      if (Array.isArray(object)) { if (key === "length") return object.length; return object[Number(key)] ?? null; }
      if (typeof object === "string" && key === "length") return object.length;
      if (object && typeof object === "object" && Object.hasOwn(object, key)) return object[key];
      throw new Error(`Propriedade “${key}” não disponível.`);
    }
    if (e.kind === "call") {
      if (e.left?.kind === "member" && e.left.left?.name === "console" && e.left.right?.value === "log") {
        if (output.length >= 100) throw new Error("Console limitado a 100 linhas.");
        output.push(e.args!.map(a => { const v = bounded(value(a, env)); return typeof v === "object" ? JSON.stringify(v) : String(v); }).join(" ")); return null;
      }
      if (e.left?.kind === "member" && e.left.right?.kind === "literal") return method(e, env);
      const fn = e.left?.kind === "name" ? functions.get(e.left.name!) : undefined;
      if (!fn) throw new Error(e.left?.kind === "name" ? `A função “${e.left.name}” ainda não foi declarada. Declare com function ${e.left.name}(...) { ... }.` : "Chame uma função que você declarou ou use console.log(...).");
      if (++depth > 24) throw new Error("Chamadas aninhadas demais. Verifique a recursão.");
      const args = e.args!.map(a => value(a, env)); const scope = Object.assign(Object.create(null), variables);
      fn.params!.forEach((name, i) => scope[name] = args[i] ?? null);
      const result = execute(fn.body!, scope); depth--;
      if (result && "jump" in result) throw new Error(`${result.jump} só funciona dentro de um laço.`);
      return result?.value ?? null;
    }
    const a = value(e.left!, env);
    if (e.op === "&&") return a ? value(e.right!, env) : a;
    if (e.op === "||") return a ? a : value(e.right!, env);
    const b = value(e.right!, env);
    switch (e.op) {
      case "+": {
        if (typeof a === "string" || typeof b === "string") { const x = String(a), y = String(b); if (x.length + y.length > 16000) throw new Error("Texto acima do limite de 16 mil caracteres."); return x + y; }
        return num(a) + num(b);
      }
      case "-": return num(a) - num(b);
      case "*": return num(a) * num(b);
      case "/": if (b === 0) throw new Error("Divisão por zero."); return num(a) / num(b);
      case "%": if (b === 0) throw new Error("Divisão por zero."); return num(a) % num(b);
      case "==": case "===": return a === b;
      case "!=": case "!==": return a !== b;
      case "<": return num(a) < num(b);
      case ">": return num(a) > num(b);
      case "<=": return num(a) <= num(b);
      case ">=": return num(a) >= num(b);
      default: throw new Error("Operação não suportada.");
    }
  }
  function record(name: string, v: Value) { if (trace.length < MAX_TRACE) trace.push({ line, name, value: show(v) }); }
  function execute(list: Stmt[], env: Record<string, Value>): Signal | undefined {
    for (const s of list) {
      line = s.line ?? line;
      try {
        tick();
        if (s.kind === "var" || s.kind === "assign") {
          if (s.kind === "assign" && !Object.hasOwn(env, s.name!)) throw new Error(`Declare “${s.name}” com let antes de mudar o valor.`);
          if (s.kind === "assign" && constants.get(env)?.has(s.name!)) throw new Error(`A constante “${s.name}” não pode receber outro valor. Use let se ela precisa mudar.`);
          env[s.name!] = bounded(value(s.expr!, env)); record(s.name!, env[s.name!]);
          if (s.kind === "var" && !s.mutable) { const names = constants.get(env) ?? new Set<string>(); names.add(s.name!); constants.set(env, names); }
        } else if (s.kind === "function") functions.set(s.name!, s);
        else if (s.kind === "return") return { value: value(s.expr!, env) };
        else if (s.kind === "break" || s.kind === "continue") return { jump: s.kind };
        else if (s.kind === "expr") value(s.expr!, env);
        else if (s.kind === "if") { const result = execute(value(s.expr!, env) ? s.body! : s.other!, env); if (result) return result; }
        else if (s.kind === "for" || s.kind === "while") {
          if (s.init) execute([s.init], env);
          while (value(s.expr!, env)) {
            tick(); const result = execute(s.body!, env);
            if (result && "jump" in result) { if (result.jump === "break") break; }
            else if (result) return result;
            if (s.step) execute([s.step], env); line = s.line ?? line;
          }
        }
      } catch (error) {
        if (error instanceof LessonError) throw error;
        throw fail(error instanceof Error ? error.message : "não foi possível executar.", s.line);
      }
    }
  }
  const top = execute(ast, variables);
  if (top && "jump" in top) throw new Error(`${top.jump} só funciona dentro de um laço.`);
  return { variables, output, steps, trace };
}
