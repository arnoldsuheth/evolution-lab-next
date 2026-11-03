import { useMemo, useState } from 'react'

// GENESIS-63-MOTOR-ACADEMICO
// Leitura dos dados reais, sem gerar XP nem modificar historicos.

type Item = {
  id: string
  titulo: string
  tipo: 'Aula' | 'Atividade' | 'Exercício'
  feito: boolean
}

type Modulo = {
  id: string
  titulo: string
  itens: Item[]
}

type Curso = {
  id: string
  titulo: string
  plataforma: string
  trilha: string
  modulos: Modulo[]
}

type Resumo = {
  curso: Curso
  total: number
  feitos: number
  progresso: number
}

function percent(feitos: number, total: number) {
  return total > 0
    ? Math.round((feitos / total) * 100)
    : 0
}

function tituloTrilha(trilha: string) {
  const nomes: Record<string, string> = {
    faculdade: 'Faculdade',
    programacao: 'Programação',
    claude: 'Claude e IA',
    design: 'Design',
    hobby: 'Hobbies',
  }

  return nomes[trilha] ?? trilha
}

function contarConcluidos(valor: unknown): number {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    return 0
  }

  return Object.values(valor).filter(item => {
    if (!item || typeof item !== 'object') return false

    return (item as Record<string, unknown>).done === true
  }).length
}

function memoriaOriginal() {
  try {
    const texto = localStorage.getItem(
      'genesis-memoria-original-v1'
    )

    if (!texto) return null

    const dados: unknown = JSON.parse(texto)

    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
      return null
    }

    const registro = dados as Record<string, unknown>

    return {
      claude: contarConcluidos(registro.claude),
      programacao: contarConcluidos(registro.prog),
      eventos: Array.isArray(registro.log)
        ? registro.log.length
        : 0,
    }
  } catch {
    return null
  }
}

