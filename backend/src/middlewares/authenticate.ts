import type { Request, RequestHandler } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { verificarToken } from '../modules/auth/auth.token';
import { usuariosRepository } from '../modules/usuarios/usuarios.repository';
import type { UsuarioAutenticado } from '../types/express';

/**
 * Exige header `Authorization: Bearer <token>` válido e popula `req.usuario`.
 * O usuário é recarregado do banco: contas desativadas perdem o acesso imediatamente
 * e mudanças de perfil valem já na próxima requisição.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError();
  }

  const usuario = await usuariosRepository.buscarAtivoPorId(verificarToken(token));
  if (!usuario) {
    throw new UnauthorizedError('Usuário inativo ou inexistente. Faça login novamente.');
  }

  req.usuario = { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
  next();
};

/** Retorna o usuário da requisição; só deve ser usado em rotas protegidas por `authenticate`. */
export function usuarioDaRequisicao(req: Request): UsuarioAutenticado {
  if (!req.usuario) {
    throw new UnauthorizedError();
  }
  return req.usuario;
}
