import { Router } from 'express';
import { Perfil } from '@prisma/client';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { categoriasController } from './categorias.controller';

export const categoriasRoutes = Router();

categoriasRoutes.use(authenticate);

// Leitura para todos (formulários e filtros); escrita só para o gerente
categoriasRoutes.get('/', categoriasController.listar);
categoriasRoutes.post('/', authorize(Perfil.GERENTE), categoriasController.criar);
categoriasRoutes.patch('/:id', authorize(Perfil.GERENTE), categoriasController.atualizar);
categoriasRoutes.delete('/:id', authorize(Perfil.GERENTE), categoriasController.excluir);
