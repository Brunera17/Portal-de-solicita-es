import { Prisma, StatusSolicitacao } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type { SolicitacaoInput } from './solicitacoes.schemas';

export interface FiltrosSolicitacao {
  solicitanteId?: number;
  criadoDesde?: Date;
  criadoAntesDe?: Date;
  categoriaId?: number;
  status?: StatusSolicitacao;
  tituloContem?: string;
}

const resumoSelect = {
  id: true,
  titulo: true,
  categoria: { select: { id: true, nome: true } },
  status: true,
  criadoEm: true,
  atualizadoEm: true,
  solicitante: { select: { id: true, nome: true, corAvatar: true } },
} satisfies Prisma.SolicitacaoSelect;

const detalheSelect = {
  ...resumoSelect,
  descricao: true,
  historico: {
    orderBy: { alteradoEm: 'asc' },
    select: {
      id: true,
      statusAnterior: true,
      statusNovo: true,
      alteradoEm: true,
      alteradoPor: { select: { id: true, nome: true, corAvatar: true } },
    },
  },
} satisfies Prisma.SolicitacaoSelect;

export type SolicitacaoDetalhe = Prisma.SolicitacaoGetPayload<{ select: typeof detalheSelect }>;

function montarWhere(f: FiltrosSolicitacao): Prisma.SolicitacaoWhereInput {
  return {
    solicitanteId: f.solicitanteId,
    categoriaId: f.categoriaId,
    status: f.status,
    criadoEm: f.criadoDesde || f.criadoAntesDe ? { gte: f.criadoDesde, lt: f.criadoAntesDe } : undefined,
    titulo: f.tituloContem ? { contains: f.tituloContem, mode: 'insensitive' } : undefined,
  };
}

export const solicitacoesRepository = {
  async listar(filtros: FiltrosSolicitacao, paginacao: { skip: number; take: number }) {
    const where = montarWhere(filtros);
    const [itens, total] = await prisma.$transaction([
      prisma.solicitacao.findMany({
        where,
        select: resumoSelect,
        orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
        ...paginacao,
      }),
      prisma.solicitacao.count({ where }),
    ]);
    return { itens, total };
  },

  buscarPorId(id: number): Promise<SolicitacaoDetalhe | null> {
    return prisma.solicitacao.findUnique({ where: { id }, select: detalheSelect });
  },

  criar(dados: SolicitacaoInput, solicitanteId: number) {
    return prisma.solicitacao.create({
      data: {
        ...dados,
        solicitanteId,
        historico: { create: { statusNovo: StatusSolicitacao.ABERTO, alteradoPorId: solicitanteId } },
      },
      select: detalheSelect,
    });
  },

  /**
   * As operações condicionais abaixo repetem a regra no WHERE para serem atômicas:
   * se outra requisição mudar o status no meio do caminho, nada é alterado (count = 0).
   */
  async atualizarSeAberta(id: number, dados: SolicitacaoInput): Promise<boolean> {
    const { count } = await prisma.solicitacao.updateMany({
      where: { id, status: StatusSolicitacao.ABERTO },
      data: dados,
    });
    return count > 0;
  },

  async excluirSeAberta(id: number): Promise<boolean> {
    const { count } = await prisma.solicitacao.deleteMany({
      where: { id, status: StatusSolicitacao.ABERTO },
    });
    return count > 0;
  },

  alterarStatus(id: number, de: StatusSolicitacao, para: StatusSolicitacao, alteradoPorId: number) {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.solicitacao.updateMany({ where: { id, status: de }, data: { status: para } });
      if (count === 0) return false;

      await tx.historicoStatus.create({
        data: { solicitacaoId: id, statusAnterior: de, statusNovo: para, alteradoPorId },
      });
      return true;
    });
  },

  async contarPorStatus(solicitanteId?: number) {
    const grupos = await prisma.solicitacao.groupBy({
      by: ['status'],
      where: { solicitanteId },
      _count: { _all: true },
    });
    return grupos.map((g) => ({ status: g.status, quantidade: g._count._all }));
  },
};

export type SolicitacoesRepository = typeof solicitacoesRepository;
