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

### CRUD de Orçamento
- [src/app/(dashboard)/orcamentos/actions.ts](<src/app/(dashboard)/orcamentos/actions.ts>): `setBudget(categoryId, month, year, formData)` — faz `upsert` usando a constraint única `householdId_categoryId_month_year` do schema; se o campo vier vazio ou ≤ 0, apaga o orçamento daquele mês em vez de gravar zero
- [src/app/(dashboard)/orcamentos/page.tsx](<src/app/(dashboard)/orcamentos/page.tsx>): uma linha por categoria de **despesa** (orçamento só faz sentido pra categorias `EXPENSE`, categorias de receita não aparecem aqui) com o valor já gasto no mês, campo de orçamento editável e barra de progresso (verde/amarelo/vermelho conforme o percentual); navegação entre meses via `?month=&year=` na URL (sem JS, só `Link`)
- Usa `PageProps<'/orcamentos'>` (helper gerado pelo Next) já que `searchParams` é uma Promise no Next 16
- Link "Orçamento" adicionado em [src/components/NavLinks.tsx](src/components/NavLinks.tsx)
- Validado com `tsc --noEmit`, `eslint` e `next build` (rota `/orcamentos` dinâmica) — **não testado no navegador** por falta de `DATABASE_URL` neste ambiente

### CRUD de Metas
- [src/app/(dashboard)/metas/actions.ts](<src/app/(dashboard)/metas/actions.ts>): `createGoal`, `updateGoal`, `deleteGoal` (mesmo padrão de sempre) + `contributeToGoal(id, formData)` — soma (ou subtrai, se o valor digitado for negativo) o campo `amount` ao `currentAmount` da meta, sem precisar abrir o formulário de edição inteiro; nunca deixa `currentAmount` ficar negativo (`Math.max(0, ...)`)
- [src/app/(dashboard)/metas/GoalRow.tsx](<src/app/(dashboard)/metas/GoalRow.tsx>): edição inline (nome, valor guardado, meta, prazo), barra de progresso, e um formulário rápido de "Adicionar guardado" (some quando a meta já foi atingida)
- [src/app/(dashboard)/metas/page.tsx](<src/app/(dashboard)/metas/page.tsx>): formulário de criação (nome, valor da meta, prazo opcional) + listagem ordenada por prazo (sem prazo fica por último, comportamento padrão do Postgres pra `ORDER BY ... ASC` com `NULL`)
- Link "Metas" adicionado em [src/components/NavLinks.tsx](src/components/NavLinks.tsx)
- Validado com `tsc --noEmit`, `eslint` e `next build` (rota `/metas` dinâmica) — **não testado no navegador** por falta de `DATABASE_URL` neste ambiente

### Exclusão de Conta/Categoria com dados vinculados
- Antes disso, excluir uma conta ou categoria com transações (ou orçamentos, no caso de categoria) vinculadas quebrava com um erro de constraint de chave estrangeira do Postgres — sem mensagem amigável, só o crash genérico do Next
- Seguido o padrão oficial do Next.js pra "expected errors" (`node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`): em vez de `throw`, as actions de exclusão agora **retornam** `{ error: string | null }` e são conectadas via `useActionState` no componente, que exibe a mensagem inline — `throw` fica reservado pra bugs de verdade (que caem no error boundary genérico), não pra erros esperados como "essa conta ainda tem transações"
  - [src/app/(dashboard)/contas/actions.ts](<src/app/(dashboard)/contas/actions.ts>): `deleteAccount` agora checa `prisma.transaction.count` antes de excluir e retorna erro descritivo se houver transações
  - [src/app/(dashboard)/categorias/actions.ts](<src/app/(dashboard)/categorias/actions.ts>): `deleteCategory` checa `transaction.count` **e** `budget.count` (uma categoria pode estar em uso nos dois lugares)
  - [src/app/(dashboard)/contas/AccountRow.tsx](<src/app/(dashboard)/contas/AccountRow.tsx>) e [src/app/(dashboard)/categorias/CategoryRow.tsx](<src/app/(dashboard)/categorias/CategoryRow.tsx>): usam `useActionState` pro botão Excluir, mostram a mensagem de erro abaixo da linha e desabilitam o botão enquanto a exclusão está em andamento
- [eslint.config.mjs](eslint.config.mjs): adicionado `argsIgnorePattern: "^_"` em `no-unused-vars`, já que a assinatura exigida por `useActionState` (`(id, prevState, formData)`) deixa `prevState`/`formData` sem uso nessas actions
- Validado com `tsc --noEmit`, `eslint` e `next build` — **não testado no navegador** por falta de `DATABASE_URL` neste ambiente

