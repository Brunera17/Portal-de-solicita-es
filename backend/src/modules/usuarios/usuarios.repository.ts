import { prisma } from '../../lib/prisma';

const camposPublicos = { id: true, nome: true, usuario: true, perfil: true } as const;

export const usuariosRepository = {
  buscarPorUsuario(usuario: string) {
    return prisma.usuario.findUnique({ where: { usuario } });
  },

  buscarAtivoPorId(id: number) {
    return prisma.usuario.findFirst({ where: { id, ativo: true }, select: camposPublicos });
  },
};
