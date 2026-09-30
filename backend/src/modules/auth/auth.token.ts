import jwt from 'jsonwebtoken';
import { Perfil } from '@prisma/client';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../errors/AppError';
import type { UsuarioAutenticado } from '../../types/express';

interface TokenPayload {
  sub: string;
  nome: string;
  perfil: Perfil;
}

export function gerarToken(usuario: UsuarioAutenticado): string {
  const payload: TokenPayload = { sub: String(usuario.id), nome: usuario.nome, perfil: usuario.perfil };
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verificarToken(token: string): UsuarioAutenticado {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    const id = Number(payload.sub);

    if (!Number.isInteger(id) || !Object.values(Perfil).includes(payload.perfil)) {
      throw new UnauthorizedError('Token inválido');
    }

    return { id, nome: payload.nome, perfil: payload.perfil };
  } catch {
    throw new UnauthorizedError('Sessão inválida ou expirada. Faça login novamente.');
  }
}
