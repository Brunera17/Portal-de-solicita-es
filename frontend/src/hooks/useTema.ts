import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { aplicarTema, lerPreferencia, observarSistema, resolverTema, salvarPreferencia, type PreferenciaTema } from '@/lib/tema'

// Pequeno "store" para que todos os componentes vejam a mesma preferência
const ouvintes = new Set<() => void>()
let atual: PreferenciaTema = lerPreferencia()

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function useTema() {
  const preferencia = useSyncExternalStore(assinar, () => atual)

  const definir = useCallback((nova: PreferenciaTema) => {
    atual = nova
    salvarPreferencia(nova)
    aplicarTema(nova)
    ouvintes.forEach((o) => o())
  }, [])

  useEffect(() => observarSistema(() => aplicarTema(atual)), [])

  return { preferencia, temaEfetivo: resolverTema(preferencia), definir }
}
