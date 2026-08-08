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
  - Aponta `pages.signIn` para `/login` (página ainda não existe — ver próximos passos)

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
- Em uso na página de login

## Próximos passos

### Autenticação / onboarding
- [x] Criar página `/login` (formulário de email + senha)
- [ ] Criar fluxo de registro (criar `User` + `Household` na primeira conta, já que hoje não existe rota/API para isso, nem a página `/register` que o login já linka)
- [ ] Proteger rotas autenticadas (middleware ou checagem de sessão nas páginas)

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
- [ ] Primeiro commit do trabalho atual (nada disso foi commitado ainda — está tudo como alterações locais)
