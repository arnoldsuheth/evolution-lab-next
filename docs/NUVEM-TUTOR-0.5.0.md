# Conta, sincronização e tutor — 28/10/2026

## Entregue

- Projeto exclusivo `evolution-lab-next`, região São Paulo, referência `mgqwzaizkllkqqqbbcna`. Nenhuma alteração no banco existente da BLESSAINT.
- Login por e-mail e senha e criação de conta com confirmação por e-mail. A configuração de retorno do login no painel ainda precisa ser finalizada; o conector não oferece essa configuração e o painel pede autenticação.
- Sincronização local primeiro, por registro, com revisão conferida no servidor antes de gravar. A primeira ativação baixa um backup local. Alterações simultâneas preservam as duas versões e exigem escolha explícita. A troca de conta bloqueia o envio de registros vinculados à conta anterior.
- Todos os 16 tipos de registro do Next entram na sincronização, incluindo disciplinas, hobbies, livros e sites. A sincronização não lê o Lab original.
- Tabelas com RLS, acesso por proprietário e ausência de acesso anônimo. A chave pública do Supabase pode estar no frontend; a chave da OpenAI nunca está no código público.
- Função `lion-tutor` implantada com verificação de JWT e conferência da conta. Perguntas limitadas a 1.500 caracteres, material público da aula a 8.000 caracteres e respostas a 800 tokens. Não envia biblioteca, notas ou registros privados automaticamente. Não altera dados.
- Cota atômica de 10 perguntas por conta/dia e 20 no projeto/dia (dia UTC). Usuários não podem zerar os contadores diretamente. Chamadas de provedor que falham também consomem a reserva, impedindo repetição ilimitada de erros pagos. O modelo preparado é `gpt-4.1-mini-2025-04-14`, Responses API com `store:false`.
- Chave OpenAI criada e salva no arquivo local ignorado, conforme autorização. **Ainda não instalada como segredo remoto no Supabase.** A interface informa que o tutor aguarda ativação e não habilita o envio de perguntas.

## Evidências

31 testes Node passaram: regressões locais/importação, dois dispositivos simulados, conflitos, exclusões, conta diferente, alteração durante consulta e tratamento do tutor sem chave, sem sessão, origem recusada, cota e payload mínimo.

Teste no Postgres real, dentro de transação revertida: duas identidades fictícias, isolamento por RLS, tentativa de escrita em outra conta recusada, comparação de revisão, dez reservas e recusa da décima primeira, tentativa de zerar cota recusada. Após rollback: zero usuários e registros de teste.

Prévia conferida pelo navegador: configurações, tutor, faculdade, cursos, hobbies, biblioteca e sites, sem estouro horizontal na largura observada de 1.363 pixels. Não equivale a teste em iPhone físico nem a login real do usuário. Os testes Node de dispositivos usam respostas simuladas; a verificação de políticas e concorrência do banco usa SQL real.

O advisor de desempenho não encontrou avisos. O advisor de segurança trouxe apenas INFO sobre RLS sem política na tabela privada de cota global; é intencional, pois o cliente não acessa a tabela e apenas a função privada com conferência de identidade pode atualizar o contador. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Pendências reais

1. Autenticar o painel Supabase para finalizar o retorno do login e confirmar a entrega do e-mail.
2. Instalar a chave como segredo de servidor e verificar uma resposta real antes de habilitar o tutor no frontend. Nenhuma resposta real da OpenAI foi produzida nesta entrega.
3. Usuário criar/entrar em sua conta do Next e ativar a sincronização dos próprios registros. Não há dados pessoais transferidos na nuvem por esta entrega.
4. Desbloquear e concluir a importação do Lab original, conferindo o resultado real. Não confundir o código de importação pronto com a transferência concluída.
5. Teste físico no iPhone e aprofundamento adicional dos cursos.

O código publicado e os ZIPs de fonte não incluem `.env.local`, credenciais, sessão ou progresso pessoal.
