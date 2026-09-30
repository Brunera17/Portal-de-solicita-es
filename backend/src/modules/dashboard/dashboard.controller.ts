import type { Request, Response } from 'express';
import { usuarioDaRequisicao } from '../../middlewares/authenticate';
import { solicitacoesService } from '../solicitacoes/solicitacoes.service';

export const dashboardController = {
  /** Indicadores por status, respeitando o escopo do usuário (solicitante vê só as suas). */
  async resumo(req: Request, res: Response) {
    res.json(await solicitacoesService.resumo(usuarioDaRequisicao(req)));
  },
};
