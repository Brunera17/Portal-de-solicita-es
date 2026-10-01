import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriasApi, usuariosApi } from '@/api/endpoints'
import type { Perfil } from '@/types'

export const chavesAdmin = {
  categorias: ['categorias'] as const,
  usuarios: ['usuarios'] as const,
}

/** Categorias: ativas para todos; o gerente recebe todas (com total de uso). */
export function useCategorias() {
  return useQuery({ queryKey: chavesAdmin.categorias, queryFn: categoriasApi.listar, staleTime: 5 * 60_000 })
}

function useInvalidarCategorias() {
  const queryClient = useQueryClient()
  // Solicitações exibem o nome da categoria: renomear precisa refletir nas listas
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: chavesAdmin.categorias }),
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] }),
    ])
}

export function useCriarCategoria() {
  const invalidar = useInvalidarCategorias()
  return useMutation({ mutationFn: categoriasApi.criar, onSuccess: invalidar })
}

export function useAtualizarCategoria() {
  const invalidar = useInvalidarCategorias()
  return useMutation({
    mutationFn: ({ id, ...dados }: { id: number; nome?: string; ativa?: boolean }) => categoriasApi.atualizar(id, dados),
    onSuccess: invalidar,
  })
}

export function useExcluirCategoria() {
  const invalidar = useInvalidarCategorias()
  return useMutation({ mutationFn: categoriasApi.excluir, onSuccess: invalidar })
}

/** Equipe com carga atual: sempre busca de novo ao abrir (a carga muda o tempo todo). */
export function useEquipe(habilitado: boolean) {
  return useQuery({ queryKey: ['usuarios', 'equipe'], queryFn: usuariosApi.listarEquipe, enabled: habilitado, staleTime: 0 })
}

export function useUsuarios() {
  return useQuery({ queryKey: chavesAdmin.usuarios, queryFn: usuariosApi.listar })
}

function useInvalidarUsuarios() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: chavesAdmin.usuarios })
}

export function useCriarUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation({ mutationFn: usuariosApi.criar, onSuccess: invalidar })
}

export function useAtualizarUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation({
    mutationFn: ({ id, ...dados }: { id: number; nome?: string; perfil?: Perfil; ativo?: boolean }) =>
      usuariosApi.atualizar(id, dados),
    onSuccess: invalidar,
  })
}

export function useRedefinirSenha() {
  return useMutation({
    mutationFn: ({ id, senha }: { id: number; senha: string }) => usuariosApi.redefinirSenha(id, senha),
  })
}
