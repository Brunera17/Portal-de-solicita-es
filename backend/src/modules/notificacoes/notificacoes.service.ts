import { TipoNotificacao, type StatusSolicitacao } from '@prisma/client';
import { NotFoundError } from '../../errors/AppError';
import { usuariosRepository } from '../usuarios/usuarios.repository';
import { ROTULOS_STATUS } from '../solicitacoes/solicitacoes.rules';
import { notificacoesRepository, type NovaNotificacao } from './notificacoes.repository';

const LIMITE_LISTAGEM = 30;
const codigo = (id: number) => `#${String(id).padStart(4, '0')}`;

interface SolicitacaoRef {
  id: number;
  titulo: string;
  solicitante: { id: number };
  responsavel?: { id: number } | null;
}

interface Autor {
  id: number;
  nome: string;
}

/** Ninguém é notificado das próprias ações, e cada pessoa recebe no máximo um aviso por evento. */
function destinatarios(ids: (number | null | undefined)[], autorId: number) {
  return [...new Set(ids.filter((id): id is number => !!id && id !== autorId))];
}

async function enviar(ids: number[], base: Omit<NovaNotificacao, 'destinatarioId'>) {
  if (ids.length === 0) return;
  await notificacoesRepository.criarVarias(ids.map((destinatarioId) => ({ ...base, destinatarioId })));
}

export const notificacoesService = {
  async listar(usuarioId: number) {
    const [itens, naoLidas] = await Promise.all([
      notificacoesRepository.listar(usuarioId, LIMITE_LISTAGEM),
      notificacoesRepository.contarNaoLidas(usuarioId),
    ]);
    return { itens, naoLidas };
  },

  async marcarLida(id: number, usuarioId: number) {
    if (!(await notificacoesRepository.marcarLida(id, usuarioId))) {
      throw new NotFoundError('Notificação não encontrada');
    }
  },

  async marcarTodasLidas(usuarioId: number) {
    await notificacoesRepository.marcarTodasLidas(usuarioId);
  },

  async marcarLidasDaSolicitacao(usuarioId: number, solicitacaoId: number) {
    await notificacoesRepository.marcarLidasDaSolicitacao(usuarioId, solicitacaoId);
  },

  solicitacoesNaoVistas(usuarioId: number, solicitacaoIds: number[]) {
    return notificacoesRepository.solicitacoesNaoVistas(usuarioId, solicitacaoIds);
  },

  /** Avisa toda a equipe de atendimento ativa que há uma nova solicitação na fila. */
  async novaSolicitacao(solicitacao: SolicitacaoRef & { categoria: { nome: string } }, autor: Autor) {
    const equipe = await usuariosRepository.listarIdsEquipeAtiva();
    return enviar(destinatarios(equipe, autor.id), {
      autorId: autor.id,
      solicitacaoId: solicitacao.id,
      tipo: TipoNotificacao.NOVA_SOLICITACAO,
      mensagem: `${autor.nome} abriu ${codigo(solicitacao.id)} "${solicitacao.titulo}" (${solicitacao.categoria.nome})`.slice(0, 300),
    });
  },

  /** Avisa o solicitante que o status da solicitação dele mudou. */
  statusAlterado(solicitacao: SolicitacaoRef, novoStatus: StatusSolicitacao, autor: Autor) {
    return enviar(destinatarios([solicitacao.solicitante.id], autor.id), {
      autorId: autor.id,
      solicitacaoId: solicitacao.id,
      tipo: TipoNotificacao.STATUS_ALTERADO,
      mensagem: `${autor.nome} alterou ${codigo(solicitacao.id)} "${solicitacao.titulo}" para ${ROTULOS_STATUS[novoStatus]}`.slice(0, 300),
    });
  },

  /**
   * Avisa os envolvidos sobre um novo comentário: o solicitante (só se for público)
   * e o responsável pelo atendimento.
   */
  novoComentario(solicitacao: SolicitacaoRef, interno: boolean, autor: Autor) {
    const ids = destinatarios([interno ? null : solicitacao.solicitante.id, solicitacao.responsavel?.id], autor.id);
    return enviar(ids, {
      autorId: autor.id,
      solicitacaoId: solicitacao.id,
      tipo: TipoNotificacao.NOVO_COMENTARIO,
      mensagem: `${autor.nome} ${interno ? 'registrou uma nota interna' : 'comentou'} em ${codigo(solicitacao.id)} "${solicitacao.titulo}"`.slice(0, 300),
    });
  },
};
