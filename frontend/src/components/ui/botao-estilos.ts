import { cn } from '@/lib/cn'

export type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'perigoContorno' | 'fantasma'
export type TamanhoBotao = 'sm' | 'md'

const variantes: Record<VarianteBotao, string> = {
  primario: 'bg-marca text-white hover:bg-marca-escura disabled:opacity-60',
  secundario: 'bg-surface text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  perigo: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 dark:hover:bg-red-400',
  perigoContorno: 'bg-surface text-red-600 border border-red-200 hover:bg-red-50 disabled:text-red-300',
  fantasma: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-400',
}

const tamanhos: Record<TamanhoBotao, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}

/** Classes compartilhadas por <Button> e <BotaoLink>. */
export function classesBotao(variante: VarianteBotao = 'primario', tamanho: TamanhoBotao = 'md', extra?: string) {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
    variantes[variante],
    tamanhos[tamanho],
    extra,
  )
}
