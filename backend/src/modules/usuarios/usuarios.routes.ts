import { Router } from 'express';
import { Perfil } from '@prisma/client';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { perfilController, usuariosController } from './usuarios.controller';

/** /api/usuarios — administração de contas, exclusiva do gerente. */
export const usuariosRoutes = Router();

usuariosRoutes.use(authenticate, authorize(Perfil.GERENTE));

usuariosRoutes.get('/', usuariosController.listar);
usuariosRoutes.get('/equipe', usuariosController.listarEquipe);
usuariosRoutes.post('/', usuariosController.criar);
usuariosRoutes.patch('/:id', usuariosController.atualizar);
usuariosRoutes.put('/:id/senha', usuariosController.redefinirSenha);

/** /api/perfil — o próprio usuário mantém seus dados. */
export const perfilRoutes = Router();

perfilRoutes.use(authenticate);

perfilRoutes.patch('/', perfilController.atualizar);
perfilRoutes.put('/senha', perfilController.trocarSenha);
