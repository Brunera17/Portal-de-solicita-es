> **Nota:** este é o plano de ação **inicial**, escrito em 30/09/2026 antes do início do desenvolvimento, mantido como registro do planejamento. O projeto evoluiu além dele (perfil gerente, categorias em tabela, Kanban, notificações, redesignação, modo escuro, entre outros). Para a solução final, veja o [README](../README.md) e o [Memorial Técnico](MEMORIAL_TECNICO.md).

# Plano de Ação: Portal de Solicitações Internas

**Processo:** Seleção DEV Jr. 09/2026, bit Soluções (2ª etapa)
**Prazo de entrega:** segunda-feira, 05/10/2026
**Início:** quarta-feira, 30/09/2026 (5 dias úteis/corridos)

---

## 1. Análise do desafio

### O que precisa ser entregue
| Item | Obrigatório |
|---|---|
| Código-fonte (backend + frontend) | Sim |
| Scripts SQL de criação + **dicionário de dados** | Sim |
| README com pré-requisitos, instalação, configuração, execução e acesso | Sim |
| **Memorial Técnico de Desenvolvimento** | Sim (é avaliado) |
| Evidências (prints/vídeo) | Sim (vídeo opcional) |
| Docker/Compose, testes, CI/CD, responsividade | Diferenciais |

### Requisitos funcionais resumidos
1. **Autenticação:** login com usuário/senha, controle de sessão, logout. Só usuário autenticado acessa o sistema.
2. **Cadastro de solicitação:** título, descrição, categoria (TI, RH, Compras, Financeiro, Infraestrutura). Automáticos: data de criação, solicitante, status = Aberto. Editar e excluir **somente enquanto Aberto**.
3. **Gerenciamento:** listagem (código, título, categoria, solicitante, data de abertura, status); alterar status (Aberto → Em Atendimento → Concluído); ver detalhes.
4. **Filtros:** período, categoria, status, texto livre no título.
5. **Dashboard:** total, abertas, em atendimento, concluídas.

### Pontos ambíguos (decida e documente no Memorial)
O enunciado não resolve estes pontos. Cada escolha deve aparecer na seção "Análise Crítica".

- **Quem altera status?** Sugestão: dois perfis, `SOLICITANTE` e `ATENDENTE`. O solicitante cria, edita e exclui as próprias solicitações abertas. O atendente vê todas e altera o status. Isso mostra regra de negócio e autorização sem aumentar muito o escopo.
- **O solicitante vê só as próprias solicitações ou todas?** Sugestão: solicitante vê as próprias; atendente vê todas. O dashboard segue o mesmo escopo.
- **Transições de status permitidas:** Aberto → Em Atendimento → Concluído, sem voltar atrás. Opcional: permitir Em Atendimento → Aberto.
- **Histórico de status:** não é pedido, mas uma tabela `historico_status` é barata e vale como diferencial de modelagem.
- **Exclusão:** física ou lógica? Como só se exclui enquanto está Aberto, a exclusão física é aceitável. Justifique.
- **Cadastro de usuários:** não é pedido. Use usuários via *seed* e não crie tela de cadastro.

---

## 2. Stack recomendada

