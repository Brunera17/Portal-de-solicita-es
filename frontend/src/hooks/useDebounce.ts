import { useEffect, useState } from 'react'

/** Devolve o valor só depois de `atraso` ms sem mudanças (ex.: busca enquanto digita). */
export function useDebounce<T>(valor: T, atraso = 400): T {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), atraso)
    return () => clearTimeout(t)
  }, [valor, atraso])

  return atrasado
}
