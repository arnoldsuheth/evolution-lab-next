import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// GENESIS-60-NEURAL-UNIVERSE
// Central 3D: cerebro, mundos orbitais e conexoes energeticas.
// Nenhum registro local e modificado por este componente.

type Pagina =
  | 'Central'
  | 'Faculdade'
  | 'Ascensão'
  | 'Cursos'
  | 'Biblioteca'
  | 'Projetos'
  | 'Conquistas'
  | 'Equipe'

type PainelNeural = {
  xp: number
  xpBase: number
  xpProximo: number
  porTrilha: {
    faculdade: number
    programacao: number
    claude: number
    design: number
  }
  projetos?: number
  projetosConcluidos?: number
  materiais?: number
}

type Mundo = {
  nome: string
  icone: string
  descricao: string
  destino: Pagina
  progresso: number
  valor: string
  cor: number
}

type Conexao = {
  tubos: THREE.Mesh[]
  fluidos: THREE.Mesh[]
  juntas: THREE.Mesh[]
}

const up = new THREE.Vector3(0, 1, 0)

function limitar(valor: number) {
  return Math.max(0, Math.min(1, valor))
}

function percentual(atual: number, total: number) {
  return total > 0 ? limitar(atual / total) : 0
}

function ajustarSegmento(
  mesh: THREE.Mesh,
  inicio: THREE.Vector3,
  fim: THREE.Vector3,
  fracao = 1
) {
  const delta = fim.clone().sub(inicio)
  const comprimento = delta.length()

  if (comprimento < 0.001 || fracao <= 0) {
    mesh.visible = false
    return
  }

  mesh.visible = true
  const comprimentoVisivel = comprimento * fracao
  const direcao = delta.normalize()

  mesh.position.copy(inicio).addScaledVector(
    direcao, comprimentoVisivel / 2
  )
  mesh.quaternion.setFromUnitVectors(up, direcao)
  mesh.scale.set(1, comprimentoVisivel, 1)
}

function criarMundo3D(
  cor: number,
  indice: number
): THREE.Group {
  const grupo = new THREE.Group()

  const plataforma = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.51, 0.075, 40),
    new THREE.MeshStandardMaterial({
      color: 0x0b1638,
      metalness: 0.83,
      roughness: 0.19,
      emissive: cor,
      emissiveIntensity: 0.13,
    })
  )
  grupo.add(plataforma)

  const aro = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.023, 8, 52),
    new THREE.MeshBasicMaterial({ color: cor })
  )
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.04
  grupo.add(aro)

  const domo = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhongMaterial({
      color: 0x77baff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      shininess: 130,
      depthWrite: false,
    })
  )
  domo.position.y = 0.08
  grupo.add(domo)

  const material = new THREE.MeshStandardMaterial({
    color: cor,
    metalness: 0.55,
    roughness: 0.2,
    emissive: cor,
    emissiveIntensity: 0.23,
  })

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.21, 0.035, 12),
    material
  )
  base.position.y = 0.09
  grupo.add(base)

  if (indice === 0) {
    // Faculdade: campus cibernetico.
    const predio = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.27, 0.24),
      material
    )
    predio.position.y = 0.25
    grupo.add(predio)

    const telhado = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.13, 4),
      material
    )
    telhado.rotation.y = Math.PI / 4
    telhado.position.y = 0.46
    grupo.add(telhado)
  } else if (indice === 1) {
    // Programacao: torres de dados.
    for (let i = 0; i < 4; i++) {
      const torre = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.095,
          0.2 + i * 0.065,
          0.095
        ),
        material
      )
      torre.position.set(
        -0.19 + i * 0.12,
        0.18 + i * 0.032,
        0
      )
      grupo.add(torre)
    }
  } else if (indice === 2) {
    // Inteligencia artificial: nucleo neural.
    const nucleo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.21, 2),
      material
    )
    nucleo.position.y = 0.3
    grupo.add(nucleo)
  } else if (indice === 3) {
    // Design: prisma criativo.
    const prisma = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26),
      material
    )
    prisma.position.y = 0.29
    grupo.add(prisma)
  } else if (indice === 4) {
    // Hobbies: planeta com anel.
    const planeta = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 20, 16),
      material
    )
    planeta.position.y = 0.29
    grupo.add(planeta)

    const anel = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.018, 6, 36),
      material
    )
    anel.position.y = 0.29
    anel.rotation.x = 0.5
    grupo.add(anel)
  } else if (indice === 5) {
    // Biblioteca: pilha de arquivos.
    for (let i = 0; i < 4; i++) {
      const livro = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.065, 0.23),
        material
      )
      livro.position.y = 0.17 + i * 0.076
      livro.rotation.y = i * 0.2
      grupo.add(livro)
    }
  } else if (indice === 6) {
    // Projetos: estruturas modulares.
    for (let i = 0; i < 3; i++) {
      const bloco = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.16,
          0.16 + i * 0.08,
          0.16
        ),
        material
      )
      bloco.position.set(
        (i - 1) * 0.17,
        0.19 + i * 0.04,
        0
      )
      grupo.add(bloco)
    }
  } else {
    // Conquistas: cristal de trofeu.
    const trofeu = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26),
      material
    )
    trofeu.position.y = 0.33
    grupo.add(trofeu)
  }

  const brilho = new THREE.PointLight(cor, 1.2, 2.3)
  brilho.position.y = 0.35
  grupo.add(brilho)

  return grupo
}

