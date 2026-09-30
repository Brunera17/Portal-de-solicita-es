import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { authenticate } from '../../middlewares/authenticate';
import { authController } from './auth.controller';

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  },
});

export const authRoutes = Router();

authRoutes.post('/login', limiteLogin, authController.login);
authRoutes.post('/logout', authenticate, authController.logout);
authRoutes.get('/me', authenticate, authController.me);
