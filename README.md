# LION’S CAVE RPG PROGRAMADOR

## 1.4.0 · Caminhos da Aurora

RPG individual 3D em desenvolvimento. Cinco raças, seis classes, personagens novos com roupas remendadas e educação separada da aventura. Esta versão amplia sistemas; não representa um RPG profissional concluído.

### Conteúdo disponível

- **1.087 definições de itens**: 562 armaduras, 176 armas, 144 acessórios, 78 materiais, 67 consumíveis, 40 alimentos, seis companheiros, seis ferramentas e oito troféus. São famílias e variantes de progressão; não 1.087 modelos 3D exclusivos.
- 871 receitas com materiais e custo, compra/venda, mochila, busca, filtros e paginação. Ferramentas e troféus têm funções de acervo; nem todo objeto tem interação especializada.
- Equipamentos nas faixas 1, 5, 10 e a cada cinco níveis até 60, com nível mínimo, classe, slot e conflito de duas mãos. Peças antigas continuam permitidas; possuir equipamento de nível maior não permite usá-lo antes da hora.
- **90 habilidades**, três ramos e 15 nós por classe. Pontos por nível, pré-requisitos, ranks, passivas, MP/estamina, quatro atalhos ativos e recargas. Reespecialização gratuita. É uma base inicial de balanceamento.
- Combates progressivos até 60 com recursos, cura, proteção, controle, sangramento, recompensas, materiais e equipamentos. Encontros são uma arena tática simplificada, não um sistema completo de ação em tempo real.
- Criador com preview independente do mundo, enquadramentos de corpo/rosto/costas, rotação manual e painel de edição com rolagem separada. Malhas procedurais suaves, silhuetas raciais, verde em degradê nos orcs e cinza azulado nos gnomos.
- Emblema original de leão/caverna/código, favicon, ícones de início de tela e manifesto. Sem service worker: não há promessa de funcionamento offline.

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

### Salvamentos

A chave **`genesis-reborn-rpg-v3`** permanece. O envelope agora é versão **3**, com migração das versões anteriores. Antes do upgrade, o original é copiado para `genesis-reborn-rpg-v3-before-1.4.0`; o backup anterior `genesis-reborn-rpg-v3-before-lions-cave-1.3.1` também permanece. Há recuperação periódica e cópia antes de importar. Saves desconhecidos bloqueiam escrita. Itens desconhecidos, XP, ouro, aparência, educação, legado e inventário são conservados.

Itens incompatíveis ficam guardados e não concedem atributos. Talentos antigos continuam contados no orçamento de pontos e podem ser reespecializados. Builds de outras classes ficam lembradas, com bônus apenas da classe ativa. O novo limite de progressão é 60; saves antigos acima disso não são rebaixados.

O armazenamento pertence ao navegador e à origem. Não há conta nem sincronização automática. Exporte antes de mudar de aparelho/domínio. Nunca exclua saves para corrigir um erro.

Hardcore preserva educação e arquiva o personagem. Herança: 15% do XP próprio, teto 100, resgate único; XP herdado não gera nova herança. Importações preservam evidências existentes e resgates. Armazenamento local não é autoridade antifraude; não há ranking ou comércio multiplayer.

### Ensino e limites

Oito missões executáveis de JavaScript: variáveis, operações, decisões, laços, funções, arrays, objetos e depuração. Interpretador limitado, sem eval/Function ou APIs do navegador, com limites de operações, entrada, recursão e console. Biblioteca adicional: 15 roteiros de projetos com pré-requisitos e rubricas, ainda não cursos completos. HTML/CSS usa iframe sem scripts e CSP restritiva.

Companheiro Hunter tem representação e bônus, sem IA independente. NPCs têm respiração, orientação e rotina simplificada de Pip. Hora e luz seguem America/Sao_Paulo pelo relógio do aparelho. Combate e economia precisam de testes prolongados de balanceamento. Homologação de GPU, gestos, desempenho e acabamento em iPhone físico permanece necessária; o navegador de auditoria pode não oferecer WebGL.

### Publicação

Produção: `interface-nexus`. O workflow exige testes, TypeScript, ESLint e build antes de publicar no GitHub Pages. Sem novos serviços pagos, chaves ou dependências de produção. Mudanças e publicação autorizadas pelo proprietário.