### Gráficos com Recharts
- Segui a skill de dataviz do projeto antes de escrever qualquer gráfico (forma → cor → validar → marcas → interação → acessibilidade), em vez de sair colocando cor/tipo de gráfico "no olho"
- **Gastos por categoria** ([ExpenseByCategoryChart.tsx](<src/app/(dashboard)/ExpenseByCategoryChart.tsx>)): barra horizontal, uma por categoria de despesa do mês, ordenada por valor — usa a cor que a própria categoria já tem no schema (`Category.color`), a mesma bolinha usada em `/categorias` e `/orcamentos`, em vez de inventar uma paleta nova; nome da categoria fica no eixo Y (identidade nunca só por cor)
- **Evolução do saldo** ([MonthlyBalanceChart.tsx](<src/app/(dashboard)/MonthlyBalanceChart.tsx>)): barras divergentes dos últimos 6 meses (receitas − despesas), verde/vermelho a partir de uma linha de referência em zero — as mesmas cores (`#059669`/`#dc2626`) já usadas no resto do app pra receita/despesa
- Rodei o validador de paleta da skill (`scripts/validate_palette.js`) no par verde/vermelho antes de usar — passou em todos os checks (contraste, daltonismo, etc.), e o gráfico ainda tem a posição acima/abaixo da linha de zero como reforço não-dependente de cor
- [ChartTooltip.tsx](<src/app/(dashboard)/ChartTooltip.tsx>): tooltip customizado compartilhado pelos dois gráficos, estilizado com os tokens do app (não o tooltip branco padrão do Recharts, que destoava no dark mode)
- Ambos os gráficos calculados a partir das transações que a dashboard já buscava — nenhuma query nova no banco
- Validado com `tsc --noEmit`, `eslint` e `next build` — **não testado no navegador** por falta de `DATABASE_URL` neste ambiente (o `next build` valida o bundle/tipos, mas não renderiza o SVG de verdade com dados reais)

## Próximos passos

### Autenticação / onboarding
- [x] Criar página `/login` (formulário de email + senha)
- [x] Criar fluxo de registro (cria `User` + `Household` na primeira conta) — depois desabilitado (uso restrito)
- [x] Proteger rotas autenticadas (`src/proxy.ts`)

### Funcionalidades principais (CRUD)
- [x] Server Actions para `Account` (criar, listar, editar, excluir contas)
- [x] Server Actions para `Category` (criar, listar, editar, excluir categorias)
- [x] Server Actions para `Transaction` (lançar receitas/despesas, listar, editar, excluir)
- [x] Server Actions para `Budget` (definir orçamento mensal por categoria de despesa)
- [x] Server Actions para `Goal` (criar, editar, excluir metas e registrar valor guardado)
- [x] Tratar exclusão de `Account`/`Category` com transações/orçamentos vinculados (mensagem amigável via `useActionState`, sem quebrar a página)

### Interface
- [x] Layout/navegação principal pós-login (substituir a página padrão do Create Next App)
- [x] Dashboard com resumo financeiro básico (saldo, receitas/despesas do mês, últimas transações)
- [x] Tela de listagem/formulário para contas (`/contas`)
- [x] Tela de listagem/formulário para categorias (`/categorias`)
- [x] Tela de listagem/formulário para transações (`/transacoes`)
- [x] Tela de orçamento por categoria com navegação por mês (`/orcamentos`)
- [x] Tela de listagem/formulário para metas (`/metas`)
- [x] Gráficos com Recharts na dashboard (gasto por categoria, evolução do saldo)
- [x] PWA instalável (manifest + ícones + aviso de instalação no iOS) — ver seção própria abaixo
- [ ] Validar dashboard, `/contas`, `/categorias`, `/transacoes`, `/orcamentos` e `/metas` no navegador contra dados reais do Neon — inclui testar login de novo, já que `auth.ts` mudou (sessão agora carrega `user.id`)

Com isso, todas as entidades do schema (`Account`, `Category`, `Transaction`, `Budget`, `Goal`) têm CRUD via Server Actions, e a dashboard já tem gráficos. O que falta é validação real no navegador.

### Preparação para deploy em produção
- Achado um problema real que ia quebrar o build em produção: `package.json` não rodava `prisma generate` em lugar nenhum. Como `src/generated/prisma` é gerado (não vai pro git — `.gitignore`), um deploy limpo (`npm install` + `next build`) simplesmente não encontraria `@/generated/prisma/client` e quebraria. Adicionado `"postinstall": "prisma generate"` em [package.json](package.json), que roda automaticamente depois de `npm install` — tanto localmente (não precisa mais lembrar de rodar `npx prisma generate` à mão) quanto no Vercel
- Testado: apaguei `src/generated` e rodei `npm install` de novo — o `postinstall` gerou o client sozinho
- `next.config.ts` não precisa de nada especial pro Vercel (isso só seria necessário pra self-host/Docker com `output: "standalone"`)
- Notado (não corrigido): `npm audit` acusa 3 vulnerabilidades "high" em `deepmerge-ts` (dependência transitiva do `@prisma/config`, usada só pra ler `prisma.config.ts`) — é uma exaustão de pilha ao mesclar objetos profundamente recursivos, risco baixo pra esse projeto (config pequeno, sem input de usuário nele). A correção automática (`npm audit fix --force`) rebaixaria o Prisma pra v6, quebrando todo o setup do gerador `prisma-client` customizado — não fiz isso sem confirmar com o usuário
- Validado com `tsc --noEmit`, `eslint` e `next build`
- Segue pendente (ação do usuário, fora do código): definir `NEXTAUTH_SECRET` e `NEXTAUTH_URL` de produção no painel do serviço de deploy (ex: Vercel), com valores diferentes dos usados em `.env` local
- Segue pendente: trocar a senha do usuário do banco no Neon (a connection string atual foi compartilhada em texto puro durante a configuração) — instruções passadas ao usuário, aguardando confirmação

