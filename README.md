# LION’S CAVE RPG PROGRAMADOR

## 1.5.0 · Identidades da Aurora

RPG individual 3D em desenvolvimento. Cinco raças, nove classes, personagens novos com roupas remendadas e educação separada da aventura. Esta versão amplia sistemas; não representa um RPG profissional concluído.

### Conteúdo disponível

- **1.480 definições de itens**: 835 armaduras, 254 armas, 186 acessórios, 78 materiais, 67 consumíveis, 40 alimentos, seis companheiros, seis ferramentas e oito troféus. São famílias e variantes de progressão; não 1.480 modelos 3D exclusivos.
- 1.261 receitas com materiais e custo, compra/venda, mochila, busca, filtros e paginação. Ferramentas e troféus têm funções de acervo; nem todo objeto tem interação especializada.
- Equipamentos nas faixas 1, 5, 10 e a cada cinco níveis até 60, com nível mínimo, classe, slot e conflito de duas mãos. Peças antigas continuam permitidas; possuir equipamento de nível maior não permite usá-lo antes da hora.
- **135 habilidades**, três ramos e 15 nós por classe. Pontos por nível, pré-requisitos, ranks, passivas, MP/estamina, quatro atalhos ativos e recargas. Reespecialização gratuita. É uma base inicial de balanceamento.
- Combates progressivos até 60 com recursos, cura, proteção, controle, sangramento, recompensas, materiais e equipamentos. Encontros são uma arena tática simplificada, não um sistema completo de ação em tempo real.
- Criador com preview independente do mundo, câmera de distância fixa, sem zoom, rotação apenas horizontal e manual e painel de edição com rolagem separada. Seis estruturas de corpo, seis formatos de malha facial, narizes com pontas/pontes/inclinações diferentes e nomes nos seletores. Malhas procedurais suaves, silhuetas raciais, verde em degradê nos orcs e cinza azulado nos gnomos.
- Emblema original de leão/caverna/código, favicon, ícones de início de tela e manifesto. Sem service worker: não há promessa de funcionamento offline.

### História, missões secundárias e promoções

A aba Jornada organiza três caminhos. História principal: oito missões de código em ordem, com nível e pré-requisito; depois, 15 projetos de carreira também sequenciais, até IA e desenvolvimento de jogos. Os projetos têm revisão própria explícita e não dão uma certificação automática ou recompensa por apenas salvar texto.

Missões secundárias: um viajante do conhecimento aparece em uma de três localizações conforme o personagem. Trinta etapas em três cursos: Claude e IA, Claude Code e Claude Cowork, do básico ao projeto de maestria, exigem nível, atividade registrada e verificação de conceito. Evidências, conclusões e revisões permanecem após morte hardcore. Cada curso avança do básico ao projeto de maestria, com explicações e atividades. Não há certificação de domínio por avaliador externo nem execução das ferramentas Claude dentro do jogo.

Promoções: níveis 20, 40 e 60, com quatro acertos em cinco perguntas sorteadas. Aos 20, concluir as oito runas; aos 40, revisar os projetos até TypeScript; aos 60, revisar a trilha completa. Cada promoção concede +3 ATQ, +3 DEF e libera uma etapa avançada das habilidades. Títulos por classe estão em [PROGRESSION-1.5.md](PROGRESSION-1.5.md). Escolhas de classe e habilidades armazenadas permanecem; as habilidades avançadas passam a respeitar as promoções.

Três baús ocultos contêm relíquias exclusivas. Abertura exige proximidade, nível, conteúdo aprendido e uma pergunta sorteada entre assuntos já estudados. Uma recompensa por baú e personagem; não há XP repetível por abrir ou rever perguntas.

### Raças e classes

| Raça | Classes disponíveis |
| --- | --- |
| Humano | Mago, Profeta, Paladino, Hunter, Guerreiro, Hacker |
| Elfo | Hunter, Mago, Profeta, Hacker, Dualista |
| Anão | Paladino, Guerreiro, Hunter, Engenheiro |
| Orc | Shaman, Guerreiro |
| Gnomo (legado) | Hacker |

Raça e classe são escolhas independentes dentro desta matriz; a raça é preservada na migração e compartilhada pelo mundo e pelo criador. Profeta e Shaman oferecem cura própria e bônus temporários; não existe grupo de aliados ou multiplayer nesta versão. O Mago repetido na lista do Elfo foi consolidado em uma classe. Gnomo não foi removido porque personagens existentes precisam continuar válidos.

### Direção de arte escolhida

Fantasia semirrealista estilizada. As prévias conceituais aprovadas são uma referência artística; os modelos atuais continuam procedurais, sem GLB, rig esquelético, texturas de artista ou equivalência visual às imagens geradas. Acabamento profissional requer uma etapa dedicada de escultura, retopologia, UV, materiais e animação. Modelos e aparência são compartilhados pelo criador e pelo mundo.

### Executar e verificar

Node 22 ou superior. `npm ci`, `npm run dev`.

- `npm test`: regras, interpretador, missões, migrações, equipamento, receitas, habilidades, combate e legado.
- `npm run typecheck`
- `npm run lint -- --max-warnings=0`
- `GITHUB_PAGES=true npm run build`: exporta `out/` com basePath `/evolution-lab-next`.

