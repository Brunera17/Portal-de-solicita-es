const dataFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const dataHoraFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const formatarData = (iso: string) => dataFmt.format(new Date(iso))
export const formatarDataHora = (iso: string) => dataHoraFmt.format(new Date(iso))

/** Código exibido ao usuário, ex.: #0007 */
export const formatarCodigo = (id: number) => `#${String(id).padStart(4, '0')}`
