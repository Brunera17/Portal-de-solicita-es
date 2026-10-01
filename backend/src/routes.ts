import { Router } from 'express';
import { prisma } from './lib/prisma';
import { authRoutes } from './modules/auth/auth.routes';
import { categoriasRoutes } from './modules/categorias/categorias.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { notificacoesRoutes } from './modules/notificacoes/notificacoes.routes';
import { solicitacoesRoutes } from './modules/solicitacoes/solicitacoes.routes';
import { perfilRoutes, usuariosRoutes } from './modules/usuarios/usuarios.routes';

export const routes = Router();

routes.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', database: 'ok', timestamp: new Date().toISOString() });
});

routes.use('/auth', authRoutes);
routes.use('/perfil', perfilRoutes);
routes.use('/solicitacoes', solicitacoesRoutes);
routes.use('/categorias', categoriasRoutes);
routes.use('/usuarios', usuariosRoutes);
routes.use('/dashboard', dashboardRoutes);
routes.use('/notificacoes', notificacoesRoutes);
