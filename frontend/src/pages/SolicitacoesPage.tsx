import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronDown, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { mensagemDeErro } from '@/api/errors'
import { useUsuarioLogado } from '@/hooks/useAuth'
import { useCategorias } from '@/hooks/useAdmin'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { useListaSolicitacoes } from '@/hooks/useSolicitacoes'
import { ehEquipe, ROTULO_STATUS } from '@/lib/dominio'
import { cn } from '@/lib/cn'
import { formatarCodigo, formatarData } from '@/lib/format'
import { STATUS, type SolicitacaoResumo } from '@/types'
import { BotaoLink, Button } from '@/components/ui/Button'
import { CategoriaBadge, NovaBadge, StatusBadge } from '@/components/ui/Badges'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Campo, Input, Select } from '@/components/ui/Campo'
import { Card } from '@/components/ui/Card'
import { CampoData } from '@/components/ui/CampoData'
import { Carregando, ErroCarregamento, Vazio } from '@/components/ui/Estados'
import { Paginacao } from '@/components/ui/Paginacao'
import { Spinner } from '@/components/ui/Spinner'

const ATRASO_BUSCA_MS = 400

export function SolicitacoesPage() {
  const usuario = useUsuarioLogado()
  const { filtros, atualizar, limpar, temFiltros } = useFiltrosUrl()
  const lista = useListaSolicitacoes(filtros)
  const categorias = useCategorias()

  // A busca por texto só vai para a URL (e dispara a consulta) após uma pausa na digitação
  const [busca, setBusca] = useState(filtros.q ?? '')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const aoDigitar = (valor: string) => {
    setBusca(valor)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => atualizar({ q: valor.trim() }), ATRASO_BUSCA_MS)
  }

  const limparTudo = () => {
    clearTimeout(timer.current)
    setBusca('')
    limpar()
  }

  // No celular, os filtros além da busca ficam recolhidos atrás de um botão
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const qtdFiltrosExtras = [filtros.status, filtros.categoriaId, filtros.dataInicio, filtros.dataFim].filter(Boolean).length

  const descricao =
    ehEquipe(usuario.perfil)
      ? 'Todas as solicitações registradas pelos colaboradores.'
      : 'Acompanhe as solicitações que você registrou.'

  return (
    <>
      <CabecalhoPagina
        titulo="Solicitações"
        descricao={descricao}
        acoes={
          <BotaoLink to="/solicitacoes/nova">
            <Plus aria-hidden className="size-4" />
            Nova solicitação
          </BotaoLink>
        }
      />

      <Card className="mb-4 p-4">
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12"
        >
          <Campo id="filtro-busca" rotulo="Buscar pelo título" className="sm:col-span-2 lg:col-span-4">
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="filtro-busca"
                type="search"
                placeholder="Ex.: notebook, férias..."
                value={busca}
                onChange={(e) => aoDigitar(e.target.value)}
                className="pl-9"
              />
            </div>
          </Campo>

          <Button
            variante="secundario"
            className="sm:hidden"
            aria-expanded={filtrosAbertos}
            aria-controls="filtros-extras"
            onClick={() => setFiltrosAbertos((v) => !v)}
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            Filtros{qtdFiltrosExtras > 0 && ` (${qtdFiltrosExtras})`}
            <ChevronDown aria-hidden className={cn('size-4 transition-transform', filtrosAbertos && 'rotate-180')} />
          </Button>

          <div id="filtros-extras" className={filtrosAbertos ? 'grid gap-4 sm:contents' : 'hidden sm:contents'}>
            <Campo id="filtro-status" rotulo="Status" className="lg:col-span-2">
              <Select
                id="filtro-status"
                value={filtros.status ?? ''}
                onChange={(e) => atualizar({ status: e.target.value })}
              >
                <option value="">Todos</option>
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {ROTULO_STATUS[s]}
                  </option>
                ))}
              </Select>
            </Campo>

            <Campo id="filtro-categoria" rotulo="Categoria" className="lg:col-span-2">
              <Select
                id="filtro-categoria"
                value={filtros.categoriaId ?? ''}
                onChange={(e) => atualizar({ categoriaId: e.target.value })}
              >
                <option value="">Todas</option>
                {categorias.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {!c.ativa && ' (inativa)'}
                  </option>
                ))}
              </Select>
            </Campo>

            <Campo id="filtro-inicio" rotulo="Aberta de" className="lg:col-span-2">
              <CampoData
                id="filtro-inicio"
                valor={filtros.dataInicio ?? ''}
                max={filtros.dataFim}
                onConfirmar={(dataInicio) => atualizar({ dataInicio })}
              />
            </Campo>

            <Campo id="filtro-fim" rotulo="até" className="lg:col-span-2">
              <CampoData
                id="filtro-fim"
                valor={filtros.dataFim ?? ''}
                min={filtros.dataInicio}
                onConfirmar={(dataFim) => atualizar({ dataFim })}
              />
            </Campo>
          </div>
        </form>

        {temFiltros && (
          <div className="mt-3 flex justify-end">
            <Button variante="fantasma" tamanho="sm" onClick={limparTudo}>
              <X aria-hidden className="size-4" />
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {lista.isPending ? (
          <Carregando />
        ) : lista.isError ? (
          <ErroCarregamento mensagem={mensagemDeErro(lista.error)} onTentarNovamente={() => lista.refetch()} />
        ) : lista.data.dados.length === 0 ? (
          temFiltros ? (
            <Vazio
              titulo="Nenhuma solicitação encontrada"
              descricao="Tente ajustar ou limpar os filtros."
              acao={<Button variante="secundario" onClick={limparTudo}>Limpar filtros</Button>}
            />
          ) : (
            <Vazio
              titulo="Nenhuma solicitação registrada"
              descricao="Quando houver solicitações, elas aparecerão aqui."
              acao={<BotaoLink to="/solicitacoes/nova">Nova solicitação</BotaoLink>}
            />
          )
        ) : (
          <div className="relative">
            {lista.isFetching && (
              <div className="absolute right-3 top-3 z-10 text-indigo-500" aria-label="Atualizando">
                <Spinner className="size-4" />
              </div>
            )}
            <TabelaSolicitacoes itens={lista.data.dados} />
            <ListaCartoes itens={lista.data.dados} />
            <Paginacao
              {...lista.data.paginacao}
              onMudar={(pagina) => atualizar({ pagina })}
            />
          </div>
        )}
      </Card>
    </>
  )
}