> O PDF diz que a stack é livre, mas cita "o perfil profissional divulgado". **Se a vaga cita outra stack (ex.: PHP/Laravel, C#/.NET, Java/Spring), prefira ela**, porque isso conta pontos. Abaixo está a sugestão para o caso de liberdade total, levando em conta o ambiente atual (Node 24 instalado; Docker e PostgreSQL ainda não).

| Camada | Tecnologia | Por quê (resumo para o Memorial) |
|---|---|---|
| Linguagem | **TypeScript** (back e front) | Uma linguagem só, tipagem compartilhada, menos bugs |
| Backend | **Node.js + Express** | Simples, muito conhecido, fácil de mostrar camadas de forma explícita |
| ORM/Migrations | **Prisma** | Schema declarativo, migrations geram SQL versionado (atende "scripts SQL") |
| Banco | **PostgreSQL 16** | SQL robusto, gratuito, padrão de mercado |
| Validação | **Zod** | Mesmo schema valida a entrada e gera os tipos |
| Autenticação | **JWT (access token)** + **bcrypt** | Stateless, ideal para SPA + API; bcrypt para o hash das senhas |
| Frontend | **React + Vite** | Rápido de configurar, ecossistema grande |
| UI | **Tailwind CSS** (ou MUI) | Produtividade e responsividade |
| Requisições | **Axios** + **TanStack Query** | Interceptor de token, cache e estados de loading/erro |
| Formulários | **React Hook Form + Zod** | Reaproveita os schemas de validação |
| Rotas | **React Router** | Rotas protegidas |
| Testes | **Vitest + Supertest** | Testes de serviço e de endpoints |
| Infra | **Docker + Docker Compose** | Diferencial; sobe banco, API e web com um comando |
| CI | **GitHub Actions** | Diferencial; lint + testes a cada push |

**Alternativa sem Docker:** instalar o PostgreSQL localmente ou usar SQLite no Prisma, trocando apenas o `provider`. Documente as duas opções no README.

---

## 3. Arquitetura

```
sistema-de-chamado/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/          # SQL gerado (entregável)
│   │   └── seed.ts              # usuários de demonstração
│   ├── src/
│   │   ├── config/              # env, conexão
│   │   ├── modules/
│   │   │   ├── auth/            # routes, controller, service, schemas
│   │   │   ├── solicitacoes/    # routes, controller, service, repository, schemas
│   │   │   └── dashboard/
│   │   ├── middlewares/         # auth, authorize(role), errorHandler, validate
│   │   ├── errors/              # AppError, NotFoundError, BusinessRuleError...
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # axios client + funções por recurso
│   │   ├── components/          # Button, Input, Table, StatusBadge, Modal...
│   │   ├── contexts/            # AuthContext
│   │   ├── hooks/
│   │   ├── pages/               # Login, Dashboard, Solicitacoes, Detalhe, Form
│   │   ├── routes/              # PrivateRoute
│   │   └── types/
│   ├── Dockerfile
│   └── .env.example
├── database/
│   ├── schema.sql               # script SQL consolidado (cópia das migrations)
│   └── DICIONARIO_DE_DADOS.md
├── docs/
│   ├── MEMORIAL_TECNICO.md
│   └── evidencias/              # prints
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

**Camadas do backend:** `Route → Middleware (auth/validação) → Controller → Service (regras de negócio) → Repository (Prisma) → DB`.
Um `errorHandler` global converte os erros em respostas HTTP padronizadas: `{ error: { code, message, details } }`.

---

## 4. Modelagem de dados

### `usuarios`
| Coluna | Tipo | Restrições |
|---|---|---|
| id | SERIAL | PK |
| nome | VARCHAR(100) | NOT NULL |
| usuario | VARCHAR(50) | NOT NULL, UNIQUE |
| senha_hash | VARCHAR(255) | NOT NULL |
| perfil | ENUM('SOLICITANTE','ATENDENTE') | NOT NULL, default SOLICITANTE |
| ativo | BOOLEAN | default true |
| criado_em | TIMESTAMP | default now() |

### `solicitacoes`
| Coluna | Tipo | Restrições |
|---|---|---|
| id (código) | SERIAL | PK |
| titulo | VARCHAR(150) | NOT NULL |
| descricao | TEXT | NOT NULL |
| categoria | ENUM('TI','RH','COMPRAS','FINANCEIRO','INFRAESTRUTURA') | NOT NULL |
| status | ENUM('ABERTO','EM_ATENDIMENTO','CONCLUIDO') | NOT NULL, default ABERTO |
| solicitante_id | INT | FK → usuarios.id |
| criado_em | TIMESTAMP | default now() |
| atualizado_em | TIMESTAMP | atualizado automaticamente |

Índices: `status`, `categoria`, `criado_em`, `solicitante_id`.

### `historico_status` (opcional, recomendado)
| Coluna | Tipo |
|---|---|
| id | SERIAL PK |
| solicitacao_id | FK (ON DELETE CASCADE) |
| status_anterior / status_novo | ENUM |
| alterado_por_id | FK → usuarios |
| alterado_em | TIMESTAMP |

> Alternativa: categoria como **tabela** (`categorias`) em vez de ENUM, o que permite cadastrar novas sem migration. Escolha uma e justifique no Memorial. Tabela é mais flexível; ENUM é mais simples.

---

## 5. API REST

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/api/auth/login` | Retorna token + dados do usuário | Público |
| POST | `/api/auth/logout` | Encerra a sessão (client-side / blacklist opcional) | Autenticado |
| GET | `/api/auth/me` | Usuário da sessão | Autenticado |
| GET | `/api/solicitacoes` | Lista com filtros `?dataInicio&dataFim&categoria&status&q&page&limit` | Autenticado |
| GET | `/api/solicitacoes/:id` | Detalhes (+ histórico) | Dono ou atendente |
| POST | `/api/solicitacoes` | Criar | Autenticado |
| PUT | `/api/solicitacoes/:id` | Editar (**só se ABERTO e dono**) | Dono |
| DELETE | `/api/solicitacoes/:id` | Excluir (**só se ABERTO e dono**) | Dono |
| PATCH | `/api/solicitacoes/:id/status` | Alterar status (valida transição) | Atendente |
| GET | `/api/dashboard` | `{ total, abertas, emAtendimento, concluidas }` | Autenticado |

**Códigos HTTP:** 200/201/204, 400 (validação), 401 (sem token), 403 (sem permissão), 404, 409/422 (regra de negócio, ex.: editar solicitação não aberta), 500.

---

## 6. Telas do frontend

1. **Login:** formulário, mensagens de erro e redirecionamento.
2. **Layout autenticado:** menu (Dashboard, Solicitações, Nova solicitação), nome do usuário, botão de sair.
3. **Dashboard:** 4 cards de indicadores. Clicar num card leva à lista já filtrada.
4. **Listagem:** tabela com filtros (período, categoria, status, busca), paginação, badge de status e ações conforme status e perfil.
5. **Nova/Editar solicitação:** formulário validado.
6. **Detalhes:** dados completos, histórico e botão para alterar status (atendente).
7. Tratamento geral: loading, estado vazio, toasts de sucesso/erro, confirmação antes de excluir, logout automático em 401, layout responsivo.

---

## 7. Cronograma (30/09 → 05/10)

### Dia 1: Qua 30/09 · Fundação
- [ ] Confirmar a stack com base no perfil da vaga
- [ ] Criar repositório GitHub, `.gitignore`, estrutura de pastas
- [ ] Instalar Docker Desktop (ou PostgreSQL local)
- [ ] `docker-compose.yml` só com o Postgres
- [ ] Backend: Express + TS + ESLint/Prettier + Prisma
- [ ] `schema.prisma` + primeira migration + seed (1 atendente, 2 solicitantes, ~15 solicitações variadas)
- [ ] Middleware de erro + classe `AppError`

### Dia 2: Qui 01/10 · Backend completo
- [ ] Módulo auth: login (bcrypt + JWT), `/me`, middleware `authenticate` e `authorize(perfil)`
- [ ] Módulo solicitações: CRUD + regras (dono, somente ABERTO) + transição de status + histórico
- [ ] Filtros e paginação na listagem
- [ ] Endpoint do dashboard (`groupBy status`)
- [ ] Validação Zod em todas as entradas
- [ ] Testar tudo via Insomnia/Postman (salvar a collection em `docs/`)
- [ ] Testes: services (regras de negócio) + alguns endpoints com Supertest

### Dia 3: Sex 02/10 · Frontend (base + fluxos principais)
- [ ] Vite + React + TS + Tailwind + React Router
- [ ] Cliente Axios com interceptor (token e 401 → logout)
- [ ] AuthContext + PrivateRoute + tela de Login + Layout
- [ ] Listagem com filtros + paginação
- [ ] Formulário de criar/editar

### Dia 4: Sáb 03/10 · Frontend (finalização) + Infra
- [ ] Tela de detalhes + alterar status + excluir com confirmação
- [ ] Dashboard com cards
- [ ] Revisão de UX: loading, vazio, erros, responsividade
- [ ] Dockerfiles (backend e frontend) + compose completo (`docker compose up` sobe tudo, roda migrations e seed)
- [ ] GitHub Actions: lint + testes

### Dia 5: Dom 04/10 · Documentação
- [ ] `database/schema.sql` (exportado das migrations) + `DICIONARIO_DE_DADOS.md`
- [ ] **README** (checklist da seção 8)
- [ ] **MEMORIAL TÉCNICO** (estrutura da seção 9)
- [ ] Prints de todas as telas → `docs/evidencias/` (opcional: vídeo curto de 2–3 min)
- [ ] **Teste de ponta a ponta:** clonar o repo numa pasta limpa e seguir o README do zero

### Seg 05/10 · Entrega
- [ ] Revisão final, repositório público, enviar o link por e-mail (contato@bitsolucoes.info)

> **Buffer:** se atrasar, corte nesta ordem: CI → histórico de status → paginação → testes de endpoint. **Nunca corte:** requisitos funcionais, README e Memorial.

---

## 8. Checklist do README (exigências do PDF)
- [ ] Descrição do projeto e funcionalidades
- [ ] **Pré-requisitos:** linguagem/versão, banco, dependências (Node 24, Docker ou PostgreSQL 16)
- [ ] **Instalação:** passo a passo de backend, frontend e banco
- [ ] **Configuração:** tabela das variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `VITE_API_URL`) + `.env.example`
- [ ] **Execução:** comandos de backend e frontend (com e sem Docker)
- [ ] **Acesso:** URLs + usuários de teste com login/senha e perfil
- [ ] Como rodar os testes
- [ ] Links para Memorial, dicionário de dados e evidências

