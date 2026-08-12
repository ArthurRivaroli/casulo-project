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

### Dashboard / home pós-login
- Criado grupo de rotas `src/app/(dashboard)/` para abrigar as páginas autenticadas com um shell compartilhado:
  - [src/app/(dashboard)/layout.tsx](<src/app/(dashboard)/layout.tsx>): busca a sessão (`getServerSession`, redireciona para `/login` se ausente, redundante com o `proxy.ts` mas defensivo), busca o nome da `Household` e renderiza o header (logo, nome da casa, nome do usuário, botão sair) na mesma identidade visual roxo/violeta do login
  - [src/components/SignOutButton.tsx](src/components/SignOutButton.tsx): client component que chama `signOut` do NextAuth
  - [src/app/(dashboard)/page.tsx](<src/app/(dashboard)/page.tsx>): resumo financeiro do mês (saldo total, receitas, despesas), lista de contas e últimas transações — com estado vazio (`EmptyState`) para quando ainda não há contas/transações cadastradas, já que os CRUDs ainda não existem
- Página padrão do Create Next App (`src/app/page.tsx`) removida
- `src/app/layout.tsx`: metadata (título/descrição) e `lang` atualizados para o Casulo
- Validado com `tsc --noEmit`, `eslint` e `next build` (rota `/` corretamente marcada como dinâmica, por causa do `getServerSession`) — **não testado no navegador nesta sessão**: o ambiente remoto não tem `DATABASE_URL`/`NEXTAUTH_SECRET` configurados, então falta validar visualmente contra o Neon assim que houver acesso

### CRUD de Contas
- Implementado com **Server Actions** (padrão recomendado pelo guia `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` para mutações no Next 16), não API routes
- [src/app/(dashboard)/contas/actions.ts](<src/app/(dashboard)/contas/actions.ts>): `createAccount`, `updateAccount`, `deleteAccount` — cada uma reautentica a sessão e escopa por `householdId` (as actions são endpoints POST alcançáveis diretamente, então não dá pra confiar só na proteção do `proxy.ts`, conforme o próprio guia do Next recomenda)
- [src/app/(dashboard)/contas/page.tsx](<src/app/(dashboard)/contas/page.tsx>): formulário de criação (Server Component puro, `<form action={createAccount}>`) + listagem
- [src/app/(dashboard)/contas/AccountRow.tsx](<src/app/(dashboard)/contas/AccountRow.tsx>): client component com edição inline (toggle) e exclusão (com `confirm()`), usando `.bind(null, account.id)` nas actions
- [src/lib/accountTypes.ts](src/lib/accountTypes.ts): labels de `AccountType` compartilhados entre a dashboard e `/contas`
- [src/components/NavLinks.tsx](src/components/NavLinks.tsx): navegação (Resumo/Contas) no header, com destaque da rota ativa via `usePathname`
- Exclusão de conta com transações vinculadas ainda vai falhar por causa da constraint de FK (`Restrict` por padrão) — não tratado agora porque não existe nenhuma transação no app ainda; revisitar quando o CRUD de `Transaction` existir
- Validado com `tsc --noEmit`, `eslint` e `next build` (rota `/contas` também dinâmica) — mesma ressalva: **não testado no navegador** por falta de `DATABASE_URL` neste ambiente

### CRUD de Categorias
- Mesmo padrão do CRUD de Contas (Server Actions, reautenticação por action, escopo por `householdId`):
  - [src/app/(dashboard)/categorias/actions.ts](<src/app/(dashboard)/categorias/actions.ts>): `createCategory`, `updateCategory`, `deleteCategory`
  - [src/app/(dashboard)/categorias/page.tsx](<src/app/(dashboard)/categorias/page.tsx>): formulário de criação (nome, tipo receita/despesa, cor) + listagem
  - [src/app/(dashboard)/categorias/CategoryRow.tsx](<src/app/(dashboard)/categorias/CategoryRow.tsx>): edição inline e exclusão, com indicador de cor (bolinha colorida) usando o campo `color` do schema (input `type="color"`, padrão `#6366f1`)
  - [src/lib/entryTypes.ts](src/lib/entryTypes.ts): labels de `EntryType` (Receita/Despesa) compartilhados
- Link "Categorias" adicionado em [src/components/NavLinks.tsx](src/components/NavLinks.tsx)
- Mesma ressalva de sempre: validado com `tsc --noEmit`, `eslint` e `next build` (rota `/categorias` dinâmica), mas **não testado no navegador** por falta de `DATABASE_URL` neste ambiente

