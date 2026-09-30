import { z } from 'zod';

export const loginSchema = z.object({
  usuario: z.string({ error: 'Informe o usuário' }).trim().min(1, 'Informe o usuário').max(50),
  senha: z.string({ error: 'Informe a senha' }).min(1, 'Informe a senha').max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;
