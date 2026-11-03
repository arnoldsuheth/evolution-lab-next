import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
// GENESIS-55-REACTOR-3D
import NexusPipes3D from './NexusPipes3D'
import NeuralUniverse from './NeuralUniverse'
import './App.css'
import legado from './dados/legado.json'

type Page =
  | 'Central' | 'Faculdade' | 'Ascensão' | 'Cursos'
  | 'Biblioteca' | 'Projetos' | 'Conquistas' | 'Equipe'

const navigation: { name: Page; icon: string; detail: string }[] = [
  { name: 'Central', icon: '◈', detail: 'Genesis Command' },
  { name: 'Faculdade', icon: '▦', detail: 'Prioridade acadêmica' },
  { name: 'Ascensão', icon: '△', detail: 'Árvore de trilhas' },
  { name: 'Cursos', icon: '⌘', detail: 'Aprendizado complementar' },
  { name: 'Biblioteca', icon: '▤', detail: 'Conhecimento reunido' },
  { name: 'Projetos', icon: '◇', detail: 'Sites e aplicativos' },
  { name: 'Conquistas', icon: '✧', detail: 'Sua jornada' },
  { name: 'Equipe', icon: '◇', detail: 'Techno Pro' },
]


function LionCrystal({ burst = 0, calm = false }: { burst?: number; calm?: boolean }) {
  const mount = useRef<HTMLDivElement>(null)
  const burstRef = useRef({ value: burst, start: -10, seen: burst })
  const calmRef = useRef(calm)

  useEffect(() => {
    calmRef.current = calm
  }, [calm])

  useEffect(() => {
    burstRef.current.value = burst
  }, [burst])

  useEffect(() => {
    const host = mount.current
    if (!host) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.z = 5.4

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'default',
      })
    } catch {
      host.classList.add('lion-webgl-unavailable')
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const canvas = renderer.domElement
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)

    const geometry = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0, -1.45),
        new THREE.Vector2(1.38, 0.12),
        new THREE.Vector2(1.38, 0.24),
        new THREE.Vector2(0.72, 0.82),
        new THREE.Vector2(0, 0.82),
      ],
      10
    )
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x79d5ff,
      metalness: 0.10,
      roughness: 0.09,
      transmission: 0.48,
      thickness: 1.15,
      transparent: true,
      opacity: 0.95,
      flatShading: true,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    })

    const crystal = new THREE.Mesh(geometry, material)
    scene.add(crystal)

    const wireGeometry = new THREE.EdgesGeometry(geometry)
    const wireMaterial = new THREE.LineBasicMaterial({
      color: 0xd3f3ff,
      transparent: true,
      opacity: 0.38,
    })
    const wireframe = new THREE.LineSegments(
      wireGeometry,
      wireMaterial
    )
    crystal.add(wireframe)

    const innerGeometry = new THREE.OctahedronGeometry(0.62, 0)
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b78ef,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
    const inner = new THREE.Mesh(innerGeometry, innerMaterial)
    crystal.add(inner)

    const particleCount = 90
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 0.9
      particlePositions[i * 3] = Math.cos(angle) * radius
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 1.6
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius
    }
    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    )
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x9fe8ff,
      size: 0.04,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    scene.add(new THREE.AmbientLight(0xa9daff, 1.45))

    const cyanLight = new THREE.PointLight(0x29c7ff, 38, 12)
    cyanLight.position.set(2, 2, 3)
    scene.add(cyanLight)

    const violetLight = new THREE.PointLight(0x8e78ff, 30, 12)
    violetLight.position.set(-2, -1, 2)
    scene.add(violetLight)

    const target = { x: 0, y: 0 }
    let frame = 0
    let disposed = false

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      target.x = (x - 0.5) * 0.8
      target.y = (y - 0.5) * 0.5
    }

    const onPointerLeave = () => {
      target.x = 0
      target.y = 0
    }

    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerleave', onPointerLeave)

    const resize = () => {
      const width = Math.max(host.clientWidth, 1)
      const height = Math.max(host.clientHeight, 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      renderer.render(scene, camera)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const clock = new THREE.Clock()

    const animate = () => {
      if (disposed) return

      const elapsed = clock.getElapsedTime()

      crystal.rotation.y += (
        (reducedMotion ? 0 : elapsed * 0.16 + target.x) -
        crystal.rotation.y
      ) * 0.035

      crystal.rotation.x += (
        target.y - crystal.rotation.x
      ) * 0.035

      crystal.position.y = reducedMotion
        ? 0
        : Math.sin(elapsed * 1.2) * 0.08

      inner.rotation.y = reducedMotion ? 0 : elapsed * -0.4
      particles.rotation.y = reducedMotion || calmRef.current ? 0 : elapsed * 0.12
      particleMaterial.opacity = calmRef.current ? 0 : 0.8

      const state = burstRef.current
      if (state.value !== state.seen) {
        state.seen = state.value
        state.start = elapsed
      }
      const pulse = Math.max(0, 1 - (elapsed - state.start) / 1.4)
      const scale = 1 + pulse * 0.22
      crystal.scale.setScalar(scale)
      cyanLight.intensity = 38 + pulse * 120
      violetLight.intensity = 30 + pulse * 90

      renderer.render(scene, camera)

      if (!reducedMotion && !document.hidden) {
        frame = requestAnimationFrame(animate)
      }
    }

    const onVisibility = () => {
      if (!document.hidden && !reducedMotion) {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(animate)
      }
    }

    animate()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      observer.disconnect()
      geometry.dispose()
      material.dispose()
      wireGeometry.dispose()
      wireMaterial.dispose()
      innerGeometry.dispose()
      innerMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      renderer.dispose()
      if (canvas.parentNode === host) host.removeChild(canvas)
    }
  }, [])

  return (
    <div
      className="lion-3d-container"
      ref={mount}
      role="img"
      aria-label="Lion Core: cristal tridimensional"
    >
      <span className="lion-fallback" aria-hidden="true">✧</span>
    </div>
  )
}
type Disciplina = {
  id: string
  nome: string
  codigo: string
  progresso: number
  feitos: number
  total: number
  temas: string[]
  aviso?: string
}

type TarefaAcademica = {
  id: string
  titulo: string
  disciplina: string
  concluida: boolean
}

type SessaoAcademica = {
  id: string
  disciplina: string
  minutos: number
  data: string
}

const disciplinasEstacio: Disciplina[] = [
  {
    id: 'redes',
    nome: 'Fundamentos de Redes de Computadores',
    codigo: 'Não confirmado',
    progresso: 6,
    feitos: 1,
    total: 8,
    temas: [
      'Introdução',
      'Redes de Computadores e a Internet',
      'Modelo de Referência OSI e Arquitetura TCP/IP',
      'Camadas de Aplicação e Transporte',
      'Camada de Rede',
      'Camadas de Enlace e Física',
      'Fundamentos de Administração e Segurança em Rede de Computadores',
      'Prepare'
    ]
  },
  {
    id: 'seguranca',
    nome: 'Introdução à Segurança da Informação',
    codigo: 'DGT0288',
    progresso: 0,
    feitos: 0,
    total: 9,
    temas: [
      'Introdução',
      'Princípios da Segurança e o Ciclo de Vida da Informação',
      'Ameaças e Vulnerabilidades à Segurança de Informação',
      'Normas de Segurança da Informação',
      'Boas Práticas em Segurança da Informação',
      'Gestão de Risco',
      'Gestão de Continuidade do Negócio',
      'Prepare'
    ],
    aviso: 'O portal informa 9 conteúdos, mas apenas 8 nomes foram identificados.'
  },
  {
    id: 'matematica',
    nome: 'Matemática e Lógica',
    codigo: 'DGT0279',
    progresso: 0,
    feitos: 0,
    total: 9,
    temas: [
      'Introdução',
      'Teoria dos Conjuntos e Princípios de Contagem',
      'Gráficos e Interpretações Gráficas',
      'Aprofundamento de Funções',
      'Cálculo Proposicional',
      'Cálculo de Predicados',
      'Métodos de Demonstração',
      'Prepare'
    ],
    aviso: 'O portal informa 9 conteúdos, mas apenas 8 nomes foram identificados.'
  },
  {
    id: 'programacao',
    nome: 'Introdução à Programação de Computadores',
    codigo: 'DGT0232',
    progresso: 0,
    feitos: 0,
    total: 7,
    temas: [
      'Apresentação da Disciplina',
      'Solução de Problemas e Pensamento Computacional',
      'Tipos de Dados, Expressões, Operadores e Tabela Verdade',
      'Comandos de Entrada e Saída',
      'Estruturas de Decisão',
      'Estruturas de Repetição',
      'Vetores e Matrizes'
    ]
  },
  {
    id: 'nuvem',
    nome: 'Computação em Nuvem',
    codigo: 'DGT1334',
    progresso: 0,
    feitos: 0,
    total: 8,
    temas: [
      'Introdução',
      'Fundamentos de Computação em Nuvem',
      'Arquitetura de Computação em Nuvem',
      'Segurança em Computação em Nuvem',
      'Ambiente de Computação em Nuvem – Azure',
      'Ambiente de Computação em Nuvem – AWS',
      'Ambiente de Computação em Nuvem – Google Cloud',
      'Prepare'
    ]
  },
  {
    id: 'labvida',
    nome: 'Labvida em Ciência da Computação 1',
    codigo: 'Não confirmado',
    progresso: 25,
    feitos: 1,
    total: 4,
    temas: ['Tema 1: Introdução'],
    aviso: 'Os outros três conteúdos ainda não foram identificados.'
  }
]

function lerDadosAcademicos<T>(
  chave: string,
  inicial: T,
  validar?: (valor: unknown) => boolean
): T {
  try {
    const conteudo = localStorage.getItem(chave)
    if (!conteudo) return inicial
    const valor: unknown = JSON.parse(conteudo)
    return !validar || validar(valor) ? valor as T : inicial
  } catch {
    return inicial
  }
}

const ehLista = (valor: unknown) => Array.isArray(valor)
const ehObjeto = (valor: unknown) =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor)

type EventoAcademico = {
  id: string
  titulo: string
  disciplina: string
  tipo: 'Prova' | 'Trabalho' | 'Atividade' | 'Revisão'
  data: string
  prioridade: 'Alta' | 'Normal' | 'Baixa'
  concluido: boolean
}

const diasEstudo = [
  'Segunda', 'Terça', 'Quarta', 'Quinta',
  'Sexta', 'Sábado', 'Domingo'
]

const planoInicial = [120, 120, 120, 120, 120, 120, 120]

