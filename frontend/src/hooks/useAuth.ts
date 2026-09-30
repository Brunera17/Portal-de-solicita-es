import { useContext } from 'react'
import { AuthContext } from '@/contexts/auth-context'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return ctx
}

/** Usuário logado; só usar em páginas protegidas por <RotaPrivada>. */
export function useUsuarioLogado() {
  const { usuario } = useAuth()
  if (!usuario) {
    throw new Error('Nenhum usuário autenticado')
  }
  return usuario
}
