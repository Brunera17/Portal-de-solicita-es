import { z } from 'zod';
import { Categoria, StatusSolicitacao } from '@prisma/client';

/** Trata parâmetros de query vazios (`?categoria=`) como ausentes. */
const opcional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

const dataSchema = z.iso.date({ error: 'Data inválida (use o formato AAAA-MM-DD)' });

export const idParamSchema = z.object({
  id: z.coerce.number({ error: 'Código inválido' }).int('Código inválido').positive('Código inválido'),
});

export const solicitacaoSchema = z.object({
  titulo: z
    .string({ error: 'Informe o título' })
    .trim()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(150, 'O título deve ter no máximo 150 caracteres'),
  descricao: z
    .string({ error: 'Informe a descrição' })
    .trim()
    .min(10, 'A descrição deve ter pelo menos 10 caracteres')
    .max(5000, 'A descrição deve ter no máximo 5000 caracteres'),
  categoria: z.enum(Categoria, { error: 'Categoria inválida' }),
});

export const alterarStatusSchema = z.object({
  status: z.enum(StatusSolicitacao, { error: 'Status inválido' }),
});

export const listarSolicitacoesSchema = z
  .object({
    dataInicio: opcional(dataSchema),
    dataFim: opcional(dataSchema),
    categoria: opcional(z.enum(Categoria, { error: 'Categoria inválida' })),
    status: opcional(z.enum(StatusSolicitacao, { error: 'Status inválido' })),
    q: opcional(z.string().trim().max(150, 'A busca deve ter no máximo 150 caracteres')),
    pagina: z.coerce.number().int().min(1, 'Página inválida').default(1),
    porPagina: z.coerce.number().int().min(1).max(100, 'Máximo de 100 itens por página').default(10),
  })
  .refine((f) => !f.dataInicio || !f.dataFim || f.dataInicio <= f.dataFim, {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['dataFim'],
  });

export type SolicitacaoInput = z.infer<typeof solicitacaoSchema>;
export type ListarSolicitacoesInput = z.infer<typeof listarSolicitacoesSchema>;
