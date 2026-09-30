import { AppError, NotFoundError } from '../../errors/AppError';
import { categoriasRepository } from './categorias.repository';
import type { AtualizarCategoriaInput } from './categorias.schemas';

async function garantirExiste(id: number) {
  const categoria = await categoriasRepository.buscarPorId(id);
  if (!categoria) throw new NotFoundError('Categoria não encontrada');
  return categoria;
}

export const categoriasService = {
  listar(incluirInativas: boolean) {
    return categoriasRepository.listar(incluirInativas);
  },

  // Nome repetido vira 409 pelo errorHandler (violação de UNIQUE)
  criar(nome: string) {
    return categoriasRepository.criar(nome);
  },

  async atualizar(id: number, dados: AtualizarCategoriaInput) {
    await garantirExiste(id);
    return categoriasRepository.atualizar(id, dados);
  },

  /** Só exclui categorias nunca usadas; as demais devem ser desativadas para preservar o histórico. */
  async excluir(id: number) {
    await garantirExiste(id);
    const emUso = await categoriasRepository.contarSolicitacoes(id);
    if (emUso > 0) {
      throw new AppError(
        409,
        'CATEGORIA_EM_USO',
        `A categoria possui ${emUso} solicitação(ões) e não pode ser excluída. Desative-a para impedir novos usos.`,
      );
    }
    await categoriasRepository.excluir(id);
  },
};
