import { Router } from 'express';
import { prisma } from './lib/prisma';
import { authRoutes } from './modules/auth/auth.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { solicitacoesRoutes } from './modules/solicitacoes/solicitacoes.routes';

export const routes = Router();

routes.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', database: 'ok', timestamp: new Date().toISOString() });
});

routes.use('/auth', authRoutes);
routes.use('/solicitacoes', solicitacoesRoutes);
routes.use('/dashboard', dashboardRoutes);
