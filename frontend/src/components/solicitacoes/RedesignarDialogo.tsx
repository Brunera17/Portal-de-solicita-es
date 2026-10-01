import { useState, type FormEvent } from 'react'
import { errosDeCampo, mensagemDeErro } from '@/api/errors'
import { useEquipe } from '@/hooks/useAdmin'
import { useRedesignar } from '@/hooks/useSolicitacoes'
import { toast } from '@/lib/avisos'
import { cn } from '@/lib/cn'
import { ROTULO_PERFIL } from '@/lib/dominio'
import { formatarCodigo } from '@/lib/format'
import { LIMITE_EM_ATENDIMENTO, type SolicitacaoDetalhe } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Campo'
import { Carregando, ErroCarregamento } from '@/components/ui/Estados'
import { Modal } from '@/components/ui/Modal'

interface Props {
  solicitacao: SolicitacaoDetalhe
  aberto: boolean
  onFechar: () => void
}

/** Gerente escolhe quem assume o atendimento; quem está no limite aparece indisponível. */
export function RedesignarDialogo({ solicitacao, aberto, onFechar }: Props) {
  const redesignar = useRedesignar(solicitacao.id)

  return (
    <Modal
      aberto={aberto}
      titulo={`Redesignar ${formatarCodigo(solicitacao.id)}`}
      descricao={solicitacao.responsavel ? `Hoje com ${solicitacao.responsavel.nome}` : undefined}
      onFechar={onFechar}
      bloqueado={redesignar.isPending}
    >
      <Formulario solicitacao={solicitacao} onConcluir={onFechar} redesignar={redesignar} />
    </Modal>
  )
}

function Formulario({
  solicitacao,
  onConcluir,
  redesignar,
}: {
  solicitacao: SolicitacaoDetalhe
  onConcluir: () => void
  redesignar: ReturnType<typeof useRedesignar>
}) {
  const equipe = useEquipe(true)
  const [escolhido, setEscolhido] = useState<number | null>(null)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const atualId = solicitacao.responsavel?.id

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!escolhido) return setErro('Selecione quem vai assumir o atendimento')
    try {
      const atualizada = await redesignar.mutateAsync({ responsavelId: escolhido, motivo: motivo.trim() || undefined })
      toast.success(`${formatarCodigo(solicitacao.id)} agora está com ${atualizada.responsavel?.nome}`)
      onConcluir()
    } catch (err) {
      const porCampo = errosDeCampo(err)
      setErro(porCampo[0]?.mensagem ?? mensagemDeErro(err))
    }
  }

  if (equipe.isPending) return <Carregando texto="Carregando equipe..." />
  if (equipe.isError) return <ErroCarregamento mensagem={mensagemDeErro(equipe.error)} onTentarNovamente={() => equipe.refetch()} />

  return (
    <form onSubmit={enviar} noValidate>
      <div className="space-y-4 px-6 py-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutra-700">Novo responsável</legend>
          <ul role="radiogroup" className="space-y-2">
            {equipe.data.map((m) => {
              const atual = m.id === atualId
              const cheio = m.emAtendimento >= LIMITE_EM_ATENDIMENTO
              const indisponivel = atual || cheio
              const selecionado = escolhido === m.id
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selecionado}
                    disabled={indisponivel}
                    onClick={() => {
                      setEscolhido(m.id)
                      setErro(null)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      selecionado ? 'border-primaria-500 bg-primaria-50 ring-1 ring-primaria-500' : 'border-neutra-200 hover:bg-neutra-50',
                      indisponivel && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                    )}
                  >
                    <Avatar nome={m.nome} cor={m.corAvatar} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutra-800">{m.nome}</span>
                      <span className="block text-xs text-neutra-500">
                        {ROTULO_PERFIL[m.perfil]}
                        {atual && ' · responsável atual'}
                        {!atual && cheio && ' · no limite de atendimentos'}
                      </span>
                    </span>
                    <span
                      title="Solicitações em atendimento agora"
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                        cheio ? 'bg-amber-100 text-amber-800' : 'bg-neutra-100 text-neutra-600',
                      )}
                    >
                      {m.emAtendimento}/{LIMITE_EM_ATENDIMENTO}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>

        <div>
          <label htmlFor="redesignar-motivo" className="mb-1.5 block text-sm font-medium text-neutra-700">
            Motivo <span className="font-normal text-neutra-400">(opcional)</span>
          </label>
          <Textarea
            id="redesignar-motivo"
            rows={2}
            maxLength={300}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Ana em férias até sexta"
            className="min-h-16"
          />
        </div>

        {erro && (
          <p role="alert" className="text-sm text-red-600">
            {erro}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 rounded-b-xl border-t border-neutra-200 bg-neutra-50 px-6 py-4">
        <Button variante="secundario" onClick={onConcluir} disabled={redesignar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" carregando={redesignar.isPending}>
          Redesignar
        </Button>
      </div>
    </form>
  )
}
