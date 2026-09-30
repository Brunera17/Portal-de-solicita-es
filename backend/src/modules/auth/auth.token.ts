import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../errors/AppError';

/**
 * O token carrega apenas o id do usuário. Nome, perfil e situação (ativo) são lidos
 * do banco a cada requisição, para que mudanças feitas pelo gerente valham na hora.
 */
export function gerarToken(usuarioId: number): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(usuarioId),
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/** Retorna o id do usuário do token ou lança 401. */
export function verificarToken(token: string): number {
  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    const id = Number(sub);
    if (!Number.isInteger(id) || id <= 0) throw new Error('sub inválido');
    return id;
  } catch {
    throw new UnauthorizedError('Sessão inválida ou expirada. Faça login novamente.');
  }
}
