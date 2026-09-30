import { Perfil } from '@prisma/client';

/** Perfis da equipe de atendimento (veem todas as solicitações e alteram status). */
export const PERFIS_EQUIPE: readonly Perfil[] = [Perfil.ATENDENTE, Perfil.GERENTE];

export const ehEquipe = (perfil: Perfil) => PERFIS_EQUIPE.includes(perfil);
export const ehGerente = (perfil: Perfil) => perfil === Perfil.GERENTE;
