import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { notificacoesController } from './notificacoes.controller';

/** /api/notificacoes — cada usuário só acessa as próprias notificações. */
export const notificacoesRoutes = Router();

notificacoesRoutes.use(authenticate);

notificacoesRoutes.get('/', notificacoesController.listar);
notificacoesRoutes.post('/lidas', notificacoesController.marcarTodasLidas);
notificacoesRoutes.patch('/:id/lida', notificacoesController.marcarLida);