## 9. Estrutura do Memorial Técnico
1. **Introdução:** objetivo e escopo
2. **Tecnologias utilizadas:** lista completa (linguagens, frameworks, libs, banco, auth, validação, Docker, testes, CI)
3. **Justificativa técnica:** para *cada* tecnologia: motivo, benefícios, vantagens sobre alternativas, impacto em manutenção/escalabilidade/produtividade (uma tabela ou subseção por tecnologia)
4. **Justificativa conceitual:** estrutura geral, camadas, modelagem (com diagrama ER), padrões (Repository, Service Layer, Middleware, DTO/Schema, Context no React), estratégia de autenticação (JWT: fluxo, expiração, armazenamento), comunicação front↔back (REST/JSON, formato de erro), organização do código
5. **Regras de negócio e decisões sobre ambiguidades** (seção 1 deste plano)
6. **Análise crítica:** limitações (ex.: JWT em localStorage, sem refresh token, sem recuperação de senha, sem anexos), melhorias futuras (notificações, SLA, comentários, auditoria completa, refresh token com cookie httpOnly, rate limit), o que mudaria em produção (observabilidade, logs estruturados, secrets manager, HTTPS, backups, RBAC mais granular)

---

## 10. Checklist de segurança básica (é critério de avaliação)
- [ ] Senhas com bcrypt (nunca em texto puro)
- [ ] JWT com segredo via env e expiração
- [ ] Autorização verificada **no backend** (não só esconder botões)
- [ ] Validação de todas as entradas (Zod)
- [ ] Queries parametrizadas (Prisma já faz)
- [ ] CORS restrito à origem do front
- [ ] `helmet` + rate limit no login
- [ ] Mensagem de login genérica ("usuário ou senha inválidos")
- [ ] `.env` fora do Git; só `.env.example` versionado

## 11. Dicas para a avaliação
- **Commits pequenos e semânticos** (`feat:`, `fix:`, `docs:`). O avaliador vê o processo.
- Nomenclatura consistente: escolha português ou inglês para o domínio e mantenha.
- O memorial pesa tanto quanto o código. Escreva as justificativas **enquanto desenvolve**, não no fim.
- "Mais importante do que utilizar tecnologias complexas é demonstrar capacidade de construir uma solução funcional, organizada e bem justificada." Não exagere no escopo.
