<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Regra do proprietário: evitar trabalho repetitivo

- Reutilize resultados e decisões já confirmados nesta tarefa.
- Não repita análises, buscas, leituras ou verificações concluídas sem alteração, falha, evidência nova ou dúvida concreta que justifique a repetição.
- Execute uma rodada de verificações adequada às mudanças. Repita somente as verificações afetadas por correções posteriores.
- Atualizações de status devem trazer um avanço, descoberta ou impedimento novo; evite mensagens idênticas.
- Esta regra não dispensa a validação necessária de código novo nem a confirmação da publicação.

## Economia de tokens e divisão de execução

- O agente cuida de diagnóstico, arquitetura, decisões, edição direcionada e revisão.
- Delegue ao PowerShell tarefas mecânicas em lote quando houver conexão autorizada: testes, build, inventário de arquivos e coleta resumida de erros.
- Sem conexão ao Windows, execute no ambiente disponível ou entregue um pacote único quando solicitado. Nunca declare envio ao PowerShell sem execução comprovada.
- Retorne resumos e erros relevantes, evitando logs completos, repetição de comandos e leitura de arquivos já conhecidos sem motivo.
