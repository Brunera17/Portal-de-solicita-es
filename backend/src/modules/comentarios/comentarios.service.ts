import { ForbiddenError } from '../../errors/AppError';
import { ehEquipe } from '../../lib/permissoes';
import type { UsuarioAutenticado } from '../../types/express';
import { notificacoesService } from '../notificacoes/notificacoes.service';
import { solicitacoesService } from '../solicitacoes/solicitacoes.service';
import { comentariosRepository } from './comentarios.repository';
import type { CriarComentarioInput } from './comentarios.schemas';

/**
 * Comentários herdam a visibilidade da solicitação: quem pode vê-la pode comentar.
 * Notas internas são exclusivas da equipe (atendente/gerente) — o solicitante não as vê.
 */
export const comentariosService = {
  async listar(solicitacaoId: number, usuario: UsuarioAutenticado) {
    await solicitacoesService.obter(solicitacaoId, usuario); // 404/403 se não puder ver
    return comentariosRepository.listar(solicitacaoId, ehEquipe(usuario.perfil));
  },

  async criar(solicitacaoId: number, { texto, interno }: CriarComentarioInput, usuario: UsuarioAutenticado) {
    const solicitacao = await solicitacoesService.obter(solicitacaoId, usuario);
    if (interno && !ehEquipe(usuario.perfil)) {
      throw new ForbiddenError('Apenas a equipe de atendimento pode registrar notas internas');
    }
    const comentario = await comentariosRepository.criar({ solicitacaoId, autorId: usuario.id, texto, interno });
    await notificacoesService.novoComentario(solicitacao, interno, usuario);
    return comentario;
  },
};
