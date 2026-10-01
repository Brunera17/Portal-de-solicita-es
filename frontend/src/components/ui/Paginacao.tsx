import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface Props {
  pagina: number
  totalPaginas: number
  total: number
  porPagina: number
  onMudar: (pagina: number) => void
}

export function Paginacao({ pagina, totalPaginas, total, porPagina, onMudar }: Props) {
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const fim = Math.min(pagina * porPagina, total)

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-4 border-t border-neutra-200 px-4 py-3">
      <p className="text-sm text-neutra-500">
        <span className="font-medium text-neutra-700">{inicio}</span>–<span className="font-medium text-neutra-700">{fim}</span> de{' '}
        <span className="font-medium text-neutra-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variante="secundario" tamanho="sm" disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)}>
          <ChevronLeft aria-hidden className="size-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <span className="text-sm text-neutra-500">
          {pagina} / {totalPaginas}
        </span>
        <Button variante="secundario" tamanho="sm" disabled={pagina >= totalPaginas} onClick={() => onMudar(pagina + 1)}>
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
