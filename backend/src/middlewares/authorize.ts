import type { RequestHandler } from 'express';
import type { Perfil } from '@prisma/client';
import { ForbiddenError } from '../errors/AppError';
import { usuarioDaRequisicao } from './authenticate';

/** Restringe a rota aos perfis informados. Deve vir depois de `authenticate`. */
export function authorize(...perfis: Perfil[]): RequestHandler {
  return (req, _res, next) => {
    if (!perfis.includes(usuarioDaRequisicao(req).perfil)) {
      throw new ForbiddenError();
    }
    next();
  };
}