### PWA instalável (Camada 1)
- Escopo decidido com o usuário: só instalável (manifest + ícones + aviso no iOS), sem push notifications nem service worker/offline — isso ficaria pra uma "Camada 2" bem mais trabalhosa (chaves VAPID, guardar inscrições no banco) que não faz sentido ainda pra um app de 2 pessoas
- [src/app/manifest.ts](<src/app/manifest.ts>): nome, cores (`#1e1b4b`, o indigo-950 do header), `display: "standalone"`
- [src/app/icon.tsx](<src/app/icon.tsx>) e [src/app/apple-icon.tsx](<src/app/apple-icon.tsx>): ícones gerados em código via `ImageResponse` (`next/og`), não arquivos estáticos — reaproveitam o gradiente roxo/violeta da marca com uma versão simplificada do casulo (uma elipse branca com contorno preto); o desenho detalhado do [Logo.tsx](src/components/Logo.tsx) não foi replicado porque não ficaria legível em 512×512 nem seria garantidamente compatível com o subconjunto de CSS que o satori (motor por trás do `ImageResponse`) suporta
- [src/lib/appIconMark.tsx](src/lib/appIconMark.tsx): desenho do ícone compartilhado entre `icon.tsx` (512×512, geral) e `apple-icon.tsx` (180×180, padrão da Apple pro ícone de tela de início)
- Validado renderizando de verdade: rodei `next build` (que gera os ícones estaticamente) e conferi o PNG resultante — bateu com a paleta esperada
- [src/app/layout.tsx](<src/app/layout.tsx>): adicionado `appleWebApp` (modo standalone no iOS, sem a barra do Safari) e um `viewport.themeColor` (a barra de status/instalação usa a cor da marca em vez do cinza padrão)
- [src/components/InstallPrompt.tsx](src/components/InstallPrompt.tsx): aviso discreto só pro Safari iOS (que não mostra prompt de instalação automático como o Chrome/Android), com "Dispensar" salvo no `localStorage`; usado em [src/app/(dashboard)/layout.tsx](<src/app/(dashboard)/layout.tsx>)
- **Nota importante**: sem service worker, o Chrome/Android pode não disparar o banner *automático* de instalação (o "mini-infobar"), mas "Adicionar à tela de início" continua disponível manualmente pelo menu do navegador em qualquer plataforma — isso já é suficiente pro objetivo de "instalar como app"
- Validado com `tsc --noEmit`, `eslint` e `next build` — os ícones/manifest são estáticos e não dependem do banco, então essa parte já foi validada de verdade (não só compilada)

### Ajustes de layout mobile (primeiro teste real no celular)
- Usuário testou local pelo celular e mandou print: header quebrando/embolando (logo + 6 links de nav + nome/sair tudo espremido numa linha) e o gráfico "Evolução do saldo" aparecendo cortado com o indicador de erro do Next por cima
- **Erro investigado**: o "1 issue" era um aviso de hidratação (`bis_skin_checked` no diff) — assinatura clássica de extensão de segurança/antivírus no navegador do celular injetando atributo no DOM depois do HTML do servidor. **Não é bug do Casulo**; confirmável testando em aba anônima (que desativa extensões). Nenhuma mudança de código necessária aqui
- **Header corrigido**: dividido em duas linhas — logo + usuário/sair no topo, navegação numa faixa própria abaixo
- **Menu mobile com gaveta lateral** (pedido explícito do usuário em vez de só scroll horizontal):
  - [src/lib/navLinks.ts](src/lib/navLinks.ts): lista de links do nav extraída pra um lugar só, usada tanto pelo nav horizontal (desktop) quanto pela gaveta (mobile)
  - [src/components/MobileNav.tsx](src/components/MobileNav.tsx): botão hambúrguer que abre uma gaveta lateral (fundo com overlay escuro, fecha no X, no clique fora ou em Esc) com os links empilhados, nome do usuário e Sair — some ao clicar num link
  - [src/components/NavLinks.tsx](src/components/NavLinks.tsx): sem mudança de comportamento, só passou a importar a lista compartilhada
  - [src/app/(dashboard)/layout.tsx](<src/app/(dashboard)/layout.tsx>): `MobileNav` visível só abaixo do breakpoint `sm`, nav horizontal + nome/sair visíveis só a partir do `sm` (`hidden sm:flex` / `sm:hidden`)
