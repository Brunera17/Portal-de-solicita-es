import type { TipoNotificacao } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export interface NovaNotificacao {
  destinatarioId: number;
  autorId: number;
  solicitacaoId: number;
  tipo: TipoNotificacao;
  mensagem: string;
}

export const notificacoesRepository = {
  criarVarias(dados: NovaNotificacao[]) {
    return prisma.notificacao.createMany({ data: dados });
  },

  listar(destinatarioId: number, limite: number) {
    return prisma.notificacao.findMany({
      where: { destinatarioId },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
      take: limite,
      select: {
        id: true,
        tipo: true,
        mensagem: true,
        lida: true,
        criadoEm: true,
        solicitacaoId: true,
        autor: { select: { id: true, nome: true, corAvatar: true } },
      },
    });
  },

  contarNaoLidas(destinatarioId: number) {
    return prisma.notificacao.count({ where: { destinatarioId, lida: false } });
  },

  /** O filtro por destinatário impede marcar notificações de outra pessoa. */
  async marcarLida(id: number, destinatarioId: number) {
    const { count } = await prisma.notificacao.updateMany({ where: { id, destinatarioId }, data: { lida: true } });
    return count > 0;
  },

  marcarTodasLidas(destinatarioId: number) {
    return prisma.notificacao.updateMany({ where: { destinatarioId, lida: false }, data: { lida: true } });
  },
};
