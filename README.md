# Evolution Lab Next

Nova versão independente do Evolution Lab. O app atual permanece em `arnoldsuheth/evolution-lab`, preservado no commit `66b63a99e6d0deb48e5e61486377521de0c46c09` e na branch `preservado-2026-10-27-66b63a9`.

## Interfaces para comparar — 0.3.0

Abra `#interfaces` para comparar Central tecnológica, Painel modular, Academia clara e Jornada de evolução nas mesmas cinco telas: painel, faculdade, aula, biblioteca e sites. Testar aplica o visual temporariamente; Usar esta interface salva apenas a preferência de aparência. É possível cancelar ou voltar às três paletas do visual anterior. Efeitos podem ser desligados e respeitam movimento reduzido.

As quatro composições usam o mesmo conteúdo e os mesmos registros. Nenhum dado pessoal nem progresso é criado ao trocar o visual. A faculdade continua em primeiro lugar. O comparador não conclui a importação pendente do histórico original.

## O que funciona nesta entrega

- Faculdade em destaque no painel e na navegação. Plano de 30, 60 ou 120 minutos com cerca de 80% do tempo para a próxima atividade da faculdade; os cursos livres ficam como sugestão opcional no tempo restante.
- Modo foco, cronômetro e registro do tempo real da sessão.
- 71 aulas de programação e 52 aulas existentes de Claude organizadas em oito etapas, com prática, pistas, avaliação e entrega.
- Cadastro, edição e conclusão de atividades da faculdade; projetos com código, demonstração e explicação.
- Competências com estágio e evidência declarados pelo aluno; fila de revisões a partir das tentativas.
- Registros locais separados por atividade, versões anteriores, recuperação de itens removidos e exportação JSON.
- Ajuda guiada do Lion baseada na aula; sem se apresentar como uma conversa de IA em tempo real.
- Meus sites: empresas, clientes, todos os links do catálogo original, edição e arquivamento reversível; oportunidades com próxima ação e prazo.
- Central Meus cursos com as oito entradas do original.
- Cinco cursos externos do catálogo original, com módulos, materiais e progresso pessoal.
- Violão: treinos por dia, meta semanal, acordes e repertório.
- Biblioteca: cadastro, edição, filtros, favoritos, páginas, notas e citações.
- Temas Original Evoluído, Next Neon e Leitura, com seleção persistida por navegador.
- Logo original dos cubos com NEXT em verde neon.
- Importação local de atividades e prazos da faculdade, hobbies, biblioteca e prospecção com prévia, backup do Next e preservação de registros existentes, incluindo itens removidos.
- PWA e funcionamento offline após carregar e instalar os recursos.

## O que ainda não está ativo

Não há login próprio do Next nem sincronização em nuvem entre dispositivos. Os dados ficam neste navegador; exporte-os para uma cópia externa. O controle de versão local detecta gravações com revisão antiga, mas não é uma garantia de concorrência distribuída. O modelo de dados do servidor está documentado para a próxima implementação.

O tutor conversacional exige uma integração de servidor, credencial e limite de custo. Os 12 laboratórios complementares de outras IAs ainda são o plano curricular; não são aulas já produzidas. A base do Figma documenta fundamentos, não uma biblioteca completa de componentes.

## Isolamento do Lab atual

O Next usa exclusivamente o prefixo `evolab-next:v1:`. Não lê `ea-state` nem `ea-sess`. A consulta direta do original só acontece quando solicitada no formulário de importação: abre o cofre com a senha informada, consulta o Gist com GET e descarta as credenciais ao terminar. Não há escrita no original. Nenhuma senha é migrada. Atividades da faculdade, hobbies, biblioteca e oportunidades podem ser importados explicitamente a partir do JSON copiado em Perfil → Cópia de segurança no original. A importação reconhece somente campos permitidos, ignora sessões e preserva registros já existentes. Conclusões, notas e rascunhos antigos de Programação e Claude são preservados em um histórico separado; não são marcados como novas entregas. Disciplinas e notas da faculdade também são reconhecidas. O service worker só remove caches com o prefixo próprio `evolab-next-`.

As duas aplicações no GitHub Pages ainda compartilham a origem do domínio; os prefixos evitam colisões acidentais, mas não são uma barreira de segurança contra código de mesma origem. Antes de ativar sessões sensíveis no Next, considerar domínio/origem isolados e um modelo de autenticação revisado.

## Executar e testar

Sem dependências de produção. Abra por um servidor HTTP, como Live Server no VS Code, ou execute `npm run serve` com Python disponível. Abra o endereço mostrado pelo servidor. Módulos JavaScript não devem ser testados por `file:`.

