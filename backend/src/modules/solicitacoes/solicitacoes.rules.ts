import { StatusSolicitacao } from '@prisma/client';

/**
 * Fluxo de status permitido. O atendimento só avança:
 * ABERTO → EM_ATENDIMENTO → CONCLUIDO. Uma solicitação concluída é final.
 */
export const TRANSICOES_PERMITIDAS: Record<StatusSolicitacao, readonly StatusSolicitacao[]> = {
  [StatusSolicitacao.ABERTO]: [StatusSolicitacao.EM_ATENDIMENTO],
  [StatusSolicitacao.EM_ATENDIMENTO]: [StatusSolicitacao.CONCLUIDO],
  [StatusSolicitacao.CONCLUIDO]: [],
};

export function podeTransicionar(de: StatusSolicitacao, para: StatusSolicitacao): boolean {
  return TRANSICOES_PERMITIDAS[de].includes(para);
}

/** Quantas solicitações cada pessoa da equipe pode ter em atendimento ao mesmo tempo (WIP). */
export const LIMITE_EM_ATENDIMENTO = 3;

/** Edição e exclusão só são permitidas enquanto a solicitação está aberta. */
export function podeSerAlterada(status: StatusSolicitacao): boolean {
  return status === StatusSolicitacao.ABERTO;
}

export const ROTULOS_STATUS: Record<StatusSolicitacao, string> = {
  [StatusSolicitacao.ABERTO]: 'Aberto',
  [StatusSolicitacao.EM_ATENDIMENTO]: 'Em Atendimento',
  [StatusSolicitacao.CONCLUIDO]: 'Concluído',
};
