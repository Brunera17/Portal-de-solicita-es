import { createContext } from 'react'
import type { Usuario } from '@/types'

export interface AuthContextValue {
  usuario: Usuario | null
  /** true enquanto valida o token salvo ao abrir a aplicação */
  carregando: boolean
  login: (usuario: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
