# Portal de Solicitações Internas

[![CI](https://github.com/Brunera17/Portal-de-solicita-es/actions/workflows/ci.yml/badge.svg)](https://github.com/Brunera17/Portal-de-solicita-es/actions/workflows/ci.yml)

Sistema web para colaboradores registrarem demandas internas (TI, RH, Compras, Financeiro, Infraestrutura…) e acompanharem cada uma até a conclusão. Desenvolvido como mini-projeto full stack do processo seletivo **DEV Jr. 09/2026 — bit Soluções**.

- **Backend:** API REST em Node.js + Express + TypeScript, com Prisma e PostgreSQL
- **Frontend:** React + TypeScript (Vite), Tailwind CSS
- **Infra:** Docker Compose (PostgreSQL + API + Nginx) e CI no GitHub Actions

📄 Documentos: [Memorial Técnico](docs/MEMORIAL_TECNICO.md) · [Dicionário de Dados](database/DICIONARIO_DE_DADOS.md) · [Script do banco](database/schema.sql) · [Evidências](docs/evidencias/)

---

## Funcionalidades

**Requisitos do desafio**
- Login com usuário e senha, controle de sessão (JWT) e logout; todo o sistema exige autenticação.
- Cadastro de solicitações (título, descrição, categoria) com data, solicitante e status *Aberto* automáticos; edição e exclusão enquanto *Aberta*.
- Listagem com código, título, categoria, solicitante, data de abertura e status; consulta de detalhes; alteração de status (*Aberto → Em Atendimento → Concluído*).
- Filtros por período, categoria, status e texto no título, com paginação.
- Dashboard com total, abertas, em atendimento e concluídas.

**Além do pedido**
- Três perfis: **Solicitante**, **Atendente** e **Gerente** (o gerente também atende e administra).
- **Quadro Kanban** com arrastar e soltar; limite de **3 atendimentos simultâneos por pessoa**; filtro *Todas / Minhas* para o gerente.
- **Responsável** pelo atendimento e **redesignação** pelo gerente (com motivo e histórico).
- **Comentários** com **notas internas** (visíveis só para a equipe).
- **Notificações** (sino): nova solicitação, mudança de status, comentário e redesignação; destaque **"Nova"** até o primeiro acesso.
- Administração de **usuários** e **categorias** (gerente); **Meu perfil** (nome, cor do avatar, senha).
- **Modo escuro**, layout responsivo, linha do tempo de cada solicitação.

---

## Pré-requisitos

| Para rodar… | Precisa de |
|---|---|
| **Com Docker** (recomendado) | [Docker Desktop](https://www.docker.com/products/docker-desktop/) com Docker Compose v2 (no Windows: WSL 2 e virtualização habilitada na BIOS) |
| **Sem Docker** | [Node.js 24](https://nodejs.org/) (npm 11) e [PostgreSQL 17](https://www.postgresql.org/download/) |

- **Linguagem:** TypeScript (Node.js 24 no backend; navegador no frontend)
- **Banco de dados:** PostgreSQL 17
- **Dependências:** instaladas pelo `npm ci` em `backend/` e `frontend/` (lista completa e justificativas no [Memorial Técnico](docs/MEMORIAL_TECNICO.md))

---

## Opção 1 — Docker (um comando)

Na raiz do projeto:

```bash
docker compose up -d --build
```

Acesse **http://localhost:8080**.

Na primeira subida a API aplica as migrations e cria os dados de demonstração. Os dados ficam no volume `pgdata` e **sobrevivem a reinícios** (o seed só roda com o banco vazio).

| Comando | Para quê |
|---|---|
| `docker compose ps` | Ver o estado (os 3 serviços devem ficar `healthy`) |
| `docker compose logs -f backend` | Acompanhar os logs da API |
| `docker compose up -d --build` | Atualizar depois de mudar o código (dados preservados) |
| `docker compose down` | Parar (mantém os dados) |
| `docker compose down -v` | Parar **e apagar** os dados (a próxima subida recria a demonstração) |

O banco não publica porta (para não conflitar com um PostgreSQL local); para inspecioná-lo, descomente `ports` do serviço `db` em [`docker-compose.yml`](docker-compose.yml). Em uso fora da demonstração, defina `JWT_SECRET` no ambiente ou num arquivo `.env` na raiz.

---

## Opção 2 — Execução local (sem Docker)

### 1. Banco de dados

Crie o usuário e os bancos (o de testes é separado porque os testes apagam os dados). Será pedida a senha do usuário `postgres`:

```bash
psql -U postgres -c "CREATE ROLE portal LOGIN CREATEDB PASSWORD 'portal';" -c "CREATE DATABASE portal_solicitacoes OWNER portal;" -c "CREATE DATABASE portal_teste OWNER portal;"
```

> No Windows, se `psql` não estiver no PATH: `& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres ...`
> Alternativa sem Prisma: o script [`database/schema.sql`](database/schema.sql) cria a estrutura completa.

### 2. Backend

```bash
cd backend
npm ci
cp .env.example .env        # ajuste os valores se necessário (ver "Configuração")
npx prisma migrate deploy   # cria as tabelas
npm run db:seed             # dados de demonstração
npm run dev                 # API em http://localhost:3333/api
```

### 3. Frontend (em outro terminal)

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev                 # interface em http://localhost:5173
```

Acesse **http://localhost:5173**. Em desenvolvimento, o Vite repassa `/api` ao backend (sem CORS).

### Build de produção (opcional)

```bash
cd backend && npm run build && npm start      # API compilada (dist/)
cd frontend && npm run build                  # arquivos estáticos em dist/
```

---

## Configuração

### Backend (`backend/.env`)

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `DATABASE_URL` | sim | — | Conexão PostgreSQL, ex.: `postgresql://portal:portal@localhost:5432/portal_solicitacoes?schema=public` |
| `JWT_SECRET` | sim | — | Segredo de assinatura dos tokens (**mínimo 16 caracteres**). Gere um com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | não | `8h` | Validade da sessão |
| `PORT` | não | `3333` | Porta da API |
| `CORS_ORIGIN` | não | `http://localhost:5173` | Origem(ns) permitida(s), separadas por vírgula |
| `TRUST_PROXY` | não | `0` | Nº de proxies à frente da API (`1` atrás do Nginx no Docker) — usado no limite de tentativas de login |
| `TEST_DATABASE_URL` | p/ testes | — | Banco **exclusivo** para `npm test` (é apagado a cada execução) |

A API valida as variáveis ao iniciar e informa qual está faltando ou inválida.

> As datas do filtro por período usam o fuso do servidor. No Docker ele é `America/Sao_Paulo`; localmente, é o fuso da máquina.

### Frontend (`frontend/.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | URL base da API usada pelo navegador |
| `API_PROXY_TARGET` | `http://localhost:3333` | Destino do proxy `/api` no `npm run dev` |
| `VITE_EXIBIR_USUARIOS_DEMO` | `true` | Mostra na tela de login o painel com os usuários de demonstração (desligue em produção) |

---

## Acesso — usuários de demonstração

| Perfil | Usuário | Senha | O que pode fazer |
|---|---|---|---|
| Gerente | `gerente` | `gerente123` | Tudo do atendente + redesignar, administrar usuários e categorias |
| Atendente | `atendente` | `atendente123` | Ver todas as solicitações, assumir, concluir, notas internas |
| Solicitante | `maria` | `maria123` | Abrir, editar/excluir (enquanto abertas) e acompanhar as próprias |
| Solicitante | `joao` | `joao123` | Idem |

Na tela de login, clicar em um usuário do painel *Usuários de demonstração* preenche o formulário. A atendente começa **no limite de 3 atendimentos** — bom para ver a regra em ação no Quadro.

---

## Testes e qualidade

```bash
cd backend
npm test            # 127 testes: unitários (regras e services) + API (supertest) — exige TEST_DATABASE_URL
npm run test:unit   # só os unitários (não precisam de banco)
npm run lint && npm run typecheck

cd frontend
npm run lint && npm run typecheck && npm run build
```

Antes dos testes de API, aplique as migrations no banco de testes:
`DATABASE_URL=<valor de TEST_DATABASE_URL> npx prisma migrate deploy`.

O **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda a cada push: lint, tipos, testes com PostgreSQL 17 e build de backend e frontend; depois sobe o `docker compose` completo e faz um teste de ponta a ponta (login pela interface, API e reinício sem perda de dados).

---

## API

Base: `/api`. Todas as rotas (exceto `login` e `health`) exigem `Authorization: Bearer <token>`. Erros seguem o formato `{ "error": { "code", "message", "details?" } }`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/health` | público | Saúde da API e do banco |
| POST | `/auth/login` | público | Login → `{ token, usuario }` |
| POST | `/auth/logout` | autenticado | Encerra a sessão (o cliente descarta o token) |
| GET | `/auth/me` | autenticado | Usuário da sessão |
| PATCH | `/perfil` | autenticado | Atualiza nome / cor do avatar |
| PUT | `/perfil/senha` | autenticado | Troca a senha (exige a atual) |
| GET | `/solicitacoes` | autenticado | Lista com filtros `dataInicio`, `dataFim`, `categoriaId`, `status`, `responsavelId`, `q`, `pagina`, `porPagina` |
| POST | `/solicitacoes` | autenticado | Cria (status *Aberto*; avisa a equipe) |
| GET | `/solicitacoes/:id` | dono ou equipe | Detalhe com histórico e redesignações (marca as notificações dela como lidas) |
| PUT | `/solicitacoes/:id` | dono | Edita (só *Aberta*) |
| DELETE | `/solicitacoes/:id` | dono | Exclui (só *Aberta*) |
| PATCH | `/solicitacoes/:id/status` | atendente, gerente | Avança o status (respeita o fluxo e o limite de 3) |
| PATCH | `/solicitacoes/:id/responsavel` | gerente | Redesigna o responsável |
| GET / POST | `/solicitacoes/:id/comentarios` | dono ou equipe | Lista / cria comentários (`interno` só para a equipe) |
| GET | `/dashboard` | autenticado | Totais por status (no escopo do usuário) |
| GET | `/notificacoes` | autenticado | Últimas notificações + contador de não lidas |
| PATCH | `/notificacoes/:id/lida` | autenticado | Marca uma como lida |
| POST | `/notificacoes/lidas` | autenticado | Marca todas como lidas |
| GET / POST / PATCH / DELETE | `/categorias` | leitura: todos · escrita: gerente | Categorias (em uso só podem ser desativadas) |
| GET / POST | `/usuarios` | gerente | Lista / cria usuários |
| PATCH | `/usuarios/:id` | gerente | Altera nome, perfil, ativo |
| PUT | `/usuarios/:id/senha` | gerente | Redefine a senha |
| GET | `/usuarios/equipe` | gerente | Equipe ativa com a carga atual de cada pessoa |

Códigos usados: `400` validação · `401` não autenticado · `403` sem permissão · `404` não encontrado · `409` conflito/duplicidade · `422` regra de negócio · `429` muitas tentativas de login.

---

## Estrutura do projeto

```
├── backend/
│   ├── prisma/            # schema, migrations e seed
│   ├── src/
│   │   ├── config/        # variáveis de ambiente (validadas com Zod)
│   │   ├── errors/        # hierarquia de erros da aplicação
│   │   ├── lib/           # Prisma, permissões, schemas compartilhados
│   │   ├── middlewares/   # autenticação, autorização, tratamento de erros
│   │   └── modules/       # auth, solicitacoes, comentarios, notificacoes,
│   │                      # categorias, usuarios, dashboard
│   │                      #   (routes → controller → service → repository)
│   └── tests/             # unit/ e api/
├── frontend/
│   └── src/
│       ├── api/           # cliente HTTP e endpoints
│       ├── components/    # layout, ui (design system) e solicitacoes
│       ├── contexts/ hooks/ lib/ types/
│       ├── pages/         # telas (carregadas sob demanda)
│       └── routes/        # rotas e proteção por perfil
├── database/              # schema.sql e dicionário de dados
├── docs/                  # memorial técnico e evidências
├── docker-compose.yml
└── .github/workflows/     # CI
```
