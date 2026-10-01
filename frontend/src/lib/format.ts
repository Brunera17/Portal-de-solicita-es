const dataFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const dataHoraFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const formatarData = (iso: string) => dataFmt.format(new Date(iso))
export const formatarDataHora = (iso: string) => dataHoraFmt.format(new Date(iso))

/** Código exibido ao usuário, ex.: #0007 */
export const formatarCodigo = (id: number) => `#${String(id).padStart(4, '0')}`

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

/** Tempo relativo curto, ex.: "há 5 minutos", "ontem". Acima de 7 dias, mostra a data. */
export function formatarRelativo(iso: string, agora = Date.now()) {
  const diferenca = new Date(iso).getTime() - agora
  if (Math.abs(diferenca) > 7 * 86_400_000) return formatarData(iso)
  for (const [unidade, ms] of UNIDADES) {
    if (Math.abs(diferenca) >= ms) return relativo.format(Math.round(diferenca / ms), unidade)
  }
  return 'agora'
}
