import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from '@/lib/avisos'
import { ArrowLeft, ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { mensagemDeErro, statusHttp } from '@/api/errors'
import { useUsuarioLogado } from '@/hooks/useAuth'
import { useAlterarStatus, useExcluirSolicitacao, useSolicitacao } from '@/hooks/useSolicitacoes'
import { ehEquipe, PROXIMA_ACAO, ROTULO_STATUS } from '@/lib/dominio'
import { formatarCodigo, formatarDataHora } from '@/lib/format'
import type { HistoricoStatus, SolicitacaoDetalhe } from '@/types'
import { BotaoLink, Button } from '@/components/ui/Button'
import { CategoriaBadge, StatusBadge } from '@/components/ui/Badges'
import { Comentarios } from '@/components/solicitacoes/Comentarios'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { DialogoConfirmacao } from '@/components/ui/DialogoConfirmacao'
import { Carregando, ErroCarregamento } from '@/components/ui/Estados'

export function SolicitacaoDetalhePage() {
  const id = Number(useParams().id)
  const consulta = useSolicitacao(id)

  if (!Number.isInteger(id) || id <= 0) {
    return <Falha mensagem="Código de solicitação inválido." />
  }
  if (consulta.isPending) return <Carregando />
  if (consulta.isError) {
    const status = statusHttp(consulta.error)
    const mensagem =
      status === 404
        ? 'Solicitação não encontrada.'
        : status === 403
          ? 'Você não tem acesso a esta solicitação.'
          : mensagemDeErro(consulta.error)
    return <Falha mensagem={mensagem} onTentarNovamente={status ? undefined : () => consulta.refetch()} />
  }

  return <Detalhe solicitacao={consulta.data} />
}

function Detalhe({ solicitacao: s }: { solicitacao: SolicitacaoDetalhe }) {
  const usuario = useUsuarioLogado()
  const navigate = useNavigate()
  const excluir = useExcluirSolicitacao()
  const alterarStatus = useAlterarStatus(s.id)
  const [dialogo, setDialogo] = useState<'excluir' | 'status' | null>(null)

  const ehDono = s.solicitante.id === usuario.id
  const podeAlterar = ehDono && s.status === 'ABERTO'
  const proximaAcao = ehEquipe(usuario.perfil) ? PROXIMA_ACAO[s.status] : null

  const confirmarExclusao = async () => {
    try {
      await excluir.mutateAsync(s.id)
      toast.success(`Solicitação ${formatarCodigo(s.id)} excluída`)
      navigate('/solicitacoes', { replace: true })
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
      setDialogo(null)
    }
  }

  const confirmarStatus = async () => {
    if (!proximaAcao) return
    try {
      await alterarStatus.mutateAsync(proximaAcao.status)
      toast.success(`Status alterado para "${ROTULO_STATUS[proximaAcao.status]}"`)
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    } finally {
      setDialogo(null)
    }
  }

  return (
    <>
      <Voltar />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-slate-500">{formatarCodigo(s.id)}</span>
            <StatusBadge status={s.status} />
            <CategoriaBadge nome={s.categoria.nome} />
          </div>
          <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900">{s.titulo}</h1>
        </div>

        {(podeAlterar || proximaAcao) && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {podeAlterar && (
              <>
                <BotaoLink to={`/solicitacoes/${s.id}/editar`} variante="secundario">
                  <Pencil aria-hidden className="size-4" />
                  Editar
                </BotaoLink>
                <Button variante="perigoContorno" onClick={() => setDialogo('excluir')}>
                  <Trash2 aria-hidden className="size-4" />
                  Excluir
                </Button>
              </>
            )}
            {proximaAcao && (
              <Button onClick={() => setDialogo('status')}>
                {proximaAcao.rotulo}
                <ArrowRight aria-hidden className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Descrição</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-slate-700">{s.descricao}</p>
          </Card>
          <Comentarios solicitacaoId={s.id} />
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Solicitante</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium text-slate-800">
                  <Avatar nome={s.solicitante.nome} cor={s.solicitante.corAvatar} tamanho="sm" />
                  {s.solicitante.nome}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Responsável</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium text-slate-800">
                  {s.responsavel ? (
                    <>
                      <Avatar nome={s.responsavel.nome} cor={s.responsavel.corAvatar} tamanho="sm" />
                      {s.responsavel.nome}
                    </>
                  ) : (
                    <span className="font-normal text-slate-400">Aguardando atendimento</span>
                  )}
                </dd>
              </div>
              <Info rotulo="Aberta em" valor={formatarDataHora(s.criadoEm)} />
              <Info rotulo="Última atualização" valor={formatarDataHora(s.atualizadoEm)} />
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Histórico</h2>
            <LinhaDoTempo historico={s.historico} />
          </Card>
        </div>
      </div>

      <DialogoConfirmacao
        aberto={dialogo === 'excluir'}
        titulo="Excluir solicitação?"
        rotuloConfirmar="Excluir"
        variante="perigo"
        carregando={excluir.isPending}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setDialogo(null)}
      >
        A solicitação <strong>{formatarCodigo(s.id)}</strong> será removida permanentemente. Esta ação não pode ser desfeita.
      </DialogoConfirmacao>

      {proximaAcao && (
        <DialogoConfirmacao
          aberto={dialogo === 'status'}
          titulo={`${proximaAcao.rotulo}?`}
          rotuloConfirmar="Confirmar"
          carregando={alterarStatus.isPending}
          onConfirmar={confirmarStatus}
          onCancelar={() => setDialogo(null)}
        >
          O status passará de <strong>{ROTULO_STATUS[s.status]}</strong> para{' '}
          <strong>{ROTULO_STATUS[proximaAcao.status]}</strong>.
          {proximaAcao.status === 'CONCLUIDO' && ' Solicitações concluídas não podem ser reabertas.'}
        </DialogoConfirmacao>
      )}
    </>
  )
}

function LinhaDoTempo({ historico }: { historico: HistoricoStatus[] }) {
  return (
    <ol className="mt-4 space-y-4">
      {historico.map((h, i) => (
        <li key={h.id} className="relative pl-6">
          {i < historico.length - 1 && (
            <span aria-hidden className="absolute left-[5px] top-4 h-[calc(100%+0.25rem)] w-px bg-slate-200" />
          )}
          <span aria-hidden className="absolute left-0 top-1.5 size-2.75 rounded-full border-2 border-white bg-indigo-500 ring-1 ring-indigo-200" />
          <p className="text-sm text-slate-700">
            {h.statusAnterior ? (
              <>
                {ROTULO_STATUS[h.statusAnterior]} → <strong className="font-medium">{ROTULO_STATUS[h.statusNovo]}</strong>
              </>
            ) : (
              <strong className="font-medium">Solicitação aberta</strong>
            )}
          </p>
          <p className="text-xs text-slate-500">
            {h.alteradoPor.nome} · {formatarDataHora(h.alteradoEm)}
          </p>
        </li>
      ))}
    </ol>
  )
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-slate-500">{rotulo}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{valor}</dd>
    </div>
  )
}

function Falha({ mensagem, onTentarNovamente }: { mensagem: string; onTentarNovamente?: () => void }) {
  return (
    <>
      <Voltar />
      <Card>
        <ErroCarregamento mensagem={mensagem} onTentarNovamente={onTentarNovamente} />
      </Card>
    </>
  )
}

function Voltar() {
  return (
    <Link to="/solicitacoes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
      <ArrowLeft aria-hidden className="size-4" />
      Solicitações
    </Link>
  )
}
