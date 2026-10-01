import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificacoesService } from '../../src/modules/notificacoes/notificacoes.service';

// vi.mock é içado para antes dos imports; vi.hoisted cria o mock nesse mesmo momento
const { criarVarias, listarIdsEquipeAtiva } = vi.hoisted(() => ({ criarVarias: vi.fn(), listarIdsEquipeAtiva: vi.fn() }));
vi.mock('../../src/modules/notificacoes/notificacoes.repository', () => ({
  notificacoesRepository: { criarVarias },
}));
vi.mock('../../src/modules/usuarios/usuarios.repository', () => ({
  usuariosRepository: { listarIdsEquipeAtiva },
}));

const maria = { id: 3, nome: 'Maria Silva' };
const ana = { id: 2, nome: 'Ana Atendente' };
const gerente = { id: 1, nome: 'Gabriel Gerente' };
const solicitacao = { id: 7, titulo: 'Reembolso', solicitante: { id: maria.id }, responsavel: { id: ana.id } };

const destinatarios = () => criarVarias.mock.calls.flatMap(([dados]) => dados.map((n: { destinatarioId: number }) => n.destinatarioId));

describe('notificacoesService', () => {
  beforeEach(() => criarVarias.mockReset());

  it('mudança de status avisa o solicitante com o novo status na mensagem', async () => {
    await notificacoesService.statusAlterado(solicitacao, 'CONCLUIDO', ana);
    expect(criarVarias).toHaveBeenCalledWith([
      expect.objectContaining({ destinatarioId: maria.id, autorId: ana.id, tipo: 'STATUS_ALTERADO', mensagem: expect.stringContaining('Concluído') }),
    ]);
  });

  it('comentário público avisa solicitante e responsável, menos o próprio autor', async () => {
    await notificacoesService.novoComentario(solicitacao, false, gerente);
    expect(destinatarios().sort()).toEqual([ana.id, maria.id].sort());

    criarVarias.mockReset();
    await notificacoesService.novoComentario(solicitacao, false, maria);
    expect(destinatarios()).toEqual([ana.id]);
  });

  it('nota interna nunca avisa o solicitante', async () => {
    await notificacoesService.novoComentario(solicitacao, true, gerente);
    expect(destinatarios()).toEqual([ana.id]);
  });

  it('nova solicitação avisa toda a equipe ativa, com título e categoria', async () => {
    listarIdsEquipeAtiva.mockResolvedValue([gerente.id, ana.id]);
    await notificacoesService.novaSolicitacao({ ...solicitacao, categoria: { nome: 'TI' } }, maria);
    expect(destinatarios().sort()).toEqual([gerente.id, ana.id].sort());
    expect(criarVarias.mock.calls[0][0][0]).toMatchObject({
      tipo: 'NOVA_SOLICITACAO',
      mensagem: 'Maria Silva abriu #0007 "Reembolso" (TI)',
    });
  });

  it('membro da equipe que abre uma solicitação não avisa a si mesmo', async () => {
    listarIdsEquipeAtiva.mockResolvedValue([gerente.id, ana.id]);
    await notificacoesService.novaSolicitacao({ ...solicitacao, categoria: { nome: 'TI' } }, ana);
    expect(destinatarios()).toEqual([gerente.id]);
  });

  it('redesignação avisa novo e antigo responsável e o solicitante, menos o autor', async () => {
    await notificacoesService.redesignada(solicitacao, ana, gerente, gerente);
    expect(destinatarios().sort()).toEqual([ana.id, maria.id].sort());
    expect(criarVarias.mock.calls[0][0][0]).toMatchObject({
      tipo: 'REDESIGNADA',
      mensagem: 'Gabriel Gerente redesignou #0007 "Reembolso" de Ana Atendente para Gabriel Gerente',
    });
  });

  it('não gera nada quando o único envolvido é o autor', async () => {
    await notificacoesService.novoComentario({ ...solicitacao, responsavel: null }, false, maria);
    expect(criarVarias).not.toHaveBeenCalled();
  });
});
