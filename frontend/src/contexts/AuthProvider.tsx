import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SESSAO_EXPIRADA_EVENT, tokenStorage } from '@/api/client'
import { authApi } from '@/api/endpoints'
import type { Usuario } from '@/types'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(() => tokenStorage.get() !== null)

  // Ao abrir a aplicação, valida o token salvo buscando o usuário da sessão
  useEffect(() => {
    if (!tokenStorage.get()) return

    authApi
      .me()
      .then(setUsuario)
      .catch(() => tokenStorage.clear())
      .finally(() => setCarregando(false))
  }, [])

  // Qualquer 401 da API (token expirado/inválido) encerra a sessão
  useEffect(() => {
    const encerrar = () => {
      setUsuario((atual) => {
        if (atual) toast.warning('Sua sessão expirou. Faça login novamente.')
        return null
      })
      queryClient.clear()
    }
    window.addEventListener(SESSAO_EXPIRADA_EVENT, encerrar)
    return () => window.removeEventListener(SESSAO_EXPIRADA_EVENT, encerrar)
  }, [queryClient])

  const login = useCallback(async (nomeUsuario: string, senha: string) => {
    const { token, usuario } = await authApi.login(nomeUsuario, senha)
    tokenStorage.set(token)
    setUsuario(usuario)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined)
    tokenStorage.clear()
    setUsuario(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, carregando, login, logout, atualizarUsuario: setUsuario }),
    [usuario, carregando, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
