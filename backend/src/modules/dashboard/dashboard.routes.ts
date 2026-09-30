import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { dashboardController } from './dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.get('/', authenticate, dashboardController.resumo);
