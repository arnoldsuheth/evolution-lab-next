import { useState } from 'react'

// GENESIS-70-ACADEMIA
// Recupera o aplicativo educacional original dentro do
// ambiente Genesis, mantendo os dois estados separados.

type Area = {
  id: string
  titulo: string
  detalhe: string
  rota: string
  simbolo: string
}

const areas: Area[] = [
  {
    id: 'hoje',
    titulo: 'Painel de estudo',
    detalhe: 'Quests, cronograma, constancia e acompanhamento',
    rota: 'hoje',
    simbolo: '◈',
  },
  {
    id: 'claude',
    titulo: 'Claude e IA',
    detalhe: 'Aulas, niveis, revisoes e avaliacoes',
    rota: 'claude',
    simbolo: '✧',
  },
  {
    id: 'prog',
    titulo: 'Programacao',
    detalhe: '71 aulas, pratica guiada e projetos',
    rota: 'prog',
    simbolo: '⌘',
  },
  {
    id: 'fac',
    titulo: 'Faculdade',
    detalhe: 'Disciplinas, notas e planejamento',
    rota: 'fac',
    simbolo: '▦',
  },
  {
    id: 'cursos',
    titulo: 'Todos os cursos',
    detalhe: 'Plataformas, modulos e aulas cadastradas',
    rota: 'cursos',
    simbolo: '◇',
  },
  {
    id: 'arena',
    titulo: 'Arena de desafios',
    detalhe: 'Fases, provas, estrelas e chefoes',
    rota: 'arena',
    simbolo: '⚔',
  },
  {
    id: 'trajetoria',
    titulo: 'Trajetoria RPG',
    detalhe: 'Patentes, medalhas, experiencia e historico',
    rota: 'trajetoria',
    simbolo: '△',
  },
  {
    id: 'presentes',
    titulo: 'Presentes',
    detalhe: 'Materiais educativos desbloqueaveis',
    rota: 'presentes',
    simbolo: '✦',
  },
  {
    id: 'livros',
    titulo: 'Biblioteca',
    detalhe: 'Leituras, favoritos e anotacoes',
    rota: 'livros',
    simbolo: '▤',
  },
  {
    id: 'violao',
    titulo: 'Violao',
    detalhe: 'Treinos, acordes e musicas',
    rota: 'violao',
    simbolo: '♫',
  },
  {
    id: 'perfil',
    titulo: 'Perfil e desempenho',
    detalhe: 'Boletim, resultados e configuracoes',
    rota: 'perfil',
    simbolo: '◎',
  },
]

const caminhoOriginal =
  `${import.meta.env.BASE_URL}acervo-evolution-lab/index.html`

export default function GenesisAcademy() {
  const [rota, setRota] = useState('hoje')
  const [aberto, setAberto] = useState(false)
  const [chave, setChave] = useState(0)

  function abrir(area: Area) {
    setRota(area.rota)
    setChave(v => v + 1)
    setAberto(true)
  }

  const url = `${caminhoOriginal}#${encodeURIComponent(rota)}`

  return (
    <main className="content reveal-scene genesis70">
      <header className="glass-surface genesis70-hero">
        <span className="eyebrow">
          GENESIS 7.0 · NUCLEO EDUCACIONAL
        </span>

        <h2>
          Academia <span>Evolution Lab</span>
        </h2>

        <p>
          A experiencia educacional que deu origem ao Genesis,
          recuperada dentro do nosso universo tecnologico.
          Aulas, desafios, arvores, recompensas e acompanhamento.
        </p>

        <div className="genesis70-status">
          <span>◉ ACERVO RECUPERADO</span>
          <span>◈ SISTEMA GENESIS PRESERVADO</span>
          <span>✧ NAVEGACAO INTEGRADA</span>
        </div>
      </header>

      <div className="genesis70-grid">
        {areas.map(area => (
          <button
            key={area.id}
            className={
              aberto && rota === area.rota
                ? 'genesis70-world active'
                : 'genesis70-world'
            }
            type="button"
            onClick={() => abrir(area)}
          >
            <span className="genesis70-orb">
              {area.simbolo}
            </span>

            <strong>{area.titulo}</strong>
            <small>{area.detalhe}</small>
            <span className="genesis70-open">
              EXPLORAR AREA
            </span>
          </button>
        ))}
      </div>

      <section className="glass-surface genesis70-deck">
        <div className="genesis70-deck-head">
          <div>
            <span className="eyebrow">
              MODULO DE ESTUDO
            </span>
            <h3>
              {aberto
                ? areas.find(a => a.rota === rota)?.titulo
                : 'Escolha seu proximo destino'}
            </h3>
            <p>
              {aberto
                ? 'O motor educacional original sera aberto abaixo.'
                : 'Selecione uma area acima para acessar os recursos.'}
            </p>
          </div>

          {aberto && (
            <div className="genesis70-actions">
              <button
                type="button"
                onClick={() => setAberto(false)}
              >
                RECOLHER
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                ABRIR EM TELA COMPLETA ↗
              </a>
            </div>
          )}
        </div>

        {aberto ? (
          <iframe
            key={chave}
            className="genesis70-frame"
            src={url}
            title="Academia Evolution Lab original"
            loading="lazy"
            referrerPolicy="same-origin"
          />
        ) : (
          <div className="genesis70-idle">
            <span>✧</span>
            <strong>ACADEMIA PRONTA PARA EXPLORACAO</strong>
            <small>
              Escolha uma area para iniciar.
            </small>
          </div>
        )}
      </section>

      <section className="glass-surface genesis70-info">
        <h3>Como os dois sistemas funcionam</h3>

        <p>
          O Genesis continua sendo o sistema principal,
          com seu Neural Universe, Faculdade, cursos
          e acompanhamento atual.
        </p>

        <p>
          A Academia recuperada disponibiliza a experiencia
          didatica antiga dentro do novo projeto.
          Seus registros permanecem separados ate uma
          reconciliacao segura, sem somar XP duas vezes.
        </p>

        <p>
          Como o historico original pode estar salvo em outro
          endereco do navegador, a Academia incorporada pode
          iniciar sem aquele historico. Nada sera apagado.
        </p>

        <a
          href="https://arnoldsuheth.github.io/evolution-lab/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Consultar Evolution Lab original (somente acesso) ↗
        </a>
      </section>
    </main>
  )
}