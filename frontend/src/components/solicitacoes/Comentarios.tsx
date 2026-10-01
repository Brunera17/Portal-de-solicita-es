import { useState, type FormEvent } from 'react'
import { toast } from '@/lib/avisos'
import { Lock, MessageSquare, Send } from 'lucide-react'
import { errosDeCampo, mensagemDeErro } from '@/api/errors'
import { useUsuarioLogado } from '@/hooks/useAuth'
import { useComentarios, useCriarComentario } from '@/hooks/useSolicitacoes'
import { cn } from '@/lib/cn'
import { ehEquipe, ROTULO_PERFIL } from '@/lib/dominio'
import { formatarDataHora } from '@/lib/format'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Campo'
import { Carregando, ErroCarregamento } from '@/components/ui/Estados'

const LIMITE = 2000

/**
 * Conversa da solicitação. A equipe pode registrar notas internas (imprevistos, atrasos
 * de SLA), que ficam ocultas para o solicitante.
 */
export function Comentarios({ solicitacaoId }: { solicitacaoId: number }) {
  const usuario = useUsuarioLogado()
  const equipe = ehEquipe(usuario.perfil)
  const comentarios = useComentarios(solicitacaoId)
  const criar = useCriarComentario(solicitacaoId)

  const [texto, setTexto] = useState('')
  const [interno, setInterno] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!texto.trim()) {
      setErro('Escreva o comentário')
      return
    }
    setErro(null)
    try {
      await criar.mutateAsync({ texto, interno })
      setTexto('')
      setInterno(false)
    } catch (err) {
      const porCampo = errosDeCampo(err).find((c) => c.campo === 'texto')
      if (porCampo) setErro(porCampo.mensagem)
      else toast.error(mensagemDeErro(err))
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 border-b border-neutra-200 px-6 py-4">
        <MessageSquare aria-hidden className="size-4 text-neutra-400" />
        <h2 className="font-semibold text-neutra-900">Comentários</h2>
        {comentarios.data && <span className="text-sm text-neutra-400">({comentarios.data.length})</span>}
      </div>

      {comentarios.isPending ? (
        <Carregando />
      ) : comentarios.isError ? (
        <ErroCarregamento mensagem={mensagemDeErro(comentarios.error)} onTentarNovamente={() => comentarios.refetch()} />
      ) : comentarios.data.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-neutra-500">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-4 px-6 py-5">
          {comentarios.data.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar nome={c.autor.nome} cor={c.autor.corAvatar} />
              <div
                className={cn(
                  'min-w-0 flex-1 rounded-lg px-4 py-3',
                  c.interno ? 'border border-dashed border-amber-300 bg-amber-50' : 'bg-neutra-50',
                )}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="font-semibold text-neutra-800">{c.autor.nome}</span>
                  <span className="text-neutra-400">{ROTULO_PERFIL[c.autor.perfil]}</span>
                  <span className="text-neutra-400">· {formatarDataHora(c.criadoEm)}</span>
                  {c.interno && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
                      <Lock aria-hidden className="size-3" />
                      Nota interna
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutra-700">{c.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={enviar} noValidate className="border-t border-neutra-200 px-6 py-4">
        <label htmlFor="novo-comentario" className="sr-only">
          Novo comentário
        </label>
        <Textarea
          id="novo-comentario"
          rows={3}
          maxLength={LIMITE}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={equipe ? 'Escreva uma atualização para o solicitante ou uma nota interna...' : 'Escreva um comentário...'}
          erro={erro ?? undefined}
          className={cn('min-h-20', interno && 'border-amber-300 bg-amber-50/50')}
        />
        {erro && (
          <p id="novo-comentario-erro" role="alert" className="mt-1.5 text-sm text-red-600">
            {erro}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {equipe ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutra-600">
              <input
                type="checkbox"
                checked={interno}
                onChange={(e) => setInterno(e.target.checked)}
                className="size-4 rounded border-neutra-300 accent-amber-600"
              />
              <Lock aria-hidden className="size-3.5 text-amber-600" />
              Nota interna (visível só para a equipe)
            </label>
          ) : (
            <span className="text-xs text-neutra-400">
              {texto.length}/{LIMITE}
            </span>
          )}
          <Button type="submit" tamanho="sm" carregando={criar.isPending}>
            <Send aria-hidden className="size-4" />
            {interno ? 'Registrar nota' : 'Comentar'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