### Controles

Clique/toque para caminhar e interagir. Botão direito arrastado gira a câmera; roda/pinça muda o zoom. Um arrasto no celular gira a câmera. WASD/setas e E são alternativas. No criador, arraste para girar; não existe giro automático. Configurações oferecem qualidade, escala, opacidade, exportação e recuperação.

### Apresentação, interface e campanha

Entrada com apresentação e perfil local, sem senha, servidor de contas ou sincronização. Não tratar essa tela como autenticação online. O nome do perfil e o salvamento continuam pertencendo ao navegador.

Itens têm ilustrações SVG por família, com nome e painel de atributos ao clicar; não são 1.480 artes exclusivas. As 135 habilidades têm ilustrações, nomes e parâmetros. Recursos do personagem e quatro atalhos ficam embaixo; minimapa no alto à direita. Missões principais usam ! disponível e ? pronta para entregar em amarelo; secundárias usam os mesmos sinais em azul-claro. Entrega ao NPC libera a próxima etapa, sem duplicar a recompensa da prática.

Seis tipos de criatura procedural (lobo, aranha, javali, golem, espectro e dragão), onze encontros definidos e cinco chefes: Brutamato, Granito, Oráculo Fragmentado, Aracna e Nullarion. Chefes têm níveis fixos 5, 15, 30, 45 e 60; encontros comuns escalam a partir de seu nível mínimo. Chefes e conteúdo educacional liberam regiões seguintes. O mestre final exige nível 60 e revisão do projeto final de jogos. Modelos são originais e procedurais; não GLBs artísticos ou combate de MMO.

### Salvamentos

A chave **`genesis-reborn-rpg-v3`** permanece. O envelope agora é versão **4**, com migração das versões anteriores. Antes do upgrade, o original é copiado para `genesis-reborn-rpg-v3-before-1.5.0`; o backup anterior `genesis-reborn-rpg-v3-before-lions-cave-1.3.1` também permanece. Há recuperação periódica e cópia antes de importar. Saves desconhecidos bloqueiam escrita. Itens desconhecidos, XP, ouro, aparência, educação, legado e inventário são conservados.

Itens incompatíveis ficam guardados e não concedem atributos. Talentos antigos continuam contados no orçamento de pontos e podem ser reespecializados. Builds de outras classes ficam lembradas, com bônus apenas da classe ativa. O novo limite de progressão é 60; saves antigos acima disso não são rebaixados.

O armazenamento pertence ao navegador e à origem. Não há conta nem sincronização automática. Exporte antes de mudar de aparelho/domínio. Nunca exclua saves para corrigir um erro.

Hardcore preserva educação e arquiva o personagem. Herança: 15% do XP próprio, teto 100, resgate único; XP herdado não gera nova herança. Importações preservam evidências existentes e resgates. Armazenamento local não é autoridade antifraude; não há ranking ou comércio multiplayer.

### Ensino e limites

Oito missões executáveis de JavaScript: variáveis, operações, decisões, laços, funções, arrays, objetos e depuração. Interpretador limitado, sem eval/Function ou APIs do navegador, com limites de operações, entrada, recursão e console. Biblioteca adicional: 15 capítulos com narrativa, explicação, exemplo, prática guiada, desafio e verificação, além de projetos com pré-requisitos e rubricas. Os projetos avançados dependem de execução no ambiente do estudante e revisão de evidências; não há certificação automática de curso profissional. HTML/CSS usa iframe sem scripts e CSP restritiva.

Companheiro Hunter tem representação e bônus, sem IA independente. NPCs têm respiração, orientação e rotina simplificada de Pip. Hora e luz seguem America/Sao_Paulo pelo relógio do aparelho. Combate e economia precisam de testes prolongados de balanceamento. Homologação de GPU, gestos, desempenho e acabamento em iPhone físico permanece necessária; o navegador de auditoria pode não oferecer WebGL.

### Mundo e expansão

A câmera do mundo agora usa projeção ortográfica e inclinação isométrica, mantendo rotação e zoom do mundo. Isso é separado da câmera fixa do criador. Árvores têm copas arredondadas e o terreno plano tem variação de cores sem desencontro com colisões. Houve ajustes de iluminação e legibilidade; ainda não há acabamento artístico profissional.

O mapa inicial mede aproximadamente 54 × 42 unidades, com quatro casas, vila, floresta e minas. Três mapas adicionais são acessados por portais: Ruínas das Funções, Fronteira dos Algoritmos e Coração do Código Perdido. São mapas finitos, carregados conforme a região atual. A área visual do chão é maior, mas não constitui um mundo explorável. O plano de expansão está em [SANDBOX-PLAN.md](SANDBOX-PLAN.md). Coleta livre, construção, economia dinâmica e um mundo contínuo e economia compartilhada **ainda são propostas**, não funcionalidades entregues nesta versão.

### Publicação

Produção: `interface-nexus`. O workflow exige testes, TypeScript, ESLint e build antes de publicar no GitHub Pages. Sem novos serviços pagos, chaves ou dependências de produção. Mudanças e publicação autorizadas pelo proprietário.
