import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  aberto: boolean
  titulo: string
  children: ReactNode
  rotuloConfirmar: string
  variante?: 'primario' | 'perigo'
  carregando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

/** Diálogo modal baseado no elemento nativo <dialog> (foco preso e tecla Esc de graça). */
export function DialogoConfirmacao({
  aberto,
  titulo,
  children,
  rotuloConfirmar,
  variante = 'primario',
  carregando = false,
  onConfirmar,
  onCancelar,
}: Props) {
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
        if (!carregando) onCancelar()
      }}
      aria-labelledby="dialogo-titulo"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="p-6">
        <h2 id="dialogo-titulo" className="text-lg font-semibold text-slate-900">
          {titulo}
        </h2>
        <div className="mt-2 text-sm text-slate-600">{children}</div>
      </div>
      <div className="flex justify-end gap-2 rounded-b-xl bg-slate-50 px-6 py-4">
        <Button variante="secundario" onClick={onCancelar} disabled={carregando}>
          Cancelar
        </Button>
        <Button variante={variante} onClick={onConfirmar} carregando={carregando}>
          {rotuloConfirmar}
        </Button>
      </div>
    </dialog>
  )
}
