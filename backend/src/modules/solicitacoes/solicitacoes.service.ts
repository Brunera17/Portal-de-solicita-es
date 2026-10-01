import { StatusSolicitacao } from '@prisma/client';
import { AppError, BusinessRuleError, ForbiddenError, NotFoundError } from '../../errors/AppError';
import { ehEquipe } from '../../lib/permissoes';
import type { UsuarioAutenticado } from '../../types/express';
import { categoriasRepository } from '../categorias/categorias.repository';
import { usuariosRepository } from '../usuarios/usuarios.repository';
import { notificacoesService } from '../notificacoes/notificacoes.service';
import {
  solicitacoesRepository,
  type SolicitacaoDetalhe,
  type SolicitacoesRepository,
} from './solicitacoes.repository';
import { LIMITE_EM_ATENDIMENTO, podeSerAlterada, podeTransicionar, ROTULOS_STATUS } from './solicitacoes.rules';
import type { ListarSolicitacoesInput, RedesignarInput, SolicitacaoInput } from './solicitacoes.schemas';

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

/** Solicitantes só enxergam as próprias solicitações; a equipe (atendente/gerente) enxerga todas. */
export function escopoDoUsuario(usuario: UsuarioAutenticado): number | undefined {
  return ehEquipe(usuario.perfil) ? undefined : usuario.id;
}

interface Dependencias {
  repo: SolicitacoesRepository;
  /** Só o necessário para validar a categoria informada. */
  categorias: { buscarPorId(id: number): Promise<{ id: number; nome: string; ativa: boolean } | null> };
  notificacoes: Pick<
    typeof notificacoesService,
    'statusAlterado' | 'novaSolicitacao' | 'marcarLidasDaSolicitacao' | 'solicitacoesNaoVistas' | 'redesignada'
  >;
  /** Só o necessário para validar quem pode assumir um atendimento. */
  equipe: { buscarMembroAtivo(id: number): Promise<{ id: number; nome: string } | null> };
}

export function criarSolicitacoesService({ repo, categorias, notificacoes, equipe }: Dependencias) {
  /**
   * Novas solicitações exigem categoria ativa. Na edição, manter a categoria atual é
   * permitido mesmo que ela tenha sido desativada depois da abertura.
   */
  async function validarCategoria(categoriaId: number, categoriaAtualId?: number) {
    const categoria = await categorias.buscarPorId(categoriaId);
    if (!categoria) {
      throw new BusinessRuleError('Categoria não encontrada', 'CATEGORIA_INVALIDA');
    }
    if (!categoria.ativa && categoria.id !== categoriaAtualId) {
      throw new BusinessRuleError(`A categoria "${categoria.nome}" está desativada`, 'CATEGORIA_INATIVA');
    }
  }

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
          categoriaId: filtros.categoriaId,
          responsavelId: filtros.responsavelId,
          status: filtros.status,
          tituloContem: filtros.q,
          criadoDesde: filtros.dataInicio ? inicioDoDia(filtros.dataInicio) : undefined,
          // data final é inclusiva: busca tudo antes do início do dia seguinte
          criadoAntesDe: filtros.dataFim ? new Date(inicioDoDia(filtros.dataFim).getTime() + DIA_MS) : undefined,
        },
        { skip: (pagina - 1) * porPagina, take: porPagina },
      );

      // "nova" = ainda não aberta por este usuário (destaque no quadro e na lista)
      const naoVistas = await notificacoes.solicitacoesNaoVistas(usuario.id, itens.map((s) => s.id));

      return {
        dados: itens.map((s) => ({ ...s, nova: naoVistas.has(s.id) })),
        paginacao: { pagina, porPagina, total, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) },
      };
    },

    obter(id: number, usuario: UsuarioAutenticado) {
      return buscarVisivel(id, usuario);
    },

    /** Abertura pela interface: além de obter, dá como lidas as notificações desta solicitação. */
    async abrir(id: number, usuario: UsuarioAutenticado) {
      const solicitacao = await buscarVisivel(id, usuario);
      await notificacoes.marcarLidasDaSolicitacao(usuario.id, id);
      return solicitacao;
    },

    async criar(dados: SolicitacaoInput, usuario: UsuarioAutenticado) {
      await validarCategoria(dados.categoriaId);
      const criada = await repo.criar(dados, usuario.id);
      await notificacoes.novaSolicitacao(criada, usuario);
      return criada;
    },

    async atualizar(id: number, dados: SolicitacaoInput, usuario: UsuarioAutenticado) {
      const atual = await buscarParaAlteracao(id, usuario);
      await validarCategoria(dados.categoriaId, atual.categoria.id);
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

      // Limite de WIP: ninguém acumula mais que LIMITE_EM_ATENDIMENTO atendimentos simultâneos
      if (novoStatus === StatusSolicitacao.EM_ATENDIMENTO) {
        const emAndamento = await repo.contarEmAtendimento(usuario.id);
        if (emAndamento >= LIMITE_EM_ATENDIMENTO) {
          throw new BusinessRuleError(
            `Você já tem ${emAndamento} solicitações em atendimento (limite: ${LIMITE_EM_ATENDIMENTO}). Conclua uma antes de iniciar outra.`,
            'LIMITE_EM_ATENDIMENTO',
          );
        }
      }

      if (!(await repo.alterarStatus(id, atual, novoStatus, usuario.id))) {
        throw new AppError(409, 'CONFLITO', 'A solicitação foi alterada por outro usuário. Atualize a página e tente novamente.');
      }

      await notificacoes.statusAlterado(solicitacao, novoStatus, usuario);
      return buscarVisivel(id, usuario);
    },

    /** Gerente troca o responsável de uma solicitação em atendimento. */
    async redesignar(id: number, { responsavelId, motivo }: RedesignarInput, usuario: UsuarioAutenticado) {
      const solicitacao = await buscarVisivel(id, usuario);
      const anterior = solicitacao.responsavel;

      if (solicitacao.status !== StatusSolicitacao.EM_ATENDIMENTO || !anterior) {
        throw new BusinessRuleError('Só é possível redesignar solicitações em atendimento', 'REDESIGNACAO_INVALIDA');
      }
      if (responsavelId === anterior.id) {
        throw new BusinessRuleError(`${anterior.nome} já é o responsável por esta solicitação`, 'MESMO_RESPONSAVEL');
      }

      const novo = await equipe.buscarMembroAtivo(responsavelId);
      if (!novo) {
        throw new BusinessRuleError('O novo responsável deve ser um atendente ou gerente ativo', 'RESPONSAVEL_INVALIDO');
      }

      const carga = await repo.contarEmAtendimento(novo.id);
      if (carga >= LIMITE_EM_ATENDIMENTO) {
        throw new BusinessRuleError(
          `${novo.nome} já tem ${carga} solicitações em atendimento (limite: ${LIMITE_EM_ATENDIMENTO})`,
          'LIMITE_EM_ATENDIMENTO',
        );
      }

      if (!(await repo.redesignar(id, anterior.id, novo.id, usuario.id, motivo))) {
        throw new AppError(409, 'CONFLITO', 'A solicitação foi alterada por outro usuário. Atualize a página e tente novamente.');
      }

      await notificacoes.redesignada(solicitacao, anterior, novo, usuario);
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

export const solicitacoesService = criarSolicitacoesService({
  repo: solicitacoesRepository,
  categorias: categoriasRepository,
  notificacoes: notificacoesService,
  equipe: usuariosRepository,
});
