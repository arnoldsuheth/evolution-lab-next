# Lion’s Cave — diagnóstico visual e direção sandbox

## O que a imagem e o código mostram

O cenário tem quatro construções semelhantes, chão quase uniforme, vegetação repetida, NPCs concentrados na praça e pouca atividade. O jogador fica pequeno e a interface ocupa as bordas sem criar um objetivo de exploração além do próximo exercício. O catálogo grande é uma base de dados de progressão; não equivale a variedade artística ou a um mundo cheio de atividades.

A navegação aceita x entre -27 e 27 e z entre -28 e 14: cerca de 54 × 42 unidades, antes de descontar obstáculos e regiões bloqueadas. O chão renderizado mede 150 × 150; olhar além da vila não significa poder caminhar até lá. Esses são limites desta implementação, que podem crescer. A busca de caminhos atual usa uma grade e até 4.000 expansões; aumentar arbitrariamente o mapa exige rever navegação, carregamento e desempenho.

## Ajustes entregues na 1.5.0

Câmera ortográfica com inclinação isométrica no mundo, árvores com copas arredondadas, terreno com variação de cor, iluminação e textos/botões mais legíveis. Criador independente, sem zoom nem animação automática, com giro horizontal manual. Alterações geométricas de rostos e corpos, traços de nariz e matriz racial ampliada. Esses ajustes não substituem modelos e cenários produzidos por artistas.

## Campanha adicionada nesta entrega

Além do mapa inicial, há três mapas finitos acessados por portais, seis tipos de criaturas e cinco chefes com desbloqueio sequencial. A cena mantém somente os elementos da região ativa. Isso é uma campanha regional inicial; coleta, fabricação integrada ao cenário, construção e economia sandbox dinâmica continuam no plano abaixo. A interface agora tem apresentação/entrada local, inventário e habilidades ilustrados e HUD inferior.

## Direção proposta

Um RPG sandbox educacional individual, com regiões conectadas, liberdade de atividades e progressão acadêmica. Pedra da Aurora é a primeira cidade, não o mundo inteiro. Referência de experiência: câmera isométrica, coleta e fabricação de Albion; identidade visual, personagens, regras e narrativa próprios. O site oficial de Albion apresenta fabricação e economia conduzida pelos jogadores: https://albiononline.com/home e https://albiononline.com/news/guide-crafting. Não se propõe copiar assets ou implantar um MMO nesta etapa.

| Etapa | Entrega jogável | Vínculo educacional | Critério de conclusão |
| --- | --- | --- | --- |
| 1.5.x | Homologação visual, controles e identidades | Traços de aparência e classes coerentes | Validar todas as raças no desktop e iPhone, contraste, gestos, recursos e salvamentos |
| 1.6 | Vila mais habitada e primeira rota externa | Missões de variáveis e condições | Distintos marcos visuais, rotas seguras, NPCs e destino útil além da praça |
| 1.7 | Coleta de madeira, minério e ervas | Quantidades, condições, inventário e laços | Nós com interação por proximidade, tempo de coleta, disponibilidade e persistência; recompensas sem duplicação |
| 1.8 | Refinamento, profissões e encomendas | Funções, arrays e objetos | Cadeia coletar → refinar → fabricar → entregar, custos e raridades verificados |
| 1.9 | Mapas regionais carregados por proximidade | Módulos, mapas de dados e estruturas | Voltar a regiões mantém estado; apenas regiões próximas ficam na memória |
| 2.0 | Oficina/casa e projetos que mudam o mundo | Projetos reais, testes, Git e APIs | Código validado restaura ponte, automatiza mecanismo ou melhora oficina; evidências acadêmicas preservadas |

## Arquitetura antes de aumentar o mapa

Separar definição de região (terreno, obstáculos, NPCs e recursos) do estado persistido (coletas, construções, desbloqueios). Usar IDs estáveis, semente determinística e versão de save. Manter posição global e identificador da região; uma migração deve mapear a posição antiga para Pedra da Aurora. Guardar o arquivo anterior antes da mudança e oferecer recuperação, sem apagar educação, XP, itens ou aparência.

Carregar a região atual e vizinhas, instanciar vegetação repetida, compartilhar materiais e texturas e definir orçamento de triângulos/draw calls por qualidade. Não criar um plano gigante com milhares de objetos ativos. A navegação precisa de busca local por região e ligações entre portais; colisões usam a mesma definição de obstáculos do cenário.

## Arte e imersão

Prioridade artística: silhuetas claras, proporções humanas críveis, rostos próprios por raça, roupas iniciais humildes e animações de repouso/caminhada/ataque. Para corresponder à prévia semirrealista, produzir modelos GLB com malha, UV, materiais, esqueleto e testes de acessórios. A personalização precisa usar morph targets ou peças anatômicas coerentes, compartilhados pelo editor e pelo mundo.

No cenário: materiais pintados de pedra, terra, madeira e tecido; composição com estradas que levam a marcos; casas com funções e volumes diferentes; oficina visível de Borin; espaço de ensino de Eldrin; água e fauna; sons contextuais; atividades de NPCs e eventos pequenos. Vegetação deve ter escala, distribuição e cores variadas. Reduzir rótulos distantes e dar destaque a interações próximas.

## Recursos, custo e limites

A fase atual usa código e malhas procedurais, sem novos serviços pagos. Arte profissional exige tempo de modelagem, texturização, rigging, animação e homologação. Antes de contratar ou comprar, validar licença de uso comercial, edição, redistribuição e compatibilidade dos modelos. Não há orçamento em dinheiro aprovado nem contratação iniciada.

Começar com uma região bem acabada e um ciclo completo de atividades é mais viável para um desenvolvedor em aprendizado. Multiplayer, trocas entre jogadores e economia compartilhada exigirão servidor autoritativo, contas, banco, prevenção de duplicação e custos de operação; permanecem fora desta entrega.

## Verificação pendente

Testes de regras, matrizes raciais, migração, cura/buffs e diferenças das malhas são automatizados. Qualidade visual, desempenho de GPU, materiais, gestos e enquadramento em iPhone físico exigem avaliação com WebGL disponível. Um build aprovado não comprova acabamento ou fluidez.