Com Node disponível, rode `npm test`. Os testes usam somente armazenamento em memória e dados fictícios.

## Estrutura

- `src/core.mjs`: registros, versões, recuperação, validação de links e planejamento.
- `src/app.mjs`: navegação e fluxos da primeira versão.
- `src/leisure.mjs`: hobbies, violão, biblioteca e temas.
- `src/import-legacy.mjs`: validação e prévia do histórico antigo.
- `src/classroom.js`: experiência das aulas, com adaptadores separados por trilha.
- `data/`: conteúdo público das trilhas, sem progresso ou credenciais.
- `docs/`: decisão de arquitetura, próximos passos e fundamentos visuais.
- `config.js`: configuração pública; não recebe segredos.

## Fundamentos visuais

[Figma — Evolution Lab Next](https://www.figma.com/design/sDQWXK66lV73mAbvXU4pVY). São 28 variáveis de cores, espaçamentos e raios, com folha de referência. Tokens correspondentes em `docs/design-tokens.json`.

## Próxima etapa de servidor

Definir com o usuário a organização e o ambiente exclusivo do Supabase, verificar o custo e criar o projeto. Não usar o projeto BLESSAINT BUSINESS existente para guardar dados do Lab. Antes da migração, testar isolamento por usuário, conflitos, falha de rede e recuperação em dados fictícios.

## Transferência direta — 0.4.0

A tela Importar pode consultar o original com sua senha, dispensando o botão de cópia. Senha, chave de descriptografia e token não são gravados no Next. A prévia permite conferir disciplinas, atividades, livros, cursos externos, violão, oportunidades e registros históricos de cursos. Um backup criptografado da cópia original pode ser baixado, sem incluir o cofre de credenciais. A importação continua preservando registros que já existem no Next.

A área de faculdade agora mantém disciplinas, período, notas informadas e frequência, além das tarefas com prazo. Não inventa datas, notas, médias oficiais ou aprovação.

## Rotina de entrega de projetos

Por orientação do Arnold, registrar cada novo projeto concluído e publicado em **Meus sites**, sem pedir essa inclusão novamente. Adicionar nome, descrição objetiva, status, link de acesso e repositório quando houver. Manter o nível de acesso: um link para sistema privado continua exigindo sua autenticação. Não publicar credenciais nem dados de clientes.

O catálogo público fica em `data/sites.js` e é combinado com registros locais, preservando edições e arquivamentos do usuário. Evitar duplicatas por ID ou URL. Novos projetos devem ganhar IDs próprios para não sobrescrever dados existentes. Confirmar a publicação e o link antes de marcar como concluído.


### Manual de uso obrigatório em PDF

Regra permanente solicitada por Arnold em 28/10/2026 para todos os projetos criados: a entrega só termina com um manual de uso em PDF pronto para encaminhar ao cliente, sem precisar de novo pedido.

Ordem da entrega:

1. Concluir o projeto e executar as verificações apropriadas, relatando limites reais de validação.
2. Salvar e versionar todos os arquivos e publicar conforme o acesso autorizado. Confirmar o link final.
3. Registrar ou atualizar o projeto em **Meus sites** no Evolution Lab, preservando o acesso privado quando aplicável e evitando duplicatas.
4. Criar o manual de uso em PDF da versão entregue, com a logo oficial, o nome **Studio Evolution Tech**, as cores da marca (azul-marinho, azul elétrico e ciano) e apresentação timbrada. Incluir capa com nome do projeto/cliente, data e versão, cabeçalho ou rodapé de marca e páginas numeradas.
5. O manual deve usar linguagem simples, explicar o acesso, o uso passo a passo das funções realmente disponíveis, tarefas comuns, cuidados com os dados, dúvidas frequentes e contato de suporte. Usar imagens da interface quando ajudarem, com dados fictícios ou anonimizados. Não prometer recursos não implementados.
6. Renderizar e conferir o PDF, salvar a versão final de forma durável e entregar **o link do projeto e o PDF para download** na resposta final. Relatar qualquer etapa pendente sem marcar a entrega como completa.

Privacidade: manuais destinados aos clientes não devem conter acesso ao painel interno do estúdio, resultados financeiros, registros de outros clientes, credenciais ou informações privadas. Para um sistema privado do próprio cliente, explicar apenas o acesso autorizado a esse sistema. A apresentação comercial pode mostrar somente os valores e itens inclusos que forem destinados ao destinatário.

Ao atualizar um projeto, manter o manual coerente com a versão efetivamente entregue. Esta regra complementa a rotina de cadastro no Evolution Lab e não muda as permissões de publicação.
