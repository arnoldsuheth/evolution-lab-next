# Cinco campanhas e vinculação de aparelhos

Publicação autorizada pelo proprietário. Edge Function publicada e validada por HTTP; frontend em publicação.

- A entrada mostra cinco slots. O personagem existente ocupa o primeiro, sem zerar progresso.
- Cada slot guarda personagem, aparência, inventário, educação e antepassados separados. Configurações de interface são compartilhadas.
- Troca de campanha fora de combate ou exercício. Não existe exclusão de personagem nesta entrega.
- A interface não pede e-mail ou senha. Uma chave aleatória de 256 bits identifica o aparelho.
- Um código aleatório de 80 bits vincula outro aparelho. Expira em dez minutos, funciona uma vez e concede acesso ao conjunto inteiro de personagens.
- O código deve ser digitado no outro aparelho. Não entra na URL nem aparece nos logs do serviço.
- Chaves e códigos são armazenados como SHA-256 no banco. A chave de serviço permanece somente no servidor.
- O endpoint faz sua própria autenticação por chave do aparelho, por isso usa `verify_jwt:false`. Aceita origem do jogo publicado ou localhost; limita tentativas por endereço de rede.
- Tabelas novas têm RLS, sem permissões para visitantes ou usuários do navegador. Somente o servidor pode executar a função de banco. A ausência de políticas nessas tabelas é intencional: bloqueia acesso direto.
- A sessão antiga é validada pelo Auth antes de copiar sua nuvem anterior. As tabelas antigas não são removidas nem alteradas.
- Revisões impedem sobrescrita silenciosa. Em conflito, a pessoa escolhe o conjunto completo e é guardada uma cópia.
- Limpar os dados do navegador remove a chave do aparelho. Para recuperar acesso, vincule novamente a partir de outro aparelho já vinculado; a exportação também continua disponível.

Validação concluída: 186 testes, lint, tipos e build; teste transacional no Supabase de isolamento, gravação, pareamento, expiração, uso único, revisão e backup. Fixtures revertidas por rollback.

Validação HTTP real: abertura isolada de dois aparelhos simulados, gravação, isolamento, vinculação, rejeição de reutilização do código, conflito de revisão e rejeição de chave inválida. Fixtures removidas. Pendente: conferência visual nos aparelhos físicos.
