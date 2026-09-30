import { prisma } from '../../lib/prisma';

export const categoriasRepository = {
  /** Gerente vê todas (com total de solicitações); os demais, apenas as ativas. */
  listar(incluirInativas: boolean) {
    return prisma.categoria.findMany({
      where: incluirInativas ? undefined : { ativa: true },
      select: {
        id: true,
        nome: true,
        ativa: true,
        ...(incluirInativas && { _count: { select: { solicitacoes: true } } }),
      },
      orderBy: { nome: 'asc' },
    });
  },

  buscarPorId(id: number) {
    return prisma.categoria.findUnique({ where: { id } });
  },

  contarSolicitacoes(id: number) {
    return prisma.solicitacao.count({ where: { categoriaId: id } });
  },

  criar(nome: string) {
    return prisma.categoria.create({ data: { nome } });
  },

  atualizar(id: number, dados: { nome?: string; ativa?: boolean }) {
    return prisma.categoria.update({ where: { id }, data: dados });
  },

  excluir(id: number) {
    return prisma.categoria.delete({ where: { id } });
  },
};

export type CategoriasRepository = typeof categoriasRepository;
