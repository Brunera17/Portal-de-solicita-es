import type { Request, Response } from 'express';
import { idParamSchema } from '../../lib/schemas';
import { usuarioDaRequisicao } from '../../middlewares/authenticate';
import { criarComentarioSchema } from './comentarios.schemas';
import { comentariosService } from './comentarios.service';

export const comentariosController = {
  async listar(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await comentariosService.listar(id, usuarioDaRequisicao(req)));
  },

  async criar(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const dados = criarComentarioSchema.parse(req.body);
    res.status(201).json(await comentariosService.criar(id, dados, usuarioDaRequisicao(req)));
  },
};
