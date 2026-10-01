import type { Request, Response } from 'express';
import { usuarioDaRequisicao } from '../../middlewares/authenticate';
import { idParamSchema } from '../../lib/schemas';
import { alterarStatusSchema, listarSolicitacoesSchema, solicitacaoSchema } from './solicitacoes.schemas';
import { solicitacoesService } from './solicitacoes.service';

export const solicitacoesController = {
  async listar(req: Request, res: Response) {
    const filtros = listarSolicitacoesSchema.parse(req.query);
    res.json(await solicitacoesService.listar(filtros, usuarioDaRequisicao(req)));
  },

  async obter(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await solicitacoesService.abrir(id, usuarioDaRequisicao(req)));
  },

  async criar(req: Request, res: Response) {
    const dados = solicitacaoSchema.parse(req.body);
    const criada = await solicitacoesService.criar(dados, usuarioDaRequisicao(req));
    res.status(201).location(`/api/solicitacoes/${criada.id}`).json(criada);
  },

  async atualizar(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const dados = solicitacaoSchema.parse(req.body);
    res.json(await solicitacoesService.atualizar(id, dados, usuarioDaRequisicao(req)));
  },

  async excluir(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await solicitacoesService.excluir(id, usuarioDaRequisicao(req));
    res.status(204).send();
  },

  async alterarStatus(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const { status } = alterarStatusSchema.parse(req.body);
    res.json(await solicitacoesService.alterarStatus(id, status, usuarioDaRequisicao(req)));
  },
};
