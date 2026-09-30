import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

function body(code: string, message: string, details?: unknown): ErrorBody {
  return { error: { code, message, ...(details !== undefined && { details }) } };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(body('ROUTE_NOT_FOUND', `Rota ${req.method} ${req.path} não encontrada`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(body(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensagem: issue.message,
    }));
    res.status(400).json(body('VALIDATION_ERROR', 'Dados inválidos', details));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json(body('NOT_FOUND', 'Recurso não encontrado'));
    return;
  }

  // JSON malformado no corpo da requisição
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json(body('INVALID_JSON', 'Corpo da requisição não é um JSON válido'));
    return;
  }

  console.error(err);
  res.status(500).json(body('INTERNAL_ERROR', 'Erro interno do servidor'));
};