function AcademicPlanner({
  sessoes,
  removerSessao
}: {
  sessoes: SessaoAcademica[]
  removerSessao: (id: string) => void
}) {
  const [eventos, setEventos, erroAgenda] = useArmazenado<EventoAcademico[]>(
    'evolution-agenda-v2', [], ehLista
  )

  const [plano, setPlano, erroPlano] = useArmazenado<number[]>(
    'evolution-plano-v2',
    planoInicial,
    valor => Array.isArray(valor) && valor.length === 7 &&
      valor.every(n => Number.isFinite(Number(n)))
  )

  const [titulo, setTitulo] = useState('')
  const [disciplina, setDisciplina] = useState('redes')
  const [tipo, setTipo] = useState<EventoAcademico['tipo']>('Atividade')
  const [data, setData] = useState('')
  const [prioridade, setPrioridade] =
    useState<EventoAcademico['prioridade']>('Normal')
  const [editando, setEditando] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('todos')
  const [mensagemLocal, setMensagem] = useState('')
  const mensagem = erroAgenda || erroPlano
    ? 'Não foi possível salvar o planejamento neste navegador.'
    : mensagemLocal

  const hoje = new Date()
  const dataHoje = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0')
  ].join('-')

  const pendentes = eventos.filter(e => !e.concluido)
  const atrasados = pendentes.filter(e => e.data < dataHoje)
  const futuros = pendentes.filter(e => e.data >= dataHoje)
  const proximos = [...futuros].sort((a, b) => a.data.localeCompare(b.data))
  const minutosTotais = sessoes.reduce(
    (soma, sessao) => soma + sessao.minutos, 0
  )

  const lista = eventos
    .filter(e => filtro === 'todos' || e.disciplina === filtro)
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))

  function nomeDisciplina(id: string) {
    return disciplinasEstacio.find(d => d.id === id)?.nome ?? 'Disciplina'
  }

  function limparFormulario() {
    setTitulo('')
    setData('')
    setTipo('Atividade')
    setPrioridade('Normal')
    setEditando(null)
  }

  function salvarEvento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!titulo.trim() || !data) {
      setMensagem('Preencha o título e a data.')
      return
    }

    const registro: EventoAcademico = {
      id: editando ?? crypto.randomUUID(),
      titulo: titulo.trim(),
      disciplina,
      tipo,
      data,
      prioridade,
      concluido: editando
        ? eventos.find(e => e.id === editando)?.concluido ?? false
        : false
    }

    setEventos(atuais => editando
      ? atuais.map(e => e.id === editando ? registro : e)
      : [...atuais, registro]
    )

    setMensagem(editando ? 'Evento atualizado.' : 'Evento cadastrado.')
    limparFormulario()
  }

  function editarEvento(evento: EventoAcademico) {
    setEditando(evento.id)
    setTitulo(evento.titulo)
    setDisciplina(evento.disciplina)
    setTipo(evento.tipo)
    setData(evento.data)
    setPrioridade(evento.prioridade)
  }

  function excluirEvento(id: string) {
    if (!window.confirm('Excluir este evento do calendário?')) return
    setEventos(atuais => atuais.filter(e => e.id !== id))
    if (editando === id) limparFormulario()
  }

  function alternarEvento(id: string) {
    setEventos(atuais => atuais.map(e =>
      e.id === id ? { ...e, concluido: !e.concluido } : e
    ))
  }

  const orientacao = atrasados.length > 0
    ? `Lion: você tem ${atrasados.length} atividade(s) com data vencida. Confira as prioridades.`
    : proximos.length > 0
      ? `Lion: sua próxima atividade é "${proximos[0].titulo}", prevista para ${proximos[0].data.split('-').reverse().join('/')}.`
      : 'Lion: nenhuma avaliação ou atividade futura foi cadastrada. Consulte o calendário oficial da Estácio.'

  return (
    <section className="planner-root">
      <div className="planner-heading glass-surface">
        <div>
          <span className="eyebrow">PLANEJAMENTO ACADÊMICO</span>
          <h2>Meu centro de estudos</h2>
          <p>Calendário, prioridades e rotina em um único lugar.</p>
        </div>
        <span className="planner-chip">ESTÁCIO · 2026.4</span>
      </div>

      <div className="planner-metrics">
        <article className="glass-surface">
          <small>ATIVIDADES PENDENTES</small>
          <strong>{pendentes.length}</strong>
          <span>Cadastradas no Lab</span>
        </article>
        <article className="glass-surface">
          <small>COM DATA VENCIDA</small>
          <strong>{atrasados.length}</strong>
          <span>Verificar situação</span>
        </article>
        <article className="glass-surface">
          <small>TEMPO REGISTRADO</small>
          <strong>{Math.floor(minutosTotais / 60)}h {minutosTotais % 60}m</strong>
          <span>Sessões no navegador</span>
        </article>
      </div>

      <div className="planner-layout">
        <section className="glass-surface planner-panel">
          <span className="eyebrow">CALENDÁRIO PESSOAL</span>
          <h3>{editando ? 'Editar atividade' : 'Cadastrar atividade ou avaliação'}</h3>
          <p>Registre somente as datas confirmadas por você.</p>

          <form className="planner-form" onSubmit={salvarEvento}>
            <label>
              Descrição
              <input
                className="faculdade-input"
                value={titulo}
                maxLength={160}
                placeholder="Ex.: Prova AV de Matemática"
                onChange={e => setTitulo(e.target.value)}
                required
              />
            </label>

            <label>
              Disciplina
              <select
                className="faculdade-input"
                value={disciplina}
                onChange={e => setDisciplina(e.target.value)}
              >
                {disciplinasEstacio.map(d => (
                  <option value={d.id} key={d.id}>{d.nome}</option>
                ))}
              </select>
            </label>

            <div className="planner-form-grid">
              <label>
                Tipo
                <select
                  className="faculdade-input"
                  value={tipo}
                  onChange={e => setTipo(e.target.value as EventoAcademico['tipo'])}
                >
                  <option>Atividade</option>
                  <option>Prova</option>
                  <option>Trabalho</option>
                  <option>Revisão</option>
                </select>
              </label>
              <label>
                Data
                <input
                  className="faculdade-input"
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Prioridade
              <select
                className="faculdade-input"
                value={prioridade}
                onChange={e => setPrioridade(
                  e.target.value as EventoAcademico['prioridade']
                )}
              >
                <option>Alta</option>
                <option>Normal</option>
                <option>Baixa</option>
              </select>
            </label>

            <div className="planner-actions">
              <button className="glass-button" type="submit">
                {editando ? 'SALVAR ALTERAÇÕES' : 'ADICIONAR AO CALENDÁRIO'}
              </button>
              {editando && (
                <button
                  className="glass-button"
                  type="button"
                  onClick={limparFormulario}
                >
                  CANCELAR
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="glass-surface planner-panel">
          <span className="eyebrow">AGENDA ACADÊMICA</span>
          <h3>Atividades e avaliações</h3>

          <select
            className="faculdade-input"
            aria-label="Filtrar eventos por disciplina"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          >
            <option value="todos">Todas as disciplinas</option>
            {disciplinasEstacio.map(d => (
              <option value={d.id} key={d.id}>{d.nome}</option>
            ))}
          </select>

          <div className="planner-events">
            {lista.map(evento => {
              const vencido = !evento.concluido && evento.data < dataHoje

              return (
                <article className="planner-event" key={evento.id}>
                  <div className="planner-event-head">
                    <span>{evento.tipo} · {evento.prioridade}</span>
                    <strong>{evento.data.split('-').reverse().join('/')}</strong>
                  </div>
                  <h4>{evento.titulo}</h4>
                  <p>{nomeDisciplina(evento.disciplina)}</p>
                  {vencido && <small className="planner-warning">Data vencida</small>}
                  <div className="planner-event-actions">
                    <button
                      className="glass-button"
                      onClick={() => alternarEvento(evento.id)}
                    >
                      {evento.concluido ? 'REABRIR' : 'CONCLUIR'}
                    </button>
                    <button
                      className="glass-button"
                      onClick={() => editarEvento(evento)}
                    >EDITAR</button>
                    <button
                      className="glass-button"
                      onClick={() => excluirEvento(evento.id)}
                    >EXCLUIR</button>
                  </div>
                </article>
              )
            })}
            {lista.length === 0 && (
              <p>Nenhuma atividade cadastrada neste filtro.</p>
            )}
          </div>
        </section>
      </div>

      <section className="glass-surface planner-panel">
        <span className="eyebrow">ROTINA FLEXÍVEL</span>
        <h3>Planejamento semanal</h3>
        <p>Meta inicial sugerida: 120 minutos por dia. Você pode ajustar ou zerar qualquer dia.</p>
        <div className="planner-week">
          {diasEstudo.map((dia, indice) => (
            <label key={dia} className="planner-day">
              <strong>{dia}</strong>
              <input
                type="number"
                className="faculdade-input"
                min="0"
                max="480"
                value={plano[indice]}
                onChange={e => setPlano(atual => atual.map((m, i) =>
                  i === indice
                    ? Math.min(480, Math.max(0, Number(e.target.value) || 0))
                    : m
                ))}
              />
              <small>minutos</small>
            </label>
          ))}
        </div>
        <p>
          Meta semanal configurada: <strong>
            {plano.reduce((soma, n) => soma + n, 0)} minutos
          </strong>. O tempo efetivamente estudado é calculado pelas sessões registradas.
        </p>
      </section>

      <div className="planner-layout">
        <section className="glass-surface planner-panel">
          <span className="eyebrow">HISTÓRICO REAL</span>
          <h3>Últimas sessões de estudo</h3>
          <div className="planner-history">
            {sessoes.slice(0, 15).map(sessao => (
              <div className="planner-history-row" key={sessao.id}>
                <div>
                  <strong>{nomeDisciplina(sessao.disciplina)}</strong>
                  <small>{new Date(sessao.data).toLocaleString('pt-BR')}</small>
                </div>
                <span>{sessao.minutos} min</span>
                <button
                  className="glass-button"
                  onClick={() => {
                    if (window.confirm('Excluir este registro de estudo?')) {
                      removerSessao(sessao.id)
                    }
                  }}
                >EXCLUIR</button>
              </div>
            ))}
            {sessoes.length === 0 && <p>Nenhuma sessão registrada ainda.</p>}
          </div>
        </section>

        <section className="glass-surface planner-panel">
          <span className="eyebrow">LION / ASSISTENTE DE ESTUDOS</span>
          <h3>Orientação da sua jornada</h3>
          <div className="planner-lion">
            <span>✧</span>
            <p>{orientacao}</p>
          </div>
          <p>
            As recomendações são geradas pelas informações registradas neste
            navegador. O Lion ainda não consulta o portal da Estácio automaticamente.
          </p>
        </section>
      </div>

      {mensagem && (
        <div className="glass-surface planner-message" role="status">
          {mensagem}
        </div>
      )}
    </section>
  )
}
function FacultyDashboard({ onBack }: { onBack: () => void }) {
  const [selecionada, setSelecionada] = useState('redes')
  const [pesquisa, setPesquisa] = useState('')
  const [tarefas, setTarefas, erroTarefas] = useArmazenado<TarefaAcademica[]>(
    'evolution-faculdade-tarefas-v1', [], ehLista
  )
  const [sessoes, setSessoes, erroSessoes] = useArmazenado<SessaoAcademica[]>(
    'evolution-faculdade-sessoes-v1', [], ehLista
  )
  const [novaTarefa, setNovaTarefa] = useState('')
  const [minutos, setMinutos] = useState(30)
  const [avisoLocal, setAviso] = useState('')
  const aviso = erroTarefas || erroSessoes
    ? 'Não foi possível salvar no navegador. Verifique o armazenamento.'
    : avisoLocal

  const disciplina = disciplinasEstacio.find(d => d.id === selecionada)
    ?? disciplinasEstacio[0]

  const resultados = disciplinasEstacio.filter(d =>
    d.nome.toLocaleLowerCase('pt-BR').includes(
      pesquisa.toLocaleLowerCase('pt-BR')
    )
  )

  const tarefasDaDisciplina = tarefas.filter(
    t => t.disciplina === disciplina.id
  )

  const sessoesDaDisciplina = sessoes.filter(
    s => s.disciplina === disciplina.id
  )

  const tempoTotal = sessoes.reduce((total, s) => total + s.minutos, 0)
  const concluidas = tarefas.filter(t => t.concluida).length

  function adicionarTarefa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const titulo = novaTarefa.trim()
    if (!titulo) return

    const tarefa: TarefaAcademica = {
      id: crypto.randomUUID(),
      titulo,
      disciplina: disciplina.id,
      concluida: false
    }
    setTarefas(atuais => [tarefa, ...atuais])
    setNovaTarefa('')
    setAviso('Tarefa criada no Evolution Lab Next.')
  }

  function concluirTarefa(id: string) {
    setTarefas(atuais => atuais.map(t =>
      t.id === id ? { ...t, concluida: !t.concluida } : t
    ))
    setAviso('Situação atualizada. O progresso da Estácio não foi alterado.')
  }

  function excluirTarefa(id: string) {
    if (!window.confirm('Excluir esta tarefa do Evolution Lab Next?')) return
    setTarefas(atuais => atuais.filter(t => t.id !== id))
  }

  function registrarEstudo() {
    const tempo = Math.round(Number(minutos))
    if (!Number.isFinite(tempo) || tempo < 1 || tempo > 480) {
      setAviso('Informe uma duração entre 1 e 480 minutos.')
      return
    }

    const sessao: SessaoAcademica = {
      id: crypto.randomUUID(),
      disciplina: disciplina.id,
      minutos: tempo,
      data: new Date().toISOString()
    }

    setSessoes(atuais => [sessao, ...atuais])
    setAviso(`Sessão de ${tempo} minutos registrada para ${disciplina.nome}.`)
  }

  return (
    <main className="content reveal-scene faculdade-next">
      <section className="glass-surface faculdade-cabecalho">
        <div>
          <span className="eyebrow">ESTÁCIO DIGITAL / PERÍODO 2026.4</span>
          <h2>Minha Faculdade</h2>
          <p>Ciência da Computação · Sua prioridade acadêmica</p>
          <small>Dados do portal: referência coletada em 02/11/2026. Sem sincronização automática.</small>
        </div>
        <button className="glass-button" onClick={onBack}>
          VOLTAR À CENTRAL
        </button>
      </section>

      <section className="faculdade-indicadores">
        <article className="glass-surface">
          <small>DISCIPLINAS ATUAIS</small>
          <strong>06</strong>
          <span>Período 2026.4</span>
        </article>
        <article className="glass-surface">
          <small>CONTEÚDOS NA ESTÁCIO</small>
          <strong>02/45</strong>
          <span>Último levantamento</span>
        </article>
        <article className="glass-surface">
          <small>SESSÕES REGISTRADAS</small>
          <strong>{sessoes.length}</strong>
          <span>{tempoTotal} minutos acumulados</span>
        </article>
        <article className="glass-surface">
          <small>TAREFAS DO LAB</small>
          <strong>{concluidas}/{tarefas.length}</strong>
          <span>Concluídas por você</span>
        </article>
      </section>

      <section className="faculdade-layout">
        <div className="glass-surface faculdade-listagem">
          <span className="eyebrow">MINHAS DISCIPLINAS</span>
          <input
            className="faculdade-input"
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            placeholder="Pesquisar disciplina..."
            aria-label="Pesquisar disciplina"
          />
          <div className="faculdade-disciplinas">
            {resultados.map(d => (
              <button
                key={d.id}
                className={`faculdade-disciplina ${d.id === selecionada ? 'ativa' : ''}`}
                onClick={() => setSelecionada(d.id)}
              >
                <span>{d.nome}</span>
                <small>{d.codigo} · {d.progresso}% no portal</small>
                <span className="faculdade-trilha">
                  <span style={{ width: `${d.progresso}%` }} />
                </span>
              </button>
            ))}
            {resultados.length === 0 && <p>Nenhuma disciplina encontrada.</p>}
          </div>
        </div>

        <div className="faculdade-conteudo">
          <section className="glass-surface faculdade-detalhes">
            <span className="eyebrow">DISCIPLINA SELECIONADA</span>
            <h3>{disciplina.nome}</h3>
            <p>Código: {disciplina.codigo}</p>

            <div className="faculdade-progresso">
              <div>
                <strong>{disciplina.progresso}%</strong>
                <small>Progresso informado pela Estácio</small>
              </div>
              <div>
                <strong>{disciplina.feitos}/{disciplina.total}</strong>
                <small>Conteúdos informados pelo portal</small>
              </div>
            </div>

            <h4>Unidades e temas identificados</h4>
            {disciplina.aviso && (
              <p className="faculdade-observacao">{disciplina.aviso}</p>
            )}

            <div className="faculdade-temas">
              {disciplina.temas.map((tema, indice) => (
                <div key={`${disciplina.id}-${indice}`} className="faculdade-tema">
                  <span>{String(indice + 1).padStart(2, '0')}</span>
                  <strong>{tema}</strong>
                </div>
              ))}
            </div>

            <p className="faculdade-nota">
              Os temas acima são referências do portal. Não é possível
              confirmar a situação individual de todos eles.
            </p>
          </section>

          <section className="glass-surface faculdade-tarefas">
            <span className="eyebrow">ORGANIZAÇÃO PESSOAL</span>
            <h3>Tarefas de estudo</h3>

            <form onSubmit={adicionarTarefa} className="faculdade-form">
              <input
                className="faculdade-input"
                value={novaTarefa}
                onChange={e => setNovaTarefa(e.target.value)}
                placeholder="Ex.: revisar o tema 2..."
                aria-label="Descrição da nova tarefa"
                maxLength={160}
              />
              <button className="glass-button" type="submit">
                ADICIONAR
              </button>
            </form>

            <div className="faculdade-tarefas-lista">
              {tarefasDaDisciplina.map(t => (
                <div key={t.id} className="faculdade-tarefa">
                  <label>
                    <input
                      type="checkbox"
                      checked={t.concluida}
                      onChange={() => concluirTarefa(t.id)}
                    />
                    <span className={t.concluida ? 'concluida' : ''}>
                      {t.titulo}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="faculdade-excluir"
                    onClick={() => excluirTarefa(t.id)}
                    aria-label={`Excluir tarefa ${t.titulo}`}
                  >×</button>
                </div>
              ))}
              {tarefasDaDisciplina.length === 0 && (
                <p>Nenhuma tarefa pessoal cadastrada nesta disciplina.</p>
              )}
            </div>
          </section>

          <section className="glass-surface faculdade-sessoes">
            <span className="eyebrow">CONTROLE DE ESTUDOS</span>
            <h3>Registrar sessão</h3>
            <p>Registre o tempo realmente estudado nesta disciplina.</p>
            <div className="faculdade-form">
              <label className="faculdade-minutos">
                Minutos
                <input
                  className="faculdade-input"
                  type="number"
                  min="1"
                  max="480"
                  value={minutos}
                  onChange={e => setMinutos(Number(e.target.value))}
                />
              </label>
              <button
                className="glass-button"
                type="button"
                onClick={registrarEstudo}
              >
                REGISTRAR ESTUDO
              </button>
            </div>
            <p>{sessoesDaDisciplina.length} sessões registradas nesta disciplina.</p>
          </section>
        </div>
      </section>

      <AcademicPlanner
        sessoes={sessoes}
        removerSessao={(id) => setSessoes(atuais =>
          atuais.filter(sessao => sessao.id !== id)
        )}
      />

      {aviso && <div className="faculdade-aviso glass-surface" role="status">{aviso}</div>}

      <section className="glass-surface faculdade-rodape">
        <span className="eyebrow">PRÓXIMAS INTEGRAÇÕES</span>
        <p>Notas, provas, simulados e calendário ainda dependem de informações confirmadas da Estácio. Os registros locais não alteram o portal acadêmico.</p>
      </section>
    </main>
  )
}
type Trilha = 'faculdade' | 'programacao' | 'claude' | 'design'