- Validado com `tsc --noEmit`, `eslint` e `next build` — layout/JS validado, mas o comportamento visual da gaveta em si ainda não foi visto num navegador de verdade (precisa de outro teste do usuário)

### Despesa fixa e compra parcelada
- Decidido com o usuário: as duas opções **geram transações de verdade** (não são só uma etiqueta) — "Fixa" repete o mesmo valor todo mês por N meses; "Parcelada" divide o valor total em N parcelas mensais
- **Mudança de schema** (primeira desde o início do projeto) em [prisma/schema.prisma](prisma/schema.prisma), `Transaction` ganhou: `isFixed` (bool), `installmentNumber`/`installmentTotal` (int, nulos fora de parcelamento) e `recurrenceGroupId` (liga as transações irmãs geradas juntas, hoje só informativo)
- **⚠️ Requer migração no banco**: criada à mão em [prisma/migrations/20260821120000_add_transaction_recurrence/migration.sql](<prisma/migrations/20260821120000_add_transaction_recurrence/migration.sql>) (só `ADD COLUMN`, sem risco de perda de dado) — escrita manualmente porque este ambiente não tem acesso ao Neon pra rodar `prisma migrate dev`. **Antes de testar, rodar `npx prisma migrate deploy` localmente** (aplica as migrações pendentes direto, sem precisar de shadow database) — sem isso o app vai quebrar tentando ler/gravar colunas que ainda não existem no banco
- [src/app/(dashboard)/transacoes/actions.ts](<src/app/(dashboard)/transacoes/actions.ts>): `createTransaction` ganhou os modos `FIXED`/`INSTALLMENT` — usa `prisma.transaction.createMany` pra criar todas as ocorrências de uma vez
  - `addMonthsClamped`: soma meses a uma data "clampando" o dia (ex: 31 de janeiro + 1 mês vira 28/29 de fevereiro, não vira março) — testado à parte, inclusive em ano bissexto
  - `splitAmount`: divide o valor total em N parcelas em centavos exatos, distribuindo o resto do arredondamento nas primeiras parcelas em vez de jogar tudo na última — testado à parte (soma sempre bate com o total, mesmo com centavos quebrados)
  - Editar ou excluir uma transação continua afetando só aquela linha (decisão deliberada: gerar em lote na criação, mas sem lógica de "editar a série toda" — mais simples e sem risco de apagar várias linhas por engano)
- [src/app/(dashboard)/transacoes/TransactionFields.tsx](<src/app/(dashboard)/transacoes/TransactionFields.tsx>): campo "Repetição" (Nenhuma/Fixa/Parcelada) só aparece no formulário de criação (`showRecurrenceOptions`), não na edição inline de uma ocorrência já existente; o rótulo do valor muda pra "Valor total" quando parcelada
- [src/components/RecurrenceBadge.tsx](src/components/RecurrenceBadge.tsx): badge "Fixa" ou "3/12" ao lado da descrição — usado em [TransactionRow.tsx](<src/app/(dashboard)/transacoes/TransactionRow.tsx>) e nas "Transações recentes" da dashboard
- Validado com `tsc --noEmit`, `eslint` e `next build` — **não testado no navegador** (precisa da migração aplicada primeiro)

### Simplificação do Resumo
- Logo no header (desktop e gaveta mobile) agora é um `Link` pra `/` — antes não levava a lugar nenhum
- Removida a data ("Agosto de 2026") do topo do Resumo
- Removidos os 3 cards de resumo (Saldo total, Receitas do mês, Despesas do mês) — decisão do usuário depois de eu sugerir manter só o Saldo total como número único (a única info que não aparece em nenhum outro lugar do app); ele preferiu simplificar e deixar só os dois gráficos mesmo, então a página Resumo agora é: título, os dois gráficos, Contas, Transações recentes
- [src/app/(dashboard)/page.tsx](<src/app/(dashboard)/page.tsx>): removido o componente `SummaryCard` e os cálculos de `income`/`expense`/`balance` que só alimentavam os cards (não tinham mais uso)
- Validado com `tsc --noEmit`, `eslint` e `next build`

