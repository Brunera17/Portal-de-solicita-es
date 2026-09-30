import { Router } from 'express';
import { Perfil } from '@prisma/client';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { solicitacoesController } from './solicitacoes.controller';

export const solicitacoesRoutes = Router();

solicitacoesRoutes.use(authenticate);

solicitacoesRoutes.get('/', solicitacoesController.listar);
solicitacoesRoutes.post('/', solicitacoesController.criar);
solicitacoesRoutes.get('/:id', solicitacoesController.obter);
solicitacoesRoutes.put('/:id', solicitacoesController.atualizar);
solicitacoesRoutes.delete('/:id', solicitacoesController.excluir);
solicitacoesRoutes.patch('/:id/status', authorize(Perfil.ATENDENTE), solicitacoesController.alterarStatus);
