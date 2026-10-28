# Transferência direta e faculdade — 28/10/2026

## Implementado

A importação pode consultar a cópia criptografada do original sem usar o clipboard. A senha é informada em um campo password, usada para derivar uma chave não exportável e abrir o cofre em memória. A credencial temporária consulta somente GET /gists/{id} na API do GitHub. O leitor não lê nem grava a sessão local do original, não modifica o cofre, não envia PATCH e não grava credenciais no Next. Redirecionamentos são recusados; limites de tamanho, iterações e identificador são conferidos. A senha é apagada do formulário assim que a consulta começa.

O retorno oferece um backup criptografado dos dados originais com salt e iterações, sem incluir o cofre de credenciais. A prévia continua exigindo a confirmação da importação. A aplicação baixa o backup do Next antes de adicionar registros e preserva os identificadores já existentes, incluindo os removidos. Uma falha de armazenamento interrompe a adição e informa o total concluído.

Disciplinas sem tópicos ou provas agora são preservadas como disciplinas, com período, notas válidas, frequência e indicação antiga de aprovação. As atividades com prazo continuam separadas e prioritárias. Nenhuma data é criada para preencher lacunas. A tela permite adicionar disciplinas e editar notas informadas, sem calcular aprovação oficial.

Registros de Claude e Programação do original aparecem em um histórico separado na central de cursos. Conclusões antigas não são convertidas automaticamente em novas entregas. Campos reconhecidos de rascunho são preservados para consulta. XP, cargos, desafios e demais módulos não são recriados; a cópia criptografada preserva o estado original para recuperação.

## Verificação

22 testes de lógica passaram, incluindo criptografia real com dados fictícios, senha errada sem consulta ao Gist, acesso recusado, limites de iterações, ausência de credenciais no retorno, filtragem de notas e preservação de disciplinas sem tarefas. O navegador exercitou consulta simulada, backup criptografado, importação de sete registros fictícios, edição de nota, recarga e histórico separado em 16 combinações de tela/largura. Os fluxos anteriores e a abertura offline passaram em 40 combinações. Nenhum dado real foi incluído no código, nos fixtures ou no repositório.

Esta documentação descreve o comportamento implementado, não comprova uma transferência real. A confirmação de dados reais é feita após autenticação e leitura do original na interface publicada.

## Ainda pendente

Login e sincronização do Next aguardam escolha da organização de um projeto exclusivo. O tutor de IA aguarda escolha de credencial e ativação segura. Nenhum banco existente foi alterado nesta entrega. A criação de novos serviços ou custos não é presumida pela publicação deste código. Teste físico no iPhone e aprofundamento dos cursos continuam como etapas próprias.
