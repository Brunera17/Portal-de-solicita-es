import type { Request, RequestHandler } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { verificarToken } from '../modules/auth/auth.token';
import type { UsuarioAutenticado } from '../types/express';

/** Exige header `Authorization: Bearer <token>` válido e popula `req.usuario`. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError();
  }

  req.usuario = verificarToken(token);
  next();
};

/** Retorna o usuário da requisição; só deve ser usado em rotas protegidas por `authenticate`. */
export function usuarioDaRequisicao(req: Request): UsuarioAutenticado {
  if (!req.usuario) {
    throw new UnauthorizedError();
  }
  return req.usuario;
}
