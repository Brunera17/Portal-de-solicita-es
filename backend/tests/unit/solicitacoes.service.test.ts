import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Perfil, StatusSolicitacao } from '@prisma/client';
import { criarSolicitacoesService } from '../../src/modules/solicitacoes/solicitacoes.service';
import type {
  SolicitacaoDetalhe,
  SolicitacoesRepository,
} from '../../src/modules/solicitacoes/solicitacoes.repository';

const maria = { id: 2, nome: 'Maria', perfil: Perfil.SOLICITANTE };
const joao = { id: 3, nome: 'João', perfil: Perfil.SOLICITANTE };
const atendente = { id: 1, nome: 'Ana', perfil: Perfil.ATENDENTE };
const gerente = { id: 4, nome: 'Gabriel', perfil: Perfil.GERENTE };

const TI = { id: 1, nome: 'TI', ativa: true, criadoEm: new Date() };
const RH = { id: 2, nome: 'RH', ativa: true, criadoEm: new Date() };
const LEGADA = { id: 9, nome: 'Legada', ativa: false, criadoEm: new Date() };
const categoriasPorId = new Map([TI, RH, LEGADA].map((c) => [c.id, c]));

function solicitacao(status: StatusSolicitacao, dono = maria, categoria = TI): SolicitacaoDetalhe {
  return {
    id: 10,
    titulo: 'Teste',
    descricao: 'Descrição de teste',
    categoria: { id: categoria.id, nome: categoria.nome },
    status,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    solicitante: { id: dono.id, nome: dono.nome, corAvatar: 'indigo' },
    historico: [],
  };
}

const dados = { titulo: 'Novo título', descricao: 'Nova descrição válida', categoriaId: RH.id };

function criarRepoFake() {
  return {
    listar: vi.fn().mockResolvedValue({ itens: [], total: 0 }),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizarSeAberta: vi.fn().mockResolvedValue(true),
    excluirSeAberta: vi.fn().mockResolvedValue(true),
    alterarStatus: vi.fn().mockResolvedValue(true),
    contarPorStatus: vi.fn().mockResolvedValue([]),
  } satisfies Record<keyof SolicitacoesRepository, unknown>;
}

