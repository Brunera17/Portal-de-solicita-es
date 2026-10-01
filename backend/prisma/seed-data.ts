/**
 * Dados de demonstração. Usado pelo `prisma db seed` e pelos testes de API.
 */
import { Perfil, StatusSolicitacao, TipoNotificacao, type PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const usuarios = [
  { nome: 'Gabriel Gerente', usuario: 'gerente', senha: 'gerente123', perfil: Perfil.GERENTE, corAvatar: 'violet' },
  { nome: 'Ana Atendente', usuario: 'atendente', senha: 'atendente123', perfil: Perfil.ATENDENTE, corAvatar: 'teal' },
  { nome: 'Maria Silva', usuario: 'maria', senha: 'maria123', perfil: Perfil.SOLICITANTE, corAvatar: 'rose' },
  { nome: 'João Souza', usuario: 'joao', senha: 'joao123', perfil: Perfil.SOLICITANTE, corAvatar: 'amber' },
];

export const categorias = ['TI', 'RH', 'Compras', 'Financeiro', 'Infraestrutura'];

type SolicitacaoSeed = {
  titulo: string;
  descricao: string;
  categoria: string;
  status: StatusSolicitacao;
  solicitante: string;
  diasAtras: number;
  /** Quem iniciou o atendimento (padrão: atendente). Ignorado se a solicitação está aberta. */
  responsavel?: string;
  comentarios?: { autor: string; texto: string; interno?: boolean }[];
};

const { ABERTO, EM_ATENDIMENTO, CONCLUIDO } = StatusSolicitacao;

const solicitacoes: SolicitacaoSeed[] = [
  { titulo: 'Notebook não liga', descricao: 'O notebook do setor comercial não liga desde ontem, mesmo conectado à tomada.', categoria: 'TI', status: ABERTO, solicitante: 'maria', diasAtras: 1 },
  {
    titulo: 'Acesso ao sistema financeiro', descricao: 'Preciso de acesso de leitura ao módulo de contas a pagar.', categoria: 'TI', status: EM_ATENDIMENTO, solicitante: 'joao', diasAtras: 3,
    comentarios: [
      { autor: 'atendente', texto: 'Solicitei a liberação ao administrador do sistema financeiro.' },
      { autor: 'atendente', texto: 'Aguardando aprovação do gestor financeiro; pode passar do SLA de 48h.', interno: true },
      { autor: 'joao', texto: 'Obrigado! Tenho um fechamento na sexta, se puderem priorizar.' },
    ],
  },
  { titulo: 'Declaração de vínculo empregatício', descricao: 'Solicito declaração de vínculo para apresentar ao banco.', categoria: 'RH', status: CONCLUIDO, solicitante: 'maria', diasAtras: 20 },
  { titulo: 'Compra de cadeiras ergonômicas', descricao: 'O setor de atendimento precisa de 4 cadeiras ergonômicas novas.', categoria: 'Compras', status: ABERTO, solicitante: 'joao', diasAtras: 2 },
  {
    titulo: 'Reembolso de despesas de viagem', descricao: 'Reembolso referente à visita ao cliente em Campina Grande.', categoria: 'Financeiro', status: EM_ATENDIMENTO, solicitante: 'maria', diasAtras: 7,
    comentarios: [
      { autor: 'atendente', texto: 'Falta o comprovante do táxi de volta. Pode anexar ao e-mail do financeiro?' },
      { autor: 'maria', texto: 'Enviado agora há pouco.' },
    ],
  },
  { titulo: 'Ar-condicionado da sala 3 com vazamento', descricao: 'O aparelho está pingando água sobre as mesas.', categoria: 'Infraestrutura', status: ABERTO, solicitante: 'joao', diasAtras: 0 },
  { titulo: 'Instalação do pacote Office', descricao: 'Novo colaborador precisa do Office instalado na estação 12.', categoria: 'TI', status: CONCLUIDO, solicitante: 'joao', diasAtras: 35 },
  { titulo: 'Férias de dezembro', descricao: 'Gostaria de confirmar o período de férias de 15/12 a 30/12.', categoria: 'RH', status: ABERTO, solicitante: 'maria', diasAtras: 4 },
  { titulo: 'Cotação de toners para impressora', descricao: 'Estoque de toner da impressora do 2º andar acabando.', categoria: 'Compras', status: CONCLUIDO, solicitante: 'maria', diasAtras: 45 },
  { titulo: 'Segunda via de nota fiscal', descricao: 'Fornecedor solicitou segunda via da NF 4512.', categoria: 'Financeiro', status: ABERTO, solicitante: 'joao', diasAtras: 5 },
  {
    titulo: 'Lâmpadas queimadas no corredor', descricao: 'Três lâmpadas queimadas no corredor de acesso ao estoque.', categoria: 'Infraestrutura', status: EM_ATENDIMENTO, solicitante: 'maria', diasAtras: 6, responsavel: 'gerente',
    comentarios: [
      { autor: 'gerente', texto: 'Fornecedor de lâmpadas atrasou a entrega; previsão de troca na segunda-feira.', interno: true },
    ],
  },
  { titulo: 'VPN não conecta em home office', descricao: 'Erro de autenticação ao conectar na VPN a partir de casa.', categoria: 'TI', status: ABERTO, solicitante: 'maria', diasAtras: 1 },
  { titulo: 'Atualização de dados bancários', descricao: 'Troquei de banco e preciso atualizar a conta para o salário.', categoria: 'RH', status: EM_ATENDIMENTO, solicitante: 'joao', diasAtras: 10 },
  { titulo: 'Troca da fechadura da sala de reuniões', descricao: 'A fechadura está emperrando e a chave quase quebrou.', categoria: 'Infraestrutura', status: CONCLUIDO, solicitante: 'joao', diasAtras: 28 },
  { titulo: 'Aprovação de orçamento de treinamento', descricao: 'Orçamento para curso de Excel avançado para a equipe financeira.', categoria: 'Financeiro', status: CONCLUIDO, solicitante: 'maria', diasAtras: 60 },
];

const DIA_MS = 24 * 60 * 60 * 1000;

/** Caminho de status percorrido até chegar ao status final. */
function caminhoAte(status: StatusSolicitacao): StatusSolicitacao[] {
  const ordem = [ABERTO, EM_ATENDIMENTO, CONCLUIDO];
  return ordem.slice(0, ordem.indexOf(status) + 1);
}

/**
 * Popula o banco com usuários, categorias e solicitações de demonstração.
 * Idempotente: pode ser executado várias vezes (recria solicitações e comentários).
 */
export async function popularBanco(prisma: PrismaClient) {
  const idsPorUsuario = new Map<string, number>();
  for (const u of usuarios) {
    const senhaHash = await bcrypt.hash(u.senha, 10);
    const dados = { nome: u.nome, senhaHash, perfil: u.perfil, corAvatar: u.corAvatar, ativo: true };
    const salvo = await prisma.usuario.upsert({
      where: { usuario: u.usuario },
      update: dados,
      create: { ...dados, usuario: u.usuario },
    });
    idsPorUsuario.set(u.usuario, salvo.id);
  }

  const idsPorCategoria = new Map<string, number>();
  for (const nome of categorias) {
    const salva = await prisma.categoria.upsert({ where: { nome }, update: { ativa: true }, create: { nome } });
    idsPorCategoria.set(nome, salva.id);
  }

  await prisma.notificacao.deleteMany();
  await prisma.comentario.deleteMany();
  await prisma.historicoStatus.deleteMany();
  await prisma.solicitacao.deleteMany();
  // Categorias criadas em testes/demonstração que não fazem parte do seed
  await prisma.categoria.deleteMany({ where: { nome: { notIn: categorias } } });
  await prisma.$executeRawUnsafe('ALTER SEQUENCE solicitacoes_id_seq RESTART WITH 1');

  // Da mais antiga para a mais recente, para que o código acompanhe a data de abertura
  const ordenadas = [...solicitacoes].sort((a, b) => b.diasAtras - a.diasAtras);

  for (const s of ordenadas) {
    const solicitanteId = idsPorUsuario.get(s.solicitante)!;
    const criadoEm = new Date(Date.now() - s.diasAtras * DIA_MS);
    const caminho = caminhoAte(s.status);
    const passo = DIA_MS / 8;
    const responsavelId = s.status === ABERTO ? null : idsPorUsuario.get(s.responsavel ?? 'atendente')!;

    const criada = await prisma.solicitacao.create({
      data: {
        titulo: s.titulo,
        descricao: s.descricao,
        categoriaId: idsPorCategoria.get(s.categoria)!,
        status: s.status,
        solicitanteId,
        responsavelId,
        criadoEm,
        historico: {
          create: caminho.map((status, i) => ({
            statusAnterior: i === 0 ? null : caminho[i - 1],
            statusNovo: status,
            alteradoPorId: i === 0 ? solicitanteId : responsavelId!,
            alteradoEm: new Date(criadoEm.getTime() + i * passo),
          })),
        },
        comentarios: {
          create: (s.comentarios ?? []).map((c, i) => ({
            autorId: idsPorUsuario.get(c.autor)!,
            texto: c.texto,
            interno: c.interno ?? false,
            criadoEm: new Date(criadoEm.getTime() + (i + 1) * (passo / 2)),
          })),
        },
      },
      select: { id: true, historico: true, comentarios: true },
    });

    // Notificações coerentes com o que aconteceu (as de mais de uma semana já foram lidas)
    const codigo = `#${String(criada.id).padStart(4, '0')}`;
    const nomeDe = (id: number) => usuarios.find((u) => idsPorUsuario.get(u.usuario) === id)!.nome;
    const rotulo = { ABERTO: 'Aberto', EM_ATENDIMENTO: 'Em Atendimento', CONCLUIDO: 'Concluído' };
    // Equipe é avisada das solicitações abertas recentes que ainda ninguém abriu (destaque "Nova")
    const equipe = usuarios.filter((u) => u.perfil !== Perfil.SOLICITANTE).map((u) => idsPorUsuario.get(u.usuario)!);
    const recemAberta = s.status === ABERTO && s.diasAtras <= 2;
    const notificacoes = [
      ...(recemAberta
        ? equipe.map((destinatarioId) => ({
            destinatarioId,
            autorId: solicitanteId,
            tipo: TipoNotificacao.NOVA_SOLICITACAO,
            mensagem: `${nomeDe(solicitanteId)} abriu ${codigo} "${s.titulo}" (${s.categoria})`,
            criadoEm,
          }))
        : []),
      ...criada.historico
        .filter((h) => h.statusAnterior)
        .map((h) => ({
          destinatarioId: solicitanteId,
          autorId: h.alteradoPorId,
          tipo: TipoNotificacao.STATUS_ALTERADO,
          mensagem: `${nomeDe(h.alteradoPorId)} alterou ${codigo} "${s.titulo}" para ${rotulo[h.statusNovo]}`,
          criadoEm: h.alteradoEm,
        })),
      ...criada.comentarios
        .filter((c) => !c.interno && c.autorId !== solicitanteId)
        .map((c) => ({
          destinatarioId: solicitanteId,
          autorId: c.autorId,
          tipo: TipoNotificacao.NOVO_COMENTARIO,
          mensagem: `${nomeDe(c.autorId)} comentou em ${codigo} "${s.titulo}"`,
          criadoEm: c.criadoEm,
        })),
    ];
    if (notificacoes.length) {
      await prisma.notificacao.createMany({
        data: notificacoes.map((n) => ({ ...n, solicitacaoId: criada.id, lida: s.diasAtras > 7 })),
      });
    }
  }

  return { usuarios: usuarios.length, categorias: categorias.length, solicitacoes: solicitacoes.length };
}
