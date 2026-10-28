# Arquitetura e próximos passos

## Situação desta entrega

O front-end é uma aplicação estática independente com dados locais. A estrutura é modular, sem copiar o sistema de credenciais do Lab antigo. Conteúdo e registros são separados. Não houve mudança no Gist, no banco da BLESSAINT BUSINESS ou nos dados privados de aprendizado.

## Modelo proposto para o servidor — não implementado nem aplicado

| Registro | Chave lógica | Conteúdo e controle |
| --- | --- | --- |
| Perfil | usuário autenticado | Preferências e identificação; sem papel de permissão editável pelo cliente |
| Progresso | usuário + curso + ID estável da aula | Etapa, prática, tentativa, entrega, versão e atualização do servidor |
| Competência | usuário + competência | Estágio, evidência e revisão, distinguindo autoavaliação de avaliação externa |
| Atividade da faculdade | usuário + ID da atividade | Disciplina, descrição, prazo, conclusão e versão |
| Projeto | usuário + ID do projeto | Referências verificáveis de código, URL e explicação |
| Revisão | usuário + curso + aula | Resultado anterior, nova tentativa e próximo intervalo escolhido |
| Sessão de estudo | usuário + ID da sessão | Início, duração medida e atividade; tempo não certifica execução |
| Histórico | usuário + entidade + versão | Dados anteriores recuperáveis, com limites e política de retenção |

As tabelas expostas precisam de RLS com proprietário verificado em SELECT, INSERT, UPDATE e DELETE, além das permissões de tabela. A atualização deve conferir a versão esperada no servidor em uma operação atômica. Uma divergência retorna conflito, preserva as duas intenções e exige resolução; não deve simplesmente substituir o documento inteiro pelo mais recente.

## Sequência para ativar nuvem

1. O usuário escolhe a organização do Supabase. Foi encontrada a organização BLESSAINT BUSINESS; não se presume que ela seja o destino desejado.
2. Conferir custo e criar um projeto exclusivo, sem alterar o banco já existente.
3. Gerar migrações, aplicar em teste e verificar políticas com dois usuários fictícios.
4. Implementar sessão, logout, recuperação e acesso aos registros.
5. Testar duas edições simultâneas, internet ausente, repetição de requisição e restauração.
6. Revisar origem/domínio da aplicação antes de ativar sessões sensíveis.
7. Migrar progresso somente mediante um processo explícito, com exportação anterior e comparação de resultados.

## Tutor conversacional

Preparar casos de teste e fonte de conteúdo antes da ativação. A chave fica no servidor; o cliente recebe apenas as respostas autorizadas. A ferramenta não deve afirmar que leu um arquivo, corrigiu uma entrega ou gravou um resultado sem executar e confirmar essa ação. Exibir custos e limites de uso, permitir desligar e distinguir pista de solução.

O plugin OpenAI Developers disponível no ChatGPT não funciona como credencial de API do site. Nenhuma chamada cobrada foi realizada nesta entrega.

## Design

A folha de fundamentos no Figma acompanha cores e escalas do código. A próxima revisão visual pode transformar padrões já usados em componentes com estados de foco, erro, desabilitado e carregamento. Priorizar tamanho de texto, navegação por teclado, toque e movimento reduzido; validar em aparelho físico além das larguras emuladas.

## Evidências de validação da base

Nove testes de lógica verificam isolamento, revisão antiga, recuperação, falha de armazenamento, corrupção de dados, tempo do plano, exportação, links e intervalos. A conferência em navegador percorreu os fluxos principais e dez telas em quatro larguras, sem erro de página ou transbordamento horizontal. A abertura offline foi verificada após instalação dos recursos. Sincronização autenticada, pagamento de serviços e aparelho físico não foram testados.
