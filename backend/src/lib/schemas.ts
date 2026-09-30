import { z } from 'zod';

/** Parâmetro de rota `:id` numérico, compartilhado pelos módulos. */
export const idParamSchema = z.object({
  id: z.coerce.number({ error: 'Código inválido' }).int('Código inválido').positive('Código inválido'),
});
