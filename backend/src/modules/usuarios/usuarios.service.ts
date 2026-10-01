import bcrypt from 'bcryptjs';
import { AppError, BusinessRuleError, NotFoundError } from '../../errors/AppError';
import type { UsuarioAutenticado } from '../../types/express';
import { usuariosRepository } from './usuarios.repository';
import type {
  AtualizarPerfilInput,
  AtualizarUsuarioInput,
  CriarUsuarioInput,
  TrocarSenhaInput,
} from './usuarios.schemas';

const CUSTO_BCRYPT = 10;

async function garantirExiste(id: number) {
  const usuario = await usuariosRepository.buscarPorId(id);
  if (!usuario) throw new NotFoundError('Usuário não encontrado');
  return usuario;
}

/** Administração de usuários (gerente) e manutenção do próprio perfil (qualquer usuário). */
export const usuariosService = {
  listar() {
    return usuariosRepository.listar();
  },

  async criar({ senha, ...dados }: CriarUsuarioInput) {
    // Usuário duplicado vira 409 pelo errorHandler (violação de UNIQUE, P2002)
    return usuariosRepository.criar({ ...dados, senhaHash: await bcrypt.hash(senha, CUSTO_BCRYPT) });
  },

  async atualizar(id: number, dados: AtualizarUsuarioInput, gerente: UsuarioAutenticado) {
    await garantirExiste(id);

    // Evita que o gerente se tranque para fora do sistema
    if (id === gerente.id && (dados.ativo === false || (dados.perfil && dados.perfil !== gerente.perfil))) {
      throw new BusinessRuleError('Você não pode desativar nem alterar o perfil da sua própria conta', 'AUTO_ALTERACAO');
    }

    return usuariosRepository.atualizar(id, dados);
  },

  async redefinirSenha(id: number, senha: string) {
    await garantirExiste(id);
    await usuariosRepository.atualizar(id, { senhaHash: await bcrypt.hash(senha, CUSTO_BCRYPT) });
  },

  atualizarPerfil(usuarioId: number, dados: AtualizarPerfilInput) {
    return usuariosRepository.atualizar(usuarioId, dados);
  },

  async trocarSenha(usuarioId: number, { senhaAtual, novaSenha }: TrocarSenhaInput) {
    const atual = await usuariosRepository.buscarSenhaHash(usuarioId);
    // 400 (e não 401): o usuário está autenticado; o dado informado é que está errado
    if (!atual || !(await bcrypt.compare(senhaAtual, atual.senhaHash))) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Senha atual incorreta', [
        { campo: 'senhaAtual', mensagem: 'Senha atual incorreta' },
      ]);
    }
    await usuariosRepository.atualizar(usuarioId, { senhaHash: await bcrypt.hash(novaSenha, CUSTO_BCRYPT) });
  },
};
