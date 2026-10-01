import { Perfil, type Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export const camposPublicosUsuario = {
  id: true,
  nome: true,
  usuario: true,
  perfil: true,
  corAvatar: true,
  ativo: true,
  criadoEm: true,
} satisfies Prisma.UsuarioSelect;

export const usuariosRepository = {
  buscarPorUsuario(usuario: string) {
    return prisma.usuario.findUnique({ where: { usuario } });
  },

  buscarPorId(id: number) {
    return prisma.usuario.findUnique({ where: { id }, select: camposPublicosUsuario });
  },

  buscarAtivoPorId(id: number) {
    return prisma.usuario.findFirst({ where: { id, ativo: true }, select: camposPublicosUsuario });
  },

  /** Ids da equipe de atendimento ativa (atendentes e gerentes). */
  async listarIdsEquipeAtiva() {
    const equipe = await prisma.usuario.findMany({
      where: { ativo: true, perfil: { in: [Perfil.ATENDENTE, Perfil.GERENTE] } },
      select: { id: true },
    });
    return equipe.map((u) => u.id);
  },

  buscarSenhaHash(id: number) {
    return prisma.usuario.findUnique({ where: { id }, select: { senhaHash: true } });
  },

  listar() {
    return prisma.usuario.findMany({
      select: { ...camposPublicosUsuario, _count: { select: { solicitacoes: true } } },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  },

  criar(dados: { nome: string; usuario: string; senhaHash: string; perfil: Perfil }) {
    return prisma.usuario.create({ data: dados, select: camposPublicosUsuario });
  },

  atualizar(id: number, dados: Prisma.UsuarioUpdateInput) {
    return prisma.usuario.update({ where: { id }, data: dados, select: camposPublicosUsuario });
  },
};