### Metas viraram "pocket" com extrato (depósito/retirada ligado a uma conta)
- Pedido do usuário: guardar/retirar dinheiro de uma meta deveria funcionar como uma carteira ("pocket") ligada a uma conta real (ex: Novo Banco, Revolut), com data e valor — e o saldo dessa conta em `/contas` deveria refletir isso de verdade. Perguntei explicitamente se deveria só ser uma anotação separada ou afetar o saldo real; o usuário confirmou que quer afetar o saldo
- **Segunda mudança de schema em sequência** — novo modelo `GoalEntry` (o "lançamento" da meta): `amount` (positivo = depósito, negativo = retirada), `date`, `accountId`, e um `transactionId` único ligado a uma `Transaction` de verdade. `Goal.currentAmount` foi **removido** — agora é sempre calculado somando os `GoalEntry` da meta (mesmo padrão já usado em Conta/Orçamento: nada de saldo guardado que possa dessincronizar)
- **Como funciona**: cada depósito cria uma `Transaction` tipo `EXPENSE` (sai da conta) numa categoria "Poupança" (criada automaticamente na primeira vez); cada retirada cria uma `Transaction` tipo `INCOME` (volta pra conta) numa categoria "Resgate de poupança". Isso significa que guardar dinheiro numa meta agora aparece em `/transacoes`, conta no saldo da conta em `/contas` e entra nos gráficos ("Poupança" pode aparecer em "Gastos por categoria" — é uma consequência esperada de fazer o dinheiro sair de verdade da conta, não um bug; se incomodar dá pra ajustar depois)
- **⚠️ Requer nova migração**: [prisma/migrations/20260821130000_add_goal_entries/migration.sql](<prisma/migrations/20260821130000_add_goal_entries/migration.sql>) — remove a coluna `Goal.currentAmount` (**qualquer valor já guardado ali antes dessa mudança se perde** — só importa se algum valor real já tinha sido lançado via "Adicionar guardado" antigo) e cria a tabela `GoalEntry`. Rodar `npx prisma migrate deploy` de novo antes de testar
- [src/app/(dashboard)/metas/actions.ts](<src/app/(dashboard)/metas/actions.ts>): `addGoalEntry` cria a `Transaction` e o `GoalEntry` juntos numa `prisma.$transaction` (atômico — ou os dois são criados, ou nenhum); `deleteGoalEntry` apaga os dois juntos também
- [src/app/(dashboard)/transacoes/actions.ts](<src/app/(dashboard)/transacoes/actions.ts>): `deleteTransaction` agora também bloqueia (com mensagem amigável, via `useActionState`, mesmo padrão de Conta/Categoria) a exclusão de uma transação que foi gerada por um lançamento de meta — tem que excluir pela página de Metas
- [src/app/(dashboard)/metas/GoalRow.tsx](<src/app/(dashboard)/metas/GoalRow.tsx>): cada meta agora mostra o extrato completo (data, conta, valor com sinal, botão excluir por lançamento) e um formulário de "Depósito/Retirada" com conta, valor e data
- **Decisão de escopo**: editar um lançamento não é suportado (só criar e excluir) — pra corrigir um valor, exclui e lança de novo. Mais simples, evita ter que sincronizar edição em duas tabelas
- [src/lib/dateInput.ts](src/lib/dateInput.ts): `toDateInputValue` extraído (estava duplicado em `TransactionRow.tsx`, agora também usado em `GoalRow.tsx`/`metas/page.tsx`)
- Validado com `tsc --noEmit`, `eslint` e `next build` — **não testado no navegador** (precisa das duas migrações aplicadas primeiro)

### Excluir uma ocorrência ou a série inteira (fixa/parcelada)
- Em `/transacoes`, uma transação que faz parte de uma série (tem `recurrenceGroupId`, ou seja, veio de uma despesa fixa ou compra parcelada) agora mostra dois botões: **"Excluir esta"** (só aquela ocorrência, comportamento de sempre) e **"Excluir série"** (todas as transações daquele `recurrenceGroupId`). Transação avulsa continua só com "Excluir"
- [src/app/(dashboard)/transacoes/actions.ts](<src/app/(dashboard)/transacoes/actions.ts>): `deleteTransactionSeries` — mesmo padrão de erro amigável via `useActionState` das outras exclusões; também bloqueia se alguma transação da série estiver ligada a uma meta (mesma checagem do `deleteTransaction` individual)
- Deletar uma ocorrência não renumera as outras (ex: excluir a parcela 3/12 não vira as demais em "3/11") — é histórico, fica como estava
- Validado com `tsc --noEmit`, `eslint` e `next build`

### Diagnóstico de sessão: Prisma Client desatualizado no Windows (não era bug do Casulo)
- Depois de puxar as mudanças de schema (Metas), o usuário via `PrismaClientValidationError: Unknown field 'entries'` mesmo com a migração aplicada (`prisma migrate status` confirmou banco em dia)
- Causa: o `npx prisma generate` regenera os arquivos em `src/generated/prisma`, mas o processo do `npm run dev` já estava rodando com o client antigo carregado em memória — regenerar os arquivos no disco não atualiza um processo já em execução. Resolvido parando o `npm run dev` (Ctrl+C, esperar o prompt voltar) e rodando de novo do zero
- Nota registrada aqui pra não repetir o mesmo ciclo de diagnóstico numa próxima mudança de schema: depois de qualquer migração, sempre **parar e reiniciar o `npm run dev`**, não só rodar `prisma generate` com o servidor ainda de pé