describe('solicitacoesService', () => {
  let repo: ReturnType<typeof criarRepoFake>;
  let service: ReturnType<typeof criarSolicitacoesService>;

  beforeEach(() => {
    repo = criarRepoFake();
    service = criarSolicitacoesService({
      repo: repo as unknown as SolicitacoesRepository,
      categorias: { buscarPorId: async (id: number) => categoriasPorId.get(id) ?? null },
    });
  });

  describe('listar', () => {
    it('restringe o solicitante às próprias solicitações', async () => {
      await service.listar({ pagina: 1, porPagina: 10 }, maria);
      expect(repo.listar).toHaveBeenCalledWith(expect.objectContaining({ solicitanteId: maria.id }), {
        skip: 0,
        take: 10,
      });
    });

    it('não restringe o gerente', async () => {
      await service.listar({ pagina: 1, porPagina: 10 }, gerente);
      expect(repo.listar).toHaveBeenCalledWith(expect.objectContaining({ solicitanteId: undefined }), expect.anything());
    });

    it('não restringe o atendente', async () => {
      await service.listar({ pagina: 3, porPagina: 5 }, atendente);
      expect(repo.listar).toHaveBeenCalledWith(expect.objectContaining({ solicitanteId: undefined }), {
        skip: 10,
        take: 5,
      });
    });

    it('torna a data final inclusiva (até o início do dia seguinte)', async () => {
      await service.listar({ pagina: 1, porPagina: 10, dataInicio: '2026-09-01', dataFim: '2026-09-30' }, atendente);
      const [filtros] = repo.listar.mock.calls[0];
      expect(filtros.criadoDesde).toEqual(new Date('2026-09-01T00:00:00'));
      expect(filtros.criadoAntesDe).toEqual(new Date('2026-10-01T00:00:00'));
    });

    it('calcula o total de páginas', async () => {
      repo.listar.mockResolvedValue({ itens: [], total: 21 });
      const r = await service.listar({ pagina: 1, porPagina: 10 }, atendente);
      expect(r.paginacao).toEqual({ pagina: 1, porPagina: 10, total: 21, totalPaginas: 3 });
    });
  });

  describe('obter', () => {
    it('lança 404 quando não existe', async () => {
      repo.buscarPorId.mockResolvedValue(null);
      await expect(service.obter(99, maria)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('impede solicitante de ver solicitação de outro', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO', joao));
      await expect(service.obter(10, maria)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('permite atendente ver qualquer solicitação', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO', joao));
      await expect(service.obter(10, atendente)).resolves.toMatchObject({ id: 10 });
    });
  });

  describe('categoria', () => {
    it('rejeita criação com categoria desativada', async () => {
      await expect(service.criar({ ...dados, categoriaId: LEGADA.id }, maria)).rejects.toMatchObject({
        statusCode: 422,
        code: 'CATEGORIA_INATIVA',
      });
      expect(repo.criar).not.toHaveBeenCalled();
    });

    it('rejeita categoria inexistente', async () => {
      await expect(service.criar({ ...dados, categoriaId: 999 }, maria)).rejects.toMatchObject({
        code: 'CATEGORIA_INVALIDA',
      });
    });

    it('permite manter na edição uma categoria que foi desativada depois', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO', maria, LEGADA));
      await service.atualizar(10, { ...dados, categoriaId: LEGADA.id }, maria);
      expect(repo.atualizarSeAberta).toHaveBeenCalled();
    });

    it('não permite trocar para uma categoria desativada', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO', maria, TI));
      await expect(service.atualizar(10, { ...dados, categoriaId: LEGADA.id }, maria)).rejects.toMatchObject({
        code: 'CATEGORIA_INATIVA',
      });
    });
  });

  describe('atualizar / excluir', () => {
    it('permite o dono editar solicitação aberta', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO'));
      await service.atualizar(10, dados, maria);
      expect(repo.atualizarSeAberta).toHaveBeenCalledWith(10, dados);
    });

    it('bloqueia edição de solicitação que não está aberta', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('EM_ATENDIMENTO'));
      await expect(service.atualizar(10, dados, maria)).rejects.toMatchObject({
        statusCode: 422,
        code: 'SOLICITACAO_NAO_ABERTA',
      });
      expect(repo.atualizarSeAberta).not.toHaveBeenCalled();
    });

    it('bloqueia edição pelo atendente (não é o dono)', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO'));
      await expect(service.atualizar(10, dados, atendente)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('trata mudança concorrente de status como regra violada', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO'));
      repo.excluirSeAberta.mockResolvedValue(false);
      await expect(service.excluir(10, maria)).rejects.toMatchObject({ statusCode: 422 });
    });
  });

  describe('alterarStatus', () => {
    it('avança de Aberto para Em Atendimento', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO'));
      await service.alterarStatus(10, 'EM_ATENDIMENTO', atendente);
      expect(repo.alterarStatus).toHaveBeenCalledWith(10, 'ABERTO', 'EM_ATENDIMENTO', atendente.id);
    });

    it('gerente também pode avançar o status', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('EM_ATENDIMENTO'));
      await service.alterarStatus(10, 'CONCLUIDO', gerente);
      expect(repo.alterarStatus).toHaveBeenCalledWith(10, 'EM_ATENDIMENTO', 'CONCLUIDO', gerente.id);
    });

    it('rejeita transição inválida', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('CONCLUIDO'));
      await expect(service.alterarStatus(10, 'ABERTO', atendente)).rejects.toMatchObject({
        statusCode: 422,
        code: 'TRANSICAO_STATUS_INVALIDA',
      });
    });

    it('retorna 409 se o status mudou durante a operação', async () => {
      repo.buscarPorId.mockResolvedValue(solicitacao('ABERTO'));
      repo.alterarStatus.mockResolvedValue(false);
      await expect(service.alterarStatus(10, 'EM_ATENDIMENTO', atendente)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('resumo', () => {
    it('soma os status e preenche ausentes com zero', async () => {
      repo.contarPorStatus.mockResolvedValue([
        { status: 'ABERTO', quantidade: 4 },
        { status: 'CONCLUIDO', quantidade: 2 },
      ]);
      await expect(service.resumo(maria)).resolves.toEqual({
        total: 6,
        abertas: 4,
        emAtendimento: 0,
        concluidas: 2,
      });
      expect(repo.contarPorStatus).toHaveBeenCalledWith(maria.id);
    });
  });
});
