# Evolution Lab Next

Nova versão independente do Evolution Lab. O app atual permanece em `arnoldsuheth/evolution-lab`, preservado no commit `66b63a99e6d0deb48e5e61486377521de0c46c09` e na branch `preservado-2026-10-27-66b63a9`.

## O que funciona nesta primeira entrega

- Painel com planejamento de 30, 60 ou 120 minutos, usando atividades realmente cadastradas.
- Modo foco, cronômetro e registro do tempo real da sessão.
- 71 aulas de programação e 52 aulas existentes de Claude organizadas em oito etapas, com prática, pistas, avaliação e entrega.
- Cadastro, edição e conclusão de atividades da faculdade; projetos com código, demonstração e explicação.
- Competências com estágio e evidência declarados pelo aluno; fila de revisões a partir das tentativas.
- Registros locais separados por atividade, versões anteriores, recuperação de itens removidos e exportação JSON.
- Ajuda guiada do Lion baseada na aula; sem se apresentar como uma conversa de IA em tempo real.
- PWA e funcionamento offline após carregar e instalar os recursos.

## O que ainda não está ativo

Não há login próprio do Next nem sincronização em nuvem entre dispositivos. Os dados ficam neste navegador; exporte-os para uma cópia externa. O controle de versão local detecta gravações com revisão antiga, mas não é uma garantia de concorrência distribuída. O modelo de dados do servidor está documentado para a próxima implementação.

O tutor conversacional exige uma integração de servidor, credencial e limite de custo. Os 12 laboratórios complementares de outras IAs ainda são o plano curricular; não são aulas já produzidas. A base do Figma documenta fundamentos, não uma biblioteca completa de componentes.

## Isolamento do Lab atual

O Next usa exclusivamente o prefixo `evolab-next:v1:`. Não lê `ea-state`, `ea-sess`, o cofre do Lab antigo nem seu Gist. Nenhuma nota ou senha foi migrada. O service worker só remove caches com o prefixo próprio `evolab-next-`.

As duas aplicações no GitHub Pages ainda compartilham a origem do domínio; os prefixos evitam colisões acidentais, mas não são uma barreira de segurança contra código de mesma origem. Antes de ativar sessões sensíveis no Next, considerar domínio/origem isolados e um modelo de autenticação revisado.

## Executar e testar

Sem dependências de produção. Abra por um servidor HTTP, como Live Server no VS Code, ou execute `npm run serve` com Python disponível. Abra o endereço mostrado pelo servidor. Módulos JavaScript não devem ser testados por `file:`.

Com Node disponível, rode `npm test`. Os testes usam somente armazenamento em memória e dados fictícios.

## Estrutura

- `src/core.mjs`: registros, versões, recuperação, validação de links e planejamento.
- `src/app.mjs`: navegação e fluxos da primeira versão.
- `src/classroom.js`: experiência das aulas, com adaptadores separados por trilha.
- `data/`: conteúdo público das trilhas, sem progresso ou credenciais.
- `docs/`: decisão de arquitetura, próximos passos e fundamentos visuais.
- `config.js`: configuração pública; não recebe segredos.

## Fundamentos visuais

[Figma — Evolution Lab Next](https://www.figma.com/design/sDQWXK66lV73mAbvXU4pVY). São 28 variáveis de cores, espaçamentos e raios, com folha de referência. Tokens correspondentes em `docs/design-tokens.json`.

## Próxima etapa de servidor

Definir com o usuário a organização e o ambiente exclusivo do Supabase, verificar o custo e criar o projeto. Não usar o projeto BLESSAINT BUSINESS existente para guardar dados do Lab. Antes da migração, testar isolamento por usuário, conflitos, falha de rede e recuperação em dados fictícios.
