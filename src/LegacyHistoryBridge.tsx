import { useState } from 'react'

// GENESIS-62-MEMORIA-PRIVADA
// Dados guardados somente neste navegador.
// Nenhuma requisicao de rede e realizada.

const CHAVE = 'genesis-memoria-original-v1'

type Registro = Record<string, unknown>

function objeto(valor: unknown): Registro {
  return valor !== null &&
    typeof valor === 'object' &&
    !Array.isArray(valor)
    ? valor as Registro
    : {}
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : []
}

function contarConcluidos(valor: unknown): number {
  return Object.values(objeto(valor)).filter(
    item => objeto(item).done === true
  ).length
}

function ler() {
  try {
    const texto = localStorage.getItem(CHAVE)
    return texto ? JSON.parse(texto) as unknown : null
  } catch {
    return null
  }
}

function resumo(valor: unknown) {
  const dados = objeto(valor)
  const fac = objeto(dados.fac)
  const disciplinas = lista(fac.discs)

  const topicos = disciplinas.flatMap(
    d => lista(objeto(d).topicos)
  )

  const entregas = disciplinas.flatMap(
    d => lista(objeto(d).entregas)
  )

  return {
    claude: contarConcluidos(dados.claude),
    programacao: contarConcluidos(dados.prog),
    disciplinas: disciplinas.length,
    topicos: topicos.filter(
      t => objeto(t).ok === true
    ).length,
    entregas: entregas.filter(
      t => objeto(t).ok === true
    ).length,
    eventos: lista(dados.log).length,
    livros: lista(dados.livros).length,
  }
}

export default function LegacyHistoryBridge() {
  const [salvo, setSalvo] = useState<unknown>(ler)
  const [texto, setTexto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [detalhes, setDetalhes] = useState(false)

  const totais = resumo(salvo)

  function importar() {
    try {
      if (texto.length > 3000000) {
        throw new Error('Arquivo muito grande.')
      }

      const entrada: unknown = JSON.parse(texto)
      const dados = objeto(entrada)

      // O Evolution Lab original exporta S,
      // cujo formato inclui v, claude, prog e fac.
      if (
        dados.v !== 1 ||
        !('claude' in dados) ||
        !('prog' in dados) ||
        !('fac' in dados)
      ) {
        throw new Error(
          'Formato diferente do progresso original.'
        )
      }

      // Lista fechada de campos academicos.
      // Tokens, sessoes e credenciais nao sao importados.
      const permitidos = [
        'v',
        'updatedAt',
        'claude',
        'prog',
        'fac',
        'ext',
        'log',
        'missoes',
        'chefes',
        'desafios',
        'bonus',
        'reviews',
        'violao',
        'livros',
        'practice',
      ]

      const filtrado: Registro = {}

      for (const chave of permitidos) {
        if (chave in dados) filtrado[chave] = dados[chave]
      }

      localStorage.setItem(
        CHAVE,
        JSON.stringify(filtrado)
      )

      setSalvo(filtrado)
      setTexto('')
      setMensagem(
        'Memoria original importada neste navegador. ' +
        'Cursos e XP atuais nao foram alterados.'
      )
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : 'Nao foi possivel importar.'
      )
    }
  }

  function exportarCopia() {
    if (!salvo) return

    const blob = new Blob(
      [JSON.stringify(salvo, null, 2)],
      { type: 'application/json' }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'genesis-memoria-original.json'
    link.click()

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section
      className="glass-surface genesis4910-acervo"
      aria-label="Memoria academica privada"
    >
      <div className="genesis4910-heading">
        <div>
          <span className="eyebrow">
            GENESIS 6.2 · MEMÓRIA PRIVADA
          </span>
          <h3>Transferir progresso do Evolution Lab original</h3>
          <p>
            Importe o histórico antigo sem substituir
            suas aulas, cursos ou conquistas atuais.
          </p>
        </div>
      </div>

      <details>
        <summary>
          Como copiar o progresso antigo
        </summary>
        <p>
          Abra o Evolution Lab original no navegador
          onde você estudava. Entre na área de
          cópia de segurança e use
          "Copiar meu progresso".
          Depois cole o conteúdo abaixo.
        </p>
      </details>

      <label
        htmlFor="genesis62-importacao"
        style={{
          display: 'block',
          marginTop: 16,
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
        JSON do progresso original
      </label>

      <textarea
        id="genesis62-importacao"
        value={texto}
        onChange={event => setTexto(event.target.value)}
        rows={5}
        placeholder="Cole aqui o progresso copiado do Lab antigo..."
        style={{
          width: '100%',
          minHeight: 115,
          padding: 12,
          borderRadius: 12,
          background: '#09152b',
          color: '#e9f4ff',
          border: '1px solid #4567a3',
          resize: 'vertical',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 12,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          className="holo-btn"
          onClick={importar}
          disabled={!texto.trim()}
        >
          IMPORTAR MEMÓRIA ORIGINAL
        </button>

        {salvo && (
          <button
            type="button"
            className="holo-btn"
            onClick={exportarCopia}
          >
            EXPORTAR BACKUP PRIVADO
          </button>
        )}
      </div>

      {mensagem && (
        <p role="status">{mensagem}</p>
      )}

      {salvo ? (
        <>
          <div className="genesis4910-grid">
            {[
              ['Claude', totais.claude],
              ['Programação', totais.programacao],
              ['Disciplinas', totais.disciplinas],
              ['Tópicos concluídos', totais.topicos],
              ['Entregas concluídas', totais.entregas],
              ['Eventos de histórico', totais.eventos],
              ['Livros registrados', totais.livros],
            ].map(([rotulo, valor]) => (
              <article
                className="genesis4910-item"
                key={rotulo}
              >
                <strong>{rotulo}</strong>
                <b>{valor}</b>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="holo-btn"
            onClick={() => setDetalhes(v => !v)}
          >
            {detalhes
              ? 'OCULTAR DISCIPLINAS'
              : 'VER DISCIPLINAS ORIGINAIS'}
          </button>

          {detalhes && (
            <div className="genesis4910-grid">
              {lista(objeto(salvo).fac &&
                objeto(objeto(salvo).fac).discs
              ).map((item, indice) => {
                const d = objeto(item)

                return (
                  <article
                    className="genesis4910-item"
                    key={String(d.id ?? indice)}
                  >
                    <strong>
                      {String(d.nome ?? 'Disciplina')}
                    </strong>
                    <span>
                      {lista(d.topicos).filter(
                        x => objeto(x).ok === true
                      ).length}
                      {' tópicos concluídos'}
                    </span>
                  </article>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <p>
          Nenhum histórico privado importado ainda.
        </p>
      )}

      <small>
        Dados armazenados exclusivamente neste
        navegador. Não são enviados ao GitHub,
        nem somados automaticamente ao XP para
        evitar duplicações.
      </small>
    </section>
  )
}