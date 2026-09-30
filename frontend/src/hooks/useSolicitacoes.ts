import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardApi, solicitacoesApi } from '@/api/endpoints'
import type { FiltrosSolicitacao, SolicitacaoInput, Status } from '@/types'

export const chaves = {
  todas: ['solicitacoes'] as const,
  lista: (filtros: FiltrosSolicitacao) => ['solicitacoes', 'lista', filtros] as const,
  detalhe: (id: number) => ['solicitacoes', 'detalhe', id] as const,
  dashboard: ['dashboard'] as const,
}

export function useListaSolicitacoes(filtros: FiltrosSolicitacao) {
  return useQuery({
    queryKey: chaves.lista(filtros),
    queryFn: () => solicitacoesApi.listar(filtros),
    placeholderData: keepPreviousData, // mantém a tabela visível enquanto troca de página/filtro
  })
}

export function useSolicitacao(id: number) {
  return useQuery({
    queryKey: chaves.detalhe(id),
    queryFn: () => solicitacoesApi.obter(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useResumoDashboard() {
  return useQuery({ queryKey: chaves.dashboard, queryFn: dashboardApi.resumo })
}

/** Qualquer escrita invalida listas, detalhes e dashboard para refletir o novo estado. */
function useInvalidarTudo() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: chaves.todas }),
      queryClient.invalidateQueries({ queryKey: chaves.dashboard }),
    ])
}

export function useCriarSolicitacao() {
  const invalidar = useInvalidarTudo()
  return useMutation({
    mutationFn: (dados: SolicitacaoInput) => solicitacoesApi.criar(dados),
    onSuccess: invalidar,
  })
}

export function useAtualizarSolicitacao(id: number) {
  const invalidar = useInvalidarTudo()
  return useMutation({
    mutationFn: (dados: SolicitacaoInput) => solicitacoesApi.atualizar(id, dados),
    onSuccess: invalidar,
  })
}

export function useExcluirSolicitacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => solicitacoesApi.excluir(id),
    // Não invalida o detalhe (ele deixou de existir e recarregá-lo daria 404): apenas o descarta
    onSuccess: (_resposta, id) => {
      queryClient.removeQueries({ queryKey: chaves.detalhe(id) })
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['solicitacoes', 'lista'] }),
        queryClient.invalidateQueries({ queryKey: chaves.dashboard }),
      ])
    },
  })
}

export function useAlterarStatus(id: number) {
  const invalidar = useInvalidarTudo()
  return useMutation({
    mutationFn: (status: Status) => solicitacoesApi.alterarStatus(id, status),
    onSuccess: invalidar,
  })
}
