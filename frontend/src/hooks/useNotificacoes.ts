import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificacoesApi } from '@/api/endpoints'
import { toast } from '@/lib/avisos'
import type { ListaNotificacoes } from '@/types'

const CHAVE = ['notificacoes'] as const
/** Intervalo da consulta periódica. Também atualiza ao voltar para a aba. */
const INTERVALO_MS = 20_000

/** Notificações do usuário com consulta periódica (polling); vários componentes compartilham o cache. */
function useConsultaNotificacoes() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: notificacoesApi.listar,
    refetchInterval: INTERVALO_MS,
    refetchIntervalInBackground: false,
  })
}

/**
 * Mostra um aviso quando chega notificação nova e atualiza as listas de solicitações
 * (o status pode ter mudado). Deve ser usado UMA vez (no layout), senão os avisos duplicam.
 */
export function useAvisarNovasNotificacoes() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const vistas = useRef<Set<number> | null>(null)
  const consulta = useConsultaNotificacoes()

  useEffect(() => {
    const itens = consulta.data?.itens
    if (!itens) return

    // Primeira carga: só registra o que já existia, sem avisar
    if (vistas.current === null) {
      vistas.current = new Set(itens.map((n) => n.id))
      return
    }

    const novas = itens.filter((n) => !n.lida && !vistas.current!.has(n.id))
    itens.forEach((n) => vistas.current!.add(n.id))
    if (novas.length === 0) return

    void queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })

    for (const n of novas.slice(0, 3).reverse()) {
      toast.info(n.mensagem, {
        action: { label: 'Abrir', onClick: () => navigate(`/solicitacoes/${n.solicitacaoId}`) },
      })
    }
    if (novas.length > 3) toast.info(`E mais ${novas.length - 3} notificação(ões)`)
  }, [consulta.data, queryClient, navigate])
}

/** Lista de notificações e ações de marcar como lida (para o sino). */
export function useNotificacoes() {
  const queryClient = useQueryClient()
  const consulta = useConsultaNotificacoes()

  const atualizarCache = (alterar: (atual: ListaNotificacoes) => ListaNotificacoes) =>
    queryClient.setQueryData<ListaNotificacoes>(CHAVE, (atual) => (atual ? alterar(atual) : atual))

  // Atualização otimista: o contador cai na hora; o servidor confirma em seguida
  const marcarLida = useMutation({
    mutationFn: notificacoesApi.marcarLida,
    onMutate: (id: number) =>
      atualizarCache((atual) => ({
        naoLidas: Math.max(0, atual.naoLidas - (atual.itens.some((n) => n.id === id && !n.lida) ? 1 : 0)),
        itens: atual.itens.map((n) => (n.id === id ? { ...n, lida: true } : n)),
      })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })

  const marcarTodas = useMutation({
    mutationFn: notificacoesApi.marcarTodasLidas,
    onMutate: () => atualizarCache((atual) => ({ naoLidas: 0, itens: atual.itens.map((n) => ({ ...n, lida: true })) })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })

  return { consulta, marcarLida, marcarTodas }
}
