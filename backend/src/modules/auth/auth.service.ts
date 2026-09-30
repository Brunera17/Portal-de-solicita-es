import bcrypt from 'bcryptjs';
import { NotFoundError, UnauthorizedError } from '../../errors/AppError';
import { usuariosRepository } from '../usuarios/usuarios.repository';
import { gerarToken } from './auth.token';
import type { LoginInput } from './auth.schemas';

// Hash usado quando o usuário não existe, para que a resposta leve o mesmo tempo
// e não revele quais usuários estão cadastrados.
const HASH_FICTICIO = bcrypt.hashSync('senha-ficticia', 10);

export const authService = {
  async login({ usuario, senha }: LoginInput) {
    const encontrado = await usuariosRepository.buscarPorUsuario(usuario);

    const senhaConfere = await bcrypt.compare(senha, encontrado?.senhaHash ?? HASH_FICTICIO);

    if (!encontrado || !senhaConfere || !encontrado.ativo) {
      throw new UnauthorizedError('Usuário ou senha inválidos');
    }

    const token = gerarToken({ id: encontrado.id, nome: encontrado.nome, perfil: encontrado.perfil });

    return {
      token,
      usuario: {
        id: encontrado.id,
        nome: encontrado.nome,
        usuario: encontrado.usuario,
        perfil: encontrado.perfil,
      },
    };
  },

  async buscarPerfil(id: number) {
    const usuario = await usuariosRepository.buscarAtivoPorId(id);
    if (!usuario) {
      throw new NotFoundError('Usuário não encontrado');
    }
    return usuario;
  },
};
