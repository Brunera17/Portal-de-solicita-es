import { Monitor, Moon, Sun } from 'lucide-react'
import { useTema } from '@/hooks/useTema'
import { cn } from '@/lib/cn'
import type { PreferenciaTema } from '@/lib/tema'

const opcoes: { valor: PreferenciaTema; rotulo: string; icone: typeof Sun }[] = [
  { valor: 'claro', rotulo: 'Claro', icone: Sun },
  { valor: 'escuro', rotulo: 'Escuro', icone: Moon },
  { valor: 'sistema', rotulo: 'Sistema', icone: Monitor },
]

/** Alternância Claro / Escuro / Sistema (segue o sistema operacional). */
export function SeletorTema() {
  const { preferencia, definir } = useTema()

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-lg bg-neutra-100 p-1 dark:bg-neutra-200">
      {opcoes.map(({ valor, rotulo, icone: Icone }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={preferencia === valor}
          title={`Tema ${rotulo.toLowerCase()}`}
          onClick={() => definir(valor)}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
            preferencia === valor ? 'bg-surface text-neutra-900 shadow-sm' : 'text-neutra-500 hover:text-neutra-800',
          )}
        >
          <Icone aria-hidden className="size-3.5" />
          {rotulo}
        </button>
      ))}
    </div>
  )
}
