import type { Request, Response } from 'express';
import { idParamSchema } from '../../lib/schemas';
import { usuarioDaRequisicao } from '../../middlewares/authenticate';
import { notificacoesService } from './notificacoes.service';

export const notificacoesController = {
  async listar(req: Request, res: Response) {
    res.json(await notificacoesService.listar(usuarioDaRequisicao(req).id));
  },

  async marcarLida(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await notificacoesService.marcarLida(id, usuarioDaRequisicao(req).id);
    res.status(204).send();
  },

  async marcarTodasLidas(req: Request, res: Response) {
    await notificacoesService.marcarTodasLidas(usuarioDaRequisicao(req).id);
    res.status(204).send();
  },
};
