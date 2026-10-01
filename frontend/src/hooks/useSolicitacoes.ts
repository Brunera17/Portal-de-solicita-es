import { useEffect } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { comentariosApi, dashboardApi, solicitacoesApi } from '@/api/endpoints'
import type { FiltrosSolicitacao, SolicitacaoInput, Status } from '@/types'

export const chaves = {
  todas: ['solicitacoes'] as const,
  lista: (filtros: FiltrosSolicitacao) => ['solicitacoes', 'lista', filtros] as const,
  detalhe: (id: number) => ['solicitacoes', 'detalhe', id] as const,
  comentarios: (id: number) => ['solicitacoes', 'comentarios', id] as const,
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
  const queryClient = useQueryClient()
  const consulta = useQuery({
    queryKey: chaves.detalhe(id),
    queryFn: () => solicitacoesApi.obter(id),
    enabled: Number.isInteger(id) && id > 0,
  })

  // Abrir a solicitação marca as notificações dela como lidas no servidor: atualiza o sino
  // e as listas para o destaque "Nova" sumir imediatamente
  const carregadaEm = consulta.dataUpdatedAt
  useEffect(() => {
    if (!carregadaEm) return
    void queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    void queryClient.invalidateQueries({ queryKey: ['solicitacoes', 'lista'] })
  }, [carregadaEm, queryClient])

  return consulta
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

export function useComentarios(solicitacaoId: number) {
  return useQuery({
    queryKey: chaves.comentarios(solicitacaoId),
    queryFn: () => comentariosApi.listar(solicitacaoId),
  })
}

export function useCriarComentario(solicitacaoId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: { texto: string; interno: boolean }) => comentariosApi.criar(solicitacaoId, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.comentarios(solicitacaoId) }),
  })
}

/** Variante de useAlterarStatus que recebe o id na chamada (usada no Kanban). */
export function useMoverSolicitacao() {
  const invalidar = useInvalidarTudo()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Status }) => solicitacoesApi.alterarStatus(id, status),
    onSettled: invalidar,
  })
}

export function useAlterarStatus(id: number) {
  const invalidar = useInvalidarTudo()
  return useMutation({
    mutationFn: (status: Status) => solicitacoesApi.alterarStatus(id, status),
    onSuccess: invalidar,
  })
}
