import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { GripVertical, Info, Search } from 'lucide-react'
import { mensagemDeErro } from '@/api/errors'
import { useCategorias } from '@/hooks/useAdmin'
import { useUsuarioLogado } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useListaSolicitacoes, useMoverSolicitacao } from '@/hooks/useSolicitacoes'
import { cn } from '@/lib/cn'
import { ehEquipe, PROXIMA_ACAO, ROTULO_STATUS } from '@/lib/dominio'
import { formatarCodigo, formatarData } from '@/lib/format'
import { STATUS, type SolicitacaoResumo, type Status } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { CategoriaBadge } from '@/components/ui/Badges'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Input, Select } from '@/components/ui/Campo'
import { Carregando, ErroCarregamento } from '@/components/ui/Estados'

const LIMITE_POR_COLUNA = 50

const estiloColuna: Record<Status, { ponto: string; destaque: string }> = {
  ABERTO: { ponto: 'bg-sky-500', destaque: 'outline-sky-400 bg-sky-50/70' },
  EM_ATENDIMENTO: { ponto: 'bg-amber-500', destaque: 'outline-amber-400 bg-amber-50/70' },
  CONCLUIDO: { ponto: 'bg-emerald-500', destaque: 'outline-emerald-400 bg-emerald-50/70' },
}

interface Arrastando {
  solicitacao: SolicitacaoResumo
  destinoPermitido: Status | null
}

/** Mensagens do leitor de tela em português. */
const anuncios: Announcements = {
  onDragStart: ({ active }) => `Solicitação ${active.data.current?.titulo} selecionada.`,
  onDragOver: ({ over }) => (over ? `Sobre a coluna ${ROTULO_STATUS[over.id as Status]}.` : 'Fora das colunas.'),
  onDragEnd: ({ over }) => (over ? `Solicitação solta em ${ROTULO_STATUS[over.id as Status]}.` : 'Movimento cancelado.'),
  onDragCancel: () => 'Movimento cancelado.',
}

