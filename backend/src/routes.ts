import { Router } from 'express';
import { prisma } from './lib/prisma';

export const routes = Router();

routes.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', database: 'ok', timestamp: new Date().toISOString() });
});
