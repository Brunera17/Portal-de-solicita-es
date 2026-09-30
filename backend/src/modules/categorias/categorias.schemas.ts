import { z } from 'zod';

const nome = z
  .string({ error: 'Informe o nome' })
  .trim()
  .min(2, 'O nome deve ter pelo menos 2 caracteres')
  .max(50, 'O nome deve ter no máximo 50 caracteres');

export const criarCategoriaSchema = z.object({ nome });

export const atualizarCategoriaSchema = z
  .object({ nome, ativa: z.boolean({ error: 'Valor inválido' }) })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nenhum campo para atualizar' });

export type AtualizarCategoriaInput = z.infer<typeof atualizarCategoriaSchema>;
