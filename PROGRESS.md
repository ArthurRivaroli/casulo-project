# Casulo — Progresso

App de gestão financeira familiar/doméstica ("household") em Next.js.

## Stack

- Next.js 16.3.0 (App Router, Turbopack)
- Prisma 7.9.1 + `@prisma/adapter-pg` (driver adapter, sem `url` no `datasource`)
- NextAuth 4 (Credentials provider + `@next-auth/prisma-adapter`)
- PostgreSQL no Neon
- Tailwind CSS v4
- Recharts (gráficos)

## O que já foi feito

### Banco de dados
- Conta criada no [Neon](https://neon.tech), banco `neondb`
- `DATABASE_URL` configurado em `.env`
- Schema Prisma definido em [prisma/schema.prisma](prisma/schema.prisma) com os modelos:
  - `Household` — a unidade familiar/doméstica, dona de tudo
  - `User` — pertence a um `Household`, login por email+senha (hash bcrypt)
  - `Account` — contas financeiras (`BANK`, `CASH`, `CREDIT_CARD`)
  - `Category` — categorias de receita/despesa (`INCOME` / `EXPENSE`)
  - `Transaction` — lançamentos, ligados a `Account`, `Category` e `User`
  - `Budget` — orçamento mensal por categoria
  - `Goal` — metas de economia
- Migração inicial `20260808070754_init` criada e aplicada no Neon
- Prisma Client gerado em `src/generated/prisma`

### Autenticação
- NextAuth configurado em [src/lib/auth.ts](src/lib/auth.ts):
  - `CredentialsProvider` (email + senha, valida hash com bcrypt)
  - Sessão via JWT, com `householdId` propagado para o token/sessão
  - Rota de API em [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/[...nextauth]/route.ts)
  - Tipos estendidos do NextAuth em [src/types/next-auth.d.ts](src/types/next-auth.d.ts)
  - Aponta `pages.signIn` para `/login`

### Infraestrutura de desenvolvimento
- Corrigido `.npmrc` que tinha `omit=optional` — isso bloqueava a instalação do binário nativo do `lightningcss` (Windows x64), quebrando o Tailwind v4 no `next dev`
- `.claude/launch.json` criado para rodar o preview (`npm run dev`, porta 3000)
- Ambiente validado rodando localmente e conectado ao Neon
- Corrigido import quebrado em [src/lib/prisma.ts](src/lib/prisma.ts): o gerador `prisma-client` do Prisma 7 não cria `index.ts` no output — o import precisa ser `@/generated/prisma/client`, não `@/generated/prisma`. Isso quebrava qualquer rota que usasse Prisma (incluindo o NextAuth)

### Página de login
- Criada em [src/app/login/page.tsx](src/app/login/page.tsx), com identidade visual roxo azulado (gradiente indigo/violeta, cards translúcidos)
- Formulário de email/senha integrado ao `signIn("credentials", ...)` do NextAuth, com mensagem de erro inline
- Testada manualmente no navegador (credenciais erradas exibem "Email ou senha inválidos." sem recarregar a página)

### Logo
- Criado em [src/components/Logo.tsx](src/components/Logo.tsx): SVG do casulo pendurado numa folha com "linhas de seda", ao lado do wordmark "casulo" em fonte Baloo 2 (rounded/bold)
- Estilo branco com contorno preto (`paint-order: stroke fill`), pensado para funcionar sobre fundos escuros/coloridos
- Em uso na página de login e na página de registro

### Fluxo de registro
- API em [src/app/api/register/route.ts](src/app/api/register/route.ts): valida campos, faz hash da senha com bcrypt e cria `Household` + `User` (primeiro usuário da casa) numa única escrita aninhada do Prisma
- Página em [src/app/register/page.tsx](src/app/register/page.tsx), no mesmo estilo visual do login, pedindo nome, nome da casa, email e senha
- Após cadastro, faz login automático (`signIn`) e redireciona para `/`
- Testado manualmente: cadastro com sucesso, login automático, e erro tratado para email duplicado ("Já existe uma conta com esse email.")
- **Desabilitado em seguida**: o Casulo é de uso restrito (só Arthur e Ketlyn), então o cadastro público foi desligado via flag `REGISTRATION_ENABLED = false` em [src/app/api/register/route.ts](src/app/api/register/route.ts) e [src/app/register/page.tsx](src/app/register/page.tsx) (a página mostra uma mensagem "cadastro desabilitado" em vez do formulário; a API retorna 403). O link "Criar conta" foi removido do login. Reativar quando as rotas tiverem proteção/convite.
- As duas contas reais foram criadas direto no banco (mesma `Household` "Casa Rivaroli"): Arthur Rivaroli e Ketlyn Rivaroli, ambas testadas com login funcionando
- Commitado em `a333aa0`

### Proteção de rotas
- Criado [src/proxy.ts](src/proxy.ts) usando `next-auth/middleware` para exigir sessão em todas as rotas, exceto `/login`, `/register`, `/api/auth/*` e `/api/register`
- **Nota importante**: no Next.js 16 o arquivo `middleware.ts` foi renomeado para `proxy.ts` (deprecation real, não erro nosso — ver `node_modules/next/dist/docs/.../proxy.md`). Como o projeto usa `src/app`, o arquivo precisa ficar em `src/proxy.ts` (mesmo nível do `app`), não na raiz do projeto — colocá-lo na raiz faz o Next simplesmente ignorá-lo, sem erro nenhum
- Testado manualmente: sem sessão, `/` redireciona para `/login`; com sessão válida (Arthur e Ketlyn, login testado com as duas contas), `/` carrega normalmente

## Próximos passos

### Autenticação / onboarding
- [x] Criar página `/login` (formulário de email + senha)
- [x] Criar fluxo de registro (cria `User` + `Household` na primeira conta) — depois desabilitado (uso restrito)
- [x] Proteger rotas autenticadas (`src/proxy.ts`)

### Funcionalidades principais (CRUD)
- [ ] API/rotas para `Account` (criar, listar, editar contas)
- [ ] API/rotas para `Category` (criar, listar categorias de receita/despesa)
- [ ] API/rotas para `Transaction` (lançar receitas/despesas, listar, editar, excluir)
- [ ] API/rotas para `Budget` (definir orçamento mensal por categoria)
- [ ] API/rotas para `Goal` (criar e acompanhar metas de economia)

### Interface
- [ ] Layout/navegação principal pós-login (substituir a página padrão do Create Next App)
- [ ] Dashboard com resumo financeiro (saldo, gastos por categoria) usando Recharts
- [ ] Telas de listagem/formulário para contas, categorias, transações, orçamentos e metas

### Outros
- [ ] Trocar a senha do usuário do banco no Neon (a connection string atual foi compartilhada em texto puro durante a configuração)
- [ ] Definir `NEXTAUTH_SECRET`/`NEXTAUTH_URL` de produção quando for fazer deploy
- [ ] Reativar o cadastro (`REGISTRATION_ENABLED`) se algum dia for preciso convidar mais alguém