type Competencia = {
  id: string
  titulo: string
  descricao: string
  requisitos: string[]
}

type TrilhaInfo = {
  id: Trilha
  titulo: string
  simbolo: string
  detalhe: string
  cor: string
  competencias: Competencia[]
}

const trilhas: TrilhaInfo[] = [
  {
    id: 'faculdade', titulo: 'Faculdade', simbolo: '▦', cor: '#2cc8ff',
    detalhe: 'Ciência da Computação · Estácio Digital · 2026.4',
    competencias: [
      { id: 'fac-logica', titulo: 'Lógica e pensamento computacional', descricao: 'Resolver problemas em passos e interpretar tabelas verdade.', requisitos: [] },
      { id: 'fac-redes', titulo: 'Fundamentos de redes', descricao: 'Explicar camadas, modelo OSI e TCP/IP.', requisitos: [] },
      { id: 'fac-programacao', titulo: 'Fundamentos de programação', descricao: 'Usar variáveis, decisões, repetições e vetores.', requisitos: ['fac-logica'] },
      { id: 'fac-seguranca', titulo: 'Noções de segurança da informação', descricao: 'Reconhecer ameaças, riscos e boas práticas.', requisitos: ['fac-redes'] },
      { id: 'fac-nuvem', titulo: 'Conceitos de computação em nuvem', descricao: 'Comparar modelos e provedores de nuvem.', requisitos: ['fac-redes', 'fac-programacao'] },
    ],
  },
  {
    id: 'programacao', titulo: 'Programação', simbolo: '</>', cor: '#4f8dff',
    detalhe: 'HTML, CSS, JavaScript, React e versionamento',
    competencias: [
      { id: 'prog-html', titulo: 'HTML semântico', descricao: 'Estruturar páginas com marcação correta.', requisitos: [] },
      { id: 'prog-git', titulo: 'Git e GitHub', descricao: 'Versionar um projeto e sincronizar com segurança.', requisitos: [] },
      { id: 'prog-css', titulo: 'CSS responsivo', descricao: 'Criar layouts que funcionam no celular e no computador.', requisitos: ['prog-html'] },
      { id: 'prog-js', titulo: 'JavaScript básico', descricao: 'Manipular dados e eventos na página.', requisitos: ['prog-html'] },
      { id: 'prog-ts', titulo: 'TypeScript', descricao: 'Tipar dados e funções de um projeto.', requisitos: ['prog-js'] },
      { id: 'prog-react', titulo: 'Componentes React', descricao: 'Construir interfaces com estado e componentes.', requisitos: ['prog-js', 'prog-css'] },
      { id: 'prog-projeto', titulo: 'Projeto publicado', descricao: 'Entregar um projeto completo e funcional.', requisitos: ['prog-react', 'prog-git'] },
    ],
  },
  {
    id: 'claude', titulo: 'Claude e IA', simbolo: '✦', cor: '#8e78ff',
    detalhe: 'Prompts, contexto, agentes e automações',
    competencias: [
      { id: 'ia-prompts', titulo: 'Prompts claros', descricao: 'Pedir tarefas com objetivo, contexto e formato.', requisitos: [] },
      { id: 'ia-revisao', titulo: 'Revisão crítica de respostas', descricao: 'Conferir e corrigir o que a IA entrega.', requisitos: [] },
      { id: 'ia-contexto', titulo: 'Instruções e contexto', descricao: 'Organizar regras e arquivos de contexto.', requisitos: ['ia-prompts'] },
      { id: 'ia-agentes', titulo: 'Agentes personalizados', descricao: 'Criar agentes com papéis e limites definidos.', requisitos: ['ia-prompts', 'ia-contexto'] },
      { id: 'ia-automacao', titulo: 'Automação de fluxos', descricao: 'Encadear tarefas repetitivas com segurança.', requisitos: ['ia-agentes'] },
    ],
  },
  {
    id: 'design', titulo: 'Design', simbolo: '◇', cor: '#c084fc',
    detalhe: 'UI/UX, composição, cor e identidade visual',
    competencias: [
      { id: 'des-layout', titulo: 'Composição e hierarquia', descricao: 'Organizar elementos para guiar o olhar.', requisitos: [] },
      { id: 'des-cor', titulo: 'Cor e contraste', descricao: 'Montar paletas legíveis.', requisitos: [] },
      { id: 'des-tipografia', titulo: 'Tipografia', descricao: 'Escolher e combinar fontes com legibilidade.', requisitos: [] },
      { id: 'des-ui', titulo: 'Interface responsiva', descricao: 'Projetar telas para celular e computador.', requisitos: ['des-layout', 'des-cor'] },
      { id: 'des-acessibilidade', titulo: 'Acessibilidade', descricao: 'Garantir uso por mais pessoas.', requisitos: ['des-ui'] },
      { id: 'des-identidade', titulo: 'Identidade visual', descricao: 'Criar um sistema visual coerente.', requisitos: ['des-cor', 'des-tipografia'] },
    ],
  },
]

type Declaradas = Record<string, { data: string; evidencia: string }>

type Config = { efeitos: boolean; movimento: boolean; som: boolean }
const configPadrao: Config = { efeitos: true, movimento: true, som: true }

function novoId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function useArmazenado<T>(
  chave: string,
  inicial: T,
  validar?: (valor: unknown) => boolean
) {
  const [valor, setValor] = useState<T>(() => lerDadosAcademicos(chave, inicial, validar))
  const [erro, setErro] = useState(false)
  const atual = useRef(valor)

  // O valor mais recente fica em um ref para a gravação acontecer fora do
  // atualizador do React, que precisa ser uma função pura.
  function atualizar(proximo: (anterior: T) => T) {
    const novo = proximo(atual.current)
    atual.current = novo
    setValor(novo)
    try {
      localStorage.setItem(chave, JSON.stringify(novo))
      setErro(false)
    } catch {
      setErro(true)
    }
  }

  return [valor, atualizar, erro] as const
}

function tocarSom(tipo: 'conquista' | 'toque') {
  try {
    const Contexto = window.AudioContext
    if (!Contexto) return
    const contexto = new Contexto()
    const notas = tipo === 'conquista' ? [523, 659, 784] : [440]
    notas.forEach((frequencia, indice) => {
      const oscilador = contexto.createOscillator()
      const ganho = contexto.createGain()
      const inicio = contexto.currentTime + indice * 0.11
      oscilador.frequency.value = frequencia
      oscilador.type = 'sine'
      ganho.gain.setValueAtTime(0.0001, inicio)
      ganho.gain.exponentialRampToValueAtTime(0.06, inicio + 0.02)
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.22)
      oscilador.connect(ganho).connect(contexto.destination)
      oscilador.start(inicio)
      oscilador.stop(inicio + 0.24)
    })
    window.setTimeout(() => void contexto.close(), 900)
  } catch {
    // som é opcional
  }
}

