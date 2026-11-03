
import { useState } from 'react'
import './App.css'

const cursos = [
  { nome: 'Ciência da Computação', detalhe: 'Faculdade · Prioridade', progresso: 42 },
  { nome: 'Desenvolvimento Full Stack', detalhe: 'Trilha profissional', progresso: 28 },
  { nome: 'Inteligência Artificial', detalhe: 'Especialização', progresso: 12 },
]

function App() {
  const [pagina, setPagina] = useState('Visão geral')
  const [xp, setXp] = useState(1250)

  const menu = ['Visão geral', 'Faculdade', 'Cursos', 'Biblioteca', 'Meus projetos']

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">EVOLUTION <span>LAB NEXT</span></div>
        <div className="nav-label">CENTRAL DE EVOLUÇÃO</div>

        <nav>
          {menu.map(item => (
            <button
              key={item}
              className={pagina === item ? 'active' : ''}
              onClick={() => setPagina(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>◆ LION SYSTEM</span>
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

        <section className="hero">
          <div>
            <span className="eyebrow">SEU PRÓXIMO NÍVEL COMEÇA AGORA</span>
            <h2>Construa seu futuro, um passo de cada vez.</h2>
            <p>Faculdade, tecnologia, projetos e conquistas em um único lugar.</p>
            <button className="primary" onClick={() => setPagina('Faculdade')}>
              Continuar estudando →
            </button>
          </div>
          <div className="crystal">◆</div>
        </section>

        <section className="stats">
          <div className="panel"><small>EXPERIÊNCIA</small><strong>{xp} XP</strong><span>Nível 07</span></div>
          <div className="panel"><small>CURSOS ATIVOS</small><strong>03</strong><span>Trilhas de aprendizado</span></div>
          <div className="panel"><small>MISSÕES DO DIA</small><strong>0 / 3</strong><span>Continue sua jornada</span></div>
        </section>

        <div className="section-heading">
          <h3>Minha jornada de aprendizado</h3>
          <span>Seu progresso</span>
        </div>

        <section className="courses">
          {cursos.map(curso => (
            <div className="course panel" key={curso.nome}>
              <small>{curso.detalhe}</small>
              <h3>{curso.nome}</h3>
              <div className="progress"><div style={{ width: `${curso.progresso}%` }} /></div>
              <div className="progress-label">{curso.progresso}% concluído</div>
            </div>
          ))}
        </section>

        <section className="mission panel">
          <div>
            <small>MISSÃO EXPERIMENTAL</small>
            <h3>Registrar uma sessão de estudos</h3>
            <p>Teste o sistema de recompensas da Nexus Academy.</p>
          </div>
          <button className="primary" onClick={() => setXp(valor => valor + 25)}>
            +25 XP
          </button>
        </section>
      </main>
    </div>
  )
}

export default App