export function KanbanPage() {
  const usuario = useUsuarioLogado()
  const podeMover = ehEquipe(usuario.perfil)
  const categorias = useCategorias()
  const mover = useMoverSolicitacao()

  const [busca, setBusca] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>()
  const [arrastando, setArrastando] = useState<Arrastando | null>(null)
  // Movimentos otimistas: o cartão já aparece na nova coluna enquanto a API confirma
  const [pendentes, setPendentes] = useState<Map<number, Status>>(new Map())

  const buscaAtrasada = useDebounce(busca.trim())
  const filtros = { q: buscaAtrasada || undefined, categoriaId, pagina: 1, porPagina: LIMITE_POR_COLUNA }
  const colunas = {
    ABERTO: useListaSolicitacoes({ ...filtros, status: 'ABERTO' }),
    EM_ATENDIMENTO: useListaSolicitacoes({ ...filtros, status: 'EM_ATENDIMENTO' }),
    CONCLUIDO: useListaSolicitacoes({ ...filtros, status: 'CONCLUIDO' }),
  }

  const sensores = useSensors(
    // A distância mínima permite clicar no cartão (abrir detalhes) sem iniciar o arraste
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const itensDa = (status: Status) => {
    const todos = STATUS.flatMap((s) => colunas[s].data?.dados ?? [])
    return todos
      .filter((s) => (pendentes.get(s.id) ?? s.status) === status)
      .map((s) => (pendentes.has(s.id) ? { ...s, status } : s))
  }

  const aoIniciar = ({ active }: DragStartEvent) => {
    const solicitacao = active.data.current as SolicitacaoResumo
    setArrastando({ solicitacao, destinoPermitido: PROXIMA_ACAO[solicitacao.status]?.status ?? null })
  }

  const aoSoltar = ({ active, over }: DragEndEvent) => {
    setArrastando(null)
    const solicitacao = active.data.current as SolicitacaoResumo
    const destino = over?.id as Status | undefined
    if (!destino || destino === solicitacao.status) return

    if (PROXIMA_ACAO[solicitacao.status]?.status !== destino) {
      toast.warning(
        `Não é possível mover de "${ROTULO_STATUS[solicitacao.status]}" para "${ROTULO_STATUS[destino]}". O atendimento só avança uma etapa por vez.`,
      )
      return
    }

    setPendentes((p) => new Map(p).set(solicitacao.id, destino))
    mover.mutate(
      { id: solicitacao.id, status: destino },
      {
        onSuccess: () => toast.success(`${formatarCodigo(solicitacao.id)} movida para "${ROTULO_STATUS[destino]}"`),
        onError: (erro) => toast.error(mensagemDeErro(erro)),
        onSettled: () =>
          setPendentes((p) => {
            const novo = new Map(p)
            novo.delete(solicitacao.id)
            return novo
          }),
      },
    )
  }

  const carregando = STATUS.some((s) => colunas[s].isPending)
  const comErro = STATUS.find((s) => colunas[s].isError)

  return (
    <>
      <CabecalhoPagina
        titulo="Quadro"
        descricao={
          podeMover
            ? 'Arraste os cartões para avançar o atendimento. Clique em um cartão para ver os detalhes.'
            : 'Acompanhe suas solicitações por etapa. Clique em um cartão para ver os detalhes.'
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="kanban-busca" className="sr-only">Buscar pelo título</label>
          <Input id="kanban-busca" type="search" placeholder="Buscar pelo título..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <label htmlFor="kanban-categoria" className="sr-only">Categoria</label>
        <Select
          id="kanban-categoria"
          value={categoriaId ?? ''}
          onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : undefined)}
          className="sm:w-56"
        >
          <option value="">Todas as categorias</option>
          {categorias.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Select>
      </div>

      {!podeMover && (
        <p className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Info aria-hidden className="size-4" />
          O status é atualizado pela equipe de atendimento.
        </p>
      )}

      {carregando ? (
        <Carregando />
      ) : comErro ? (
        <ErroCarregamento mensagem={mensagemDeErro(colunas[comErro].error)} onTentarNovamente={() => STATUS.forEach((s) => colunas[s].refetch())} />
      ) : (
        <DndContext
          sensors={sensores}
          onDragStart={aoIniciar}
          onDragEnd={aoSoltar}
          onDragCancel={() => setArrastando(null)}
          accessibility={{
            announcements: anuncios,
            screenReaderInstructions: {
              draggable: 'Pressione espaço para pegar o cartão, use as setas para escolher a coluna e espaço para soltar. Esc cancela.',
            },
          }}
        >
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {STATUS.map((status) => (
              <Coluna
                key={status}
                status={status}
                itens={itensDa(status)}
                total={colunas[status].data?.paginacao.total ?? 0}
                podeMover={podeMover}
                pendentes={pendentes}
                destaque={arrastando ? arrastando.destinoPermitido === status : false}
                bloqueada={arrastando ? arrastando.destinoPermitido !== status && arrastando.solicitacao.status !== status : false}
              />
            ))}
          </div>
          <DragOverlay>{arrastando && <Cartao solicitacao={arrastando.solicitacao} flutuando />}</DragOverlay>
        </DndContext>
      )}
    </>
  )
}

interface ColunaProps {
  status: Status
  itens: SolicitacaoResumo[]
  total: number
  podeMover: boolean
  pendentes: Map<number, Status>
  destaque: boolean
  bloqueada: boolean
}

function Coluna({ status, itens, total, podeMover, pendentes, destaque, bloqueada }: ColunaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section
      ref={setNodeRef}
      aria-label={`${ROTULO_STATUS[status]}: ${total} solicitação(ões)`}
      className={cn(
        'flex w-[85vw] max-w-sm shrink-0 snap-start flex-col rounded-xl bg-slate-100/80 p-3 transition sm:w-80 lg:w-auto lg:max-w-none',
        // Só a coluna de destino permitida fica destacada durante o arraste
        destaque && 'outline-2 outline-dashed',
        destaque && estiloColuna[status].destaque,
        destaque && isOver && 'outline-solid',
        bloqueada && 'opacity-50',
      )}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span aria-hidden className={cn('size-2 rounded-full', estiloColuna[status].ponto)} />
        <h2 className="text-sm font-semibold text-slate-700">{ROTULO_STATUS[status]}</h2>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{total}</span>
      </header>

      <ul className="flex min-h-24 flex-1 flex-col gap-2">
        {itens.map((s) => (
          <li key={s.id}>
            <CartaoArrastavel solicitacao={s} podeMover={podeMover && PROXIMA_ACAO[s.status] !== null} pendente={pendentes.has(s.id)} />
          </li>
        ))}
        {itens.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
            Nenhuma solicitação
          </li>
        )}
      </ul>

      {total > itens.length && (
        <Link to={`/solicitacoes?status=${status}`} className="mt-3 block text-center text-xs font-medium text-indigo-600 hover:text-indigo-700">
          Ver todas as {total} na lista
        </Link>
      )}
    </section>
  )
}

function CartaoArrastavel({ solicitacao, podeMover, pendente }: { solicitacao: SolicitacaoResumo; podeMover: boolean; pendente: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: solicitacao.id,
    data: solicitacao,
    disabled: !podeMover || pendente,
  })

  return (
    <div ref={setNodeRef} {...(podeMover ? { ...attributes, ...listeners } : {})} className={cn(isDragging && 'opacity-30')}>
      <Cartao solicitacao={solicitacao} arrastavel={podeMover} pendente={pendente} />
    </div>
  )
}

interface CartaoProps {
  solicitacao: SolicitacaoResumo
  arrastavel?: boolean
  pendente?: boolean
  flutuando?: boolean
}

function Cartao({ solicitacao: s, arrastavel, pendente, flutuando }: CartaoProps) {
  const navigate = useNavigate()

  return (
    <article
      onClick={() => !flutuando && navigate(`/solicitacoes/${s.id}`)}
      className={cn(
        'group cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300',
        arrastavel && 'cursor-grab active:cursor-grabbing',
        pendente && 'animate-pulse',
        flutuando && 'rotate-2 cursor-grabbing shadow-lg ring-2 ring-indigo-300',
      )}
    >
      <div className="flex items-start gap-2">
        <Link
          to={`/solicitacoes/${s.id}`}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-800 hover:text-indigo-600"
        >
          {s.titulo}
        </Link>
        {arrastavel && <GripVertical aria-hidden className="size-4 shrink-0 text-slate-300 group-hover:text-slate-400" />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-slate-400">{formatarCodigo(s.id)}</span>
        <CategoriaBadge nome={s.categoria.nome} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar nome={s.solicitante.nome} cor={s.solicitante.corAvatar} tamanho="sm" />
          <span className="truncate">{s.solicitante.nome}</span>
        </span>
        <span className="shrink-0">{formatarData(s.criadoEm)}</span>
      </div>
    </article>
  )
}