### CRUD de Transações
- [src/app/(dashboard)/transacoes/actions.ts](<src/app/(dashboard)/transacoes/actions.ts>): `createTransaction`, `updateTransaction`, `deleteTransaction` — além do escopo por `householdId`, cada action revalida que a `accountId`/`categoryId` recebidas pertencem à household antes de gravar (não dá pra confiar no valor cru do form)
- [src/app/(dashboard)/transacoes/TransactionFields.tsx](<src/app/(dashboard)/transacoes/TransactionFields.tsx>): client component com os campos (tipo, valor, data, conta, categoria, descrição), compartilhado entre o formulário de criação e a edição inline — filtra as opções de categoria pelo tipo (receita/despesa) escolhido
- [src/app/(dashboard)/transacoes/TransactionRow.tsx](<src/app/(dashboard)/transacoes/TransactionRow.tsx>): listagem com edição inline e exclusão (mesmo padrão de Contas/Categorias)
- [src/app/(dashboard)/transacoes/page.tsx](<src/app/(dashboard)/transacoes/page.tsx>): busca contas/categorias/transações da household; se não houver conta ou categoria cadastrada, esconde o formulário e mostra um aviso com link pra `/contas` e/ou `/categorias`
- Corrigido `src/lib/auth.ts` e `src/types/next-auth.d.ts`: sessão não expunha `user.id` (só `householdId`), necessário pra gravar o `userId` de cada transação — adicionado `session.user.id = token.sub` no callback `session` (o `sub` já vem preenchido pelo NextAuth com o id do usuário desde o login)
- Datas tratadas como meio-dia local (`\`${value}T00:00:00\``) na gravação e reconstruídas a partir dos componentes locais (não `toISOString`) na edição, pra evitar o campo de data pular um dia por causa de fuso horário
- Excluir uma conta/categoria com transações vinculadas ainda vai falhar por FK constraint — segue como pendência conhecida
- Validado com `tsc --noEmit`, `eslint` e `next build` (rota `/transacoes` dinâmica) — **não testado no navegador** por falta de `DATABASE_URL` neste ambiente

### Saldo por conta
- [src/app/(dashboard)/contas/page.tsx](<src/app/(dashboard)/contas/page.tsx>) agora calcula o saldo de cada conta com `prisma.transaction.groupBy({ by: ["accountId", "type"], _sum: { amount: true } })` e passa pra [AccountRow.tsx](<src/app/(dashboard)/contas/AccountRow.tsx>), que exibe o valor (verde/vermelho/neutro conforme o sinal)
- [src/lib/formatCurrency.ts](src/lib/formatCurrency.ts): função de formatação de moeda que estava duplicada em `(dashboard)/page.tsx` e `transacoes/TransactionRow.tsx`, agora centralizada
- Validado com `tsc --noEmit`, `eslint` e `next build`

### Moeda e ajustes visuais
- Moeda trocada de Real (`pt-BR`/`BRL`) para Euro (`pt-PT`/`EUR`) em [src/lib/formatCurrency.ts](src/lib/formatCurrency.ts) — o app passou a ser usado em euros
- Nome da household ("Casa Rivaroli") removido do header — [src/app/(dashboard)/layout.tsx](<src/app/(dashboard)/layout.tsx>) não busca mais o `Household` do banco, já que não tinha mais nenhum uso pra esse dado
- Navegação do header em negrito ([src/components/NavLinks.tsx](src/components/NavLinks.tsx))
- Títulos em negrito (`font-bold` em vez de `font-semibold`): título de cada página (`h1`), títulos de seção da dashboard (`h2`) e o rótulo dos cards de resumo (Saldo total/Receitas/Despesas)
- Validado com `tsc --noEmit`, `eslint` e `next build`

## Próximos passos

### Autenticação / onboarding
- [x] Criar página `/login` (formulário de email + senha)
- [x] Criar fluxo de registro (cria `User` + `Household` na primeira conta) — depois desabilitado (uso restrito)
- [x] Proteger rotas autenticadas (`src/proxy.ts`)

### Funcionalidades principais (CRUD)
- [x] Server Actions para `Account` (criar, listar, editar, excluir contas)
- [x] Server Actions para `Category` (criar, listar, editar, excluir categorias)
- [x] Server Actions para `Transaction` (lançar receitas/despesas, listar, editar, excluir)
- [ ] Server Actions/rotas para `Budget` (definir orçamento mensal por categoria)
- [ ] Server Actions/rotas para `Goal` (criar e acompanhar metas de economia)
- [ ] Tratar exclusão de `Account`/`Category` com transações vinculadas (hoje quebra por FK constraint)

### Interface
- [x] Layout/navegação principal pós-login (substituir a página padrão do Create Next App)
- [x] Dashboard com resumo financeiro básico (saldo, receitas/despesas do mês, últimas transações)
- [x] Tela de listagem/formulário para contas (`/contas`)
- [x] Tela de listagem/formulário para categorias (`/categorias`)
- [x] Tela de listagem/formulário para transações (`/transacoes`)
- [ ] Trocar cálculo de saldo/gráficos para usar Recharts (por enquanto são só números)
- [ ] Validar dashboard, `/contas`, `/categorias` e `/transacoes` no navegador contra dados reais do Neon — inclui testar login de novo, já que `auth.ts` mudou (sessão agora carrega `user.id`)
- [ ] Telas de listagem/formulário para orçamentos e metas

### Outros
- [ ] Trocar a senha do usuário do banco no Neon (a connection string atual foi compartilhada em texto puro durante a configuração)
- [ ] Definir `NEXTAUTH_SECRET`/`NEXTAUTH_URL` de produção quando for fazer deploy
- [ ] Reativar o cadastro (`REGISTRATION_ENABLED`) se algum dia for preciso convidar mais alguém
