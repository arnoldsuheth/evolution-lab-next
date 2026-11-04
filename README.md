# LION’S CAVE RPG PROGRAMADOR

## 1.3.1 · Expedição Aurora

RPG individual 3D com criação de personagem compartilhada com o mundo, cinco raças e seis classes oficiais. Personagens novos usam roupas remendadas. O aprendizado é persistido separadamente da aventura.

### Executar

Node 22 ou superior. `npm ci`, `npm run dev`.

### Verificar

- `npm test`: regras originais, interpretador, missões, migração, navegação e integridade do legado.
- `npm run typecheck`
- `npm run lint -- --max-warnings=0`
- `GITHUB_PAGES=true npm run build`: exporta `out/` com basePath `/evolution-lab-next`.

### Controles

Clique/toque para caminhar; clique em NPC para aproximar e conversar. Botão direito arrastado gira a câmera; roda/pinça muda o zoom. Um arrasto no celular gira a câmera. WASD/setas e E são alternativas de teclado. Painéis pausam o movimento. Use a aba Configurações para qualidade, escala, opacidade, exportação e recuperação.

### Progresso e recuperação

A chave `genesis-reborn-rpg-v3` é mantida, com envelope de versão 2 e migração da versão 1. A primeira leitura copia o texto original para `genesis-reborn-rpg-v3-before-lions-cave-1.3.1`; essa cópia não é rotacionada. Há uma cópia de recuperação periódica e outra antes de importar. Saves futuros/desconhecidos bloqueiam escrita. Itens desconhecidos permanecem nos dados, e o objeto original legado é preservado.

O armazenamento pertence ao navegador e à origem. Não há conta ou sincronização automática. Exporte antes de mudar de aparelho/domínio. Nunca exclua saves para resolver um erro. Não há reset destrutivo na interface.

Hardcore arquiva a morte e conserva educação e portfólio. Herança: 15% do XP próprio, teto 100, resgate único; XP herdado não gera nova herança. Importações preservam evidências existentes e registros de legado consumido. O navegador local não é uma autoridade antifraude: não há ranking, comércio multiplayer ou promessa de proteção contra edição manual dos dados.

### Ensino

Oito missões executáveis cobrem variáveis, operações, decisões, laços, funções, arrays, objetos e depuração. O interpretador é intencionalmente limitado: não usa eval/Function, não expõe APIs do navegador e limita entrada, operações, recursão e console. Não é uma implementação completa de JavaScript. A biblioteca adicional contém 15 roteiros de projetos com pré-requisitos e rubricas; não representa cursos completos ou domínio certificado. Projetos HTML/CSS têm iframe sem scripts, com CSP restritiva.

### Limites desta versão

- Personagens e cenário são geometria procedural original, sem GLB, rig esquelético ou assets artísticos externos.
- Combate tático simplificado: ataque, habilidade de classe, retaliação, recursos, consumíveis e recuo. Animações completas de ataque ainda não existem.
- Talentos têm três ramos por classe com bônus iniciais compartilhados de ataque, defesa e estamina. Árvores avançadas dependem de balanceamento posterior.
- Companheiro Hunter tem representação visual e bônus no combate, sem IA de navegação independente.
- NPCs têm respiração, orientação e uma pequena rotina de Pip; não há simulação completa de agendas.
- Hora e iluminação seguem America/Sao_Paulo pelo relógio do aparelho.
- O desempenho em iPhone físico precisa de homologação. Perfil leve permite desativar sombras.

### Fonte e publicação

Desenvolvimento: `work/lions-cave-131`; checks também executam nessa branch. Produção: `interface-nexus`, cujo push publica após verificações. Backup da revisão anterior: `backup/lions-cave-before-131-20261104`. Publicação desta entrega foi expressamente autorizada pelo proprietário na conversa.

Não há serviços pagos, chaves de API, IA remota ou dependências adicionadas nesta versão.
