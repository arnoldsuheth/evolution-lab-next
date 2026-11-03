import { useMemo, useState } from 'react'

// GENESIS-64-RPG
// Sistema independente. Nao modifica XP, cursos ou memoria antiga.

type Item = { feito: boolean }
type Modulo = { id: string; titulo: string; itens: Item[] }
type Curso = {
  id: string
  titulo: string
  trilha: string
  modulos: Modulo[]
}

type Painel = {
  xp: number
  nivel: number
  minutos: number
  concluidas: number
  competencias: number
  itensFeitos: number
  projetosConcluidos: number
  materiais: number
}

type Questao = {
  pergunta: string
  opcoes: string[]
  correta: number
  explicacao: string
}

type TrilhaDesafio = {
  id: string
  nome: string
  descricao: string
  questoes: Questao[]
}

type Recordes = Record<string, number>

const chave = 'genesis-arena-v1'

function carregarRecordes(): Recordes {
  try {
    const texto = localStorage.getItem(chave)
    if (!texto) return {}
    const valor: unknown = JSON.parse(texto)

    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(valor).filter(
        ([id, pontos]) =>
          id.length < 80 &&
          typeof pontos === 'number' &&
          Number.isInteger(pontos) &&
          pontos >= 0 &&
          pontos <= 100
      )
    )
  } catch {
    return {}
  }
}

const desafios: TrilhaDesafio[] = [
  {
    id: 'html',
    nome: 'Fundamentos HTML',
    descricao: 'Estrutura, semantica e navegacao.',
    questoes: [
      {
        pergunta: 'Qual tag indica o conteudo principal da pagina?',
        opcoes: ['main', 'meta', 'link', 'title'],
        correta: 0,
        explicacao: 'main identifica o conteudo principal do documento.',
      },
      {
        pergunta: 'Qual atributo define o destino de um link?',
        opcoes: ['src', 'href', 'alt', 'role'],
        correta: 1,
        explicacao: 'A tag a utiliza href para indicar o destino.',
      },
      {
        pergunta: 'Qual atributo descreve uma imagem para acessibilidade?',
        opcoes: ['name', 'value', 'alt', 'target'],
        correta: 2,
        explicacao: 'alt oferece uma alternativa textual a imagem.',
      },
    ],
  },
  {
    id: 'css',
    nome: 'Interface e CSS',
    descricao: 'Layout, responsividade e estilos.',
    questoes: [
      {
        pergunta: 'Qual propriedade cria um container flexivel?',
        opcoes: ['display: flex', 'font-weight', 'opacity', 'outline'],
        correta: 0,
        explicacao: 'display: flex ativa o modelo Flexbox.',
      },
      {
        pergunta: 'Qual recurso aplica estilos conforme a largura da tela?',
        opcoes: ['@keyframes', '@media', '@font-face', '@import'],
        correta: 1,
        explicacao: '@media permite definir estilos responsivos.',
      },
      {
        pergunta: 'Qual propriedade controla o espaco interno?',
        opcoes: ['margin', 'border', 'padding', 'z-index'],
        correta: 2,
        explicacao: 'padding cria espaco dentro das bordas.',
      },
    ],
  },
  {
    id: 'javascript',
    nome: 'Logica JavaScript',
    descricao: 'Variaveis, eventos e manipulacao de dados.',
    questoes: [
      {
        pergunta: 'Qual operador compara valor e tipo?',
        opcoes: ['=', '==', '===', '=>'],
        correta: 2,
        explicacao: '=== faz a comparacao estrita.',
      },
      {
        pergunta: 'Qual metodo transforma JSON em objeto?',
        opcoes: ['JSON.parse', 'JSON.stringify', 'Object.keys', 'Array.map'],
        correta: 0,
        explicacao: 'JSON.parse interpreta um texto JSON valido.',
      },
      {
        pergunta: 'Como adicionar um ouvinte de clique?',
        opcoes: ['querySelector', 'addEventListener', 'setAttribute', 'console.log'],
        correta: 1,
        explicacao: 'addEventListener registra eventos nos elementos.',
      },
    ],
  },
  {
    id: 'git',
    nome: 'Git e publicacao',
    descricao: 'Versionamento, branches e seguranca.',
    questoes: [
      {
        pergunta: 'Qual comando mostra alteracoes no repositorio?',
        opcoes: ['git status', 'git push', 'git clone', 'git tag'],
        correta: 0,
        explicacao: 'git status mostra o estado dos arquivos.',
      },
      {
        pergunta: 'Para que serve uma branch?',
        opcoes: ['Apagar backups', 'Isolar linhas de desenvolvimento', 'Criar senhas', 'Instalar React'],
        correta: 1,
        explicacao: 'Branches isolam historicos de desenvolvimento.',
      },
      {
        pergunta: 'Qual comando cria um registro de alteracoes?',
        opcoes: ['git fetch', 'git pull', 'git commit', 'git branch'],
        correta: 2,
        explicacao: 'git commit registra uma nova revisao local.',
      },
    ],
  },
]

