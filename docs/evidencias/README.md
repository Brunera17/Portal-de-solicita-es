# Evidências — aplicação em funcionamento

Capturas geradas a partir da versão em Docker (`docker compose up -d --build`, http://localhost:8080) com os dados de demonstração, usando um navegador automatizado (Edge em modo headless). Desktop em 1440×900; celular em 390×844.

## Autenticação e visão geral

| | |
|---|---|
| **01 — Login.** Painel de usuários de demonstração (clique preenche o formulário). | **02 — Dashboard (gerente).** Totais por status, distribuição e solicitações recentes; sino com notificações não lidas. |
| ![Login](01-login.png) | ![Dashboard](02-dashboard-gerente.png) |

## Solicitações

| | |
|---|---|
| **03 — Listagem.** Código, título, categoria, solicitante, data de abertura e status; selo **Nova** nas ainda não abertas. | **04 — Filtros.** Status e texto no título; filtros ficam na URL. |
| ![Listagem](03-listagem.png) | ![Filtros](04-listagem-com-filtros.png) |
| **05 — Nova solicitação.** Validação por campo antes de enviar. | **06 — Detalhe (equipe).** Comentários com **nota interna**, responsável, histórico e ações *Redesignar* / *Concluir*. |
| ![Validação](05-nova-solicitacao-validacao.png) | ![Detalhe](06-detalhe-comentarios-historico.png) |
| **07 — Detalhe (solicitante).** A nota interna não aparece e não há ações da equipe. | **11 — Redesignar.** Gerente escolhe o novo responsável; quem está no limite ou já é o responsável fica indisponível. |
| ![Visão do solicitante](07-detalhe-visao-do-solicitante.png) | ![Redesignar](11-redesignar.png) |

## Quadro Kanban

| | |
|---|---|
| **08 — Atendente no limite.** "Você atingiu o limite 3/3"; Em Atendimento e Concluído mostram só os atendimentos dela; selo **Nova** na fila. | **09 — Gerente.** Filtro *Todas / Minhas*, avatar do responsável em cada cartão. |
| ![Kanban atendente](08-kanban-atendente-no-limite.png) | ![Kanban gerente](09-kanban-gerente-novas.png) |

## Notificações, administração e perfil

| | |
|---|---|
| **10 — Notificações.** Mudança de status e comentários, com não lidas destacadas. | **12 — Usuários (gerente).** Perfis, situação e ações de editar, redefinir senha e desativar. |
| ![Notificações](10-notificacoes.png) | ![Usuários](12-admin-usuarios.png) |
| **13 — Categorias (gerente).** Criar, renomear, desativar; excluir só sem solicitações. | **14 — Meu perfil.** Nome, cor do avatar e troca de senha. |
| ![Categorias](13-admin-categorias.png) | ![Perfil](14-meu-perfil.png) |

## Modo escuro e celular

| | |
|---|---|
| **15 — Dashboard no modo escuro.** | **16 — Quadro no modo escuro.** |
| ![Dashboard escuro](15-dashboard-modo-escuro.png) | ![Kanban escuro](16-kanban-modo-escuro.png) |
| **17 — Celular: listagem em cartões.** | **18 — Celular: menu lateral no modo escuro.** |
| ![Celular](17-celular-listagem.png) | ![Menu celular](18-celular-menu-modo-escuro.png) |