### Ícones Feather, data DD/MM/AAAA e layout mobile do formulário de transações
- **Ícones**: os botões "Editar"/"Excluir" (texto) viraram ícones do Feather Icons (lápis/lixeira) em Contas, Categorias, Transações e Metas — [src/components/icons.tsx](src/components/icons.tsx) traz os dois SVGs inline (mesmo estilo já usado nos ícones de hambúrguer/fechar do menu mobile: `viewBox 24x24`, `stroke=currentColor`), sem adicionar dependência nova. Validei renderizando os SVGs isolados com Playwright antes de usar, pra garantir que batem com o desenho real do Feather. Em `/transacoes`, o botão "Excluir série" manteve a palavra "série" ao lado do ícone (é uma ação mais destrutiva — apaga várias transações de uma vez — então mantive texto por clareza/segurança, só ícone sozinho ficaria ambíguo)
- **Data sempre DD/MM/AAAA**: as datas exibidas usavam `toLocaleDateString` com locale variando entre `"pt-BR"` e `"pt-PT"` conforme o arquivo (inconsistente, e dependente de como o navegador/SO interpreta a locale). Criado [src/lib/formatDate.ts](src/lib/formatDate.ts) que monta a string manualmente (sem depender de locale) e usado em `TransactionRow.tsx`, `(dashboard)/page.tsx` e `GoalRow.tsx` — as labels de gráfico (mês abreviado) continuam usando locale normalmente, isso é outra coisa (não é uma data completa)
- **Layout mobile do formulário de transações**: trocado `flex flex-wrap` por `grid grid-cols-2 gap-3 sm:flex sm:flex-wrap` no formulário de criação (`/transacoes`) e na edição inline (`TransactionRow.tsx`), pra os campos pareggarem em 2 colunas de forma previsível no celular em vez do wrap desigual de antes. Campo "Descrição" ocupa a linha inteira (`col-span-2`) por ser texto livre; valor/meses/parcelas usam `w-full` no mobile e voltam pra largura fixa (`sm:w-28`/`sm:w-24`) no desktop
- Validado com `tsc --noEmit`, `eslint` e `next build` — o visual em si (grade mobile, ícones no contexto real da página) ainda não foi visto no navegador de verdade

### Deploy na Vercel — corrigido `Module not found: Can't resolve '@/generated/prisma/client'`
- Primeiro deploy na Vercel quebrou com esse erro mesmo com o `"postinstall": "prisma generate"` já no `package.json` — o passo de instalação da Vercel não gerou o client antes do `next build` rodar (motivo exato incerto: cache de instalação, pulo de scripts, etc.)
- Corrigido de forma mais robusta, colocando o `prisma generate` **dentro do próprio comando de build**, não só no `postinstall`: `"build": "prisma generate && next build"` em [package.json](package.json) — assim o client é gerado logo antes do build rodar, não importa o que aconteça no passo de instalação. Mantido o `postinstall` também (ajuda no dia a dia local depois de um `npm install`)
- Testado simulando o cenário exato da Vercel: apaguei `src/generated` e rodei só `npm run build` (mesmo comando que a Vercel executa) — funcionou de ponta a ponta
- Repositório na Vercel deve apontar pra branch `master-qe8ke3` (onde está todo o trabalho); a PR pra `master` ainda não foi mesclada
- Env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) precisaram ser adicionadas manualmente no painel da Vercel (projeto começou sem nenhuma) — sem elas o NextAuth quebra com `[next-auth][error][NO_SECRET]` e a tela `/api/auth/error?error=Configuration`. Confirmar que cada uma está marcada pros três ambientes (Production/Preview/Development), não só Production
- Confirmado pelo status da PR no GitHub que o deployment do commit desta correção (`31386bf`) sempre built com sucesso — erros de "module not found" reaparecendo depois disso eram o usuário reabrindo/reimplantando uma entrada antiga na lista de Deployments da Vercel, não uma regressão real

### Botão único de excluir transação (em vez de dois)
- Ajuste pedido logo depois de eu ter implementado "Excluir esta" + "Excluir série" como dois botões separados — o usuário queria só **um** botão, que decide sozinho o que perguntar
- [src/app/(dashboard)/transacoes/TransactionRow.tsx](<src/app/(dashboard)/transacoes/TransactionRow.tsx>): trocado os dois `<form>`/`useActionState` por um único botão com `useTransition`, chamando `deleteTransaction`/`deleteTransactionSeries` diretamente (as Server Actions continuam as mesmas, só a forma de invocar do cliente mudou). Se a transação é avulsa: um `confirm()` só. Se faz parte de série: primeiro `confirm()` pergunta "OK = série inteira, Cancelar = só esta ocorrência" e, se cancelar, um segundo `confirm()` pra essa opção — dá pra escolher entre 3 caminhos (série / só esta / nada) com dois diálogos nativos
- Validado com `tsc --noEmit`, `eslint` e `next build`

