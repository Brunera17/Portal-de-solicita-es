import type { Request, Response } from 'express';
import { ehGerente } from '../../lib/permissoes';
import { idParamSchema } from '../../lib/schemas';
import { usuarioDaRequisicao } from '../../middlewares/authenticate';
import { atualizarCategoriaSchema, criarCategoriaSchema } from './categorias.schemas';
import { categoriasService } from './categorias.service';

export const categoriasController = {
  async listar(req: Request, res: Response) {
    res.json(await categoriasService.listar(ehGerente(usuarioDaRequisicao(req).perfil)));
  },

  async criar(req: Request, res: Response) {
    const { nome } = criarCategoriaSchema.parse(req.body);
    res.status(201).json(await categoriasService.criar(nome));
  },

  async atualizar(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const dados = atualizarCategoriaSchema.parse(req.body);
    res.json(await categoriasService.atualizar(id, dados));
  },

  async excluir(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await categoriasService.excluir(id);
    res.status(204).send();
  },
};
