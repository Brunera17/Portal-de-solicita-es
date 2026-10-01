import { Toaster } from 'sonner'
import { useTema } from '@/hooks/useTema'
import { DURACAO_AVISO_MS } from '@/lib/avisos'

/**
 * Avisos temporários (toasts): somem sozinhos, sem botão de fechar. Uma barra mostra o
 * tempo restante e pausa com o mouse em cima (estilos em index.css, `.aviso`).
 */
export function Avisos() {
  const { preferencia } = useTema()

  return (
    <Toaster
      position="bottom-right"
      theme={preferencia === 'sistema' ? 'system' : preferencia === 'escuro' ? 'dark' : 'light'}
      duration={DURACAO_AVISO_MS}
      gap={10}
      toastOptions={{
        classNames: {
          toast: 'aviso !rounded-xl !border !border-neutra-200 !bg-surface !text-neutra-800 !shadow-lg !py-3.5',
          title: '!font-medium',
          description: '!text-neutra-500',
        },
      }}
    />
  )
}