### Gerenciamento de usuários (admin) — `isAdmin`
- Pedido: criar/editar/excluir usuários da casa pelo app, em vez de direto no banco. Decidido com o usuário: só uma conta é "admin" (Arthur) e só ela pode gerenciar; quem cria já define a senha do novo usuário direto no formulário (sem envio de e-mail)
- **Terceira mudança de schema**: `User` ganhou `isAdmin Boolean @default(false)`. Migração em [prisma/migrations/20260821140000_add_user_is_admin/migration.sql](<prisma/migrations/20260821140000_add_user_is_admin/migration.sql>) — além do `ADD COLUMN`, já inclui o `UPDATE` marcando `arthur.rivaroli21@gmail.com` como admin (confirmado com o usuário antes de escrever)
- **⚠️ Requer migração**: rodar `npx prisma migrate deploy` de novo (e lembrar de reiniciar o `npm run dev` depois do `prisma generate`, como já documentado acima)
- `isAdmin` propagado pra sessão do NextAuth: [src/lib/auth.ts](src/lib/auth.ts) (`authorize`, `jwt`, `session`) e [src/types/next-auth.d.ts](src/types/next-auth.d.ts) — mesmo padrão já usado pra `householdId`/`id`
- [src/app/(dashboard)/usuarios/actions.ts](<src/app/(dashboard)/usuarios/actions.ts>): `createUser`/`updateUser` (throw em erro, mesmo padrão de Conta/Categoria/Meta) e `deleteUser` (via `useActionState`, mesmo padrão de exclusão de Conta/Categoria/Transação) — `deleteUser` bloqueia excluir a própria conta, excluir o único usuário da casa, e excluir alguém com transações lançadas (mesma checagem de FK já usada em outros lugares)
- Cada Server Action reverifica `session.user.isAdmin` internamente (`requireAdmin()`) — não basta esconder o link do menu, já que Server Actions são endpoints alcançáveis diretamente
- [src/app/(dashboard)/usuarios/page.tsx](<src/app/(dashboard)/usuarios/page.tsx>): redireciona pra `/` se quem acessa não for admin; formulário de criação (nome, email, senha) + listagem
- [src/app/(dashboard)/usuarios/UserRow.tsx](<src/app/(dashboard)/usuarios/UserRow.tsx>): edição inline (nome, email, "nova senha" opcional — em branco mantém a atual) e exclusão; botão de excluir some na própria linha do usuário logado
- Link "Usuários" no nav (desktop e gaveta mobile) só aparece pra admin — [src/lib/navLinks.ts](src/lib/navLinks.ts) ganhou uma flag `adminOnly`, [NavLinks.tsx](src/components/NavLinks.tsx)/[MobileNav.tsx](src/components/MobileNav.tsx) agora recebem `isAdmin` como prop e filtram a lista
- Validado com `tsc --noEmit`, `eslint` e `next build`, incluindo o teste de simular o build da Vercel (apagar `src/generated` + `npm run build`) — **não testado no navegador**

