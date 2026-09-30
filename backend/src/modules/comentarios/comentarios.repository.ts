import { prisma } from '../../lib/prisma';

const comentarioSelect = {
  id: true,
  texto: true,
  interno: true,
  criadoEm: true,
  autor: { select: { id: true, nome: true, perfil: true, corAvatar: true } },
} as const;

export const comentariosRepository = {
  listar(solicitacaoId: number, incluirInternos: boolean) {
    return prisma.comentario.findMany({
      where: { solicitacaoId, ...(!incluirInternos && { interno: false }) },
      select: comentarioSelect,
      orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
    });
  },

  criar(dados: { solicitacaoId: number; autorId: number; texto: string; interno: boolean }) {
    return prisma.comentario.create({ data: dados, select: comentarioSelect });
  },
};
