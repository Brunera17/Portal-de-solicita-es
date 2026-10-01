import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { STATUS, type FiltrosSolicitacao, type Status } from '@/types'

const POR_PAGINA = 10

const ehStatus = (v: string | null): v is Status => STATUS.includes(v as Status)
const ehData = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v)

/** Filtros da listagem sincronizados com a query string (?status=ABERTO&pagina=2...). */
export function useFiltrosUrl() {
  const [params, setParams] = useSearchParams()

  const filtros = useMemo<FiltrosSolicitacao>(() => {
    const pagina = Number(params.get('pagina'))
    const categoriaId = Number(params.get('categoriaId'))
    const status = params.get('status')
    const dataInicio = params.get('dataInicio')
    const dataFim = params.get('dataFim')

    return {
      q: params.get('q')?.trim() || undefined,
      categoriaId: Number.isInteger(categoriaId) && categoriaId > 0 ? categoriaId : undefined,
      status: ehStatus(status) ? status : undefined,
      dataInicio: ehData(dataInicio) ? dataInicio : undefined,
      dataFim: ehData(dataFim) ? dataFim : undefined,
      pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
      porPagina: POR_PAGINA,
    }
  }, [params])

  /** Atualiza um ou mais filtros; qualquer mudança que não seja de página volta para a página 1. */
  const atualizar = useCallback(
    (mudancas: Partial<Record<keyof FiltrosSolicitacao, string | number | undefined>>) => {
      setParams(
        (atual) => {
          const novo = new URLSearchParams(atual)
          for (const [chave, valor] of Object.entries(mudancas)) {
            if (valor === undefined || valor === '') novo.delete(chave)
            else novo.set(chave, String(valor))
          }
          if (!('pagina' in mudancas)) novo.delete('pagina')
          return novo
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const limpar = useCallback(() => setParams({}, { replace: true }), [setParams])

  const temFiltros = !!(filtros.q || filtros.categoriaId || filtros.status || filtros.dataInicio || filtros.dataFim)

  return { filtros, atualizar, limpar, temFiltros }
}