function linkSeguro(texto: string) {
  try {
    const url = new URL(texto.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch {
    return ''
  }
}

function registros(valor: unknown): Record<string, unknown>[] {
  return Array.isArray(valor)
    ? valor.filter((x): x is Record<string, unknown> =>
        typeof x === 'object' && x !== null)
    : []
}

type Painel = {
  tarefas: number
  concluidas: number
  minutos: number
  pendencias: number
  proxima: { titulo: string; data: string; disciplina: string } | null
  competencias: number
  porTrilha: Record<Trilha, number>
  itensCursos: number
  itensFeitos: number
  projetos: number
  projetosConcluidos: number
  materiais: number
  xp: number
  nivel: number
  xpBase: number
  xpProximo: number
}

function lerPainel(): Painel {
  const tarefas = registros(lerDadosAcademicos<unknown>('evolution-faculdade-tarefas-v1', []))
  const sessoes = registros(lerDadosAcademicos<unknown>('evolution-faculdade-sessoes-v1', []))
  const agenda = registros(lerDadosAcademicos<unknown>('evolution-agenda-v2', []))
  const cursos = registros(lerDadosAcademicos<unknown>('evolution-cursos-v1', []))
  const projetos = registros(lerDadosAcademicos<unknown>('evolution-projetos-v1', []))
  const biblioteca = registros(lerDadosAcademicos<unknown>('evolution-biblioteca-v1', []))
  const bruto = lerDadosAcademicos<unknown>('evolution-ascensao-v1', {})
  const declaradas: Declaradas =
    typeof bruto === 'object' && bruto !== null && !Array.isArray(bruto)
      ? bruto as Declaradas
      : {}

  const pendentes = agenda
    .filter(x => x.concluido !== true)
    .sort((a, b) => String(a.data).localeCompare(String(b.data)))
  const primeira = pendentes[0]

  const itens = cursos
    .flatMap(c => registros(c.modulos))
    .flatMap(m => registros(m.itens))

  const porTrilha = { faculdade: 0, programacao: 0, claude: 0, design: 0 } as Record<Trilha, number>
  trilhas.forEach(t => {
    porTrilha[t.id] = t.competencias.filter(c => declaradas[c.id]).length
  })

  const minutos = sessoes.reduce((soma, x) => soma + (Number(x.minutos) || 0), 0)
  const concluidas = tarefas.filter(x => x.concluida === true).length
  const competencias = Object.values(porTrilha).reduce((a, b) => a + b, 0)
  const itensFeitos = itens.filter(x => x.feito === true).length
  const projetosConcluidos = projetos.filter(x => x.status === 'Concluído').length

  const xp =
    Math.floor(minutos / 5) + concluidas * 15 + competencias * 40 +
    itensFeitos * 10 + projetosConcluidos * 25
  const nivel = Math.floor(Math.sqrt(xp / 40)) + 1

  return {
    tarefas: tarefas.length,
    concluidas,
    minutos,
    pendencias: pendentes.length,
    proxima: primeira
      ? {
          titulo: String(primeira.titulo ?? 'Atividade'),
          data: String(primeira.data ?? ''),
          disciplina: String(primeira.disciplina ?? ''),
        }
      : null,
    competencias,
    porTrilha,
    itensCursos: itens.length,
    itensFeitos,
    projetos: projetos.length,
    projetosConcluidos,
    materiais: biblioteca.length,
    xp,
    nivel,
    xpBase: 40 * (nivel - 1) ** 2,
    xpProximo: 40 * nivel ** 2,
  }
}

function formatarTempo(minutos: number) {
  return `${Math.floor(minutos / 60)}h ${String(minutos % 60).padStart(2, '0')}m`
}

function formatarData(texto: string) {
  const [ano, mes, dia] = texto.slice(0, 10).split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : texto
}

function mensagemDoLion(painel: Painel, trilha?: TrilhaInfo) {
  if (trilha) {
    const feitas = painel.porTrilha[trilha.id]
    return feitas === 0
      ? `${trilha.titulo}: nenhuma competência registrada ainda. Abra a trilha e comece pela primeira camada.`
      : `${trilha.titulo}: ${feitas} de ${trilha.competencias.length} competências registradas por você.`
  }
  if (painel.minutos === 0 && painel.tarefas === 0) {
    return 'Ainda não vejo registros de estudo. Registre a primeira sessão na Faculdade para eu acompanhar sua evolução.'
  }
  return `Você registrou ${formatarTempo(painel.minutos)} de estudo e ${painel.concluidas} de ${painel.tarefas} tarefas concluídas.`
}

const cameras: Record<Trilha, { x: number; y: number }> = {
  faculdade: { x: 3, y: 7 },
  programacao: { x: 3, y: -7 },
  claude: { x: -3, y: 7 },
  design: { x: -3, y: -7 },
}

function GenesisHome({
  painel, selecionado, onSelect, onNavigate, onOpenTrilha, burst, calm, onLion,
}: {
  painel: Painel
  selecionado: Trilha
  onSelect: (trilha: Trilha) => void
  onNavigate: (page: Page) => void
  onOpenTrilha: (trilha: Trilha) => void
  burst: number
  calm: boolean
  onLion: () => void
}) {
  const [agora, setAgora] = useState(() => new Date())
  const [mensagem, setMensagem] = useState(() => mensagemDoLion(painel))
  // GENESIS-53-ENERGIA-VIVA
  const [energiaAberta53, setEnergiaAberta53] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(new Date()), 15000)
    return () => window.clearInterval(timer)
  }, [])

  const hora = agora.getHours()
  const saudacao = hora < 5 ? 'Boa madrugada' : hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const trilha = trilhas.find(t => t.id === selecionado)!
  const camera = cameras[selecionado]
  const feitas = painel.porTrilha[selecionado]
  const pctTrilha = Math.round(feitas / trilha.competencias.length * 100)
  const pctXp = Math.round(
    (painel.xp - painel.xpBase) / (painel.xpProximo - painel.xpBase) * 100
  )

  const fasesLion = [
    { nivel: 1, nome: 'CENTELHA' },
    { nivel: 3, nome: 'PULSO' },
    { nivel: 6, nome: 'PRISMA' },
    { nivel: 10, nome: 'LION CORE' },
    { nivel: 16, nome: 'LEÃO ASCENDENTE' },
    { nivel: 25, nome: 'LION CORE PRIME' },
  ]

  const faseLion = [...fasesLion]
    .reverse()
    .find(fase => painel.nivel >= fase.nivel) ?? fasesLion[0]
  // GENESIS-42-ENERGY
  const energiaLion = Math.min(
    100,
    Math.max(0, pctXp)
  )

  const intensidadeLion = Math.min(
    1,
    0.18 + painel.nivel * 0.035
  )

  const proximaForma = fasesLion.find(
    fase => fase.nivel > painel.nivel
  )

  const energiaRestante = Math.max(
    0,
    painel.xpProximo - painel.xp
  )


  const paineis = [
    { anel: 0, angulo: 20, rotulo: 'TEMPO REGISTRADO', valor: formatarTempo(painel.minutos) },
    { anel: 0, angulo: 200, rotulo: 'TAREFAS', valor: `${painel.concluidas}/${painel.tarefas}` },
    { anel: 1, angulo: 70, rotulo: 'AGENDA', valor: `${painel.pendencias} pend.` },
    { anel: 1, angulo: 250, rotulo: 'COMPETÊNCIAS', valor: String(painel.competencias) },
    { anel: 2, angulo: 140, rotulo: 'ESTÁCIO · LEITURA', valor: '2%' },
    { anel: 2, angulo: 320, rotulo: 'XP MOTIVACIONAL', valor: String(painel.xp) },
  ]
  const destinosPainel: Record<string, Page> = {
    'TEMPO REGISTRADO': 'Faculdade',
    'TAREFAS': 'Faculdade',
    'AGENDA': 'Faculdade',
    'COMPETÊNCIAS': 'Ascensão',
    'ESTÁCIO · LEITURA': 'Faculdade',
    'XP MOTIVACIONAL': 'Conquistas',
  }

  // GENESIS 5.3: valores derivados, sem alterar os registros.
  const limitar53 = (valor: number) =>
    Math.max(0, Math.min(100, Math.round(Number.isFinite(valor) ? valor : 0)))

  const energias53 = [
    ...trilhas.map(t => {
      const registradas = painel.porTrilha[t.id]
      const total = t.competencias.length
      return {
        id: t.id as string,
        titulo: t.titulo,
        percentual: limitar53(total ? registradas / total * 100 : 0),
        resumo: `${registradas} de ${total} competências registradas`,
        destino: 'Ascensão' as Page,
        cor: t.cor,
      }
    }),
    {
      id: 'agenda',
      titulo: 'Agenda e tarefas',
      percentual: limitar53(
        painel.tarefas ? painel.concluidas / painel.tarefas * 100 : 0
      ),
      resumo: `${painel.concluidas}/${painel.tarefas} tarefas · ${painel.pendencias} pendências`,
      destino: 'Faculdade' as Page,
      cor: '#b48cff',
    },
    {
      id: 'xp',
      titulo: 'XP motivacional',
      percentual: limitar53(pctXp),
      resumo: `${painel.xp} XP · nível ${painel.nivel} · faltam ${energiaRestante} XP`,
      destino: 'Conquistas' as Page,
      cor: '#c68aff',
    },
  ]

  const energiaSelecionada53 = energias53.find(e => e.id === energiaAberta53)
  const energiaMedia53 = limitar53(
    energias53.reduce((soma, e) => soma + e.percentual, 0) /
    energias53.length
  )
  const aneis = [{ r: 190, dur: 70 }, { r: 290, dur: 95 }, { r: 390, dur: 125 }]

  function escolher(id: Trilha) {
    onSelect(id)
    setMensagem(mensagemDoLion(painel, trilhas.find(t => t.id === id)))
  }

  return (
    <main
      className={`content reveal-scene gx-home genesis44-home ${
        painel.xp > 0 ? 'genesis44-return-burst' : ''
      }`}
    >
      <section className="gx-strip glass-surface" aria-label="Resumo da jornada">
        <div>
          <span className="eyebrow">GENESIS COMMAND</span>
          <h2>{saudacao}, Arnold.</h2>
          <p>
            {agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            <time dateTime={agora.toISOString()}>
              {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </time>
          </p>
        </div>
        <button type="button" className="gx-xp genesis497-energy" onClick={() => onNavigate('Conquistas')} aria-label={`Abrir evolução do nível ${painel.nivel}`}>
          <div className="gx-xp-head">
            <strong>NÍVEL {painel.nivel}</strong>
            <span>{painel.xp} / {painel.xpProximo} XP</span>
          </div>
          <div className="gx-bar"><i style={{ width: `${pctXp}%` }} /></div>
          <small>{energiaLion}% da faixa atual · {energiaRestante} XP restantes · {proximaForma ? `Próxima forma: ${proximaForma.nome}` : 'Evolução contínua'}</small>
        </button>
      </section>

      <div className="gx-layout">
        <aside className="gx-side">
          <section className="glass-surface gx-card">
            <span className="eyebrow">PRÓXIMO OBJETIVO</span>
            {painel.proxima ? (
              <>
                <h3>{painel.proxima.titulo}</h3>
                <p>{painel.proxima.disciplina} · {formatarData(painel.proxima.data)}</p>
              </>
            ) : (
              <>
                <h3>Defina o próximo passo</h3>
                <p>Cadastre uma atividade na agenda da Faculdade.</p>
              </>
            )}
            <button className="holo-btn" onClick={() => onNavigate('Faculdade')}>ABRIR FACULDADE ↗</button>
          </section>
          <section className="glass-surface gx-card">
            <span className="eyebrow">INDICADORES REAIS</span>
            <ul className="gx-metrics">
              <li><b>{formatarTempo(painel.minutos)}</b><span>estudo registrado</span></li>
              <li><b>{painel.concluidas}/{painel.tarefas}</b><span>tarefas concluídas</span></li>
              <li><b>{painel.competencias}</b><span>competências declaradas</span></li>
              <li><b>{painel.projetos}</b><span>projetos</span></li>
            </ul>
          </section>
        </aside>

        <section className="gx-stage glass-surface" aria-label="Mapa de evolução">
{/* GENESIS-60-ACERVO-ORIGINAL */}
<a
  href="/acervo-evolution-lab/index.html"
  target="_blank"
  rel="noopener noreferrer"
  className="genesis60-acervo-link"
  title="Abrir uma copia preservada do Evolution Lab original"
>
  ◈ ACERVO ORIGINAL
</a>
<NeuralUniverse painel={painel} onNavigate={onNavigate} />
          <NexusPipes3D
            progresso={[
              ...trilhas.map(t =>
                t.competencias.length
                  ? painel.porTrilha[t.id] /
                    t.competencias.length * 100
                  : 0
              ),
              painel.tarefas
                ? painel.concluidas / painel.tarefas * 100
                : 0,
              pctXp,
            ].join(',')}
          />
          <div
            className="gx-camera"
            style={{ '--cam-x': camera.x, '--cam-y': camera.y } as CSSProperties}
          >
            <svg className="gx-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {[[20, 24], [80, 24], [20, 76], [80, 76]].map(([x, y], i) => (
                <line key={i} x1="50" y1="50" x2={x} y2={y} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>

            <div
                className="gx-core genesis42-core"
                style={{
                  '--energy': `${energiaLion}%`,
                  '--intensity': intensidadeLion,
                } as CSSProperties}
              >
              <div className="gx-plane" aria-hidden="true">
                {aneis.map(anel => (
                  <div
                    key={anel.r}
                    className="gx-ring"
                    style={{ '--r': anel.r } as CSSProperties}
                  />
                ))}
                {paineis.map(p => (
                  <div
                    key={p.rotulo}
                    className="gx-arm"
                    style={{
                      '--r': aneis[p.anel].r,
                      '--dur': `${aneis[p.anel].dur}s`,
                      '--a': p.angulo,
                    } as CSSProperties}
                  >
                    <button type="button" className="gx-panel genesis497-panel" onClick={() => onNavigate(destinosPainel[p.rotulo])} aria-label={`Abrir ${p.rotulo}`}>
                      <div className="gx-panel-face">
                        <small>{p.rotulo}</small>
                        <b>{p.valor}</b>
                        <i /><i /><i />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="gx-lion"
                aria-label="Interagir com o Lion Core"
                onClick={() => {
                  setMensagem(mensagemDoLion(painel))
                  onLion()
                }}
              >
                <LionCrystal burst={burst} calm={calm} />
                <span className="genesis42-energy-ring" aria-hidden="true" />
                <span className="genesis42-energy-particles" aria-hidden="true">
                  <i /><i /><i /><i /><i /><i />
                </span>
              </button>
              <span className="gx-core-label">{faseLion.nome} · NÍVEL {painel.nivel}</span>
              {/* GENESIS-53-ENERGIA-VIVA */}
              <svg
                className="genesis53-circuits"
                viewBox="-250 -250 500 500"
                aria-hidden="true"
              >
                {energias53.map((energia, indice) => {
                  const raio = 155 + indice * 15
                  const comprimento = 2 * Math.PI * raio
                  return (
                    <g
                      key={energia.id}
                      transform={`rotate(${indice * 20 - 90})`}
                    >
                      <circle
                        r={raio}
                        className="genesis53-track"
                      />
                      <circle
                        r={raio}
                        className="genesis53-fill"
                        stroke={energia.cor}
                        strokeDasharray={comprimento}
                        strokeDashoffset={
                          comprimento * (1 - energia.percentual / 100)
                        }
                      />
                    </g>
                  )
                })}
              </svg>
              <div className="genesis53-orbs">
                {energias53.map((energia, indice) => (
                  <button
                    key={energia.id}
                    type="button"
                    className={`genesis53-orb genesis53-orb-${indice} ${
                      energiaAberta53 === energia.id ? 'active' : ''
                    }`}
                    style={{
                      '--energy-color': energia.cor,
                      '--energy-pct': `${energia.percentual}%`,
                    } as CSSProperties}
                    title={`${energia.titulo}: ${energia.percentual}%`}
                    aria-label={`Resumo de ${energia.titulo}, ${energia.percentual}%`}
                    aria-pressed={energiaAberta53 === energia.id}
                    onClick={() =>
                      setEnergiaAberta53(
                        energiaAberta53 === energia.id ? null : energia.id
                      )
                    }
                  >
                    <span>{indice + 1}</span>
                    <strong>{energia.percentual}%</strong>
                  </button>
                ))}
              </div>
              
            </div>

            <div className="gx-nodes">
              {trilhas.map(t => (
                <button
                  key={t.id}
                  className={`gx-node gx-node-${t.id} ${selecionado === t.id ? 'selected' : ''}`}
                  style={{ '--accent': t.cor } as CSSProperties}
                  aria-pressed={selecionado === t.id}
                  onClick={() => escolher(t.id)}
                >
                  <span className="gx-node-symbol">{t.simbolo}</span>
                  <span className="gx-node-copy">
                    <strong>{t.titulo}</strong>
                    <small>{painel.porTrilha[t.id]}/{t.competencias.length} competências</small>
                  </span>
                  <span className="gx-node-meter">
                    <i style={{ width: `${painel.porTrilha[t.id] / t.competencias.length * 100}%` }} />
                  </span>
                </button>
              ))}
            </div>
          </div>
          {energiaSelecionada53 && (
            <section className="genesis53-summary" aria-label="Resumo da energia">
              <div className="genesis53-summary-head">
                <div>
                  <span className="eyebrow">CIRCUITO DE ENERGIA</span>
                  <h3>{energiaSelecionada53.titulo}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEnergiaAberta53(null)}
                  aria-label="Fechar resumo"
                >×</button>
              </div>
              <div className="genesis53-summary-progress">
                <i style={{
                  width: `${energiaSelecionada53.percentual}%`,
                  background: energiaSelecionada53.cor
                }} />
              </div>
              <p>{energiaSelecionada53.resumo}</p>
              <small>
                Energia média dos seis circuitos: {energiaMedia53}%.
                O nível do Lion continua vinculado ao XP real.
              </small>
              <button
                type="button"
                className="holo-btn"
                onClick={() => onNavigate(energiaSelecionada53.destino)}
              >
                ABRIR DETALHES E HISTÓRICO ↗
              </button>
            </section>
          )}
          <p className="gx-lion-message" role="status">
            <span>✧</span> {mensagem}
          </p>
        </section>

        <aside className="gx-side">
          <section className="glass-surface gx-card gx-detail" style={{ '--accent': trilha.cor } as CSSProperties}>
            <span className="eyebrow">TRILHA SELECIONADA</span>
            <h3>{trilha.titulo}</h3>
            <p>{trilha.detalhe}</p>
            <div className="gx-bar"><i style={{ width: `${pctTrilha}%` }} /></div>
            <small>{feitas} de {trilha.competencias.length} competências registradas por você</small>
            {selecionado === 'faculdade' && (
              <small>Portal Estácio em 02/11/2026: 2% (leitura manual, não sincronizado).</small>
            )}
            <div className="gx-actions">
              <button className="holo-btn" onClick={() => onOpenTrilha(selecionado)}>ABRIR TRILHA</button>
              {selecionado === 'faculdade' && (
                <button className="holo-btn" onClick={() => onNavigate('Faculdade')}>FACULDADE</button>
              )}
            </div>
          </section>
          <section className="glass-surface gx-card">
            <span className="eyebrow">ACESSO RÁPIDO</span>
            <div className="gx-quick">
              <button onClick={() => onNavigate('Cursos')}>⌘ Cursos</button>
              <button onClick={() => onNavigate('Projetos')}>◇ Projetos</button>
              <button onClick={() => onNavigate('Biblioteca')}>▤ Biblioteca</button>
              <button onClick={() => onNavigate('Conquistas')}>✧ Conquistas</button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

function AscensaoPage({
  trilhaInicial, burst, calm, onCelebrar, onNavigate,
}: {
  trilhaInicial: Trilha
  burst: number
  calm: boolean
  onCelebrar: () => void
  onNavigate: (page: Page) => void
}) {
  const [ativa, setAtiva] = useState<Trilha>(trilhaInicial)
  const [declaradas, setDeclaradas] = useArmazenado<Declaradas>('evolution-ascensao-v1', {}, ehObjeto)
  const [aberta, setAberta] = useState<string | null>(null)
  const [evidencia, setEvidencia] = useState('')
  const [aviso, setAviso] = useState('')

  const trilha = trilhas.find(t => t.id === ativa)!
  const feitas = trilha.competencias.filter(c => declaradas[c.id]).length
  const total = trilha.competencias.length
  const pct = Math.round(feitas / total * 100)
  const estagio =
    feitas === 0 ? 'Semente' : feitas === total ? 'Trilha declarada completa'
      : feitas < total / 2 ? 'Iniciante' : 'Em evolução'

  const profundidade = (competencia: Competencia): number =>
    competencia.requisitos.length === 0
      ? 0
      : 1 + Math.max(...competencia.requisitos.map(id =>
          profundidade(trilha.competencias.find(c => c.id === id)!)))
  const camadas = trilha.competencias.reduce<Competencia[][]>((lista, c) => {
    const nivel = profundidade(c)
    lista[nivel] = [...(lista[nivel] ?? []), c]
    return lista
  }, [])

  function registrar(competencia: Competencia) {
    const texto = evidencia.trim()
    if (texto.length < 5) {
      setAviso('Descreva em pelo menos 5 caracteres o que você fez (exercício, projeto ou link).')
      return
    }
    setDeclaradas(atual => ({
      ...atual,
      [competencia.id]: { data: new Date().toISOString(), evidencia: texto },
    }))
    setAberta(null)
    setEvidencia('')
    setAviso('')
    onCelebrar()
  }

  function desfazer(id: string) {
    setDeclaradas(atual => {
      const resto = { ...atual }
      delete resto[id]
      return resto
    })
  }

  return (
    <main className="content reveal-scene asc-page" style={{ '--accent': trilha.cor } as CSSProperties}>
      <header className="glass-surface asc-head">
        <div>
          <span className="eyebrow">ÁRVORE DE ASCENSÃO</span>
          <h2>{trilha.titulo}</h2>
          <p>{trilha.detalhe}</p>
          <p className="asc-note">
            Cada competência é uma declaração sua, com registro do que você fez.
            Não é certificação e não altera notas ou progresso da faculdade.
          </p>
        </div>
        <div className="asc-orb-wrap">
          <div className="asc-lion"><LionCrystal burst={burst} calm={calm} /></div>
          <div className="asc-orb" style={{ '--fill': `${pct}%` } as CSSProperties}>
            <b>{pct}%</b>
            <small>{estagio}</small>
          </div>
        </div>
      </header>

      <div className="asc-tabs" role="tablist" aria-label="Trilhas">
        {trilhas.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={ativa === t.id}
            className={ativa === t.id ? 'selected' : ''}
            style={{ '--accent': t.cor } as CSSProperties}
            onClick={() => { setAtiva(t.id); setAberta(null); setAviso('') }}
          >
            <span>{t.simbolo}</span> {t.titulo}
          </button>
        ))}
      </div>

      <section className="asc-tree" aria-label={`Competências de ${trilha.titulo}`}>
        {camadas.map((camada, indice) => (
          <div className="asc-tier" key={indice}>
            <h3>CAMADA {indice + 1}</h3>
            {camada.map(c => {
              const registro = declaradas[c.id]
              const liberada = c.requisitos.every(id => declaradas[id])
              const estado = registro ? 'registrada' : liberada ? 'liberada' : 'bloqueada'
              const nomesRequisitos = c.requisitos
                .map(id => trilha.competencias.find(x => x.id === id)?.titulo)
                .join(', ')
              return (
                <article key={c.id} className={`asc-node ${estado}`}>
                  <div className="asc-node-top">
                    <strong>{c.titulo}</strong>
                    <span className="asc-badge">
                      {estado === 'registrada' ? 'REGISTRADA' : estado === 'liberada' ? 'LIBERADA' : 'BLOQUEADA'}
                    </span>
                  </div>
                  <p>{c.descricao}</p>
                  {c.requisitos.length > 0 && <small>Requer: {nomesRequisitos}</small>}
                  {registro && (
                    <>
                      <small>
                        Registrada em {new Date(registro.data).toLocaleDateString('pt-BR')}: {registro.evidencia}
                      </small>
                      <button className="ghost-btn" onClick={() => desfazer(c.id)}>Desfazer registro</button>
                    </>
                  )}
                  {estado === 'liberada' && aberta !== c.id && (
                    <button className="holo-btn" onClick={() => { setAberta(c.id); setEvidencia(''); setAviso('') }}>
                      REGISTRAR CONCLUSÃO
                    </button>
                  )}
                  {estado === 'liberada' && aberta === c.id && (
                    <form
                      className="asc-form"
                      onSubmit={event => { event.preventDefault(); registrar(c) }}
                    >
                      <label htmlFor={`evidencia-${c.id}`}>O que você fez para comprovar?</label>
                      <textarea
                        id={`evidencia-${c.id}`}
                        value={evidencia}
                        maxLength={300}
                        onChange={event => setEvidencia(event.target.value)}
                        autoFocus
                      />
                      {aviso && <small role="alert">{aviso}</small>}
                      <div className="gx-actions">
                        <button type="submit" className="holo-btn">SALVAR REGISTRO</button>
                        <button type="button" className="ghost-btn" onClick={() => setAberta(null)}>Cancelar</button>
                      </div>
                    </form>
                  )}
                </article>
              )
            })}
          </div>
        ))}
      </section>

      {ativa === 'faculdade' && (
        <section className="glass-surface asc-academic">
          <span className="eyebrow">PROGRESSO ACADÊMICO · LEITURA DO PORTAL EM 02/11/2026</span>
          <p>Este bloco é separado das competências. Os valores foram lidos manualmente e não são sincronizados.</p>
          <ul>
            {disciplinasEstacio.map(d => (
              <li key={d.id}>
                <span>{d.nome}</span>
                <div className="gx-bar"><i style={{ width: `${d.progresso}%` }} /></div>
                <b>{d.progresso}%</b>
              </li>
            ))}
          </ul>
          <button className="holo-btn" onClick={() => onNavigate('Faculdade')}>ABRIR FACULDADE ↗</button>
        </section>
      )}
    </main>
  )
}

function ConquistasPage({ painel, onNavigate }: { painel: Painel; onNavigate: (page: Page) => void }) {
  const [declaradas] = useArmazenado<Declaradas>('evolution-ascensao-v1', {}, ehObjeto)
  const lista = trilhas.flatMap(t =>
    t.competencias.filter(c => declaradas[c.id]).map(c => ({ trilha: t, competencia: c, registro: declaradas[c.id] }))
  )
  const marcos = [
    { titulo: 'Primeira sessão de estudo', ok: painel.minutos > 0 },
    { titulo: 'Primeira tarefa concluída', ok: painel.concluidas > 0 },
    { titulo: 'Primeira competência registrada', ok: painel.competencias > 0 },
    { titulo: 'Primeiro item de curso concluído', ok: painel.itensFeitos > 0 },
    { titulo: 'Primeiro projeto cadastrado', ok: painel.projetos > 0 },
    { titulo: 'Primeiro material na biblioteca', ok: painel.materiais > 0 },
    { titulo: '10 horas de estudo registradas', ok: painel.minutos >= 600 },
  ]

  return (
    <main className="content reveal-scene cnq-page">
      <header className="glass-surface asc-head">
        <div>
          <span className="eyebrow">CONQUISTAS</span>
          <h2>Cada avanço, no lugar certo.</h2>
          <p className="asc-note">
            Três registros separados: progresso acadêmico, competências declaradas e XP motivacional.
            Nenhum deles é certificação profissional.
          </p>
        </div>
      </header>

      <div className="cnq-grid">
        <section className="glass-surface gx-card">
          <span className="eyebrow">1 · PROGRESSO ACADÊMICO</span>
          <p>Leitura do portal em 02/11/2026, não sincronizada: 0 de 103 disciplinas concluídas, progresso do período em 2%.</p>
          <ul className="gx-metrics">
            <li><b>{painel.concluidas}/{painel.tarefas}</b><span>tarefas locais concluídas</span></li>
            <li><b>{formatarTempo(painel.minutos)}</b><span>estudo registrado</span></li>
            <li><b>{painel.pendencias}</b><span>itens pendentes na agenda</span></li>
          </ul>
          <button className="holo-btn" onClick={() => onNavigate('Faculdade')}>ABRIR FACULDADE ↗</button>
        </section>

        <section className="glass-surface gx-card">
          <span className="eyebrow">2 · COMPETÊNCIAS DECLARADAS</span>
          {lista.length === 0 ? (
            <p>Nenhuma competência registrada ainda. Registre na Árvore de Ascensão, com a evidência do que você fez.</p>
          ) : (
            <ul className="cnq-list">
              {lista.map(({ trilha, competencia, registro }) => (
                <li key={competencia.id}>
                  <strong>{competencia.titulo}</strong>
                  <small>{trilha.titulo} · {new Date(registro.data).toLocaleDateString('pt-BR')}</small>
                </li>
              ))}
            </ul>
          )}
          <button className="holo-btn" onClick={() => onNavigate('Ascensão')}>ABRIR ÁRVORE ↗</button>
        </section>

        <section className="glass-surface gx-card">
          <span className="eyebrow">3 · XP MOTIVACIONAL</span>
          <h3>Nível {painel.nivel} · {painel.xp} XP</h3>
          <div className="gx-bar">
            <i style={{ width: `${(painel.xp - painel.xpBase) / (painel.xpProximo - painel.xpBase) * 100}%` }} />
          </div>
          <small>Próximo nível em {painel.xpProximo} XP. O XP vem de tempo estudado, tarefas, itens de cursos, competências e projetos.</small>
          <ul className="cnq-list">
            {marcos.map(m => (
              <li key={m.titulo} className={m.ok ? 'earned' : ''}>
                <strong>{m.ok ? '✓' : '○'} {m.titulo}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

type ItemCurso = { id: string; titulo: string; tipo: 'Aula' | 'Atividade' | 'Exercício'; feito: boolean }
type ModuloCurso = { id: string; titulo: string; itens: ItemCurso[] }
type Curso = { id: string; titulo: string; plataforma: string; trilha: Trilha | 'hobby'; modulos: ModuloCurso[] }

function NovoTexto({
  rotulo, botao, onAdd, tipos,
}: {
  rotulo: string
  botao: string
  onAdd: (texto: string, tipo: string) => void
  tipos?: string[]
}) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState(tipos?.[0] ?? '')
  const id = useId()

  return (
    <form
      className="inline-form"
      onSubmit={event => {
        event.preventDefault()
        if (!texto.trim()) return
        onAdd(texto.trim(), tipo)
        setTexto('')
      }}
    >
      <label htmlFor={id} className="sr-only">{rotulo}</label>
      <input id={id} value={texto} maxLength={120} placeholder={rotulo} onChange={e => setTexto(e.target.value)} />
      {tipos && (
        <select aria-label="Tipo" value={tipo} onChange={e => setTipo(e.target.value)}>
          {tipos.map(t => <option key={t}>{t}</option>)}
        </select>
      )}
      <button type="submit" className="holo-btn">{botao}</button>
    </form>
  )
}

function CursosPage({ onCelebrar }: { onCelebrar: () => void }) {
  const [cursos, setCursos] = useArmazenado<Curso[]>('evolution-cursos-v1', [], ehLista)
  const [titulo, setTitulo] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [trilha, setTrilha] = useState<Trilha>('programacao')

  // GENESIS-497-CURSOS
  const [avisoLegado, setAvisoLegado] = useState('')

  function importarCursosLegados() {
    const formatoValido = legado.cursos.every(item =>
      typeof item.id === 'string' &&
      typeof item.titulo === 'string' &&
      typeof item.plataforma === 'string' &&
      ['faculdade','programacao','claude','design','hobby'].includes(item.trilha) &&
      Array.isArray(item.modulos) &&
      item.modulos.every(modulo =>
        typeof modulo.id === 'string' &&
        typeof modulo.titulo === 'string' &&
        Array.isArray(modulo.itens) &&
        modulo.itens.every(aula =>
          typeof aula.id === 'string' &&
          typeof aula.titulo === 'string' &&
          typeof aula.feito === 'boolean' &&
          ['Aula','Atividade','Exercício'].includes(aula.tipo)
        )
      )
    )

    if (!formatoValido) {
      setAvisoLegado('Formato incompatível. Nenhum curso importado.')
      return
    }

    const antigos = legado.cursos as unknown as Curso[]
    const ids = new Set(cursos.map(curso => curso.id))
    const novos = antigos.filter(curso => !ids.has(curso.id))

    if (!novos.length) {
      setAvisoLegado('Todos os cursos já estão cadastrados.')
      return
    }

    setCursos(atuais => {
      const existentes = new Set(atuais.map(curso => curso.id))
      const unicos = novos.filter(curso => !existentes.has(curso.id))
      return unicos.length ? [...atuais, ...unicos] : atuais
    })
    setAvisoLegado(`${novos.length} cursos importados. Dados existentes preservados.`)
  }
  function alterar(id: string, fn: (curso: Curso) => Curso) {
    setCursos(lista => lista.map(c => (c.id === id ? fn(c) : c)))
  }

  function adicionarCurso(event: React.FormEvent) {
    event.preventDefault()
    if (!titulo.trim()) return
    setCursos(lista => [
      ...lista,
      { id: novoId(), titulo: titulo.trim(), plataforma: plataforma.trim(), trilha, modulos: [] },
    ])
    setTitulo('')
    setPlataforma('')
  }

  return (
    <main className="content reveal-scene col-page">
      <header className="glass-surface asc-head">
        <div>
          <span className="eyebrow">CURSOS</span>
          <h2>Seus cursos reais, com progresso real.</h2>
          <p className="asc-note">Cadastre os cursos de Programação, Claude e Design com módulos, atividades e exercícios. Tudo fica salvo neste navegador.</p>
        </div>
      </header>

      <section className="glass-surface genesis497-import">
        <strong>ACERVO ORIGINAL — EVOLUTION LAB</strong>
        <p>Sete cursos disponíveis. A importação não substitui seus cursos atuais.</p>
        <button type="button" className="holo-btn" onClick={importarCursosLegados}>
          IMPORTAR CURSOS ANTIGOS
        </button>
        {avisoLegado && <p role="status">{avisoLegado}</p>}
      </section>
      {/* GENESIS-4910-HISTORICO */}
      <section className="glass-surface genesis4910-acervo">
        <div className="genesis4910-heading">
          <div>
            <span className="eyebrow">MEMÓRIA ACADÊMICA</span>
            <h3>Histórico do Evolution Lab original</h3>
            <p>
              Registros preservados para conferência.
              Nenhuma aula atual foi marcada automaticamente.
            </p>
          </div>
          <span className="genesis4910-tag">
            {legado.progresso.length} registros
          </span>
        </div>

        <div className="genesis4910-grid">
          {legado.progresso.map((registro, indice) => {
            const curso = legado.cursos.find(
              item => item.id === registro.curso
            )
            const modulo = curso?.modulos[registro.modulo]

            return (
              <article
                className="genesis4910-item"
                key={`${registro.curso}-${registro.modulo}-${indice}`}
              >
                <strong>{curso?.titulo ?? registro.curso}</strong>
                <span>
                  {modulo?.titulo ??
                    `Módulo antigo ${registro.modulo + 1}`}
                </span>
                <b>{registro.feitas} atividades registradas</b>
              </article>
            )
          })}
        </div>

        <p className="genesis4910-note">
          O arquivo antigo informa quantidades concluídas,
          mas não identifica todas as aulas individualmente.
          O progresso existente no Genesis permanece intacto.
        </p>
      </section>

      <section className="glass-surface genesis4910-acervo">
        <div className="genesis4910-heading">
          <div>
            <span className="eyebrow">BIBLIOTECA ORIGINAL</span>
            <h3>Materiais recuperados</h3>
          </div>
          <span className="genesis4910-tag">
            {legado.biblioteca.length} registros
          </span>
        </div>

        <div className="genesis4910-grid">
          {legado.biblioteca.map(livro => (
            <article className="genesis4910-item" key={livro.id}>
              <strong>{livro.titulo}</strong>
              <span>{livro.autor}</span>
              <span>{livro.tema}</span>
              <small>{livro.origem}</small>
            </article>
          ))}
        </div>
      </section>
      <form className="glass-surface col-form" onSubmit={adicionarCurso}>
        <label>Nome do curso
          <input value={titulo} maxLength={120} onChange={e => setTitulo(e.target.value)} />
        </label>
        <label>Plataforma ou instituição
          <input value={plataforma} maxLength={80} onChange={e => setPlataforma(e.target.value)} />
        </label>
        <label>Trilha
          <select value={trilha} onChange={e => setTrilha(e.target.value as Trilha)}>
            {trilhas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
          </select>
        </label>
        <button type="submit" className="holo-btn">CADASTRAR CURSO</button>
      </form>

      {cursos.length === 0 && (
        <p className="glass-surface gx-card">Nenhum curso cadastrado ainda.</p>
      )}

      {cursos.map(curso => {
        const itens = curso.modulos.flatMap(m => m.itens)
        const feitos = itens.filter(i => i.feito).length
        const pct = itens.length ? Math.round(feitos / itens.length * 100) : 0
        return (
          <section key={curso.id} className="glass-surface col-card">
            <div className="col-card-head">
              <div>
                <h3>{curso.titulo}</h3>
                <small>
                  {curso.trilha === 'hobby' ? 'Hobbies' : trilhas.find(t => t.id === curso.trilha)?.titulo}
                  {curso.plataforma && ` · ${curso.plataforma}`}
                </small>
              </div>
              <button
                className="ghost-btn"
                onClick={() => {
                  if (window.confirm(`Remover o curso "${curso.titulo}"?`)) {
                    setCursos(lista => lista.filter(c => c.id !== curso.id))
                  }
                }}
              >Remover</button>
            </div>
            <div className="gx-bar"><i style={{ width: `${pct}%` }} /></div>
            <small>{feitos} de {itens.length} itens concluídos ({pct}%)</small>
            <div className="genesis-course-summary">
              <span><strong>{curso.modulos.length}</strong> módulos</span>
              <span><strong>{itens.length}</strong> atividades e aulas</span>
              <span><strong>{feitos}</strong> concluídos</span>
              <span><strong>{pct}%</strong> progresso</span>
            </div>

            <div className="genesis42-course-tree">
              <div className="genesis42-tree-heading">
                <strong>ÁRVORE DE EVOLUÇÃO</strong>
                <small>{curso.titulo}</small>
              </div>
              {curso.modulos.length === 0 ? (
                <p>Adicione módulos para começar sua árvore.</p>
              ) : (
                <div className="genesis42-tree-nodes">
                  {curso.modulos.map((modulo, indice) => {
                    const totalItens = modulo.itens.length
                    const feitosModulo = modulo.itens.filter(
                      item => item.feito
                    ).length
                    const completo = totalItens > 0 &&
                      feitosModulo === totalItens
                    const andamento = feitosModulo > 0 && !completo

                    return (
                      <div
                        key={modulo.id}
                        className={`genesis42-tree-node ${
                          completo ? 'complete' :
                            andamento ? 'active' : 'waiting'
                        }`}
                      >
                        <span className="genesis42-node-orb">
                          {completo ? '✦' : String(indice + 1)}
                        </span>
                        <div>
                          <strong>{modulo.titulo}</strong>
                          <small>
                            {feitosModulo}/{totalItens} itens
                            {' · '}
                            {completo ? 'Concluído' :
                              andamento ? 'Em andamento' : 'Pendente'}
                          </small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {curso.modulos.map(modulo => (
              <div className="col-module" key={modulo.id}>
                <h4>{modulo.titulo}</h4>
                <ul>
                  {modulo.itens.map(item => (
                    <li key={item.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.feito}
                          onChange={() => {
                            if (!item.feito) onCelebrar()
                            alterar(curso.id, c => ({
                              ...c,
                              modulos: c.modulos.map(m => m.id === modulo.id
                                ? { ...m, itens: m.itens.map(i => i.id === item.id ? { ...i, feito: !i.feito } : i) }
                                : m),
                            }))
                          }}
                        />
                        <span>{item.titulo}</span> <small>{item.tipo}</small>
                      </label>
                    </li>
                  ))}
                </ul>
                <NovoTexto
                  rotulo="Novo item do módulo"
                  botao="ADICIONAR"
                  tipos={['Aula', 'Atividade', 'Exercício']}
                  onAdd={(texto, tipo) => alterar(curso.id, c => ({
                    ...c,
                    modulos: c.modulos.map(m => m.id === modulo.id
                      ? { ...m, itens: [...m.itens, { id: novoId(), titulo: texto, tipo: tipo as ItemCurso['tipo'], feito: false }] }
                      : m),
                  }))}
                />
              </div>
            ))}
            <NovoTexto
              rotulo="Novo módulo"
              botao="ADICIONAR MÓDULO"
              onAdd={texto => alterar(curso.id, c => ({
                ...c,
                modulos: [...c.modulos, { id: novoId(), titulo: texto, itens: [] }],
              }))}
            />
          </section>
        )
      })}
    </main>
  )
}

type CampoLocal = {
  nome: string
  rotulo: string
  tipo: 'texto' | 'url' | 'area' | 'opcoes'
  opcoes?: string[]
}
type RegistroLocal = Record<string, string> & { id: string }

function ColecaoLocal({
  chave, eyebrow, titulo, descricao, campos, principal, estado, vazio,
}: {
  chave: string
  eyebrow: string
  titulo: string
  descricao: string
  campos: CampoLocal[]
  principal: string
  estado: string
  vazio: string
}) {
  const [itens, setItens] = useArmazenado<RegistroLocal[]>(chave, [], ehLista)
  const [busca, setBusca] = useState('')
  const [rascunho, setRascunho] = useState<Record<string, string>>(() =>
    Object.fromEntries(campos.map(c => [c.nome, c.opcoes?.[0] ?? ''])))
  const [aviso, setAviso] = useState('')

  function adicionar(event: React.FormEvent) {
    event.preventDefault()
    if (!rascunho[principal]?.trim()) {
      setAviso('Preencha o campo principal.')
      return
    }
    const url = campos.find(c => c.tipo === 'url')
    if (url && rascunho[url.nome]?.trim() && !linkSeguro(rascunho[url.nome])) {
      setAviso('O link precisa começar com http:// ou https://.')
      return
    }
    setAviso('')
    setItens(lista => [...lista, { ...rascunho, id: novoId() } as RegistroLocal])
    setRascunho(Object.fromEntries(campos.map(c => [c.nome, c.opcoes?.[0] ?? ''])))
  }

  // GENESIS-4914-BIBLIOTECA
  function importarBibliotecaOriginal() {
    if (chave !== 'evolution-biblioteca-v1') return

    const existentes = new Set(
      itens.map(item => item.titulo.trim().toLocaleLowerCase('pt-BR'))
    )
    const ids = new Set(itens.map(item => item.id))

    const novos: RegistroLocal[] = []

    for (const livro of legado.biblioteca) {
      if (
        !livro.id ||
        !livro.titulo ||
        ids.has(livro.id) ||
        existentes.has(livro.titulo.trim().toLocaleLowerCase('pt-BR'))
      ) continue

      novos.push({
        id: livro.id,
        titulo: livro.titulo,
        tipo: 'Livro',
        link: '',
        notas: [
          livro.autor && `Autor: ${livro.autor}`,
          livro.tema && `Tema: ${livro.tema}`,
          livro.origem && `Origem: ${livro.origem}`,
        ].filter(Boolean).join(' | '),
        situacao: livro.status === 'concluido'
          ? 'Concluído'
          : livro.status === 'estudando'
            ? 'Estudando'
            : 'Para estudar',
      })

      ids.add(livro.id)
      existentes.add(livro.titulo.trim().toLocaleLowerCase('pt-BR'))
    }

    if (!novos.length) {
      setAviso('Os materiais antigos já estão cadastrados.')
      return
    }

    setItens(atuais => {
      const atuaisIds = new Set(atuais.map(item => item.id))
      const atuaisTitulos = new Set(
        atuais.map(item => item.titulo.trim().toLocaleLowerCase('pt-BR'))
      )
      const unicos = novos.filter(item =>
        !atuaisIds.has(item.id) &&
        !atuaisTitulos.has(item.titulo.trim().toLocaleLowerCase('pt-BR'))
      )
      return unicos.length ? [...atuais, ...unicos] : atuais
    })

    setAviso(
      `${novos.length} materiais preparados para inclusão. Confira a lista.`
    )
  }
  const filtrados = itens.filter(item =>
    Object.values(item).join(' ').toLowerCase().includes(busca.toLowerCase()))
  const campoEstado = campos.find(c => c.nome === estado)!

  return (
    <main className="content reveal-scene col-page">
      <header className="glass-surface asc-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{titulo}</h2>
          <p className="asc-note">{descricao}</p>
        </div>
      </header>

      <form className="glass-surface col-form" onSubmit={adicionar}>
        {campos.map(campo => (
          <label key={campo.nome} className={campo.tipo === 'area' ? 'wide' : ''}>
            {campo.rotulo}
            {campo.tipo === 'area' ? (
              <textarea value={rascunho[campo.nome] ?? ''} maxLength={400}
                onChange={e => setRascunho(r => ({ ...r, [campo.nome]: e.target.value }))} />
            ) : campo.tipo === 'opcoes' ? (
              <select value={rascunho[campo.nome] ?? ''}
                onChange={e => setRascunho(r => ({ ...r, [campo.nome]: e.target.value }))}>
                {campo.opcoes!.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input value={rascunho[campo.nome] ?? ''} maxLength={200}
                inputMode={campo.tipo === 'url' ? 'url' : undefined}
                onChange={e => setRascunho(r => ({ ...r, [campo.nome]: e.target.value }))} />
            )}
          </label>
        ))}
        {aviso && <small role="alert" className="wide">{aviso}</small>}
        <button type="submit" className="holo-btn">ADICIONAR</button>
      </form>

      {chave === 'evolution-biblioteca-v1' && (
        <section className="glass-surface genesis4914-import">
          <div>
            <strong>ACERVO ORIGINAL — EVOLUTION LAB</strong>
            <p>
              Dois materiais antigos disponíveis.
              Seus materiais atuais serão preservados.
            </p>
          </div>
          <button
            type="button"
            className="holo-btn"
            onClick={importarBibliotecaOriginal}
          >
            IMPORTAR MATERIAIS ANTIGOS
          </button>
        </section>
      )}

      <div className="glass-surface col-search">
        <label>Buscar
          <input type="search" value={busca} onChange={e => setBusca(e.target.value)} />
        </label>
        <small>{filtrados.length} de {itens.length} registros</small>
      </div>

      {itens.length === 0 && <p className="glass-surface gx-card">{vazio}</p>}

      <div className="col-list">
        {filtrados.map(item => {
          const link = linkSeguro(item.link ?? '')
          return (
            <article key={item.id} className="glass-surface col-card">
              <div className="col-card-head">
                <h3>{item[principal]}</h3>
                <button
                  className="ghost-btn"
                  onClick={() => {
                    if (window.confirm(`Remover "${item[principal]}"?`)) {
                      setItens(lista => lista.filter(x => x.id !== item.id))
                    }
                  }}
                >Remover</button>
              </div>
              {campos.filter(c => c.nome !== principal && c.nome !== estado && c.tipo !== 'url' && item[c.nome]).map(c => (
                <p key={c.nome}><small>{c.rotulo}:</small> {item[c.nome]}</p>
              ))}
              {link && <a href={link} target="_blank" rel="noopener noreferrer">Abrir link ↗</a>}
              <label>{campoEstado.rotulo}
                <select
                  value={item[estado]}
                  onChange={e => setItens(lista => lista.map(x => x.id === item.id ? { ...x, [estado]: e.target.value } : x))}
                >
                  {campoEstado.opcoes!.map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
            </article>
          )
        })}
      </div>
    </main>
  )
}

function exportarDados() {
  const dados: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i)
    // GENESIS-PACOTE-CONSOLIDADO-01
    if (chave && [
      'evolution-agenda-v2',
      'evolution-plano-v2',
      'evolution-faculdade-tarefas-v1',
      'evolution-faculdade-sessoes-v1',
      'evolution-cursos-v1',
      'evolution-projetos-v1',
      'evolution-biblioteca-v1',
      'evolution-ascensao-v1',
      'evolution-config-v1',
    ].includes(chave)) {
      const valor = localStorage.getItem(chave)
      if (valor !== null) dados[chave] = valor
    }
  }
  const conteudo = JSON.stringify(
    { app: 'evolution-lab-next', versao: 1, exportadoEm: new Date().toISOString(), dados },
    null, 2
  )
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `evolution-lab-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return Object.keys(dados).length
}

async function importarDados(arquivo: File): Promise<string> {
  if (arquivo.size > 2_000_000) {
    return 'Arquivo grande demais (limite de 2 MB).'
  }

  let leitura: unknown
  try {
    leitura = JSON.parse(await arquivo.text())
  } catch {
    return 'Arquivo invalido: nao foi possivel ler o JSON.'
  }

  const objeto = (valor: unknown): valor is Record<string, unknown> =>
    typeof valor === 'object' && valor !== null && !Array.isArray(valor)

  if (!objeto(leitura) ||
      leitura.app !== 'evolution-lab-next' ||
      leitura.versao !== 1 ||
      !objeto(leitura.dados)) {
    return 'Formato ou versao de backup nao reconhecido.'
  }

  const tipos: Record<string, 'array' | 'object' | 'week'> = {
    'evolution-agenda-v2': 'array',
    'evolution-plano-v2': 'week',
    'evolution-faculdade-tarefas-v1': 'array',
    'evolution-faculdade-sessoes-v1': 'array',
    'evolution-cursos-v1': 'array',
    'evolution-projetos-v1': 'array',
    'evolution-biblioteca-v1': 'array',
    'evolution-ascensao-v1': 'object',
    'evolution-config-v1': 'object',
  }

  const entradas = Object.entries(leitura.dados)
  if (!entradas.length) return 'Backup sem registros.'

  const validas: [string, string][] = []
  let ignoradas = 0

  for (const [chave, valor] of entradas) {
    const tipo = Object.prototype.hasOwnProperty.call(tipos, chave)
      ? tipos[chave] : undefined

    if (!tipo) {
      ignoradas++
      continue
    }

    if (typeof valor !== 'string') {
      return `Valor invalido no backup: ${chave}`
    }

    let dado: unknown
    try {
      dado = JSON.parse(valor)
    } catch {
      return `JSON interno invalido: ${chave}`
    }

    const valido = tipo === 'array'
      ? Array.isArray(dado) && dado.every(objeto)
      : tipo === 'week'
        ? Array.isArray(dado) && dado.length === 7 &&
          dado.every(n => typeof n === 'number' &&
            Number.isFinite(n) && n >= 0 && n <= 480)
        : objeto(dado)

    if (!valido) {
      return `Estrutura invalida em ${chave}. Nenhum dado foi importado.`
    }

    // Validacoes adicionais de estruturas utilizadas pela interface.
    if (chave === 'evolution-cursos-v1' &&
        Array.isArray(dado) &&
        !dado.every(c =>
          Array.isArray(c.modulos) &&
          c.modulos.every((m: unknown) =>
            objeto(m) && Array.isArray(m.itens)))) {
      return 'Estrutura de cursos invalida.'
    }

    if (chave === 'evolution-config-v1' &&
        (!objeto(dado) ||
          typeof dado.efeitos !== 'boolean' ||
          typeof dado.movimento !== 'boolean' ||
          typeof dado.som !== 'boolean')) {
      return 'Configuracoes invalidas no backup.'
    }

    validas.push([chave, valor])
  }

  if (validas.length === 0) {
    return 'Nenhum registro reconhecido. Nada foi alterado.'
  }

  if (!window.confirm(
    `Restaurar ${validas.length} conjuntos de dados? ` +
    (ignoradas > 0
      ? `${ignoradas} chave(s) desconhecida(s) serao ignoradas. `
      : '') +
    'Os registros atuais com as mesmas chaves serao substituidos. ' +
    'Exporte um backup antes de continuar.'
  )) {
    return 'Importacao cancelada.'
  }

  const anteriores = new Map<string, string | null>()

  try {
    // Guardar todos os valores antes da primeira gravacao.
    for (const [chave] of validas) {
      anteriores.set(chave, localStorage.getItem(chave))
    }

    for (const [chave, valor] of validas) {
      localStorage.setItem(chave, valor)
    }
  } catch {
    let restauracaoFalhou = false

    for (const [chave, valor] of anteriores) {
      try {
        if (valor === null) {
          localStorage.removeItem(chave)
        } else {
          localStorage.setItem(chave, valor)
        }
      } catch {
        restauracaoFalhou = true
      }
    }

    return restauracaoFalhou
      ? 'ERRO CRITICO: a recuperacao foi incompleta. Nao altere mais dados; preserve seus backups.'
      : 'Falha na importacao. Os valores anteriores foram restaurados.'
  }

  window.setTimeout(() => window.location.reload(), 600)
  return `${validas.length} conjuntos restaurados; ${ignoradas} extras ignorados. Recarregando...`
}

const equipeTechnoPro = [
  { nome: 'DENNER', funcao: 'Arquiteto de Sistemas',
    descricao: 'Estrutura, integracoes e seguranca.' },
  { nome: 'FERNANDO', funcao: 'Designer UI/UX',
    descricao: 'Interface, efeitos, alinhamentos e mobile.' },
  { nome: 'MARKIN', funcao: 'Engenheiro de Codigo',
    descricao: 'Programacao, componentes e manutencao.' },
  { nome: 'DEOCLÉRIO', funcao: 'Auditor de Qualidade',
    descricao: 'Testes, problemas e validacoes.' },
  { nome: 'FELIPE', funcao: 'Gestor de Projetos',
    descricao: 'Prioridades, planejamento e entregas.' },
  { nome: 'LÓLÓ', funcao: 'Professor de Programacao',
    descricao: 'Ensino, exercicios e aprendizado.' },
  { nome: 'RENATO', funcao: 'Especialista em Automacao',
    descricao: 'PowerShell, processos e automacoes.' },
]

/* GENESIS-45-PROMPTS */

const instrucoesAgentes: Record<string, string> = {
  DENNER: 'Analise arquitetura, estrutura de sistemas, seguranca, dados, integrações, escalabilidade e manutenção.',
  FERNANDO: 'Avalie design UI/UX, hierarquia, identidade visual, efeitos, acessibilidade, alinhamento e responsividade.',
  MARKIN: 'Revise React, TypeScript, componentes, estados, validacoes, desempenho e qualidade do codigo.',
  'DEOCLÉRIO': 'Identifique falhas, regressões, riscos, problemas de armazenamento, seguranca e testes ausentes.',
  FELIPE: 'Organize escopo, requisitos, prioridades, dependencias, criterios de aceite e entregas.',
  'LÓLÓ': 'Ensine programacao, explique conceitos, prepare exercicios e avalie a aprendizagem do estudante.',
  RENATO: 'Analise PowerShell, scripts, integracoes, automacoes, verificacoes e formas seguras de executar processos.'
}

function criarPromptAgente(
  agente: (typeof equipeTechnoPro)[number]
): string {
  const especialidade =
    instrucoesAgentes[agente.nome] ?? agente.descricao

  return [
    `# ${agente.nome} - ${agente.funcao}`,
    '',
    'Voce e um especialista da Equipe Techno Pro.',
    '',
    '## Identidade',
    `Nome: ${agente.nome}`,
    `Funcao: ${agente.funcao}`,
    `Responsabilidade: ${agente.descricao}`,
    '',
    '## Missao',
    especialidade,
    '',
    '## Regras de trabalho',
    '1. Atue apenas quando solicitado pelo usuario.',
    '2. Analise antes de recomendar qualquer alteracao.',
    '3. Preserve projetos, dados e interfaces aprovadas.',
    '4. Nao modifique arquivos sem autorizacao expressa.',
    '5. Nao execute instalacoes, commits, push ou publicacoes sem autorizacao.',
    '6. Separe fatos confirmados de sugestoes e hipoteses.',
    '7. Informe riscos, dependencias e criterios de teste.',
    '8. Evite consumo desnecessario de recursos e creditos.',
    '9. Nao afirme que executou ferramentas sem realmente executar.',
    '10. Entregue instrucoes claras para revisao e aprovacao.',
    '',
    '## Formato das respostas',
    '1. Diagnostico ou objetivo.',
    '2. Evidencias e problemas encontrados.',
    '3. Recomendacoes priorizadas.',
    '4. Riscos e cuidados.',
    '5. Proposta de implementacao, sem executar.',
    '6. Testes e criterios de aceite.',
    '',
    '## Contexto de trabalho',
    'Projeto principal: Evolution Lab Next.',
    'Preserve o menu aprovado, o nucleo Lion e os dados academicos.',
    'O usuario autoriza as alteracoes antes da execucao.',
    '',
    '## Adaptacao a plataforma',
    'Use este texto como instrucoes do agente.',
    'Configure ferramentas e permissoes no Claude, Copilot',
    'ou outra plataforma conforme os recursos disponiveis.',
    'Este texto nao instala nem ativa um agente automaticamente.'
  ].join('\n')
}

function EquipePage() {
  const [mensagemCopia, setMensagemCopia] = useState('')

  async function copiarPrompt(nome: string, prompt: string) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Copia automatica indisponivel')
      }

      await navigator.clipboard.writeText(prompt)
      setMensagemCopia(`Prompt de ${nome} copiado.`)
    } catch {
      setMensagemCopia(
        'Nao foi possivel copiar automaticamente. Selecione o texto do campo e copie manualmente.'
      )
    }
  }

  return (
    <main className="content reveal-scene col-page">
      <header className="glass-surface asc-head">
        <div>
          <span className="eyebrow">EVOLUTION LAB NEXT</span>
          <h2>TECHNO PRO · NOSSA EQUIPE</h2>
          <p className="asc-note">
            Conheca os especialistas e consulte seus prompts de criacao
            para reutilizar no Copilot, Claude ou outras plataformas.
          </p>
          <p className="asc-note">
            Os prompts sao informativos e nao executam agentes automaticamente.
          </p>
        </div>
      </header>

      {mensagemCopia && (
        <p className="genesis45-copy-status glass-surface" role="status">
          {mensagemCopia}
        </p>
      )}

      <section className="genesis-team-grid">
        {equipeTechnoPro.map(agente => {
          const prompt = criarPromptAgente(agente)

          return (
            <article
              className="glass-surface genesis-team-card genesis45-agent"
              key={agente.nome}
            >
              <span className="eyebrow">EQUIPE TECHNO PRO</span>
              <h3>{agente.nome}</h3>
              <strong>{agente.funcao}</strong>
              <p>{agente.descricao}</p>

              <details className="genesis45-prompt-details">
                <summary className="genesis45-prompt-toggle">
                  <span>VER PROMPT DE CRIAÇÃO</span>
                  <span className="genesis45-chevron" aria-hidden="true">
                    ▾
                  </span>
                </summary>

                <div className="genesis45-prompt-content">
                  <p>
                    Prompt reutilizavel para configurar este
                    especialista em outra plataforma.
                  </p>

                  <label>
                    Instrucoes do agente
                    <textarea
                      readOnly
                      rows={15}
                      value={prompt}
                      onFocus={event => event.currentTarget.select()}
                      aria-label={`Prompt de ${agente.nome}`}
                    />
                  </label>

                  <button
                    type="button"
                    className="holo-btn genesis45-copy-button"
                    onClick={() => void copiarPrompt(agente.nome, prompt)}
                  >
                    COPIAR PROMPT
                  </button>
                </div>
              </details>
            </article>
          )
        })}
      </section>
    </main>
  )
}
function Brand() {
  return (
    <div className="brand">
      <span className="genesis498-brand">
  <img className="genesis497-logo" src={`${import.meta.env.BASE_URL}marca/logo-evolution-lab.svg`} alt="Evolution Lab" />
  
</span>
      <div className="brand-name">
        <strong>EVOLUTION LAB</strong>
        <span><b>NEXT</b> / sua evolução</span>
      </div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<Page>('Central')
  const [historicoPaginas, setHistoricoPaginas] = useState<Page[]>(['Central'])
  const [indiceHistorico, setIndiceHistorico] = useState(0)
  const [intro, setIntro] = useState(true)
  const [focus, setFocus] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [motion, setMotion] = useState({ x: 0, y: 0 })
  const [painel, setPainel] = useState(lerPainel)
  const [selecionada, setSelecionada] = useState<Trilha>('faculdade')
  const [trilhaAberta, setTrilhaAberta] = useState<Trilha>('faculdade')
  const [config, setConfig] = useArmazenado<Config>('evolution-config-v1', configPadrao, ehObjeto)
  const [burst, setBurst] = useState(0)
  const [painelAberto, setPainelAberto] = useState<'notificacoes' | 'config' | null>(null)
  const [mensagemDados, setMensagemDados] = useState('')

  const movimentoAtivo = config.movimento

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 2300)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!movimentoAtivo) return
    let frame = 0
    const move = (event: MouseEvent) => {
      if (frame) return
      const x = (event.clientX / window.innerWidth - .5) * 2
      const y = (event.clientY / window.innerHeight - .5) * 2
      frame = requestAnimationFrame(() => {
        setMotion({ x, y })
        frame = 0
      })
    }
    window.addEventListener('pointermove', move)
    return () => {
      window.removeEventListener('pointermove', move)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [movimentoAtivo])

  function navigate(destination: Page) {
    setPainel(lerPainel())
    if (destination !== page) {
      setHistoricoPaginas(atual =>
        [...atual.slice(0, indiceHistorico + 1), destination]
      )
      setIndiceHistorico(indiceHistorico + 1)
      setPage(destination)
    }
    setMenuOpen(false)
    setPainelAberto(null)
  }

  function moverHistorico(delta: number) {
    const indice = indiceHistorico + delta
    if (indice < 0 || indice >= historicoPaginas.length) return

    setIndiceHistorico(indice)
    setPage(historicoPaginas[indice])
    setPainel(lerPainel())
    setMenuOpen(false)
    setPainelAberto(null)
  }

  function celebrar() {
    setBurst(valor => valor + 1)
    if (config.som) tocarSom('conquista')
  }

  function abrirTrilha(trilha: Trilha) {
    setTrilhaAberta(trilha)
    navigate('Ascensão')
  }

  function alternar(chave: keyof Config) {
    setConfig(atual => ({ ...atual, [chave]: !atual[chave] }))
  }

  const sceneStyle = {
    '--pointer-x': (movimentoAtivo ? motion.x : 0).toFixed(3),
    '--pointer-y': (movimentoAtivo ? motion.y : 0).toFixed(3),
  } as CSSProperties

  const notificacoes: string[] = []
  if (painel.pendencias > 0) notificacoes.push(`${painel.pendencias} atividade(s) pendente(s) na agenda acadêmica.`)
  if (painel.tarefas - painel.concluidas > 0) notificacoes.push(`${painel.tarefas - painel.concluidas} tarefa(s) da Faculdade ainda abertas.`)
  if (painel.proxima) notificacoes.push(`Próximo: ${painel.proxima.titulo} (${formatarData(painel.proxima.data)}).`)

  return (
    <div
      className={`experience ${focus ? 'is-focus' : ''} ${config.efeitos ? '' : 'fx-off'} ${config.movimento ? '' : 'motion-off'}`}
      style={sceneStyle}
    >
      <div className="world" aria-hidden="true">
        <div className="world-nebula nebula-a" />
        <div className="world-nebula nebula-b" />
        <div className="world-orbit orbit-a" />
        <div className="world-orbit orbit-b" />
        <div className="world-floor" />
        <div className="world-stars" />
      </div>

      {intro && (
        <div className="intro-overlay">
          <div className="intro-scene">
            <div className="intro-symbol genesis497-intro genesis498-intro">
              <img src={`${import.meta.env.BASE_URL}marca/logo-evolution-lab.svg`} alt="Evolution Lab" />
              
            </div>
            <span className="eyebrow">SUA JORNADA ESTÁ COMEÇANDO</span>
            <h1>EVOLUTION LAB <b>NEXT</b></h1>
            <p>Conhecimento. Tecnologia. Evolução.</p>
            <div className="intro-progress"><span /></div>
            <button className="glass-button" onClick={() => setIntro(false)}>
              PULAR APRESENTAÇÃO
            </button>
          </div>
        </div>
      )}

      <aside className={`navigation ${menuOpen ? 'navigation-open' : ''}`}>
        <Brand />
        <p className="nav-caption">CENTRAL DE NAVEGAÇÃO</p>
        <nav aria-label="Navegação principal">
          {navigation.map(item => (
            <button
              key={item.name}
              className={`nav-button ${page === item.name ? 'selected' : ''}`}
              onClick={() => navigate(item.name)}
            >
              <span className="nav-symbol">{item.icon}</span>
              <span className="nav-copy">
                <strong>{item.name}</strong>
                <small>{item.detail}</small>
              </span>
              <span className="nav-chevron">›</span>
            </button>
          ))}
        </nav>
        <div className="nav-bottom glass-surface">
          <span className="eyebrow">LION SYSTEM</span>
          <p>Seu espaço de aprendizado e evolução.</p>
        </div>
      </aside>

      <nav className="genesis497-nav" aria-label="Navegação rápida">
        <button type="button" onClick={() => navigate('Central')} aria-label="Início" title="Início">⌂</button>
        <button type="button" onClick={() => moverHistorico(-1)} disabled={indiceHistorico === 0} aria-label="Voltar" title="Voltar">←</button>
        <button type="button" onClick={() => moverHistorico(1)} disabled={indiceHistorico >= historicoPaginas.length - 1} aria-label="Prosseguir" title="Prosseguir">→</button>
      </nav>
      <div className="main-area">
        <header className="toolbar glass-surface">
          <div className="toolbar-heading">
            <button
              className="glass-button menu-toggle"
              aria-label="Alternar menu"
              onClick={() => setMenuOpen(value => !value)}
            >☰</button>
            <div>
              <span className="eyebrow">EVOLUTION LAB NEXT / {page.toUpperCase()}</span>
              <h1>{page === 'Central' ? 'Sua central de evolução' : page}</h1>
            </div>
          </div>
          <div className="toolbar-actions">
            <button
              className="glass-button"
              aria-label={`Notificações (${notificacoes.length})`}
              aria-expanded={painelAberto === 'notificacoes'}
              onClick={() => {
                setPainel(lerPainel())
                setPainelAberto(v => (v === 'notificacoes' ? null : 'notificacoes'))
              }}
            >🔔 {notificacoes.length}</button>
            <button
              className="glass-button"
              aria-label="Configurações"
              aria-expanded={painelAberto === 'config'}
              onClick={() => setPainelAberto(v => (v === 'config' ? null : 'config'))}
            >⚙</button>
            <button className="glass-button" onClick={() => setFocus(value => !value)}>
              {focus ? 'SAIR DO FOCO' : 'MODO FOCO'}
            </button>
            <button className="glass-button" onClick={() => navigate('Faculdade')}>
              FACULDADE ↗
            </button>
          </div>
        </header>

        {painelAberto === 'notificacoes' && (
          <section className="floating-panel glass-surface" aria-label="Notificações">
            <span className="eyebrow">NOTIFICAÇÕES</span>
            {notificacoes.length === 0
              ? <p>Nada pendente nos seus registros.</p>
              : <ul>{notificacoes.map(n => <li key={n}>{n}</li>)}</ul>}
          </section>
        )}

        {painelAberto === 'config' && (
          <section className="floating-panel glass-surface" aria-label="Configurações">
            <span className="eyebrow">EFEITOS E DADOS</span>
            <label><input type="checkbox" checked={config.efeitos} onChange={() => alternar('efeitos')} /> Efeitos visuais (desligue para economizar bateria)</label>
            <label><input type="checkbox" checked={config.movimento} onChange={() => alternar('movimento')} /> Movimento e paralaxe</label>
            <label><input type="checkbox" checked={config.som} onChange={() => alternar('som')} /> Sons de conquista</label>
            <div className="gx-actions">
              <button
                className="holo-btn"
                onClick={() => setMensagemDados(`Backup exportado com ${exportarDados()} registros.`)}
              >EXPORTAR BACKUP</button>
              <label className="holo-btn file-btn">
                IMPORTAR BACKUP
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={async event => {
                    const arquivo = event.target.files?.[0]
                    event.target.value = ''
                    if (arquivo) setMensagemDados(await importarDados(arquivo))
                  }}
                />
              </label>
            </div>
            {mensagemDados && <small role="status">{mensagemDados}</small>}
          </section>
        )}

        {page === 'Central' ? (
          <GenesisHome
            key="central"
            painel={painel}
            selecionado={selecionada}
            onSelect={setSelecionada}
            onNavigate={navigate}
            onOpenTrilha={abrirTrilha}
            burst={burst}
            calm={!config.efeitos}
            onLion={celebrar}
          />
        ) : page === 'Faculdade' ? (
          <FacultyDashboard key="faculdade" onBack={() => navigate('Central')} />
        ) : page === 'Ascensão' ? (
          <AscensaoPage
            key={`ascensao-${trilhaAberta}`}
            trilhaInicial={trilhaAberta}
            burst={burst}
            calm={!config.efeitos}
            onCelebrar={celebrar}
            onNavigate={navigate}
          />
        ) : page === 'Cursos' ? (
          <CursosPage key="cursos" onCelebrar={celebrar} />
        ) : page === 'Equipe' ? (
          <EquipePage />
        ) : page === 'Projetos' ? (
          <ColecaoLocal
            key="projetos"
            chave="evolution-projetos-v1"
            eyebrow="PROJETOS"
            titulo="Transforme conhecimento em criação."
            descricao="Organize seus sites, aplicativos e experimentos, com status e links."
            principal="nome"
            estado="status"
            vazio="Nenhum projeto cadastrado ainda."
            campos={[
              { nome: 'nome', rotulo: 'Nome do projeto', tipo: 'texto' },
              { nome: 'tipo', rotulo: 'Tipo', tipo: 'opcoes', opcoes: ['Site', 'Aplicativo', 'Experimento'] },
              { nome: 'link', rotulo: 'Link (opcional)', tipo: 'url' },
              { nome: 'notas', rotulo: 'Notas', tipo: 'area' },
              { nome: 'status', rotulo: 'Status', tipo: 'opcoes', opcoes: ['Ideia', 'Em andamento', 'Concluído'] },
            ]}
          />
        ) : page === 'Biblioteca' ? (
          <ColecaoLocal
            key="biblioteca"
            chave="evolution-biblioteca-v1"
            eyebrow="BIBLIOTECA"
            titulo="Todo conhecimento em um lugar."
            descricao="Guarde livros, materiais, links e anotações, com busca e status de leitura."
            principal="titulo"
            estado="situacao"
            vazio="Nenhum material cadastrado ainda."
            campos={[
              { nome: 'titulo', rotulo: 'Título', tipo: 'texto' },
              { nome: 'tipo', rotulo: 'Tipo', tipo: 'opcoes', opcoes: ['Livro', 'Material', 'Link', 'Anotação'] },
              { nome: 'link', rotulo: 'Link (opcional)', tipo: 'url' },
              { nome: 'notas', rotulo: 'Anotações', tipo: 'area' },
              { nome: 'situacao', rotulo: 'Situação', tipo: 'opcoes', opcoes: ['Para estudar', 'Estudando', 'Concluído'] },
            ]}
          />
        ) : (
          <ConquistasPage key="conquistas" painel={painel} onNavigate={navigate} />
        )}
      </div>
    </div>
  )
}

export default App