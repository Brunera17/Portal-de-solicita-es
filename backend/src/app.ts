import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { routes } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export const app = express();

// Atrás de proxy (Nginx), usa o IP real do cliente (X-Forwarded-For) no rate limit do login
app.set('trust proxy', env.TRUST_PROXY);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);
