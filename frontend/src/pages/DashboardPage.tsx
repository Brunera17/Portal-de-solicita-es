import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { ArrowRight, CheckCircle2, CircleDot, Clock, Layers, Plus, type LucideIcon } from 'lucide-react'
import { mensagemDeErro } from '@/api/errors'
import { useUsuarioLogado } from '@/hooks/useAuth'
import { useListaSolicitacoes, useResumoDashboard } from '@/hooks/useSolicitacoes'
import { ehEquipe } from '@/lib/dominio'
import { formatarCodigo, formatarData } from '@/lib/format'
import { BotaoLink } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badges'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Card } from '@/components/ui/Card'
import { Carregando, ErroCarregamento, Vazio } from '@/components/ui/Estados'
import type { ResumoDashboard, Status } from '@/types'

interface Indicador {
  chave: keyof ResumoDashboard
  rotulo: string
  icone: LucideIcon
  cor: string
  barra: string
  status?: Status
}

const indicadores: Indicador[] = [
  { chave: 'total', rotulo: 'Total', icone: Layers, cor: 'bg-primaria-50 text-primaria-600', barra: '' },
  { chave: 'abertas', rotulo: 'Abertas', icone: CircleDot, cor: 'bg-ameixa-50 text-ameixa-600', barra: 'bg-ameixa-500', status: 'ABERTO' },
  { chave: 'emAtendimento', rotulo: 'Em atendimento', icone: Clock, cor: 'bg-amber-50 text-amber-600', barra: 'bg-amber-500', status: 'EM_ATENDIMENTO' },
  { chave: 'concluidas', rotulo: 'Concluídas', icone: CheckCircle2, cor: 'bg-oliva-50 text-oliva-600', barra: 'bg-oliva-500', status: 'CONCLUIDO' },
]

export function DashboardPage() {
  const usuario = useUsuarioLogado()
  const resumo = useResumoDashboard()
  const recentes = useListaSolicitacoes({ pagina: 1, porPagina: 5 })

  const primeiroNome = usuario.nome.split(' ')[0]
  const escopo = ehEquipe(usuario.perfil) ? 'todas as solicitações' : 'suas solicitações'

  return (
    <>
      <CabecalhoPagina
        titulo={`Olá, ${primeiroNome}`}
        descricao={`Visão geral de ${escopo}.`}
        acoes={
          <BotaoLink to="/solicitacoes/nova">
            <Plus aria-hidden className="size-4" />
            Nova solicitação
          </BotaoLink>
        }
      />

      {resumo.isPending ? (
        <Carregando />
      ) : resumo.isError ? (
        <Card>
          <ErroCarregamento mensagem={mensagemDeErro(resumo.error)} onTentarNovamente={() => resumo.refetch()} />
        </Card>
      ) : (
        <>
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {indicadores.map(({ chave, rotulo, icone: Icone, cor, status }) => (
              <Link
                key={chave}
                to={status ? `/solicitacoes?status=${status}` : '/solicitacoes'}
                className="group rounded-xl border border-neutra-200 bg-surface p-5 shadow-sm transition hover:border-primaria-300 hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutra-500">{rotulo}</span>
                  <span className={cn('grid size-9 place-items-center rounded-lg', cor)}>
                    <Icone aria-hidden className="size-5" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-neutra-900">{resumo.data[chave]}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-neutra-400 group-hover:text-primaria-600">
                  Ver lista <ArrowRight aria-hidden className="size-3" />
                </p>
              </Link>
            ))}
          </section>

          {resumo.data.total > 0 && (
            <Card className="mt-4 p-5">
              <p className="text-sm font-medium text-neutra-700">Distribuição por status</p>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-neutra-100">
                {indicadores
                  .filter((i) => i.status)
                  .map((i) => (
                    <div
                      key={i.chave}
                      className={i.barra}
                      style={{ width: `${(resumo.data[i.chave] / resumo.data.total) * 100}%` }}
                      title={`${i.rotulo}: ${resumo.data[i.chave]}`}
                    />
                  ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutra-500">
                {indicadores
                  .filter((i) => i.status)
                  .map((i) => (
                    <li key={i.chave} className="flex items-center gap-1.5">
                      <span aria-hidden className={cn('size-2 rounded-full', i.barra)} />
                      {i.rotulo}: {Math.round((resumo.data[i.chave] / resumo.data.total) * 100)}%
                    </li>
                  ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <Card className="mt-8">
        <div className="flex items-center justify-between border-b border-neutra-200 px-5 py-4">
          <h2 className="font-semibold text-neutra-900">Solicitações recentes</h2>
          <Link to="/solicitacoes" className="text-sm font-medium text-primaria-600 hover:text-primaria-700">
            Ver todas
          </Link>
        </div>

        {recentes.isPending ? (
          <Carregando />
        ) : recentes.isError ? (
          <ErroCarregamento mensagem={mensagemDeErro(recentes.error)} onTentarNovamente={() => recentes.refetch()} />
        ) : recentes.data.dados.length === 0 ? (
          <Vazio titulo="Nenhuma solicitação ainda" descricao="Registre sua primeira demanda para acompanhá-la aqui." />
        ) : (
          <ul className="divide-y divide-neutra-100">
            {recentes.data.dados.map((s) => (
              <li key={s.id}>
                <Link to={`/solicitacoes/${s.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-neutra-50">
                  <span className="w-14 shrink-0 font-mono text-xs text-neutra-400">{formatarCodigo(s.id)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutra-800">{s.titulo}</span>
                    <span className="block text-xs text-neutra-500">
                      {s.solicitante.nome} · {formatarData(s.criadoEm)}
                    </span>
                  </span>
                  <StatusBadge status={s.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
