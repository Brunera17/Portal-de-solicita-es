import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Carregando } from '@/components/ui/Estados'

/** Só renderiza as rotas filhas para usuários autenticados; senão, redireciona ao login. */
export function RotaPrivada() {
  const { usuario, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return <Carregando texto="Verificando sessão..." />
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />
  }

  return <Outlet />
}
