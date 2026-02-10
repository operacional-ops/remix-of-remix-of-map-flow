

# Criar Conta de Proprietario Global

## Resumo
Criar o usuario `danillo-souza@hotmail.com` com senha temporaria `danillo33`, flag de troca obrigatoria no primeiro acesso, e role `global_owner` na tabela `user_roles`.

## Etapas

### 1. Criar o usuario via edge function existente
Invocar a edge function `add-user-with-invite` com os parametros:
- email: `danillo-souza@hotmail.com`
- role: `global_owner`
- temporaryPassword: `danillo33`
- mustChangePassword: `true`

Isso executa com `SUPABASE_SERVICE_ROLE_KEY` e realiza:
- Cria o usuario no `auth.users` com email confirmado
- O trigger `handle_new_user` cria automaticamente o registro em `profiles`
- Define `must_change_password = true` no perfil
- Insere o role `global_owner` na tabela `user_roles`

### 2. Validacao pos-criacao
Verificar no banco que:
- O usuario existe em `auth.users`
- O perfil foi criado em `profiles`
- O role `global_owner` esta em `user_roles`
- O campo `must_change_password` esta `true`

## Seguranca
- A senha e definida diretamente no Supabase Auth (hash seguro, nunca armazenada em texto)
- O role fica na tabela `user_roles` separada (nao no perfil), protegida por RLS
- Somente `global_owner` pode gerenciar roles (politica RLS ja existente)
- O flag `must_change_password` garante troca no primeiro login
- Nenhum dado sensivel fica exposto em tabelas publicas

## Detalhe Tecnico
A chamada sera feita diretamente via `curl` na edge function `add-user-with-invite`, autenticada com a anon key. Porem, como nao ha usuario autenticado ainda, sera necessario chamar a funcao usando o service role, ou criar o usuario diretamente via SQL administrativo no banco.

**Abordagem escolhida**: Criar via SQL administrativo usando as ferramentas de migracao, pois nao ha usuario autenticado para autorizar a chamada a edge function.

### SQL a executar:
1. Criar usuario em `auth.users` via `supabase.auth.admin.createUser`
2. Como nao temos acesso direto ao admin API via SQL, usaremos a edge function com uma chamada direta (sem auth header check) -- mas a funcao exige autorizacao.

**Solucao final**: Criar uma edge function temporaria simples que use o service role key para criar o usuario inicial, ou usar a ferramenta de curl para chamar a edge function existente (que requer auth). A melhor opcao e ajustar a chamada para funcionar neste cenario de bootstrap.

Na pratica, vou:
1. Chamar a edge function `add-user-with-invite` via curl -- se falhar por falta de auth, criarei uma edge function de bootstrap temporaria
2. Confirmar a criacao
3. Remover qualquer funcao temporaria

