import { describe, expect, it } from 'vitest';
import { StatusSolicitacao } from '@prisma/client';
import { podeSerAlterada, podeTransicionar } from '../../src/modules/solicitacoes/solicitacoes.rules';

const { ABERTO, EM_ATENDIMENTO, CONCLUIDO } = StatusSolicitacao;

describe('podeTransicionar', () => {
  it.each([
    [ABERTO, EM_ATENDIMENTO],
    [EM_ATENDIMENTO, CONCLUIDO],
  ])('permite %s → %s', (de, para) => {
    expect(podeTransicionar(de, para)).toBe(true);
  });

  it.each([
    [ABERTO, ABERTO],
    [ABERTO, CONCLUIDO],
    [EM_ATENDIMENTO, ABERTO],
    [EM_ATENDIMENTO, EM_ATENDIMENTO],
    [CONCLUIDO, ABERTO],
    [CONCLUIDO, EM_ATENDIMENTO],
    [CONCLUIDO, CONCLUIDO],
  ])('bloqueia %s → %s', (de, para) => {
    expect(podeTransicionar(de, para)).toBe(false);
  });
});

describe('podeSerAlterada', () => {
  it('permite edição/exclusão apenas quando aberta', () => {
    expect(podeSerAlterada(ABERTO)).toBe(true);
    expect(podeSerAlterada(EM_ATENDIMENTO)).toBe(false);
    expect(podeSerAlterada(CONCLUIDO)).toBe(false);
  });
});