function criarCerebro(): {
  grupo: THREE.Group
  circuitos: THREE.MeshBasicMaterial[]
} {
  const grupo = new THREE.Group()
  const circuitos: THREE.MeshBasicMaterial[] = []

  const materia = new THREE.MeshPhysicalMaterial({
    color: 0x516a9e,
    metalness: 0.45,
    roughness: 0.24,
    clearcoat: 0.95,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.94,
    emissive: 0x17113f,
    emissiveIntensity: 0.3,
  })

  // Dois hemisferios biomecanicos.
  for (const lado of [-1, 1]) {
    const hemisferio = new THREE.Mesh(
      new THREE.SphereGeometry(1.06, 36, 28),
      materia
    )
    hemisferio.position.x = lado * 0.59
    hemisferio.scale.set(0.73, 0.88, 0.85)
    grupo.add(hemisferio)

    // Giros cerebrais: relevos independentes.
    for (let i = 0; i < 28; i++) {
      const a = i * 2.39996
      const y = -0.68 + (i % 14) / 13 * 1.36
      const lateral = 0.28 + Math.abs(Math.sin(a)) * 0.38
      const z = Math.cos(a) * 0.66

      const giro = new THREE.Mesh(
        new THREE.SphereGeometry(0.21, 13, 10),
        materia
      )
      giro.position.set(
        lado * (0.42 + lateral),
        y,
        z
      )
      giro.scale.set(0.9, 0.47, 1.35)
      giro.rotation.z = Math.sin(a) * 0.75
      grupo.add(giro)
    }
  }

  const materialEnergia = new THREE.MeshBasicMaterial({
    color: 0xba5cff,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  })
  circuitos.push(materialEnergia)

  // Fibras neurais de energia violeta.
  for (let i = 0; i < 26; i++) {
    const lado = i % 2 === 0 ? -1 : 1
    const a = i * 2.39996
    const y = Math.sin(a) * 0.72
    const z = Math.cos(a) * 0.67

    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lado * 0.1, y * 0.5, 0.77),
      new THREE.Vector3(lado * 0.42, y + 0.12, z),
      new THREE.Vector3(lado * 0.85, y * 0.8, z * 0.9),
      new THREE.Vector3(lado * 1.08, y * 0.5, z * 0.46),
    ])

    const filamento = new THREE.Mesh(
      new THREE.TubeGeometry(curva, 22, 0.014, 6, false),
      materialEnergia
    )
    grupo.add(filamento)
  }

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.78, 0.016, 8, 100),
    new THREE.MeshBasicMaterial({
      color: 0x3ddcff,
      transparent: true,
      opacity: 0.5,
    })
  )
  halo.rotation.x = 1.12
  grupo.add(halo)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.74, 0.94, 0.15, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0c153d,
      metalness: 0.9,
      roughness: 0.16,
      emissive: 0x7523d7,
      emissiveIntensity: 0.25,
    })
  )
  base.position.y = -1.48
  grupo.add(base)

  const aroBase = new THREE.Mesh(
    new THREE.TorusGeometry(0.77, 0.045, 12, 60),
    new THREE.MeshBasicMaterial({ color: 0x9855ff })
  )
  aroBase.rotation.x = Math.PI / 2
  aroBase.position.y = -1.38
  grupo.add(aroBase)

  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2
    const cabo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.64, 8),
      new THREE.MeshBasicMaterial({
        color: 0x6f41e9,
        transparent: true,
        opacity: 0.65,
      })
    )
    cabo.position.set(
      Math.cos(a) * 0.32,
      -1.06,
      Math.sin(a) * 0.32
    )
    grupo.add(cabo)
  }

  return { grupo, circuitos }
}