### Auditoria de segurança e correções de hardening
- Pedido: varrer o app inteiro em busca de vulnerabilidades de invasão e melhorias. Rodei 3 sub-agentes em paralelo (autenticação/sessão, autorização/IDOR em todas as Server Actions, validação de input/headers/config). **Resultado geral: isolamento entre households já era sólido** — toda Server Action escopa `update`/`delete`/`findFirst` por `{ id, householdId }` derivado da sessão do servidor, nunca de campo enviado pelo cliente; sem SQL cru, sem `dangerouslySetInnerHTML`, sem `.env` vazado
- Um dos agentes reportou o `src/proxy.ts` (middleware de auth) como quebrado, citando o `.next/server/middleware-manifest.json` vazio. Investiguei manualmente (doc do Next 16 em `node_modules/next/dist/docs/.../proxy.md`, testei com o dev server rodando de verdade: uma requisição sem sessão pra `/contas` foi interceptada e redirecionada) — confirmado que o `proxy.ts` está correto e ativo; o manifest vazio é só um artefato do Turbopack, não evidência de falha. Descartado como falso positivo
- **Rate limiting no login** (não existia nenhum): [src/lib/rateLimit.ts](src/lib/rateLimit.ts) — limitador em memória por email (5 tentativas / 15 min de bloqueio), simples e suficiente pra um app de uso doméstico com poucos usuários. Usado em `authorize()` ([src/lib/auth.ts](src/lib/auth.ts))
- **Timing attack corrigido**: `authorize()` agora sempre roda `bcrypt.compare` (contra um hash fixo quando o email não existe), em vez de retornar antes — evita descobrir se um email existe pelo tempo de resposta
- **`auth.ts`**: `secret: process.env.NEXTAUTH_SECRET` explícito (evita repetir o incidente de produção `NO_SECRET` documentado acima, de forma silenciosa) e `session.maxAge` de 7 dias (era o padrão de 30 dias do NextAuth)
- [src/app/login/page.tsx](src/app/login/page.tsx): agora mostra a mensagem de bloqueio por tentativas quando existir, em vez de sempre "Email ou senha inválidos."
- **Teto de valor monetário**: `parseAmount` em `transacoes/actions.ts`, `metas/actions.ts` e o parse inline em `orcamentos/actions.ts` agora rejeitam valores acima de 1 bilhão — evitava um valor absurdamente grande (ainda "finito") virar `Infinity` depois de `splitAmount` multiplicar por 100 e corromper os saldos agregados da casa inteira
- **Headers de segurança HTTP**: [next.config.ts](next.config.ts) ganhou `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `Strict-Transport-Security` — não existia nenhum antes. CSP ficou de fora por ora (precisa de mais ajuste fino pra não quebrar nada)
- **Senha mínima unificada em 8 caracteres**: `usuarios/actions.ts` (`MIN_PASSWORD_LENGTH`) era 6, a rota de registro (desativada) já era 8 — unificado
- [src/app/(dashboard)/usuarios/actions.ts](<src/app/(dashboard)/usuarios/actions.ts>): `deleteUser` contava as transações do usuário sem escopar por `householdId` (não era um IDOR de verdade — o delete de fato já era escopado — mas podia gerar uma contagem/mensagem de erro equivocada) — corrigido
- Validado com `next build` (sucesso, inclusive confirmando `ƒ Proxy (Middleware)` ativo no output) e `eslint` (sem erros); testado manualmente com o dev server: headers de segurança presentes via `curl -I`
- **⚠️ Requer env var em produção**: nada novo além do já documentado (`NEXTAUTH_SECRET`/`DATABASE_URL`/`NEXTAUTH_URL` já configurados na Vercel) — só reforça que `NEXTAUTH_SECRET` precisa continuar setado, senão o app falha alto e claro em vez de silenciosamente

### Melhorias no Orçamento — resumo total, copiar mês anterior, aviso de estouro
- A tela `/orcamentos` já existia (orçamento mensal por categoria + gasto do mês + barra de progresso); pedido era melhorá-la, não recriá-la. Escolhidas as 3 melhorias: resumo total do mês, copiar orçamento do mês anterior, aviso quando estourar
- [src/app/(dashboard)/orcamentos/page.tsx](<src/app/(dashboard)/orcamentos/page.tsx>): novo card de resumo no topo — **Orçamento total** (soma dos valores definidos) vs **Gasto total** (soma de todas as categorias de despesa do mês, orçadas ou não), com selo de status (bom/perto do limite/estourado, ícone + texto, nunca só cor) e um banner listando as categorias que passaram do orçamento. Cada categoria também ganhou o rótulo "Estourado" (ícone + texto) quando `spent > budgetAmount`
- **Copiar orçamento do mês anterior**: [src/app/(dashboard)/orcamentos/actions.ts](<src/app/(dashboard)/orcamentos/actions.ts>) ganhou `copyPreviousMonthBudgets(month, year)` — só preenche categorias que **ainda não têm** orçamento no mês atual (nunca sobrescreve um valor já definido); o link só aparece na página quando há algo pra copiar
- [src/lib/monthNav.ts](src/lib/monthNav.ts): `shiftMonth` extraído de `orcamentos/page.tsx` pra ser reusado também em `actions.ts` (calcular o mês anterior pro "copiar")
- [src/components/icons.tsx](src/components/icons.tsx): adicionados `AlertTriangleIcon`/`CheckCircleIcon` (Feather, mesmo padrão dos ícones existentes) — usados nos selos de status, nunca cor sozinha (seguindo a regra da skill de dataviz: status nunca só por cor, sempre ícone + rótulo)
- **Testado de ponta a ponta pela primeira vez nesta sessão** (não só `build`/`lint`): subi um Postgres local temporário (`pg_ctlcluster`, já vinha instalado no ambiente), apliquei as 4 migrações com `prisma migrate deploy`, semeei dados de teste via uma rota temporária (`/api/dev-seed`, deletada depois de usar) cobrindo os 3 estados (dentro do orçamento, perto do limite, estourado, e uma categoria sem orçamento este mês mas com orçamento no mês anterior) e tirei prints com Playwright (light e dark) logando de verdade pela tela de login. Testei também o clique no "Copiar orçamento do mês anterior" — funcionou (preencheu só a categoria que faltava, recalculou os totais, e o link sumiu depois por não ter mais nada pra copiar). Banco de teste, cluster Postgres e a rota de seed foram todos removidos ao final — nada disso foi commitado
- Validado com `tsc --noEmit`, `eslint` e `next build`

### Outros
- [ ] Reativar o cadastro (`REGISTRATION_ENABLED`) se algum dia for preciso convidar mais alguém
