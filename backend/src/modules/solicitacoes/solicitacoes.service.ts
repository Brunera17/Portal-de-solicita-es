import { Perfil, type StatusSolicitacao } from '@prisma/client';
import { AppError, BusinessRuleError, ForbiddenError, NotFoundError } from '../../errors/AppError';
import type { UsuarioAutenticado } from '../../types/express';
import {
  solicitacoesRepository,
  type SolicitacaoDetalhe,
  type SolicitacoesRepository,
} from './solicitacoes.repository';
import { podeSerAlterada, podeTransicionar, ROTULOS_STATUS } from './solicitacoes.rules';
import type { ListarSolicitacoesInput, SolicitacaoInput } from './solicitacoes.schemas';

const DIA_MS = 24 * 60 * 60 * 1000;

/** Converte 'AAAA-MM-DD' para o início do dia no fuso horário do servidor. */
function inicioDoDia(data: string): Date {
  return new Date(`${data}T00:00:00`);
}

function solicitacaoNaoAberta() {
  return new BusinessRuleError(
    'Apenas solicitações com status "Aberto" podem ser editadas ou excluídas',
    'SOLICITACAO_NAO_ABERTA',
  );
}

/** Solicitantes só enxergam as próprias solicitações; atendentes enxergam todas. */
export function escopoDoUsuario(usuario: UsuarioAutenticado): number | undefined {
  return usuario.perfil === Perfil.SOLICITANTE ? usuario.id : undefined;
}

export function criarSolicitacoesService(repo: SolicitacoesRepository) {
  async function buscarVisivel(id: number, usuario: UsuarioAutenticado): Promise<SolicitacaoDetalhe> {
    const solicitacao = await repo.buscarPorId(id);
    if (!solicitacao) {
      throw new NotFoundError('Solicitação não encontrada');
    }
    const escopo = escopoDoUsuario(usuario);
    if (escopo !== undefined && solicitacao.solicitante.id !== escopo) {
      throw new ForbiddenError('Você não tem acesso a esta solicitação');
    }
    return solicitacao;
  }

  /** Garante que o usuário é o dono da solicitação e que ela ainda está aberta. */
  async function buscarParaAlteracao(id: number, usuario: UsuarioAutenticado) {
    const solicitacao = await buscarVisivel(id, usuario);
    if (solicitacao.solicitante.id !== usuario.id) {
      throw new ForbiddenError('Apenas o solicitante pode editar ou excluir a solicitação');
    }
    if (!podeSerAlterada(solicitacao.status)) {
      throw solicitacaoNaoAberta();
    }
    return solicitacao;
  }

  return {
    async listar(filtros: ListarSolicitacoesInput, usuario: UsuarioAutenticado) {
      const { pagina, porPagina } = filtros;
      const { itens, total } = await repo.listar(
        {
          solicitanteId: escopoDoUsuario(usuario),
          categoria: filtros.categoria,
          status: filtros.status,
          tituloContem: filtros.q,
          criadoDesde: filtros.dataInicio ? inicioDoDia(filtros.dataInicio) : undefined,
          // data final é inclusiva: busca tudo antes do início do dia seguinte
          criadoAntesDe: filtros.dataFim ? new Date(inicioDoDia(filtros.dataFim).getTime() + DIA_MS) : undefined,
        },
        { skip: (pagina - 1) * porPagina, take: porPagina },
      );

      return {
        dados: itens,
        paginacao: { pagina, porPagina, total, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) },
      };
    },

    obter(id: number, usuario: UsuarioAutenticado) {
      return buscarVisivel(id, usuario);
    },

    criar(dados: SolicitacaoInput, usuario: UsuarioAutenticado) {
      return repo.criar(dados, usuario.id);
    },

    async atualizar(id: number, dados: SolicitacaoInput, usuario: UsuarioAutenticado) {
      await buscarParaAlteracao(id, usuario);
      if (!(await repo.atualizarSeAberta(id, dados))) {
        throw solicitacaoNaoAberta();
      }
      return buscarVisivel(id, usuario);
    },

    async excluir(id: number, usuario: UsuarioAutenticado) {
      await buscarParaAlteracao(id, usuario);
      if (!(await repo.excluirSeAberta(id))) {
        throw solicitacaoNaoAberta();
      }
    },

    async alterarStatus(id: number, novoStatus: StatusSolicitacao, usuario: UsuarioAutenticado) {
      const solicitacao = await buscarVisivel(id, usuario);
      const atual = solicitacao.status;

      if (!podeTransicionar(atual, novoStatus)) {
        throw new BusinessRuleError(
          `Não é possível alterar o status de "${ROTULOS_STATUS[atual]}" para "${ROTULOS_STATUS[novoStatus]}"`,
          'TRANSICAO_STATUS_INVALIDA',
        );
      }

      if (!(await repo.alterarStatus(id, atual, novoStatus, usuario.id))) {
        throw new AppError(409, 'CONFLITO', 'A solicitação foi alterada por outro usuário. Atualize a página e tente novamente.');
      }

      return buscarVisivel(id, usuario);
    },

    async resumo(usuario: UsuarioAutenticado) {
      const contagens = await repo.contarPorStatus(escopoDoUsuario(usuario));
      const quantidade = (status: StatusSolicitacao) =>
        contagens.find((c) => c.status === status)?.quantidade ?? 0;

      const abertas = quantidade('ABERTO');
      const emAtendimento = quantidade('EM_ATENDIMENTO');
      const concluidas = quantidade('CONCLUIDO');

      return { total: abertas + emAtendimento + concluidas, abertas, emAtendimento, concluidas };
    },
  };
}

export const solicitacoesService = criarSolicitacoesService(solicitacoesRepository);
