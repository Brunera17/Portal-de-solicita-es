import type { Request, Response } from 'express';
import { usuarioDaRequisicao } from '../../middlewares/authenticate';
import { idParamSchema } from '../../lib/schemas';
import {
  atualizarPerfilSchema,
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  redefinirSenhaSchema,
  trocarSenhaSchema,
} from './usuarios.schemas';
import { usuariosService } from './usuarios.service';

export const usuariosController = {
  async listar(_req: Request, res: Response) {
    res.json(await usuariosService.listar());
  },

  async criar(req: Request, res: Response) {
    const dados = criarUsuarioSchema.parse(req.body);
    res.status(201).json(await usuariosService.criar(dados));
  },

  async atualizar(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const dados = atualizarUsuarioSchema.parse(req.body);
    res.json(await usuariosService.atualizar(id, dados, usuarioDaRequisicao(req)));
  },

  async redefinirSenha(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const { senha } = redefinirSenhaSchema.parse(req.body);
    await usuariosService.redefinirSenha(id, senha);
    res.status(204).send();
  },
};

export const perfilController = {
  async atualizar(req: Request, res: Response) {
    const dados = atualizarPerfilSchema.parse(req.body);
    res.json(await usuariosService.atualizarPerfil(usuarioDaRequisicao(req).id, dados));
  },

  async trocarSenha(req: Request, res: Response) {
    const dados = trocarSenhaSchema.parse(req.body);
    await usuariosService.trocarSenha(usuarioDaRequisicao(req).id, dados);
    res.status(204).send();
  },
};
