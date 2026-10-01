import type { ReactNode } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'
import { Button } from './Button'
import { Spinner } from './Spinner'

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-neutra-500">
      <Spinner />
      <span className="text-sm">{texto}</span>
    </div>
  )
}

export function Vazio({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <Inbox aria-hidden className="size-10 text-neutra-300" />
      <p className="mt-3 font-medium text-neutra-700">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-neutra-500">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  )
}

export function ErroCarregamento({ mensagem, onTentarNovamente }: { mensagem: string; onTentarNovamente?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-16 text-center">
      <AlertTriangle aria-hidden className="size-10 text-red-400" />
      <p className="mt-3 font-medium text-neutra-700">{mensagem}</p>
      {onTentarNovamente && (
        <Button variante="secundario" className="mt-5" onClick={onTentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
