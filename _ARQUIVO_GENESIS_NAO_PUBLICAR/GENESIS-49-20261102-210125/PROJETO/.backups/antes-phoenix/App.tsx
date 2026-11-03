import { useState } from 'react'
import './App.css'

const cursos = [
  { nome: 'Ciência da Computação', tipo: 'FACULDADE · PRIORIDADE', progresso: 42 },
  { nome: 'Desenvolvimento Full Stack', tipo: 'TRILHA PROFISSIONAL', progresso: 28 },
  { nome: 'Inteligência Artificial', tipo: 'ESPECIALIZAÇÃO', progresso: 12 },
]

const menu = [
  { nome: 'Visão geral', simbolo: '◈' },
  { nome: 'Faculdade', simbolo: '▣' },
  { nome: 'Cursos', simbolo: '◇' },
  { nome: 'Biblioteca', simbolo: '▤' },
  { nome: 'Meus projetos', simbolo: '⌘' },
]

const paginas: Record<string, string> = {
  'Faculdade': 'Sua graduação é a prioridade da sua jornada. Aqui ficarão disciplinas, atividades e cronograma.',
  'Cursos': 'Aqui organizaremos suas trilhas complementares, cursos livres e certificados.',
  'Biblioteca': 'Este espaço reunirá seus livros, materiais de estudo e referências.',
  'Meus projetos': 'Aqui você acompanhará os projetos, aplicativos e sites que desenvolve.',
}

function App() {
  const [pagina, setPagina] = useState('Visão geral')
  const [xp, setXp] = useState(1250)
  const [missaoFeita, setMissaoFeita] = useState(false)

  const concluirMissao = () => {
    if (missaoFeita) return
    setXp(valor => valor + 25)
    setMissaoFeita(true)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">EVOLUTION <span>LAB NEXT</span></div>
        <div className="nav-label">CENTRAL DE EVOLUÇÃO</div>

        <nav aria-label="Navegação principal">
          {menu.map(item => (
            <button
              key={item.nome}
              className={pagina === item.nome ? 'active' : ''}
              onClick={() => setPagina(item.nome)}
            >
              <span className="menu-icon">{item.simbolo}</span>
              {item.nome}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>◆ LION SYSTEM</strong>
          <p>Sua evolução começa aqui.</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <small>EVOLUTION LAB / {pagina.toUpperCase()}</small>
            <h1>{pagina}</h1>
          </div>
          <div className="level">NÍVEL 07 · {xp} XP</div>
        </header>

        {pagina === 'Visão geral' ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">SEU PRÓXIMO NÍVEL COMEÇA AGORA</span>
                <h2>Construa seu futuro, um passo de cada vez.</h2>
                <p>Faculdade, tecnologia, projetos e conquistas em um único lugar.</p>
                <button className="primary" onClick={() => setPagina('Faculdade')}>
                  Continuar estudando →
                </button>
              </div>
              <div className="crystal" aria-label="Símbolo provisório do Lion">◆</div>
            </section>

            <section className="stats">
              <div className="panel">
                <small>EXPERIÊNCIA</small>
                <strong>{xp} XP</strong>
                <span>Nível demonstrativo 07</span>
              </div>
              <div className="panel">
                <small>TRILHAS ATIVAS</small>
                <strong>03</strong>
                <span>Dados demonstrativos</span>
              </div>
              <div className="panel">
                <small>MISSÃO DO DIA</small>
                <strong>{missaoFeita ? '1 / 1' : '0 / 1'}</strong>
                <span>Registre sua evolução</span>
              </div>
            </section>

            <div className="section-heading">
              <h3>Minha jornada de aprendizado</h3>
              <span>Prévia de progresso</span>
            </div>

            <section className="courses">
              {cursos.map(curso => (
                <article className="course panel" key={curso.nome}>
                  <small>{curso.tipo}</small>
                  <h3>{curso.nome}</h3>
                  <div className="progress">
                    <div style={{ width: `${curso.progresso}%` }} />
                  </div>
                  <div className="progress-label">{curso.progresso}% demonstrativo</div>
                </article>
              ))}
            </section>

            <section className="mission panel">
              <div>
                <small>MISSÃO EXPERIMENTAL</small>
                <h3>Registrar uma sessão de estudos</h3>
                <p>Experimente o sistema de recompensas da Nexus Academy.</p>
              </div>
              <button
                className="primary"
                onClick={concluirMissao}
                disabled={missaoFeita}
              >
                {missaoFeita ? 'Missão concluída ✓' : 'Concluir +25 XP'}
              </button>
            </section>
          </>
        ) : (
          <section className="panel page-placeholder">
            <small>MÓDULO EM PREPARAÇÃO</small>
            <h2>{pagina}</h2>
            <p>{paginas[pagina]}</p>
            <button className="primary" onClick={() => setPagina('Visão geral')}>
              ← Voltar ao painel
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App