/** Tabela para telas grandes. */
function TabelaSolicitacoes({ itens }: { itens: SolicitacaoResumo[] }) {
  const navigate = useNavigate()

  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Código</th>
            <th scope="col" className="px-4 py-3">Título</th>
            <th scope="col" className="px-4 py-3">Categoria</th>
            <th scope="col" className="px-4 py-3">Solicitante</th>
            <th scope="col" className="px-4 py-3">Abertura</th>
            <th scope="col" className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {itens.map((s) => (
            <tr
              key={s.id}
              onClick={() => navigate(`/solicitacoes/${s.id}`)}
              className="cursor-pointer transition-colors hover:bg-slate-50"
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{formatarCodigo(s.id)}</td>
              <td className="max-w-xs px-4 py-3">
                <span className="flex items-center gap-2">
                  {s.nova && <NovaBadge />}
                  <Link
                    to={`/solicitacoes/${s.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn('block truncate hover:text-indigo-600', s.nova ? 'font-semibold text-slate-900' : 'font-medium text-slate-800')}
                  >
                    {s.titulo}
                  </Link>
                </span>
              </td>
              <td className="px-4 py-3"><CategoriaBadge nome={s.categoria.nome} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{s.solicitante.nome}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatarData(s.criadoEm)}</td>
              <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Cartões empilhados para telas pequenas e médias. */
function ListaCartoes({ itens }: { itens: SolicitacaoResumo[] }) {
  return (
    <ul className="divide-y divide-slate-100 lg:hidden">
      {itens.map((s) => (
        <li key={s.id}>
          <Link to={`/solicitacoes/${s.id}`} className="block space-y-2 px-4 py-4 hover:bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                {s.nova && <NovaBadge />}
                {s.titulo}
              </span>
              <StatusBadge status={s.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="font-mono">{formatarCodigo(s.id)}</span>
              <CategoriaBadge nome={s.categoria.nome} />
              <span>{s.solicitante.nome}</span>
              <span>{formatarData(s.criadoEm)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
