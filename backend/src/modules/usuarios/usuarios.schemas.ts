import { z } from 'zod';
import { Perfil } from '@prisma/client';

export const CORES_AVATAR = ['indigo', 'sky', 'teal', 'emerald', 'amber', 'orange', 'rose', 'violet', 'slate'] as const;

const nome = z
  .string({ error: 'Informe o nome' })
  .trim()
  .min(3, 'O nome deve ter pelo menos 3 caracteres')
  .max(100, 'O nome deve ter no máximo 100 caracteres');

const senha = z
  .string({ error: 'Informe a senha' })
  .min(6, 'A senha deve ter pelo menos 6 caracteres')
  .max(100, 'A senha deve ter no máximo 100 caracteres');

const perfil = z.enum(Perfil, { error: 'Perfil inválido' });

export const criarUsuarioSchema = z.object({
  nome,
  usuario: z
    .string({ error: 'Informe o usuário' })
    .trim()
    .toLowerCase()
    .min(3, 'O usuário deve ter pelo menos 3 caracteres')
    .max(50, 'O usuário deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9._-]+$/, 'Use apenas letras minúsculas, números, ponto, hífen ou sublinhado'),
  senha,
  perfil,
});

export const atualizarUsuarioSchema = z
  .object({ nome, perfil, ativo: z.boolean({ error: 'Valor inválido' }) })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nenhum campo para atualizar' });

export const redefinirSenhaSchema = z.object({ senha });

export const atualizarPerfilSchema = z
  .object({ nome, corAvatar: z.enum(CORES_AVATAR, { error: 'Cor inválida' }) })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nenhum campo para atualizar' });

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string({ error: 'Informe a senha atual' }).min(1, 'Informe a senha atual'),
    novaSenha: senha,
  })
  .refine((d) => d.senhaAtual !== d.novaSenha, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['novaSenha'],
  });

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
export type AtualizarPerfilInput = z.infer<typeof atualizarPerfilSchema>;
export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>;