const patentes: [number, string][] = [
  [0, 'Iniciante'],
  [1000, 'Trainee'],
  [3000, 'Junior I'],
  [7000, 'Junior II'],
  [14000, 'Pleno I'],
  [25000, 'Pleno II'],
  [40000, 'Senior'],
  [65000, 'Especialista Tecnico'],
  [100000, 'Especialista Senior'],
]

export default function GenesisRPG({
  painel,
  cursos,
}: {
  painel: Painel
  cursos: Curso[]
}) {
  const [recordes, setRecordes] = useState(carregarRecordes)
  const [selecionado, setSelecionado] = useState('html')
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Record<number, number>>({})
  const [terminou, setTerminou] = useState(false)
  const [erro, setErro] = useState('')

  const desafio = desafios.find(d => d.id === selecionado) ?? desafios[0]

  const pontuacao = desafio.questoes.reduce(
    (soma, questao, i) =>
      soma + (respostas[i] === questao.correta ? 1 : 0),
    0
  )

  const medalhas = [
    { nome: 'Primeiro passo', ok: painel.itensFeitos >= 1, motivo: 'Concluir uma atividade de curso' },
    { nome: 'Foco academico', ok: painel.minutos >= 120, motivo: 'Registrar 2 horas de estudo' },
    { nome: 'Constancia de estudo', ok: painel.minutos >= 600, motivo: 'Registrar 10 horas de estudo' },
    { nome: 'Explorador', ok: painel.materiais >= 1, motivo: 'Adicionar um material a biblioteca' },
    { nome: 'Construtor', ok: painel.projetosConcluidos >= 1, motivo: 'Concluir um projeto' },
    { nome: 'Evolucao', ok: painel.competencias >= 1, motivo: 'Registrar uma competencia' },
    { nome: 'Missao cumprida', ok: painel.concluidas >= 1, motivo: 'Concluir uma tarefa academica' },
    { nome: 'Mente afiada', ok: Object.values(recordes).some(x => x === 100), motivo: 'Conseguir 100% em uma fase da Arena' },
    { nome: 'Arena completa', ok: desafios.every(d => recordes[d.id] >= 70), motivo: 'Alcancar pelo menos 70% em todas as fases' },
  ]

  const patenteXp = [...patentes].reverse().find(
    ([minimo]) => painel.xp >= minimo
  ) ?? patentes[0]

  const seguinte = patentes.find(
    ([minimo]) => minimo > painel.xp
  )

  const modulos = useMemo(
    () => cursos.flatMap(curso =>
      curso.modulos.map(modulo => {
        const total = modulo.itens.length
        const feitos = modulo.itens.filter(item => item.feito).length

        return {
          id: `${curso.id}:${modulo.id}`,
          curso: curso.titulo,
          nome: modulo.titulo,
          total,
          feitos,
          completo: total > 0 && feitos === total,
        }
      })
    ),
    [cursos]
  )

  const estrelas = Object.values(recordes).reduce(
    (soma, pontos) => soma +
      (pontos >= 100 ? 3 : pontos >= 70 ? 2 : pontos >= 34 ? 1 : 0),
    0
  )

  function iniciar(id: string) {
    setSelecionado(id)
    setIndice(0)
    setRespostas({})
    setTerminou(false)
    setErro('')
  }

  function responder(opcao: number) {
    if (terminou || respostas[indice] !== undefined) return

    setRespostas(atuais => ({ ...atuais, [indice]: opcao }))
  }

  function avancar() {
    if (respostas[indice] === undefined) return

    if (indice + 1 < desafio.questoes.length) {
      setIndice(atual => atual + 1)
      return
    }

    const percentual = Math.round(
      pontuacao / desafio.questoes.length * 100
    )

    const proximos = {
      ...recordes,
      [selecionado]: Math.max(recordes[selecionado] ?? 0, percentual),
    }

    try {
      localStorage.setItem(chave, JSON.stringify(proximos))
      setRecordes(proximos)
      setErro('')
    } catch {
      setErro('O navegador nao permitiu salvar o recorde.')
    }

    setTerminou(true)
  }

  const questao = desafio.questoes[indice]

  return (
    <section className="glass-surface genesis64">
      <div className="genesis64-head">
        <span className="eyebrow">GENESIS 6.4 · RPG ACADEMICO</span>
        <h2>Trajetoria, conquistas e Arena</h2>
        <p>
          Acompanhamento vinculado aos seus registros reais.
          A Arena salva recordes separados, sem alterar o XP
          academico nem marcar aulas automaticamente.
        </p>
      </div>

      <div className="genesis64-cards">
        <article>
          <small>XP atual do Genesis</small>
          <strong>{painel.xp.toLocaleString('pt-BR')}</strong>
          <span>Nivel motivacional {painel.nivel}</span>
        </article>
        <article>
          <small>Patente por XP</small>
          <strong>{patenteXp[1]}</strong>
          <span>{seguinte ? `Proximo marco: ${seguinte[0].toLocaleString('pt-BR')} XP` : 'Ultimo marco da escala'}</span>
        </article>
        <article>
          <small>Medalhas conquistadas</small>
          <strong>{medalhas.filter(m => m.ok).length}/{medalhas.length}</strong>
          <span>Conquistas por criterios verificaveis</span>
        </article>
        <article>
          <small>Estrelas da Arena</small>
          <strong>{estrelas}/{desafios.length * 3}</strong>
          <span>Recorde por fase</span>
        </article>
      </div>

      <p className="genesis64-note">
        As patentes mostram faixas de XP do Lab original.
        Promocoes profissionais exigem evidencias e projetos
        revisados; esta exibicao nao certifica competencia.
      </p>

      <div className="genesis64-columns">
        <section className="genesis64-panel">
          <h3>Medalhas e recompensas</h3>
          <div className="genesis64-medals">
            {medalhas.map(m => (
              <div className={m.ok ? 'won' : 'locked'} key={m.nome}>
                <span aria-hidden="true">{m.ok ? '✦' : '◇'}</span>
                <div>
                  <strong>{m.nome}</strong>
                  <small>{m.motivo}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="genesis64-panel">
          <h3>Arvore academica por modulos</h3>
          <p>
            {modulos.filter(m => m.completo).length} de {modulos.length}
            {' modulos completos'}
          </p>
          <div className="genesis64-tree">
            {modulos.slice(0, 18).map(m => (
              <div
                className={m.completo ? 'complete' : 'incomplete'}
                key={m.id}
              >
                <span>{m.completo ? '✦' : '○'}</span>
                <div>
                  <strong>{m.nome}</strong>
                  <small>{m.curso} · {m.feitos}/{m.total}</small>
                </div>
              </div>
            ))}
          </div>
          {modulos.length > 18 && (
            <small>
              Exibindo os primeiros 18 modulos.
              A arvore completa continua na pagina Cursos.
            </small>
          )}
        </section>
      </div>

      <section className="genesis64-panel genesis64-arena">
        <div className="genesis64-head">
          <span className="eyebrow">ARENA DE DESAFIOS</span>
          <h3>Treine, responda e conquiste estrelas</h3>
          <p>
            Quatro fases iniciais de conhecimentos fundamentais.
            Cada fase tem tres perguntas e registra a melhor nota.
          </p>
        </div>

        <div className="genesis64-tabs">
          {desafios.map(d => (
            <button
              type="button"
              className={selecionado === d.id ? 'active' : ''}
              onClick={() => iniciar(d.id)}
              key={d.id}
            >
              {d.nome}
              <small>
                {recordes[d.id] === undefined
                  ? 'Nao iniciada'
                  : `Recorde: ${recordes[d.id]}%`}
              </small>
            </button>
          ))}
        </div>

        {terminou ? (
          <div className="genesis64-result">
            <span className="eyebrow">FASE CONCLUIDA</span>
            <h3>
              {Math.round(pontuacao / desafio.questoes.length * 100)}%
              {' de acerto'}
            </h3>
            <p>
              {pontuacao} de {desafio.questoes.length} respostas corretas.
              {pontuacao === desafio.questoes.length
                ? ' Gabarito! Tres estrelas.'
                : ' Reveja as explicacoes e tente novamente.'}
            </p>
            <button type="button" onClick={() => iniciar(selecionado)}>
              REFAZER DESAFIO
            </button>
          </div>
        ) : (
          <div className="genesis64-question">
            <div className="genesis64-question-heading">
              <small>{desafio.descricao}</small>
              <span>
                Pergunta {indice + 1}/{desafio.questoes.length}
              </span>
            </div>

            <h4>{questao.pergunta}</h4>

            <div className="genesis64-options">
              {questao.opcoes.map((opcao, n) => {
                const respondida = respostas[indice] !== undefined
                const correta = n === questao.correta
                const selecionada = respostas[indice] === n

                return (
                  <button
                    type="button"
                    key={opcao}
                    disabled={respondida}
                    className={
                      respondida && correta ? 'correct'
                        : respondida && selecionada ? 'wrong'
                          : ''
                    }
                    onClick={() => responder(n)}
                  >
                    <span>{String.fromCharCode(65 + n)}</span>
                    {opcao}
                  </button>
                )
              })}
            </div>

            {respostas[indice] !== undefined && (
              <div className="genesis64-feedback">
                <strong>
                  {respostas[indice] === questao.correta
                    ? 'Resposta correta!'
                    : 'Vamos revisar o conceito.'}
                </strong>
                <p>{questao.explicacao}</p>
                <button type="button" onClick={avancar}>
                  {indice + 1 === desafio.questoes.length
                    ? 'CONCLUIR FASE'
                    : 'PROXIMA PERGUNTA'}
                </button>
              </div>
            )}
          </div>
        )}

        {erro && <p role="alert">{erro}</p>}
      </section>
    </section>
  )
}