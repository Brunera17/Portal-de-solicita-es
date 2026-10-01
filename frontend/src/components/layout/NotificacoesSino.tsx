import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRightLeft, Bell, CheckCheck, FilePlus2, MessageSquare } from 'lucide-react'
import { useNotificacoes } from '@/hooks/useNotificacoes'
import { cn } from '@/lib/cn'
import { formatarRelativo } from '@/lib/format'
import type { Notificacao } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  /** "lateral": painel abre à direita (sidebar); "abaixo": abre sob o botão (barra do celular). */
  posicao: 'lateral' | 'abaixo'
}

export function NotificacoesSino({ posicao }: Props) {
  const { consulta, marcarLida, marcarTodas } = useNotificacoes()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  const naoLidas = consulta.data?.naoLidas ?? 0

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => !raiz.current?.contains(e.target as Node) && setAberto(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const abrir = (n: Notificacao) => {
    if (!n.lida) marcarLida.mutate(n.id)
    setAberto(false)
    navigate(`/solicitacoes/${n.solicitacaoId}`)
  }

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label={naoLidas ? `Notificações: ${naoLidas} não lida(s)` : 'Notificações'}
        className="relative grid size-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        <Bell aria-hidden className="size-5" />
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4.5 text-white ring-2 ring-surface">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Notificações"
          className={cn(
            'z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-xl',
            posicao === 'lateral' ? 'absolute left-full top-0 ml-3 w-96' : 'fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96',
          )}
        >
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Notificações</h2>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={() => marcarTodas.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <CheckCheck aria-hidden className="size-4" />
                Marcar todas como lidas
              </button>
            )}
          </header>

          <div className="overflow-y-auto">
            {consulta.isPending ? (
              <div className="flex justify-center py-10 text-slate-400">
                <Spinner />
              </div>
            ) : !consulta.data?.itens.length ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma notificação por enquanto.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {consulta.data.itens.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => abrir(n)}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                        !n.lida && 'bg-indigo-50/60',
                      )}
                    >
                      <span className="relative">
                        <Avatar nome={n.autor.nome} cor={n.autor.corAvatar} />
                        <span className="absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full bg-surface text-slate-500 ring-1 ring-slate-200">
                          {n.tipo === 'NOVO_COMENTARIO' ? (
                            <MessageSquare aria-hidden className="size-2.5" />
                          ) : n.tipo === 'NOVA_SOLICITACAO' ? (
                            <FilePlus2 aria-hidden className="size-2.5" />
                          ) : (
                            <ArrowRightLeft aria-hidden className="size-2.5" />
                          )}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm', n.lida ? 'text-slate-600' : 'font-medium text-slate-800')}>
                          {n.mensagem}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">{formatarRelativo(n.criadoEm)}</span>
                      </span>
                      {!n.lida && <span aria-label="Não lida" className="mt-1.5 size-2 shrink-0 rounded-full bg-indigo-500" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
