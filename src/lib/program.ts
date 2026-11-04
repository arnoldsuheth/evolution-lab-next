// A deliberately small interpreter. Student code never enters eval/Function or the DOM.
export type Value = number | string | boolean | null | Value[] | { [key: string]: Value };
type Token = { text: string; kind: string };
type Expr = { kind: string; value?: Value; name?: string; op?: string; args?: Expr[]; left?: Expr; right?: Expr; keys?: string[] };
type Stmt = { kind: string; name?: string; expr?: Expr; body?: Stmt[]; other?: Stmt[]; init?: Stmt; step?: Stmt; params?: string[] };
const forbidden = new Set(["__proto__", "prototype", "constructor", "window", "document", "globalThis", "fetch", "eval", "Function", "localStorage", "import", "new"]);

function lex(code: string): Token[] {
  if (code.length > 12000) throw new Error("Seu programa excedeu o limite de 12 mil caracteres.");
  const tokens: Token[] = [];
  const re = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|(?:\d+(?:\.\d+)?)|(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?:[A-Za-z_$][\w$]*)|(?:===|!==|<=|>=|==|!=|&&|\|\||\+\+|--|\+=|-=)|[{}()[\];,.?:+\-*\/%<>=!]/gy;
  let pos = 0;
  while (pos < code.length) {
    re.lastIndex = pos;
    const match = re.exec(code);
    if (!match) throw new Error(`Símbolo não suportado perto de: ${code.slice(pos, pos + 16)}`);
    pos = re.lastIndex;
    const text = match[0];
    if (/^\s|^\/\//.test(text) || text.startsWith("/*")) continue;
    if (forbidden.has(text)) throw new Error(`“${text}” não está disponível no laboratório protegido.`);
    tokens.push({ text, kind: /^\d/.test(text) ? "number" : /^["']/.test(text) ? "string" : /^[\w$]/.test(text) ? "name" : "symbol" });
  }
  return [...tokens, { text: "EOF", kind: "end" }];
}

class Parser {
  tokens: Token[]; index = 0;
  constructor(code: string) { this.tokens = lex(code); }
  peek() { return this.tokens[this.index].text; }
  take() { return this.tokens[this.index++]; }
  is(text: string) { if (this.peek() === text) { this.index++; return true; } return false; }
  expect(text: string) { if (!this.is(text)) throw new Error(`Esperado “${text}”, encontrado “${this.peek()}”.`); }
  name() { const t = this.take(); if (t.kind !== "name") throw new Error("Use um nome válido."); return t.text; }
  block(): Stmt[] { this.expect("{"); const result = this.all("}"); this.expect("}"); return result; }
  all(end = "EOF"): Stmt[] { const result: Stmt[] = []; while (this.peek() !== end && this.peek() !== "EOF") result.push(this.statement()); return result; }
  statement(): Stmt {
    if (this.is(";")) return { kind: "empty" };
    if (this.is("let") || this.is("const")) {
      const name = this.name(); this.expect("="); const expr = this.expr(); this.is(";"); return { kind: "var", name, expr };
    }
    if (this.is("function")) {
      const name = this.name(); this.expect("("); const params: string[] = [];
      if (this.peek() !== ")") do { params.push(this.name()); } while (this.is(","));
      this.expect(")"); return { kind: "function", name, params, body: this.block() };
    }
    if (this.is("return")) { const expr = this.expr(); this.is(";"); return { kind: "return", expr }; }
    if (this.is("if")) {
      this.expect("("); const expr = this.expr(); this.expect(")"); const body = this.block();
      return { kind: "if", expr, body, other: this.is("else") ? this.block() : [] };
    }
    if (this.is("for")) {
      this.expect("("); const init = this.statement(); const expr = this.expr(); this.expect(";");
      const step = this.statement(); this.expect(")"); return { kind: "for", init, expr, step, body: this.block() };
    }
    if (this.is("while")) { this.expect("("); const expr = this.expr(); this.expect(")"); return { kind: "while", expr, body: this.block() }; }
    const expr = this.expr();
    if (["=", "+=", "-=", "++", "--"].includes(this.peek())) {
      if (expr.kind !== "name") throw new Error("Nesta oficina, atribua apenas a variáveis simples.");
      const op = this.take().text;
      const right: Expr = op === "++" || op === "--" ? { kind: "literal", value: 1 } : this.expr();
      this.is(";"); return { kind: "assign", name: expr.name, expr: op === "=" ? right : { kind: "binary", op: op.startsWith("+") ? "+" : "-", left: expr, right } };
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
      const args: Expr[] = []; if (this.peek() !== "]") do { args.push(this.expr()); } while (this.is(","));
      this.expect("]"); node = { kind: "array", args };
    } else if (token.text === "{") {
      const keys: string[] = []; const args: Expr[] = [];
      if (this.peek() !== "}") do { const key = this.name(); if (forbidden.has(key)) throw new Error("Propriedade bloqueada."); keys.push(key); this.expect(":"); args.push(this.expr()); } while (this.is(","));
      this.expect("}"); node = { kind: "object", keys, args };
    } else if (token.kind === "name") node = { kind: "name", name: token.text };
    else throw new Error(`Expressão incompleta perto de “${token.text}”.`);
    while ([".", "[", "("].includes(this.peek())) {
      if (this.is(".")) node = { kind: "member", left: node, right: { kind: "literal", value: this.name() } };
      else if (this.is("[")) { const right = this.expr(); this.expect("]"); node = { kind: "member", left: node, right }; }
      else { this.expect("("); const args: Expr[] = []; if (this.peek() !== ")") do { args.push(this.expr()); } while (this.is(",")); this.expect(")"); node = { kind: "call", left: node, args }; }
    }
    return node;
  }
}

export function runProgram(code: string): { variables: Record<string, Value>; output: string[]; steps: number } {
  const ast = new Parser(code).all();
  const variables: Record<string, Value> = Object.create(null);
  const functions = new Map<string, Stmt>(); const output: string[] = [];
  let steps = 0; let depth = 0;
  function tick() { if (++steps > 8000) throw new Error("Limite de execução atingido. Verifique se seu laço consegue terminar."); }
  const num = (v: Value): number => { if (typeof v !== "number" || !Number.isFinite(v)) throw new Error("Esta operação precisa de números finitos."); return v; };
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
        output.push(e.args!.map(a => { const v = value(a, env); return typeof v === "object" ? JSON.stringify(v) : String(v); }).join(" ")); return null;
      }
      const fn = e.left?.kind === "name" ? functions.get(e.left.name!) : undefined;
      if (!fn) throw new Error("Chame uma função que você declarou ou use console.log(...).");
      if (++depth > 24) throw new Error("Chamadas aninhadas demais. Verifique a recursão.");
      const args = e.args!.map(a => value(a, env)); const scope = Object.assign(Object.create(null), variables);
      fn.params!.forEach((name, i) => scope[name] = args[i] ?? null);
      const result = execute(fn.body!, scope); depth--; return result?.value ?? null;
    }
    const a = value(e.left!, env);
    if (e.op === "&&") return a ? value(e.right!, env) : a;
    if (e.op === "||") return a ? a : value(e.right!, env);
    const b = value(e.right!, env);
    switch (e.op) {
      case "+": return typeof a === "string" || typeof b === "string" ? String(a) + String(b) : num(a) + num(b);
      case "-": return num(a) - num(b);
      case "*": return num(a) * num(b);
      case "/": if (b === 0) throw new Error("Divisão por zero."); return num(a) / num(b);
      case "%": return num(a) % num(b);
      case "==": case "===": return a === b;
      case "!=": case "!==": return a !== b;
      case "<": return num(a) < num(b);
      case ">": return num(a) > num(b);
      case "<=": return num(a) <= num(b);
      case ">=": return num(a) >= num(b);
      default: throw new Error("Operação não suportada.");
    }
  }
  function execute(list: Stmt[], env: Record<string, Value>): { value: Value } | undefined {
    for (const s of list) {
      tick();
      if (s.kind === "var" || s.kind === "assign") {
        if (s.kind === "assign" && !Object.hasOwn(env, s.name!)) throw new Error(`Declare “${s.name}” antes de atribuir.`);
        env[s.name!] = value(s.expr!, env);
      } else if (s.kind === "function") functions.set(s.name!, s);
      else if (s.kind === "return") return { value: value(s.expr!, env) };
      else if (s.kind === "expr") value(s.expr!, env);
      else if (s.kind === "if") { const result = execute(value(s.expr!, env) ? s.body! : s.other!, env); if (result) return result; }
      else if (s.kind === "for" || s.kind === "while") {
        if (s.init) execute([s.init], env);
        while (value(s.expr!, env)) { tick(); const result = execute(s.body!, env); if (result) return result; if (s.step) execute([s.step], env); }
      }
    }
  }
  execute(ast, variables);
  return { variables, output, steps };
}
