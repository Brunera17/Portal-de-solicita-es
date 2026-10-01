import { useState, type FormEvent } from 'react'
import { toast } from '@/lib/avisos'
import { Check, EyeOff, Eye, Pencil, Plus, Trash2, X } from 'lucide-react'
import { errosDeCampo, mensagemDeErro } from '@/api/errors'
import { useAtualizarCategoria, useCategorias, useCriarCategoria, useExcluirCategoria } from '@/hooks/useAdmin'
import { cn } from '@/lib/cn'
import type { Categoria } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Campo'
import { Card } from '@/components/ui/Card'
import { DialogoConfirmacao } from '@/components/ui/DialogoConfirmacao'
import { Carregando, ErroCarregamento, Vazio } from '@/components/ui/Estados'

/** Valida o nome localmente (mesmas regras da API) e devolve a mensagem de erro, se houver. */
function validarNome(nome: string) {
  const n = nome.trim()
  if (n.length < 2) return 'O nome deve ter pelo menos 2 caracteres'
  if (n.length > 50) return 'O nome deve ter no máximo 50 caracteres'
  return null
}

export function CategoriasPage() {
  const categorias = useCategorias()
  const [excluindo, setExcluindo] = useState<Categoria | null>(null)

  return (
    <>
      <NovaCategoria />

      <Card className="overflow-hidden">
        {categorias.isPending ? (
          <Carregando />
        ) : categorias.isError ? (
          <ErroCarregamento mensagem={mensagemDeErro(categorias.error)} onTentarNovamente={() => categorias.refetch()} />
        ) : categorias.data.length === 0 ? (
          <Vazio titulo="Nenhuma categoria cadastrada" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {categorias.data.map((c) => (
              <LinhaCategoria key={c.id} categoria={c} onExcluir={() => setExcluindo(c)} />
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-3 text-xs text-slate-500">
        Categorias com solicitações não podem ser excluídas, apenas desativadas: deixam de aparecer para novas
        solicitações, mas o histórico é preservado.
      </p>

      {excluindo && <ConfirmarExclusao categoria={excluindo} onFechar={() => setExcluindo(null)} />}
    </>
  )
}

function NovaCategoria() {
  const criar = useCriarCategoria()
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const invalido = validarNome(nome)
    if (invalido) return setErro(invalido)
    try {
      await criar.mutateAsync(nome.trim())
      toast.success(`Categoria "${nome.trim()}" criada`)
      setNome('')
      setErro(null)
    } catch (err) {
      setErro(errosDeCampo(err).length ? 'Já existe uma categoria com esse nome' : mensagemDeErro(err))
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="mb-4">
      <label htmlFor="nova-categoria" className="mb-1.5 block text-sm font-medium text-slate-700">
        Nova categoria
      </label>
      <div className="flex gap-2">
        <Input
          id="nova-categoria"
          value={nome}
          maxLength={50}
          placeholder="Ex.: Jurídico, Marketing..."
          onChange={(e) => {
            setNome(e.target.value)
            setErro(null)
          }}
          erro={erro ?? undefined}
          className="max-w-sm"
        />
        <Button type="submit" carregando={criar.isPending}>
          <Plus aria-hidden className="size-4" />
          Adicionar
        </Button>
      </div>
      {erro && (
        <p id="nova-categoria-erro" role="alert" className="mt-1.5 text-sm text-red-600">
          {erro}
        </p>
      )}
    </form>
  )
}

function LinhaCategoria({ categoria: c, onExcluir }: { categoria: Categoria; onExcluir: () => void }) {
  const atualizar = useAtualizarCategoria()
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(c.nome)
  const [erro, setErro] = useState<string | null>(null)
  const emUso = c._count?.solicitacoes ?? 0

  const salvarNome = async (e: FormEvent) => {
    e.preventDefault()
    const invalido = validarNome(nome)
    if (invalido) return setErro(invalido)
    if (nome.trim() === c.nome) return setEditando(false)
    try {
      await atualizar.mutateAsync({ id: c.id, nome: nome.trim() })
      toast.success('Categoria renomeada')
      setEditando(false)
    } catch (err) {
      setErro(errosDeCampo(err).length ? 'Já existe uma categoria com esse nome' : mensagemDeErro(err))
    }
  }

  const alternarAtiva = async () => {
    try {
      await atualizar.mutateAsync({ id: c.id, ativa: !c.ativa })
      toast.success(`Categoria "${c.nome}" ${c.ativa ? 'desativada' : 'reativada'}`)
    } catch (err) {
      toast.error(mensagemDeErro(err))
    }
  }

  if (editando) {
    return (
      <li className="px-5 py-3">
        <form onSubmit={salvarNome} noValidate className="flex flex-wrap items-center gap-2">
          <label htmlFor={`cat-${c.id}`} className="sr-only">
            Nome da categoria
          </label>
          <Input
            id={`cat-${c.id}`}
            autoFocus
            value={nome}
            maxLength={50}
            onChange={(e) => {
              setNome(e.target.value)
              setErro(null)
            }}
            onKeyDown={(e) => e.key === 'Escape' && (setNome(c.nome), setEditando(false))}
            erro={erro ?? undefined}
            className="max-w-xs"
          />
          <Button type="submit" tamanho="sm" carregando={atualizar.isPending} aria-label="Salvar nome">
            <Check aria-hidden className="size-4" />
          </Button>
          <Button variante="fantasma" tamanho="sm" aria-label="Cancelar" onClick={() => (setNome(c.nome), setEditando(false), setErro(null))}>
            <X aria-hidden className="size-4" />
          </Button>
          {erro && <p role="alert" className="w-full text-sm text-red-600">{erro}</p>}
        </form>
      </li>
    )
  }

  return (
    <li className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3', !c.ativa && 'bg-slate-50')}>
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium', c.ativa ? 'text-slate-800' : 'text-slate-400')}>{c.nome}</p>
        <p className="text-xs text-slate-500">{emUso === 0 ? 'Sem solicitações' : `${emUso} solicitação(ões)`}</p>
      </div>
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-medium',
          c.ativa ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600',
        )}
      >
        {c.ativa ? 'Ativa' : 'Inativa'}
      </span>
      <div className="flex gap-1">
        <Button variante="fantasma" tamanho="sm" title="Renomear" aria-label={`Renomear ${c.nome}`} onClick={() => setEditando(true)}>
          <Pencil aria-hidden className="size-4" />
        </Button>
        <Button
          variante="fantasma"
          tamanho="sm"
          title={c.ativa ? 'Desativar' : 'Reativar'}
          aria-label={`${c.ativa ? 'Desativar' : 'Reativar'} ${c.nome}`}
          disabled={atualizar.isPending}
          onClick={alternarAtiva}
        >
          {c.ativa ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </Button>
        <Button
          variante="fantasma"
          tamanho="sm"
          disabled={emUso > 0}
          title={emUso > 0 ? 'Em uso: desative em vez de excluir' : 'Excluir'}
          aria-label={`Excluir ${c.nome}`}
          onClick={onExcluir}
          className="hover:text-red-600"
        >
          <Trash2 aria-hidden className="size-4" />
        </Button>
      </div>
    </li>
  )
}

function ConfirmarExclusao({ categoria, onFechar }: { categoria: Categoria; onFechar: () => void }) {
  const excluir = useExcluirCategoria()

  const confirmar = async () => {
    try {
      await excluir.mutateAsync(categoria.id)
      toast.success(`Categoria "${categoria.nome}" excluída`)
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    } finally {
      onFechar()
    }
  }

  return (
    <DialogoConfirmacao
      aberto
      titulo="Excluir categoria?"
      rotuloConfirmar="Excluir"
      variante="perigo"
      carregando={excluir.isPending}
      onConfirmar={confirmar}
      onCancelar={onFechar}
    >
      A categoria <strong>{categoria.nome}</strong> será removida permanentemente.
    </DialogoConfirmacao>
  )
}
