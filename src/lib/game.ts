import {cleanBindings} from "./keybindings";
import { normalizeHotbar } from './controls';
import type {RegionId} from "./campaign";
import { promotionRank } from "./journey";
import { runProgram, type Value } from "./program";
import { buildCatalogue } from "./catalogue";
import { activeEquipment } from "./equipment";
import { passiveBonuses, SKILLS } from "./skills";

export const RELEASE = "1.6.3";
export type Race = "human" | "orc" | "dwarf" | "elf" | "gnome";
export type ClassId = "paladin" | "warrior" | "hunter" | "engineer" | "mage" | "hacker" | "prophet" | "duelist" | "shaman";
export type NpcId = "borin" | "eldrin" | "pip" | "lion" | "traveler" | "elara" | "dorin" | "mira";
export const CLASSES: Record<ClassId, { name: string; race: Race; role: string; skill: string; color: string; talents: string[]; stats: number[] }> = {
  paladin: { name: "Paladino", race: "human", role: "Espada, escudo e luz. Resiste e protege.", skill: "Luz da Aurora", color: "#edc86d", talents: ["Égide", "Juramento", "Luz"], stats: [8, 6, 9, 4, 5, 6] },
  warrior: { name: "Guerreiro", race: "orc", role: "Armadura leve, força e ataques físicos.", skill: "Golpe da Fúria", color: "#e58b62", talents: ["Fúria", "Disciplina", "Duelista"], stats: [10, 9, 5, 6, 5, 3] },
  hunter: { name: "Hunter", race: "dwarf", role: "Arco, besta, espingarda e companheiro.", skill: "Flecha do Vínculo", color: "#a3c786", talents: ["Pontaria", "Vínculo", "Rastreador"], stats: [5, 7, 5, 7, 10, 4] },
  engineer: { name: "Engenheiro", race: "dwarf", role: "Forja, invenções e preparação estratégica.", skill: "Pulso Mecânico", color: "#e3ab6f", talents: ["Forja", "Engenhocas", "Mobilidade"], stats: [6, 6, 6, 5, 8, 8] },
  mage: { name: "Mago", race: "elf", role: "Tecido, bastão, escudos e controle arcano.", skill: "Runa Estelar", color: "#b9a3ed", talents: ["Runas", "Elementos", "Proteção"], stats: [3, 8, 3, 6, 6, 12] },
  hacker: { name: "Hacker", race: "gnome", role: "Couro, adagas, furtividade e precisão.", skill: "Passo da Sombra", color: "#7bdbcb", talents: ["Sombra", "Sabotagem", "Agilidade"], stats: [4, 7, 4, 11, 9, 7] },
  prophet: { name: "Profeta", race: "human", role: "Cura, bênçãos e proteção. Tecido e foco sagrado.", skill: "Prece Restauradora", color: "#e9d7a3", talents: ["Restauração","Bênçãos","Disciplina"], stats: [3,5,4,5,6,12] },
  duelist: { name: "Dualista", race: "elf", role: "Duas lâminas, precisão, esquiva e contra-ataque.", skill: "Corte Duplo", color: "#c7a37e", talents: ["Duas Lâminas","Esquiva","Precisão"], stats: [6,8,4,10,10,4] },
  shaman: { name: "Shaman", race: "orc", role: "Espíritos, elementos, cura e bênçãos tribais.", skill: "Sopro Ancestral", color: "#82c5b1", talents: ["Elementos","Espíritos","Totens"], stats: [6,7,5,5,5,10] },
};
export const RACE_CLASSES: Record<Race, readonly ClassId[]> = {
  human: ['mage','prophet','paladin','hunter','warrior','hacker'],
  elf: ['hunter','mage','prophet','hacker','duelist'],
  dwarf: ['paladin','warrior','hunter','engineer'],
  orc: ['shaman','warrior'],
  gnome: ['hacker'], // Preserve the previously released race and existing heroes.
};
export function validRaceClass(race: unknown, classId: ClassId): race is Race {
  return typeof race === 'string' && Object.hasOwn(RACE_CLASSES,race) && RACE_CLASSES[race as Race].includes(classId);
}
export function raceForClass(classId: ClassId, preferred?: Race): Race { return validRaceClass(preferred,classId) ? preferred : CLASSES[classId].race; }
export const RACES: Record<Race, string> = { human: "Humano", orc: "Orc", dwarf: "Anão", elf: "Elfo", gnome: "Gnomo" };
export const SKIN = ["#e7bd9e", "#c48a66", "#925f46", "#633f33", "#f1d5bb", "#7d9565", "#607c5b", "#a0b58a"];
export const HAIR = ["#30251f", "#825235", "#bf8b4d", "#e1cfac", "#9697a4", "#533a5d", "#1e252d"];
export const EYES = ["#527f91", "#788447", "#9c6a39", "#a287bd", "#bcbfbd", "#262d34"];
export interface Look { body: number; hair: number; beard: number; moustache: number; skin: number; hairColor: number; eyes: number; face: number; nose: number; brows: number; scar: number; tattoo: number; accessory: number; cloth: number; }
export const DEFAULT_LOOK: Look = { body: 2, hair: 1, beard: 1, moustache: 0, skin: 1, hairColor: 0, eyes: 0, face: 0, nose: 1, brows: 1, scar: 0, tattoo: 0, accessory: 0, cloth: 0 };
export interface HeroData { durability?:Record<string,number>;professions?:Record<string,number>; id: string; name: string; race: Race; classId: ClassId; created: boolean; gold: number; xp: number; level: number; inventory: string[]; equipped: string[]; hp: number; mp: number; stamina: number; talents: number[]; mode: "normal" | "hardcore"; dead: boolean; kills: number; position: [number, number]; materials: number; inherited: number; skills: Record<string,number>; hotbar: string[]; promotions: Partial<Record<ClassId,number>>; openedChests: string[]; region:RegionId; defeatedBosses:string[]; }
export interface Education { deliveries:string[]; aiCompleted: string[]; aiEvidence: Record<string,string>; reviewedProjects: number[]; completed: string[]; attempts: Record<string, number>; drafts: Record<string, string>; reviews: Record<string, number>; projects: Record<string, { code: string; savedAt: number }>; }
export interface Ancestor { id: string; name: string; classId: ClassId; level: number; diedAt: number; cause: string; legacy: number; claimed: boolean; }
export interface Settings {keybindings?:Record<string,string>; ambienceVolume?:number; muted?:boolean; volume: number; panelOpacity: number; uiScale: number; quality: "auto" | "low" | "high"; reduceMotion: boolean; }
export interface SaveData { hero: HeroData; look: Look; education: Education; ancestors: Ancestor[]; settings: Settings; legacy: Record<string, unknown>; }
export const uid = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `lion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function freshHero(): HeroData { return { id: uid(), name: "Viajante", race: "human", classId: "paladin", created: false, durability:{},professions:{}, gold: 0, xp: 0, level: 1, inventory: [], equipped: [], hp: 100, mp: 60, stamina: 100, talents: [0, 0, 0], mode: "normal", dead: false, kills: 0, position: [0, 5], materials: 0, inherited: 0, skills: {}, hotbar: [], promotions: {}, openedChests: [], region:"aurora", defeatedBosses:[] }; }
export function freshSave(): SaveData { return { hero: freshHero(), look: { ...DEFAULT_LOOK }, education: { deliveries:[], aiCompleted: [], aiEvidence: {}, reviewedProjects: [], completed: [], attempts: {}, drafts: {}, reviews: {}, projects: {} }, ancestors: [], settings: {keybindings:cleanBindings(null), volume: .3, ambienceVolume:.55, muted:false, panelOpacity: 0.92, uiScale: 1, quality: "auto", reduceMotion: false }, legacy: {} }; }
const LEGACY_ITEMS: Record<string, { name: string; price: number; slot: string; power: number; defense: number; rarity: string; classId?: ClassId; recipe?: number; description: string }> = {
  axe: { name: "Machado de Ferro", price: 25, slot: "weapon", power: 5, defense: 0, rarity: "Comum", description: "Uma peça antiga da oficina de Borin." },
  shield: { name: "Escudo do Vale", price: 15, slot: "offhand", power: 0, defense: 5, rarity: "Comum", description: "Madeira reforçada com ferro." },
  helmet: { name: "Elmo da Aurora", price: 20, slot: "head", power: 0, defense: 3, rarity: "Comum", description: "Proteção conquistada na jornada." },
  sword: { name: "Espada do Juramento", price: 35, slot: "weapon", power: 7, defense: 0, rarity: "Incomum", classId: "paladin", description: "O primeiro juramento é proteger." },
  greatsword: { name: "Lâmina da Fúria", price: 40, slot: "twohand", power: 10, defense: 0, rarity: "Incomum", classId: "warrior", description: "Duas mãos. Um golpe decisivo." },
  bow: { name: "Arco do Rastreador", price: 35, slot: "twohand", power: 8, defense: 0, rarity: "Incomum", classId: "hunter", description: "Recruta um companheiro ao equipar." },
  tool: { name: "Martelo de Engenho", price: 35, slot: "weapon", power: 7, defense: 1, rarity: "Incomum", classId: "engineer", recipe: 3, description: "Forjado com fragmentos das sentinelas." },
  staff: { name: "Bastão das Estrelas", price: 35, slot: "twohand", power: 8, defense: 0, rarity: "Incomum", classId: "mage", description: "Focaliza as runas de Eldrin." },
  dagger: { name: "Adaga do Silêncio", price: 35, slot: "weapon", power: 7, defense: 0, rarity: "Incomum", classId: "hacker", description: "Pequena, rápida e precisa." },
  tunic: { name: "Traje do Aprendiz", price: 30, slot: "chest", power: 0, defense: 4, rarity: "Comum", description: "Substitui as roupas remendadas." },
  runic: { name: "Amuleto Rúnico", price: 75, slot: "charm", power: 5, defense: 3, rarity: "Raro", recipe: 6, description: "Uma lembrança da floresta restaurada." },
  potion: { name: "Poção de Vida", price: 8, slot: "consumable", power: 0, defense: 0, rarity: "Comum", description: "Recupera 45 HP. Não funciona após a morte." },
  food: { name: "Pão da Aurora", price: 5, slot: "consumable", power: 0, defense: 0, rarity: "Comum", description: "Recupera MP e estamina." },
  tea: { name: "Chá de Lion", price: 12, slot: "consumable", power: 0, defense: 0, rarity: "Incomum", description: "Proteção adicional por 60 segundos de jogo." },
};
export const ITEMS = buildCatalogue(LEGACY_ITEMS);
export function stats(hero: HeroData) {
  const s=CLASSES[hero.classId].stats, promotion=promotionRank(hero), gear=activeEquipment(hero,ITEMS), pass=passiveBonuses(hero);
  return { strength:s[0]+hero.level,attack:7+s[1]+hero.level*2+promotion*3+gear.reduce((n,g)=>n+g.power,0)+hero.talents[0]*2+pass.attack,defense:s[2]+promotion*3+gear.reduce((n,g)=>n+g.defense,0)+hero.talents[1]*2+pass.defense,agility:s[3],dexterity:s[4],intelligence:s[5],maxHp:90+hero.level*10+s[2]*2+gear.reduce((n,g)=>n+(g.hp??0),0)+pass.hp,maxMp:40+s[5]*5+gear.reduce((n,g)=>n+(g.mp??0),0)+pass.mp,maxStamina:100+hero.talents[2]*10+pass.stamina,companion:gear.reduce((n,g)=>n+(g.companion??0),0)+pass.companion,craftDiscount:pass.craftDiscount,lifesteal:pass.lifesteal };
}
export function withXp(hero: HeroData, amount: number): HeroData {
  const xp = hero.xp + amount; const level = Math.min(60,Math.floor(Math.sqrt(xp / 100)) + 1);
  const next = { ...hero, xp, level: Math.max(hero.level, level) };
  return next.level > hero.level ? { ...next, hp: stats(next).maxHp, mp: stats(next).maxMp, stamina: stats(next).maxStamina } : next;
}
export const NPCS_LIVE: { id: NpcId; name: string; title: string; x: number; z: number; classId: ClassId; color: string; greeting: string }[] = [
 {id:'elara',name:'Elara',title:'Mercadora élfica · tecidos e arcos',x:-20,z:7,classId:'mage',color:'#7eaf96',greeting:'Trouxe tecidos, focos e arcos dos artesãos élficos. Conhecer outros ofícios abre novos caminhos.'},
 {id:'dorin',name:'Dorin',title:'Mercador anão · metal e engenhos',x:13,z:4,classId:'engineer',color:'#bd9b6a',greeting:'Metal bom tem origem e trabalho. Veja as peças dos salões anões e compare os requisitos antes de comprar.'},
 {id:'mira',name:'Mira',title:'Boticária · poções e provisões',x:3,z:9,classId:'prophet',color:'#c8b38c',greeting:'Prepare sua mochila antes de explorar. Uma poção não substitui descanso; fora do combate, seu corpo se recupera.'},
  { id: "borin", name: "Borin", title: "Mercador & ferreiro", x: -6, z: 1, classId: "engineer", color: "#bc8f59", greeting: "Estas mãos começaram sem nada, assim como as suas. Aprenda, explore e volte à minha oficina." },
  { id: "eldrin", name: "Eldrin", title: "Mestre das Runas", x: 5, z: -5, classId: "mage", color: "#9d8cc3", greeting: "O mundo perdeu suas regras. Não preciso que você decore respostas: preciso que compreenda o código." },
  { id: "pip", name: "Pip", title: "Viajante improvável", x: -9, z: -15, classId: "hacker", color: "#91ab6d", greeting: "Shhh! Encontrei uma sentinela entre as árvores. Traga fragmentos e não conte a Borin que fui eu." },
  { id: "lion", name: "Lion", title: "Guardião cristalino", x: 0, z: 0, classId: "paladin", color: "#8cd4e4", greeting: "Cada descoberta deixa uma marca. Seu aprendizado continua, mesmo quando uma aventura termina." },
];
export interface Lesson { id: string; title: string; region: string; concept: string; intro: string; task: string; starter: string; hint: string; expected: string; xp: number; gold: number; tests: { label: string; variable: string; expected: Value; suffix?: string }[]; }
export const LESSONS: Lesson[] = [
  { id: "variables", title: "A primeira runa", region: "Pedra da Aurora", concept: "Variáveis", intro: "Uma variável dá nome a uma informação. let permite alterar seu valor; const protege a associação de uma nova atribuição. As regras completas de escopo serão estudadas em projetos JavaScript reais.", task: "Declare uma variável chamada nivel com valor numérico 1. Você pode usar let ou const.", starter: "// Acenda a primeira runa\n", hint: "Uma declaração contém palavra-chave, nome, sinal = e valor. Exemplo diferente: let energia = 5;", expected: "nivel deve ser o número 1", xp: 100, gold: 25, tests: [{ label: "Valor numérico da runa", variable: "nivel", expected: 1 }] },
  { id: "arithmetic", title: "O armazém de Borin", region: "Pedra da Aurora", concept: "Operadores", intro: "Operadores transformam valores. Multiplicação acontece antes da adição. Parênteses deixam a intenção explícita.", task: "Borin tem 4 caixas com 6 pães em cada. Calcule o total na variável total usando as variáveis caixas e paes.", starter: "const caixas = 4;\nconst paes = 6;\n// Calcule total\n", hint: "Use * para multiplicar. Evite escrever apenas o resultado: o programa será testado com outra quantidade.", expected: "total acompanha caixas × paes", xp: 110, gold: 25, tests: [{ label: "Quatro caixas", variable: "total", expected: 24 }, { label: "Outra entrega: sete caixas", variable: "total", expected: 42, suffix: "variant:caixas:7" }] },
  { id: "conditions", title: "A comporta das decisões", region: "Minas das Condições", concept: "Condições", intro: "Uma condição escolhe um caminho. Compare valores com >=, < ou ===. Neste laboratório use chaves nos blocos if e else.", task: "Defina aberta como true quando energia for pelo menos 10; caso contrário, false. Isso abrirá a rota das minas.", starter: "const energia = 12;\nlet aberta = false;\n// Escreva uma decisão\n", hint: "if (condição) { ... } else { ... }. Testaremos também energia insuficiente.", expected: "A comporta só abre com energia suficiente", xp: 140, gold: 30, tests: [{ label: "Energia suficiente", variable: "aberta", expected: true }, { label: "Energia insuficiente", variable: "aberta", expected: false, suffix: "variant:energia:3" }] },
  { id: "loops", title: "As lanternas da floresta", region: "Floresta das Variáveis", concept: "Repetição", intro: "Um laço repete uma sequência enquanto uma condição for verdadeira. A atualização deve aproximar a execução do término.", task: "Some de 1 até limite (incluindo limite) na variável soma, usando for ou while.", starter: "const limite = 5;\nlet soma = 0;\n// Acenda cada lanterna com um laço\n", hint: "Comece em 1; continue enquanto i <= limite; some i; aumente i. Um laço sem término é interrompido pelo laboratório.", expected: "soma deve acompanhar o limite", xp: 160, gold: 35, tests: [{ label: "Cinco lanternas", variable: "soma", expected: 15 }, { label: "Três lanternas", variable: "soma", expected: 6, suffix: "variant:limite:3" }] },
  { id: "functions", title: "O eco das funções", region: "Arquivo das Funções", concept: "Funções", intro: "Uma função reúne uma tarefa. Parâmetros recebem dados, e return entrega um resultado. Use nomes que expliquem a responsabilidade.", task: "Crie a função dobro(valor), retornando o dobro do argumento.", starter: "function dobro(valor) {\n  // Retorne o resultado\n}\n", hint: "return encerra a função e devolve um valor. A função será chamada com números diferentes.", expected: "dobro funciona para diferentes entradas", xp: 180, gold: 40, tests: [{ label: "Dobro de quatro", variable: "teste", expected: 8, suffix: "const teste = dobro(4);" }, { label: "Dobro de nove", variable: "teste", expected: 18, suffix: "const teste = dobro(9);" }] },
  { id: "arrays", title: "A mochila do viajante", region: "Floresta das Variáveis", concept: "Arrays", intro: "Arrays organizam sequências. O primeiro índice é 0. length informa quantos elementos existem.", task: "Some os valores do array recursos em total usando um laço e recursos.length.", starter: "const recursos = [3, 5, 2];\nlet total = 0;\n// Percorra a mochila\n", hint: "recursos[i] lê uma posição. Use i < recursos.length para não acessar além do array.", expected: "total acompanha todos os recursos", xp: 180, gold: 40, tests: [{ label: "Mochila inicial", variable: "total", expected: 10 }, { label: "Mochila diferente", variable: "total", expected: 16, suffix: "variant:recursos:[8,1,7]" }] },
  { id: "objects", title: "O registro do guardião", region: "Pedra da Aurora", concept: "Objetos", intro: "Objetos agrupam informações nomeadas. A notação com ponto acessa uma propriedade, como heroi.vida.", task: "Crie o objeto heroi com nome igual a Aurora, vida igual a 100 e ativo igual a true.", starter: "// Crie o registro do guardião\n", hint: 'Use pares nome: valor dentro de chaves. Textos usam aspas, como "Viajante".', expected: "Registro com nome, vida e estado", xp: 180, gold: 40, tests: [{ label: "Nome", variable: "teste", expected: "Aurora", suffix: "const teste = heroi.nome;" }, { label: "Vida", variable: "teste", expected: 100, suffix: "const teste = heroi.vida;" }, { label: "Estado", variable: "teste", expected: true, suffix: "const teste = heroi.ativo;" }] },
  { id: "debug", title: "A sentinela dos limites", region: "Minas das Condições", concept: "Depuração", intro: "Um teste mostra uma diferença entre o esperado e o observado. Investigue a causa antes de alterar o programa. Limites de arrays são uma fonte comum de erros.", task: "Corrija o código para somar todos os números de valores em soma. Verifique o índice inicial e a condição do laço.", starter: "const valores = [2, 4, 6];\nlet soma = 0;\nfor (let i = 1; i <= valores.length; i++) {\n  soma += valores[i];\n}\n", hint: "Arrays começam no índice 0 e terminam em length - 1.", expected: "Todos os elementos somados sem acessar fora do array", xp: 220, gold: 50, tests: [{ label: "Dados originais", variable: "soma", expected: 12 }, { label: "Um único elemento", variable: "soma", expected: 7, suffix: "variant:valores:[7]" }] },
];
export function evaluateLesson(id: string, code: string) {
  const lesson = LESSONS.find(l => l.id === id);
  if (!lesson) return { passed: false, results: [{ label: "Missão", passed: false, message: "Missão desconhecida." }], output: [] as string[] };
  let output: string[] = [];
  const results = lesson.tests.map(t => {
    try {
      let program = code;
      if (t.suffix?.startsWith("variant:")) {
        const [, variable, ...replacement] = t.suffix.split(":");
        const pattern = new RegExp(`((?:const|let)\\s+${variable}\\s*=\\s*)[^;\\n]+`);
        if (!pattern.test(program)) throw new Error(`Mantenha a declaração de ${variable} para testar outras entradas.`);
        program = program.replace(pattern, `$1${replacement.join(":")}`);
      } else if (t.suffix) program += `\n${t.suffix}`;
      const result = runProgram(program); output = result.output;
      const actual = result.variables[t.variable];
      const passed = JSON.stringify(actual) === JSON.stringify(t.expected);
      return { label: t.label, passed, message: passed ? "Funcionou." : `Esperado ${JSON.stringify(t.expected)}; recebido ${JSON.stringify(actual) ?? "não declarado"}.` };
    } catch (e) { return { label: t.label, passed: false, message: e instanceof Error ? e.message : "Não foi possível executar." }; }
  });
  return { passed: results.every(t => t.passed), results, output };
}
export const CURRICULUM = [
  { title: "Pensamento computacional", requires: "Nenhum", goal: "Decompor, ordenar e verificar", project: "Descreva um algoritmo de entrega com entradas, decisões e saída.", evidence: "Explique dois casos diferentes e como verificar o resultado.", kind: "text" },
  { title: "Lógica e JavaScript", requires: "Sequência e decomposição", goal: "Variáveis, condições, laços, funções e dados", project: "Conclua as oito missões práticas de Eldrin.", evidence: "Testes com entradas diferentes e revisão após 24 horas.", kind: "js" },
  { title: "HTML e CSS", requires: "Fundamentos", goal: "Semântica, layout e acessibilidade", project: "Construa um quadro de avisos com título, três missões e layout responsivo. Use HTML e uma tag style.", evidence: "Teste a 390 px, confira títulos, contraste, foco e navegação por teclado.", kind: "html" },
  { title: "JavaScript no navegador", requires: "HTML/CSS e funções", goal: "DOM, eventos, módulos, assincronia e erros", project: "Crie um diário de tarefas com adicionar, concluir, filtrar e persistir.", evidence: "Demonstre lista vazia, duplicatas e restauração após recarga.", kind: "text" },
  { title: "Git e GitHub", requires: "Um projeto pequeno", goal: "Histórico, branches e revisão", project: "Versione seu diário. Crie uma branch, altere uma função e revise o diff.", evidence: "Inclua os commits e explique como recuperar a versão anterior.", kind: "text" },
  { title: "TypeScript e orientação a objetos", requires: "Funções e objetos", goal: "Tipos, contratos e composição", project: "Modele um inventário com itens, slots e regras de equipamento.", evidence: "Mostre os tipos e testes que rejeitam combinações inválidas.", kind: "text" },
  { title: "React", requires: "JavaScript e TypeScript", goal: "Componentes, estado, efeitos e formulários", project: "Crie um diário de missões com componentes pequenos e estado previsível.", evidence: "Explique o dono de cada estado e teste interação e teclado.", kind: "text" },
  { title: "Next.js", requires: "React e HTTP", goal: "Rotas, cliente, servidor e publicação", project: "Transforme o diário em aplicação com páginas de missão e tratamento de erros.", evidence: "Justifique o que roda no cliente e no servidor e verifique o build.", kind: "text" },
  { title: "APIs, servidores e bancos", requires: "HTTP e aplicação web", goal: "Modelagem, autenticação e consultas", project: "Construa um sistema de encomendas com uma API e banco de dados.", evidence: "Teste permissões, entradas inválidas, paginação e falhas de rede.", kind: "text" },
  { title: "Testes e depuração", requires: "Aplicação com regras", goal: "Investigar defeitos e prevenir regressões", project: "Reproduza um defeito, escreva um teste que falha e corrija a causa.", evidence: "Registre hipótese, reprodução, correção e limites do teste.", kind: "text" },
  { title: "Segurança", requires: "APIs e autenticação", goal: "Limites de confiança e proteção de dados", project: "Revise seu sistema: autorização, validação, segredos e dependências.", evidence: "Use somente seu ambiente autorizado e mostre testes de acesso negado.", kind: "text" },
  { title: "Estruturas de dados e algoritmos", requires: "Laços e funções", goal: "Listas, filas, mapas, árvores, grafos e custo", project: "Implemente uma fila de pedidos e uma busca de rota em grade.", evidence: "Compare entradas pequenas e grandes, e explique a complexidade.", kind: "text" },
  { title: "Arquitetura de software", requires: "Projetos e testes", goal: "Módulos, contratos e decisões", project: "Separe regras, armazenamento e interface sem mudar o comportamento.", evidence: "Desenhe os limites e registre uma decisão com alternativas.", kind: "text" },
  { title: "Inteligência artificial", requires: "APIs, dados e segurança", goal: "Avaliação, limites, privacidade e integração", project: "Projete um assistente com conjunto de avaliação antes de conectar um modelo.", evidence: "Defina acerto, erro, custo e proteção de dados. A integração de API é uma etapa externa.", kind: "text" },
  { title: "Desenvolvimento de jogos", requires: "Vetores, estado e algoritmos", goal: "Game loop, câmera, física, animação e IA", project: "Crie um pequeno jogo com objetivo, controles, derrota e reinício.", evidence: "Meça o desempenho, teste teclado/toque e explique o game loop.", kind: "text" },
];

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const number = (value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) => typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
export function migrateSave(input: unknown): SaveData {
  const data = record(input); const fresh = freshSave(); const old = record(data.hero); const oldLook = record(data.look); const appearance = record(data.appearance); const edu = record(data.education);
  const classId: ClassId = typeof old.classId === "string" && Object.hasOwn(CLASSES, old.classId) ? old.classId as ClassId : Object.keys(old).length ? "engineer" : "paladin";
  const completed = [...new Set([...strings(edu.completed), ...(old.missionComplete === true ? ["variables"] : [])])];
  const hero: HeroData = { ...fresh.hero, id: typeof old.id === "string" ? old.id : fresh.hero.id, name: typeof old.name === "string" ? old.name.slice(0, 40) : fresh.hero.name, classId, race: validRaceClass(old.race,classId) ? old.race : CLASSES[classId].race, created: typeof old.created === "boolean" ? old.created : Object.keys(old).length > 0,
    durability:Object.fromEntries(Object.entries(record(old.durability)).map(([id,value])=>[id,Math.floor(number(value,100,0,100))])),professions:Object.fromEntries(Object.entries(record(old.professions)).filter(([id])=>["blacksmith","weaponsmith","tailor","leatherworker","alchemist"].includes(id)).map(([id,value])=>[id,Math.floor(number(value,0,0,100000))])),gold: number(old.gold, 0), xp: number(old.xp, 0), level: number(old.level, 1, 1), inventory: strings(old.inventory), equipped: strings(old.equipped), hp: number(old.hp, 100), mp: number(old.mp, 60), stamina: number(old.stamina, 100), talents: [0, 1, 2].map(i => number(Array.isArray(old.talents) ? old.talents[i] : 0, 0, 0, 10)), mode: old.mode === "hardcore" ? "hardcore" : "normal", dead: old.dead === true, kills: number(old.kills, 0), materials: number(old.materials, 0), inherited: number(old.inherited, 0), skills: Object.fromEntries(Object.entries(record(old.skills)).filter(([id])=>Object.hasOwn(SKILLS,id)).map(([id,value])=>[id,Math.floor(number(value,0,0,SKILLS[id].maxRank))])), promotions: Object.fromEntries(Object.entries(record(old.promotions)).filter(([id])=>Object.hasOwn(CLASSES,id)).map(([id,value])=>[id,Math.floor(number(value,0,0,3))])), openedChests: strings(old.openedChests), region:["aurora","ruins","frontier","heart"].includes(String(old.region))?old.region as RegionId:"aurora", defeatedBosses:strings(old.defeatedBosses), hotbar: normalizeHotbar(old.hotbar,id=>Object.hasOwn(SKILLS,id)||id.startsWith("item:")&&!!ITEMS[id.slice(5)]?.effect), position: Array.isArray(old.position) && old.position.length === 2 && old.position.every(v => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 28) ? [old.position[0], old.position[1]] : [0, 5] };
  const look = { ...DEFAULT_LOOK };
  for (const key of Object.keys(look) as (keyof Look)[]) look[key] = Math.floor(number(oldLook[key], look[key], 0, key === "skin" ? SKIN.length - 1 : key === "hairColor" ? HAIR.length - 1 : 5));
  if (!data.look) { if (appearance.beard === "copper") look.hairColor = 2; if (appearance.beard === "silver") look.hairColor = 4; if (appearance.armor === "red") look.cloth = 2; if (appearance.armor === "green") look.cloth = 3; }
  const drafts = Object.fromEntries(Object.entries(record(edu.drafts)).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const attempts = Object.fromEntries(Object.entries(record(edu.attempts)).map(([k, v]) => [k, number(v, 0)]));
  const reviews = Object.fromEntries(Object.entries(record(edu.reviews)).map(([k, v]) => [k, number(v, 0)]));
  const projects: Education["projects"] = {};
  for (const [key, raw] of Object.entries(record(edu.projects))) { const p = record(raw); if (typeof p.code === "string") projects[key] = { code: p.code, savedAt: number(p.savedAt, 0) }; }
  const settings = record(data.settings);
  const ancestors: Ancestor[] = Array.isArray(data.ancestors) ? data.ancestors.flatMap(raw => { const a = record(raw); return typeof a.id === "string" && typeof a.name === "string" ? [{ id: a.id, name: a.name, classId: typeof a.classId === "string" && Object.hasOwn(CLASSES, a.classId) ? a.classId as ClassId : "paladin" as ClassId, level: number(a.level, 1), diedAt: number(a.diedAt, 0), cause: typeof a.cause === "string" ? a.cause : "Jornada encerrada", legacy: number(a.legacy, 0, 0, 100), claimed: a.claimed === true }] : []; }) : [];
  return { hero, look, education: { deliveries:Array.isArray(edu.deliveries)?strings(edu.deliveries):[...completed.map(id=>`main:${id}`),...strings(edu.aiCompleted).map(id=>`ai:${id}`)], aiCompleted: strings(edu.aiCompleted), aiEvidence: Object.fromEntries(Object.entries(record(edu.aiEvidence)).filter((entry): entry is [string,string]=>typeof entry[1]==="string")), reviewedProjects: Array.isArray(edu.reviewedProjects)?[...new Set(edu.reviewedProjects.filter((v): v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<15))]:[], completed, drafts, attempts, reviews, projects }, ancestors, settings: {keybindings:cleanBindings(settings.keybindings), ambienceVolume:number(settings.ambienceVolume,.55,0,1),muted:settings.muted===true,volume: number(settings.volume, .3, 0, 1), panelOpacity: number(settings.panelOpacity, 0.92, 0.4, 1), uiScale: number(settings.uiScale, 1, 0.85, 1.2), quality: settings.quality === "low" || settings.quality === "high" ? settings.quality : "auto", reduceMotion: settings.reduceMotion === true }, legacy: Object.keys(data).length ? { ...record(data.legacy), ...(!data.look ? { originalSave: data } : {}) } : {} };
}