export default function AcademicReactor({
  cursos,
}: {
  cursos: Curso[]
}) {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [memoria, setMemoria] = useState(memoriaOriginal)

  const resumos = useMemo<Resumo[]>(() => {
    return cursos.map(curso => {
      const itens = curso.modulos.flatMap(m => m.itens)
      const feitos = itens.filter(i => i.feito).length

      return {
        curso,
        total: itens.length,
        feitos,
        progresso: percent(feitos, itens.length),
      }
    })
  }, [cursos])

  const totais = useMemo(() => {
    const itens = resumos.reduce(
      (soma, r) => soma + r.total, 0
    )

    const feitos = resumos.reduce(
      (soma, r) => soma + r.feitos, 0
    )

    return {
      cursos: resumos.length,
      modulos: cursos.reduce(
        (soma, c) => soma + c.modulos.length, 0
      ),
      itens,
      feitos,
      progresso: percent(feitos, itens),
    }
  }, [cursos, resumos])

  const visiveis = resumos.filter(r => {
    const area = filtro === 'todos' ||
      r.curso.trilha === filtro

    const termo = busca.trim().toLocaleLowerCase('pt-BR')

    const nome = r.curso.titulo.toLocaleLowerCase('pt-BR')
    const modulos = r.curso.modulos.some(m =>
      m.titulo.toLocaleLowerCase('pt-BR').includes(termo)
    )

    return area && (!termo || nome.includes(termo) || modulos)
  })

  return (
    <section
      className="glass-surface genesis63-reactor"
      aria-label="Motor educacional unificado"
    >
      <div className="genesis63-heading">
        <div>
          <span className="eyebrow">
            GENESIS 6.3 · MOTOR EDUCACIONAL
          </span>

          <h2>Seu universo de aprendizado</h2>

          <p>
            Cursos, módulos, aulas e progresso em uma única
            central, utilizando os registros reais do Genesis.
          </p>
        </div>

        <span className="genesis63-status">
          ◈ SISTEMA NEURAL
        </span>
      </div>

      <div className="genesis63-metrics">
        {[
          ['Cursos', totais.cursos],
          ['Módulos', totais.modulos],
          ['Aulas e atividades', totais.itens],
          ['Concluídas', totais.feitos],
        ].map(([rotulo, valor]) => (
          <div className="genesis63-metric" key={rotulo}>
            <small>{rotulo}</small>
            <strong>{valor}</strong>
          </div>
        ))}
      </div>

      <div className="genesis63-global">
        <div className="genesis63-row">
          <span>Progresso geral do catálogo</span>
          <strong>{totais.progresso}%</strong>
        </div>

        <div
          className="genesis63-bar"
          role="progressbar"
          aria-label="Progresso dos cursos"
          aria-valuenow={totais.progresso}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${totais.progresso}%` }} />
        </div>

        <small>
          {totais.feitos} de {totais.itens} aulas e atividades
          concluídas. Progresso sem recompensas duplicadas.
        </small>
      </div>

      <div className="genesis63-tools">
        <label>
          <span>Localizar curso ou módulo</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Ex.: HTML, Photoshop, Claude..."
          />
        </label>

        <label>
          <span>Área de conhecimento</span>
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          >
            <option value="todos">Todas as áreas</option>
            <option value="faculdade">Faculdade</option>
            <option value="programacao">Programação</option>
            <option value="claude">Claude e IA</option>
            <option value="design">Design</option>
            <option value="hobby">Hobbies</option>
          </select>
        </label>
      </div>

      <div className="genesis63-courses">
        {visiveis.map(({ curso, total, feitos, progresso }) => (
          <details
            key={curso.id}
            className="genesis63-course"
          >
            <summary>
              <span className="genesis63-course-icon">
                {curso.trilha === 'faculdade' ? '🎓'
                  : curso.trilha === 'programacao' ? '⌘'
                  : curso.trilha === 'claude' ? '✧'
                  : curso.trilha === 'design' ? '◇'
                  : '✦'}
              </span>

              <span className="genesis63-course-name">
                <strong>{curso.titulo}</strong>
                <small>
                  {tituloTrilha(curso.trilha)}
                  {' · '}
                  {curso.modulos.length} módulos
                </small>
              </span>

              <span className="genesis63-course-progress">
                {progresso}%
              </span>
            </summary>

            <div className="genesis63-course-body">
              <div className="genesis63-row">
                <small>{feitos}/{total} concluídos</small>
                <small>{curso.plataforma}</small>
              </div>

              <div className="genesis63-bar">
                <span style={{ width: `${progresso}%` }} />
              </div>

              {curso.modulos.map((modulo, indice) => {
                const concluidos = modulo.itens.filter(
                  i => i.feito
                ).length

                const completo =
                  modulo.itens.length > 0 &&
                  concluidos === modulo.itens.length

                return (
                  <div
                    className="genesis63-module"
                    key={modulo.id}
                  >
                    <div className="genesis63-module-orb">
                      {completo ? '✦' : indice + 1}
                    </div>

                    <div className="genesis63-module-content">
                      <strong>{modulo.titulo}</strong>

                      <small>
                        {concluidos}/{modulo.itens.length}
                        {' atividades'}
                      </small>
                    </div>

                    <span className={
                      completo
                        ? 'genesis63-done'
                        : 'genesis63-pending'
                    }>
                      {completo ? 'CONCLUÍDO' : 'EM EVOLUÇÃO'}
                    </span>
                  </div>
                )
              })}

              <a
                className="genesis63-open"
                href={`#genesis-curso-${curso.id}`}
              >
                ABRIR CURSO COMPLETO
              </a>
            </div>
          </details>
        ))}

        {visiveis.length === 0 && (
          <p>Nenhum curso encontrado nesse filtro.</p>
        )}
      </div>

      <div className="genesis63-memory">
        <div>
          <strong>Memória acadêmica original</strong>
          <p>
            O histórico importado do Evolution Lab antigo
            continua separado das conclusões atuais.
          </p>
        </div>

        {memoria ? (
          <div className="genesis63-memory-stats">
            <span>Claude: {memoria.claude} conclusões</span>
            <span>Programação: {memoria.programacao} conclusões</span>
            <span>Eventos antigos: {memoria.eventos}</span>
          </div>
        ) : (
          <small>
            Ainda não foi encontrada uma memória privada
            importada neste navegador.
          </small>
        )}

        <button
          type="button"
          className="genesis63-refresh"
          onClick={() => setMemoria(memoriaOriginal())}
        >
          ATUALIZAR LEITURA DA MEMÓRIA
        </button>
      </div>
    </section>
  )
}