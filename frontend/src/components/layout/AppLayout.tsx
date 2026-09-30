import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { cn } from '@/lib/cn'
import { ClipboardList, LayoutDashboard, LogOut, Menu, Plus, X } from 'lucide-react'
import { useUsuarioLogado, useAuth } from '@/hooks/useAuth'
import { ROTULO_PERFIL } from '@/lib/dominio'
import { BotaoLink, Button } from '@/components/ui/Button'

const links = [
  { to: '/', rotulo: 'Dashboard', icone: LayoutDashboard, end: true },
  { to: '/solicitacoes', rotulo: 'Solicitações', icone: ClipboardList, end: false },
]

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function AppLayout() {
  const usuario = useUsuarioLogado()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  const sair = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const classeLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    )

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
              <ClipboardList aria-hidden className="size-4" />
            </span>
            <span className="hidden whitespace-nowrap sm:inline">Portal de Solicitações</span>
          </Link>

          <nav aria-label="Principal" className="ml-4 hidden items-center gap-1 md:flex">
            {links.map(({ to, rotulo, icone: Icone, end }) => (
              <NavLink key={to} to={to} end={end} className={classeLink}>
                <Icone aria-hidden className="size-4" />
                {rotulo}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <BotaoLink to="/solicitacoes/nova" tamanho="sm" className="hidden lg:inline-flex">
              <Plus aria-hidden className="size-4" />
              Nova solicitação
            </BotaoLink>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 md:flex">
              <span
                aria-hidden
                title={usuario.nome}
                className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
              >
                {iniciais(usuario.nome)}
              </span>
              <div className="hidden whitespace-nowrap leading-tight lg:block">
                <p className="text-sm font-medium text-slate-800">{usuario.nome}</p>
                <p className="text-xs text-slate-500">{ROTULO_PERFIL[usuario.perfil]}</p>
              </div>
              <Button variante="fantasma" tamanho="sm" onClick={sair} aria-label="Sair" title="Sair">
                <LogOut aria-hidden className="size-4" />
              </Button>
            </div>

            <Button
              variante="fantasma"
              tamanho="sm"
              className="md:hidden"
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              onClick={() => setMenuAberto((v) => !v)}
            >
              {menuAberto ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {menuAberto && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <nav aria-label="Principal (móvel)" className="flex flex-col gap-1" onClick={() => setMenuAberto(false)}>
              {links.map(({ to, rotulo, icone: Icone, end }) => (
                <NavLink key={to} to={to} end={end} className={classeLink}>
                  <Icone aria-hidden className="size-4" />
                  {rotulo}
                </NavLink>
              ))}
              <NavLink to="/solicitacoes/nova" className={classeLink}>
                <Plus aria-hidden className="size-4" />
                Nova solicitação
              </NavLink>
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <div className="leading-tight">
                <p className="text-sm font-medium text-slate-800">{usuario.nome}</p>
                <p className="text-xs text-slate-500">{ROTULO_PERFIL[usuario.perfil]}</p>
              </div>
              <Button variante="secundario" tamanho="sm" onClick={sair}>
                <LogOut aria-hidden className="size-4" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
