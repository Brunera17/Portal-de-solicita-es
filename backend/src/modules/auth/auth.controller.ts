import type { Request, Response } from 'express';
import { usuarioDaRequisicao } from '../../middlewares/authenticate';
import { loginSchema } from './auth.schemas';
import { authService } from './auth.service';

export const authController = {
  async login(req: Request, res: Response) {
    const dados = loginSchema.parse(req.body);
    res.json(await authService.login(dados));
  },

  async me(req: Request, res: Response) {
    res.json(await authService.buscarPerfil(usuarioDaRequisicao(req).id));
  },

  /**
   * Com JWT stateless, o logout efetivo é o descarte do token pelo cliente.
   * O endpoint existe para manter o contrato da API e permitir, no futuro,
   * invalidar tokens no servidor (blacklist/refresh tokens).
   */
  logout(_req: Request, res: Response) {
    res.status(204).send();
  },
};
