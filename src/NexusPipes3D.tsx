import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// GENESIS-552-VIDRO-ARTICULAVEL
// Tubos segmentados, juntas 3D e fluido progressivo.
// O LionCrystal original permanece intacto.

type Particula = {
  mesh: THREE.Mesh
  curva: THREE.CatmullRomCurve3
  limite: number
  fase: number
}

type Ponto = {
  x: number
  y: number
}

type Geometria = {
  largura: number
  altura: number
  centro: Ponto
  raio: number
  origens: Array<Ponto | null>
}

const seletores = [
  '.gx-node-faculdade',
  '.gx-node-programacao',
  '.gx-node-claude',
  '.gx-node-design',
]

const orbitais = [
  'TEMPO REGISTRADO',
  'TAREFAS',
  'AGENDA',
  'COMPETÊNCIAS',
  'ESTÁCIO',
  'XP MOTIVACIONAL',
]

export default function NexusPipes3D({
  progresso,
}: {
  progresso: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const palco = host?.closest('.gx-stage')

    if (!host || !(palco instanceof HTMLElement)) return

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      })
    } catch {
      return
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    )
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const canvas = renderer.domElement
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)

    const cena = new THREE.Scene()
    cena.add(new THREE.AmbientLight(0x9ecaff, 2.1))

    const luz = new THREE.DirectionalLight(
      0xffffff, 2.8
    )
    luz.position.set(-180, 170, 280)
    cena.add(luz)

    const camera = new THREE.OrthographicCamera(
      -500, 500, 350, -350, 0.1, 1000
    )
    camera.position.z = 500

    const grupo = new THREE.Group()
    cena.add(grupo)

    const particulas: Particula[] = []

    const valores = progresso.split(',').map(valor =>
      Math.max(
        0,
        Math.min(1, (Number(valor) || 0) / 100)
      )
    )

    const media = valores.slice(0, 4).reduce(
      (total, valor) => total + valor, 0
    ) / 4

    const niveis = [
      valores[0] ?? 0,
      valores[1] ?? 0,
      valores[2] ?? 0,
      valores[3] ?? 0,
      0,
      valores[4] ?? 0,
      0,
      media,
      0,
      valores[5] ?? 0,
    ]

    const movimentoReduzido = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const vidroMaterial = new THREE.MeshPhongMaterial({
      color: 0x98daff,
      specular: 0xffffff,
      shininess: 145,
      transparent: true,
      opacity: 0.27,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const bordaMaterial = new THREE.MeshPhongMaterial({
      color: 0x9ccfff,
      specular: 0xffffff,
      shininess: 160,
      transparent: true,
      opacity: 0.67,
      depthWrite: false,
    })

    const juntaMaterial = new THREE.MeshStandardMaterial({
      color: 0x345b92,
      metalness: 0.8,
      roughness: 0.22,
      emissive: 0x113972,
      emissiveIntensity: 0.35,
    })

    const neonMaterial = new THREE.MeshPhongMaterial({
      color: 0xbc54ff,
      emissive: 0x8624eb,
      emissiveIntensity: 1.5,
      specular: 0xffeeff,
      shininess: 170,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    })

    const brilhoMaterial = new THREE.MeshBasicMaterial({
      color: 0xe7b3ff,
    })

    function limpar() {
      grupo.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
        }
      })
      grupo.clear()
      particulas.length = 0
    }

    function ponto3D(
      p: Ponto,
      largura: number,
      altura: number,
      z = 12
    ) {
      return new THREE.Vector3(
        p.x - largura / 2,
        altura / 2 - p.y,
        z
      )
    }

    // Encontra a borda do card, nao o seu centro.
    function borda(
      elemento: Element,
      alvo: Ponto,
      base: DOMRect
    ): Ponto | null {
      const rect = elemento.getBoundingClientRect()

      if (rect.width < 3 || rect.height < 3) return null

      const cx = rect.left + rect.width / 2 - base.left
      const cy = rect.top + rect.height / 2 - base.top

      const dx = alvo.x - cx
      const dy = alvo.y - cy

      const fator = Math.min(
        dx === 0 ? Infinity : rect.width / 2 / Math.abs(dx),
        dy === 0 ? Infinity : rect.height / 2 / Math.abs(dy)
      )

      const k = Math.min(fator, 1)

      return {
        x: cx + dx * k,
        y: cy + dy * k,
      }
    }

    function medir(): Geometria | null {
      if (!palco) return null

      const base = palco.getBoundingClientRect()
      const lion = palco.querySelector('.gx-lion')

      if (
        !lion ||
        base.width < 761 ||
        base.height < 250
      ) return null

      const cristal = lion.getBoundingClientRect()

      const centro = {
        x: cristal.left + cristal.width / 2 - base.left,
        y: cristal.top + cristal.height / 2 - base.top,
      }

      const paineis = Array.from(
        palco.querySelectorAll('.gx-panel-face')
      )

      const procurar = (nome: string) =>
        paineis.find(p =>
          p.textContent?.toUpperCase().includes(nome)
        ) ?? null

      const elementos = [
        ...seletores.map(s => palco.querySelector(s)),
        ...orbitais.map(procurar),
      ]

      return {
        largura: base.width,
        altura: base.height,
        centro,
        raio: Math.min(cristal.width, cristal.height) * 0.43,
        origens: elementos.map(el =>
          el ? borda(el, centro, base) : null
        ),
      }
    }

    function cilindro(
      inicio: THREE.Vector3,
      fim: THREE.Vector3,
      raio: number,
      material: THREE.Material
    ) {
      const direcao = new THREE.Vector3()
        .subVectors(fim, inicio)

      const comprimento = direcao.length()
      if (comprimento < 0.5) return

      const cilindro = new THREE.Mesh(
        new THREE.CylinderGeometry(
          raio, raio, comprimento, 12
        ),
        material
      )

      cilindro.position.copy(inicio).add(fim).multiplyScalar(0.5)
      cilindro.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direcao.normalize()
      )
      grupo.add(cilindro)
    }

    function junta(
      posicao: THREE.Vector3,
      raio = 8
    ) {
      const anel = new THREE.Mesh(
        new THREE.SphereGeometry(raio, 14, 10),
        juntaMaterial
      )
      anel.position.copy(posicao)
      grupo.add(anel)

      const visor = new THREE.Mesh(
        new THREE.SphereGeometry(raio * 0.65, 12, 8),
        vidroMaterial
      )
      visor.position.copy(posicao)
      grupo.add(visor)
    }

    function montarTubo(
      origem: Ponto,
      mapa: Geometria,
      indice: number
    ) {
      const { centro, raio, largura, altura } = mapa

      const dx = origem.x - centro.x
      const dy = origem.y - centro.y
      const distancia = Math.hypot(dx, dy)

      if (distancia <= raio + 12) return

      const ux = dx / distancia
      const uy = dy / distancia

      const final = {
        x: centro.x + ux * raio,
        y: centro.y + uy * raio,
      }

      // Segmentos articulados:
      // saida, primeiro cotovelo, trecho central,
      // segundo cotovelo e encaixe do cristal.
      const horizontal = Math.abs(dx) >= Math.abs(dy)
      const sinal = indice % 2 === 0 ? 1 : -1

      const afastamento = Math.min(42, distancia * 0.18)

      const cotovelo1: Ponto = horizontal
        ? { x: origem.x - ux * afastamento, y: origem.y }
        : { x: origem.x, y: origem.y - uy * afastamento }

      const meio: Ponto = {
        x: origem.x * 0.52 + final.x * 0.48,
        y: origem.y * 0.52 + final.y * 0.48,
      }

      const cotovelo2: Ponto = {
        x: final.x + ux * afastamento,
        y: final.y + uy * afastamento,
      }

      const pontos = [
        ponto3D(origem, largura, altura, 10),
        ponto3D(cotovelo1, largura, altura, 17),
        ponto3D(meio, largura, altura, 30 + indice),
        ponto3D(cotovelo2, largura, altura, 18),
        ponto3D(final, largura, altura, 10),
      ]

      // Curvatura leve somente nas articulacoes.
      const curva = new THREE.CatmullRomCurve3(
        pontos, false, 'centripetal', 0.3
      )

      // Vidro tridimensional em segmentos.
      for (let i = 0; i < 4; i++) {
        const segmento = new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              pontos[i],
              pontos[i].clone().lerp(pontos[i + 1], 0.5),
              pontos[i + 1],
            ]),
            20, 6.2, 12, false
          ),
          vidroMaterial
        )

        grupo.add(segmento)

        // Reflexos na parede do vidro.
        cilindro(
          pontos[i],
          pontos[i + 1],
          1,
          bordaMaterial
        )
      }

      // Juntas esfericas articuladas.
      junta(pontos[0], 9)
      junta(pontos[1], 8)
      junta(pontos[2], 8.5)
      junta(pontos[3], 8)
      junta(pontos[4], 10)

      // Anel de acoplamento ao cristal.
      const encaixe = new THREE.Mesh(
        new THREE.TorusGeometry(9, 2, 8, 18),
        bordaMaterial
      )
      encaixe.position.copy(pontos[4])
      encaixe.lookAt(pontos[3])
      grupo.add(encaixe)

      const nivel = niveis[indice] ?? 0
      if (nivel <= 0.001) return

      // O liquido percorre apenas o trecho
      // proporcional ao progresso real.
      const curvaLiquido = new THREE.CatmullRomCurve3(
        Array.from({ length: 28 }, (_, i) =>
          curva.getPoint((i / 27) * nivel)
        )
      )

      const fluido = new THREE.Mesh(
        new THREE.TubeGeometry(
          curvaLiquido, 60, 3.9, 10, false
        ),
        neonMaterial
      )

      grupo.add(fluido)

      for (let i = 0; i < 2; i++) {
        const particula = new THREE.Mesh(
          new THREE.SphereGeometry(2.7, 8, 8),
          brilhoMaterial
        )
        grupo.add(particula)
        particulas.push({
          mesh: particula,
          curva,
          limite: nivel,
          fase: i / 2 + sinal * 0.05,
        })
      }
    }

    function reconstruir(mapa: Geometria) {
      limpar()

      renderer.setSize(
        mapa.largura,
        mapa.altura,
        false
      )

      camera.left = -mapa.largura / 2
      camera.right = mapa.largura / 2
      camera.top = mapa.altura / 2
      camera.bottom = -mapa.altura / 2
      camera.updateProjectionMatrix()

      mapa.origens.forEach((origem, indice) => {
        if (origem) montarTubo(origem, mapa, indice)
      })
    }

    let quadro = 0
    let ultimaLeitura = 0
    let assinaturaAnterior = ''

    function animar(agora: number) {
      if (agora - ultimaLeitura > 100) {
        ultimaLeitura = agora

        const mapa = medir()

        if (mapa) {
          const assinatura = [
            mapa.largura,
            mapa.altura,
            mapa.centro.x,
            mapa.centro.y,
            ...mapa.origens.flatMap(p =>
              p ? [p.x, p.y] : [-1, -1]
            ),
          ].map(v => Math.round(v / 2)).join('|')

          if (assinatura !== assinaturaAnterior) {
            assinaturaAnterior = assinatura
            reconstruir(mapa)
          }
        } else if (assinaturaAnterior !== 'oculto') {
          assinaturaAnterior = 'oculto'
          limpar()
        }
      }

      const segundos = agora / 1000

      particulas.forEach(p => {
        const t = movimentoReduzido
          ? Math.max(0, p.fase) * p.limite
          : ((segundos * 0.13 + p.fase + 1) % 1) *
            p.limite

        p.mesh.position.copy(
          p.curva.getPoint(t)
        )
      })

      renderer.render(cena, camera)
      quadro = requestAnimationFrame(animar)
    }

    quadro = requestAnimationFrame(animar)

    return () => {
      cancelAnimationFrame(quadro)
      limpar()

      vidroMaterial.dispose()
      bordaMaterial.dispose()
      juntaMaterial.dispose()
      neonMaterial.dispose()
      brilhoMaterial.dispose()

      renderer.dispose()
      canvas.remove()
    }
  }, [progresso])

  return (
    <div
      ref={hostRef}
      className="genesis55-pipes"
      aria-hidden="true"
    />
  )
}