export default function NeuralUniverse({
  painel,
  onNavigate,
}: {
  painel: PainelNeural
  onNavigate: (pagina: Pagina) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const botoesRef = useRef<Array<HTMLButtonElement | null>>([])

  const mundos = useMemo<Mundo[]>(() => {
    const trilhas = painel.porTrilha
    const projetos = Number(painel.projetos ?? 0)
    const concluidos = Number(painel.projetosConcluidos ?? 0)

    return [
      {
        nome: 'Faculdade',
        icone: '🎓',
        descricao: 'Ciência da Computação',
        destino: 'Faculdade',
        progresso: percentual(trilhas.faculdade, 5),
        valor: `${trilhas.faculdade}/5 competências`,
        cor: 0x42d8ff,
      },
      {
        nome: 'Programação',
        icone: '⌘',
        descricao: 'Desenvolvimento',
        destino: 'Cursos',
        progresso: percentual(trilhas.programacao, 7),
        valor: `${trilhas.programacao}/7 competências`,
        cor: 0x32aaff,
      },
      {
        nome: 'Claude e IA',
        icone: '✧',
        descricao: 'Inteligência artificial',
        destino: 'Cursos',
        progresso: percentual(trilhas.claude, 5),
        valor: `${trilhas.claude}/5 competências`,
        cor: 0xa36aff,
      },
      {
        nome: 'Design',
        icone: '◇',
        descricao: 'Academia criativa',
        destino: 'Cursos',
        progresso: percentual(trilhas.design, 6),
        valor: `${trilhas.design}/6 competências`,
        cor: 0xee67ff,
      },
      {
        nome: 'Hobbies',
        icone: '✦',
        descricao: 'Interesses e criação',
        destino: 'Cursos',
        progresso: 0,
        valor: 'Explorar atividades',
        cor: 0x45dfb9,
      },
      {
        nome: 'Biblioteca',
        icone: '▣',
        descricao: 'Acervo de conhecimento',
        destino: 'Biblioteca',
        progresso: 0,
        valor: `${painel.materiais ?? 0} materiais`,
        cor: 0x56bbff,
      },
      {
        nome: 'Projetos',
        icone: '⬡',
        descricao: 'Sites e aplicativos',
        destino: 'Projetos',
        progresso: percentual(concluidos, projetos),
        valor: `${concluidos}/${projetos} projetos`,
        cor: 0x9d78ff,
      },
      {
        nome: 'Conquistas',
        icone: '★',
        descricao: 'Sua jornada',
        destino: 'Conquistas',
        progresso: 0,
        valor: 'Ver conquistas',
        cor: 0xffc77b,
      },
    ]
  }, [painel])

  const progressoGeral = useMemo(() => {
    const xpFaixa = Math.max(1, painel.xpProximo - painel.xpBase)
    const xpAtual = Math.max(0, painel.xp - painel.xpBase)
    const energiaXp = limitar(xpAtual / xpFaixa)

    const competencias = mundos.slice(0, 4).reduce(
      (soma, mundo) => soma + mundo.progresso, 0
    ) / 4

    return limitar(energiaXp * 0.5 + competencias * 0.5)
  }, [mundos, painel.xp, painel.xpBase, painel.xpProximo])

  useEffect(() => {
    const container = containerRef.current
    const canvasHost = canvasRef.current

    if (!container || !canvasHost) return

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      return
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    )
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    canvasHost.appendChild(renderer.domElement)

    const cena = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      38, 1, 0.1, 100
    )
    camera.position.set(0, 0.3, 16.8)
    camera.lookAt(0, 0, 0)

    cena.add(new THREE.AmbientLight(0x9dc6ff, 2.2))

    const luzPrincipal = new THREE.DirectionalLight(
      0x9fe5ff, 3.1
    )
    luzPrincipal.position.set(-5, 6, 10)
    cena.add(luzPrincipal)

    const luzRoxa = new THREE.PointLight(
      0xa441ff, 13, 12
    )
    luzRoxa.position.set(0, 0, 3)
    cena.add(luzRoxa)

    const { grupo: cerebro, circuitos } = criarCerebro()
    cena.add(cerebro)

    const plataformas = mundos.map((mundo, i) => {
      const grupo = criarMundo3D(mundo.cor, i)
      cena.add(grupo)
      return grupo
    })

    // Aneis da estacao espacial.
    const orbital = new THREE.Group()
    for (let i = 0; i < 3; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x9a51ff : 0x198de3,
        transparent: true,
        opacity: i === 1 ? 0.25 : 0.33,
        depthWrite: false,
      })
      const aro = new THREE.Mesh(
        new THREE.TorusGeometry(
          5.2 + i * 0.33,
          0.008,
          5,
          160
        ),
        material
      )
      aro.scale.y = 0.49
      aro.rotation.z = i * 0.07
      orbital.add(aro)
    }
    cena.add(orbital)

    const vidro = new THREE.MeshPhongMaterial({
      color: 0xb7eaff,
      transparent: true,
      opacity: 0.34,
      shininess: 145,
      specular: 0xffffff,
      depthWrite: false,
    })

    const neon = new THREE.MeshBasicMaterial({
      color: 0xba62ff,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    })

    const conexoes: Conexao[] = mundos.map(() => {
      const tubos: THREE.Mesh[] = []
      const fluidos: THREE.Mesh[] = []
      const juntas: THREE.Mesh[] = []

      for (let i = 0; i < 4; i++) {
        const tubo = new THREE.Mesh(
          new THREE.CylinderGeometry(0.048, 0.048, 1, 10),
          vidro
        )
        cena.add(tubo)
        tubos.push(tubo)

        const fluido = new THREE.Mesh(
          new THREE.CylinderGeometry(0.024, 0.024, 1, 8),
          neon
        )
        cena.add(fluido)
        fluidos.push(fluido)

        const junta = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 12, 10),
          vidro
        )
        cena.add(junta)
        juntas.push(junta)
      }

      return { tubos, fluidos, juntas }
    })

    const larguraInicial = container.clientWidth
    const alturaInicial = container.clientHeight

    function redimensionar() {
      if (!container) return
      const w = Math.max(1, container.clientWidth)
      const h = Math.max(1, container.clientHeight)

      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    const observer = new ResizeObserver(redimensionar)
    observer.observe(container)
    redimensionar()

    const reduzirMovimento = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const inicio = performance.now()
    let frame = 0
    let ativo = true

    const vetorProjetado = new THREE.Vector3()

    function animar(agora: number) {
      if (!ativo || !container) return

      const tempo = (agora - inicio) / 1000
      const movimento = reduzirMovimento ? 0 : tempo

      cerebro.rotation.y = Math.sin(movimento * 0.16) * 0.11
      cerebro.rotation.z = Math.sin(movimento * 0.24) * 0.025

      const pulso = 1 +
        Math.sin(movimento * 1.4) * (0.008 + progressoGeral * 0.013)

      cerebro.scale.setScalar(pulso)

      // Energia interna cresce com o progresso real.
      circuitos.forEach(material => {
        material.opacity = 0.12 + progressoGeral * 0.82
      })

      orbital.rotation.z = movimento * 0.014

      const largura = container.clientWidth || larguraInicial
      const altura = container.clientHeight || alturaInicial

      plataformas.forEach((plataforma, i) => {
        const angulo = i / mundos.length *
          Math.PI * 2 + movimento * 0.026

        const x = Math.cos(angulo) * 5.22
        const y = Math.sin(angulo) * 2.35
        const z = Math.sin(angulo) * 0.34

        plataforma.position.set(x, y, z)
        plataforma.rotation.y = -movimento * 0.1

        if (!reduzirMovimento) {
          plataforma.position.y += Math.sin(
            movimento * 0.7 + i
          ) * 0.055
        }

        const label = botoesRef.current[i]

        if (label) {
          vetorProjetado.copy(
            plataforma.position
          ).project(camera)

          const px = (vetorProjetado.x * 0.5 + 0.5) * largura
          const py = (-vetorProjetado.y * 0.5 + 0.5) * altura

          label.style.left = `${px}px`
          label.style.top = `${py - 41}px`
          label.style.zIndex = String(
            Math.round(20 + z * 10)
          )
        }

        const origem = plataforma.position.clone()
        const destino = new THREE.Vector3(
          Math.cos(angulo) * 1.12,
          Math.sin(angulo) * 0.60,
          0.35
        )

        const p1 = origem.clone().lerp(destino, 0.2)
        p1.z += 0.38

        const p2 = origem.clone().lerp(destino, 0.53)
        p2.z += 0.59

        const p3 = origem.clone().lerp(destino, 0.82)
        p3.z += 0.28

        const pontos = [
          origem,
          p1,
          p2,
          p3,
          destino,
        ]

        const conexao = conexoes[i]
        const preenchimento = mundos[i].progresso

        for (let j = 0; j < 4; j++) {
          ajustarSegmento(
            conexao.tubos[j],
            pontos[j],
            pontos[j + 1]
          )

          const preenchido = limitar(
            preenchimento * 4 - j
          )

          ajustarSegmento(
            conexao.fluidos[j],
            pontos[j],
            pontos[j + 1],
            preenchido
          )

          conexao.juntas[j].position.copy(
            pontos[j]
          )
        }
      })

      renderer.render(cena, camera)
      frame = requestAnimationFrame(animar)
    }

    frame = requestAnimationFrame(animar)

    return () => {
      ativo = false
      cancelAnimationFrame(frame)
      observer.disconnect()

      cena.traverse(objeto => {
        if (!(objeto instanceof THREE.Mesh)) return
        objeto.geometry.dispose()
      })

      const materiais = new Set<THREE.Material>()

      cena.traverse(objeto => {
        if (!(objeto instanceof THREE.Mesh)) return

        const lista = Array.isArray(objeto.material)
          ? objeto.material
          : [objeto.material]

        lista.forEach(material => materiais.add(material))
      })

      materiais.forEach(material => material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [mundos, progressoGeral])

  return (
    <div
      className="genesis60-universe"
      ref={containerRef}
    >
      <div
        className="genesis60-canvas"
        ref={canvasRef}
        aria-hidden="true"
      />

      <div className="genesis60-heading">
        <span>GENESIS 6.0 · NEURAL UNIVERSE</span>
        <strong>Seu universo de conhecimento</strong>
      </div>

      <div className="genesis60-brain-label">
        <span>NÚCLEO NEURAL</span>
        <strong>
          {Math.round(progressoGeral * 100)}%
        </strong>
        <small>Energia de evolução</small>
      </div>

      {mundos.map((mundo, i) => (
        <button
          type="button"
          key={mundo.nome}
          ref={elemento => {
            botoesRef.current[i] = elemento
          }}
          className="genesis60-mundo"
          onClick={() => onNavigate(mundo.destino)}
          title={`${mundo.nome}: ${mundo.descricao}`}
          style={{
            borderColor: `#${mundo.cor.toString(16).padStart(6, '0')}`,
          }}
        >
          <span className="genesis60-mundo-icone">
            {mundo.icone}
          </span>

          <span className="genesis60-mundo-texto">
            <strong>{mundo.nome}</strong>
            <small>{mundo.valor}</small>
          </span>

          <span className="genesis60-progresso">
            <span
              style={{
                width: `${mundo.progresso * 100}%`,
              }}
            />
          </span>
        </button>
      ))}

      <div className="genesis60-rodape">
        <span>
          ◈ O conhecimento alimenta seu núcleo.
        </span>
        <span>
          {painel.xp} XP acumulados
        </span>
      </div>
    </div>
  )
}