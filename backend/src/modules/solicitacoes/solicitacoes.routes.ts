import { Router } from 'express';
import { PERFIS_EQUIPE } from '../../lib/permissoes';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { comentariosController } from '../comentarios/comentarios.controller';
import { solicitacoesController } from './solicitacoes.controller';

export const solicitacoesRoutes = Router();

solicitacoesRoutes.use(authenticate);

solicitacoesRoutes.get('/', solicitacoesController.listar);
solicitacoesRoutes.post('/', solicitacoesController.criar);
solicitacoesRoutes.get('/:id', solicitacoesController.obter);
solicitacoesRoutes.put('/:id', solicitacoesController.atualizar);
solicitacoesRoutes.delete('/:id', solicitacoesController.excluir);
solicitacoesRoutes.patch('/:id/status', authorize(...PERFIS_EQUIPE), solicitacoesController.alterarStatus);

// Comentários são um sub-recurso da solicitação
solicitacoesRoutes.get('/:id/comentarios', comentariosController.listar);
solicitacoesRoutes.post('/:id/comentarios', comentariosController.criar);
