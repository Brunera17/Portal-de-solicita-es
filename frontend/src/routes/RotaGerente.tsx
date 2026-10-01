import { Outlet } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { useUsuarioLogado } from '@/hooks/useAuth'
import { ehGerente } from '@/lib/dominio'
import { BotaoLink } from '@/components/ui/Button'

/** Área administrativa: só gerentes. O backend também bloqueia (403) — isto é só para a UX. */
export function RotaGerente() {
  const usuario = useUsuarioLogado()

  if (!ehGerente(usuario.perfil)) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <ShieldAlert aria-hidden className="size-10 text-slate-300" />
        <h1 className="mt-3 text-lg font-semibold text-slate-900">Acesso restrito</h1>
        <p className="mt-1 text-sm text-slate-500">Esta área é exclusiva para gerentes.</p>
        <BotaoLink to="/" variante="secundario" className="mt-5">
          Voltar ao início
        </BotaoLink>
      </div>
    )
  }

  return <Outlet />
}
