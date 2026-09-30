import { z } from 'zod';

export const criarComentarioSchema = z.object({
  texto: z
    .string({ error: 'Escreva o comentário' })
    .trim()
    .min(1, 'Escreva o comentário')
    .max(2000, 'O comentário deve ter no máximo 2000 caracteres'),
  interno: z.boolean({ error: 'Valor inválido' }).default(false),
});

export type CriarComentarioInput = z.infer<typeof criarComentarioSchema>;
