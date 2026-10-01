import { cn } from '@/lib/cn'
import { ROTULO_STATUS } from '@/lib/dominio'
import type { Status } from '@/types'

const coresStatus: Record<Status, string> = {
  ABERTO: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  EM_ATENDIMENTO: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  CONCLUIDO: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

const pontoStatus: Record<Status, string> = {
  ABERTO: 'bg-sky-500',
  EM_ATENDIMENTO: 'bg-amber-500',
  CONCLUIDO: 'bg-emerald-500',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        coresStatus[status],
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', pontoStatus[status])} />
      {ROTULO_STATUS[status]}
    </span>
  )
}

/** Selo de solicitação ainda não aberta pelo usuário logado. */
export function NovaBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      <span aria-hidden className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex size-1.5 rounded-full bg-white" />
      </span>
      Nova
    </span>
  )
}

export function CategoriaBadge({ nome }: { nome: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {nome}
    </span>
  )
}
