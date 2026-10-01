import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  aberto: boolean
  titulo: string
  descricao?: string
  onFechar: () => void
  /** Impede fechar (Esc/botão) enquanto uma operação está em andamento. */
  bloqueado?: boolean
  children: ReactNode
}

/** Janela modal baseada em <dialog> nativo: foco preso, Esc e backdrop de graça. */
export function Modal({ aberto, titulo, descricao, onFechar, bloqueado = false, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (aberto && !dialog.open) dialog.showModal()
    if (!aberto && dialog.open) dialog.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        if (!bloqueado) onFechar()
      }}
      aria-labelledby="modal-titulo"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-surface p-0 text-neutra-800 shadow-xl backdrop:bg-black/50"
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutra-200 px-6 py-4">
        <div>
          <h2 id="modal-titulo" className="text-lg font-semibold text-neutra-900">
            {titulo}
          </h2>
          {descricao && <p className="mt-0.5 text-sm text-neutra-500">{descricao}</p>}
        </div>
        <button
          type="button"
          onClick={onFechar}
          disabled={bloqueado}
          aria-label="Fechar"
          className="rounded-md p-1 text-neutra-400 hover:bg-neutra-100 hover:text-neutra-600"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      {/* Só monta o conteúdo aberto: formulários reiniciam a cada abertura */}
      {aberto && children}
    </dialog>
  )
}
