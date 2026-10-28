# Comparador de interfaces — 28/10/2026

## Entrega

Quatro apresentações completas sobre a mesma aplicação: Central tecnológica (menu compacto e painéis luminosos), Painel modular (menu horizontal e blocos desiguais), Academia clara (composição editorial e índice de aula à direita) e Jornada de evolução (caminho visual, menu de trilhas e botões recortados). No celular, a navegação inferior mantém os acessos essenciais e a seção Mais.

A galeria compara a mesma seleção de cinco telas em miniaturas de composição. O botão Testar abre a tela funcional, com barra para trocar interface e tela, salvar a escolha ou voltar ao visual anterior. A preferência só é escrita quando o usuário salva; cancelar não grava a tentativa. Trocar aparência em uma mesma tela não recria os formulários nem apaga rascunhos. Navegar entre telas mantém o comportamento normal da aplicação.

Botões têm resposta visual ao toque/clique. A central usa luz acompanhando o cursor; os blocos modulares têm elevação; a academia tem movimento discreto; a jornada usa marcações de caminho. Efeitos são opcionais e respeitam movimento reduzido. Transições entre aparências usam a API nativa quando disponível, com alternativa sem animação. Não foram adicionadas dependências de produção.

## Conteúdo e dados

O comparador usa a mesma origem de conteúdo, adaptadores de aula e repositório local. Faculdade, tarefas e plano diário mantêm a regra de prioridade. Não há importação de dados nem redefinição de progresso nesta atualização. Histórico do original continua pendente; nuvem e tutor conversacional continuam sem ativação. Nenhum dado real do usuário foi incluído nos testes ou no código.

## Referências

- https://mobbin.com/ — hierarquia e fluxos de produtos.
- https://ui.shadcn.com/blocks/sidebar — agrupamento de navegação.
- https://ui.aceternity.com/components — profundidade e resposta visual.
- https://magicui.design/docs/components — luz e movimento.

As referências orientam a comparação. Os layouts e efeitos desta versão foram escritos em CSS e JavaScript; não foram incorporados templates ou componentes dessas bibliotecas. A marca vetorial original foi mantida com NEXT em verde neon. O Figma anterior continua como documento de fundamentos da primeira entrega, sem espelhamento automático dos novos layouts.

## Validação

17 testes de lógica passaram. Em navegador, foram verificadas 112 combinações de quatro interfaces, sete telas e quatro larguras, sem erro de página ou transbordamento horizontal. As cinco telas principais foram comparadas por conteúdo, e os registros foram comparados antes/depois da troca de aparência. Foram testados teste/cancelamento, manutenção de rascunho em troca de layout, preferência após recarga, retorno à paleta anterior, efeitos desligados, movimento reduzido e comparação offline. Os fluxos anteriores foram reconferidos em 40 combinações de tela e largura, incluindo prática HTML, quiz e entrega. Não houve validação em aparelho físico.
