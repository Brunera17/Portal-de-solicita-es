import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { ClipboardList, Columns3, LayoutDashboard, LogOut, Menu, Plus, Settings, UserRound, X } from 'lucide-react'
import { useAuth, useUsuarioLogado } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { ehGerente, ROTULO_PERFIL } from '@/lib/dominio'
import { Avatar } from '@/components/ui/Avatar'
import { BotaoLink, Button } from '@/components/ui/Button'

const linksBase = [
  { to: '/', rotulo: 'Dashboard', icone: LayoutDashboard, end: true },
  { to: '/solicitacoes', rotulo: 'Solicitações', icone: ClipboardList, end: false },
  { to: '/quadro', rotulo: 'Quadro', icone: Columns3, end: false },
]
const linkAdmin = { to: '/admin', rotulo: 'Administração', icone: Settings, end: false }

export function AppLayout() {
  const usuario = useUsuarioLogado()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  const links = ehGerente(usuario.perfil) ? [...linksBase, linkAdmin] : linksBase

  const sair = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const classeLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
            <span className="hidden whitespace-nowrap sm:inline md:hidden xl:inline">Portal de Solicitações</span>
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex xl:ml-4">
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
              <span className="hidden xl:inline">Nova solicitação</span>
              <span className="xl:hidden">Nova</span>
            </BotaoLink>

            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 md:flex">
              <Link
                to="/perfil"
                title="Meu perfil"
                className="flex items-center gap-3 rounded-lg p-1 pr-2 hover:bg-slate-100"
              >
                <Avatar nome={usuario.nome} cor={usuario.corAvatar} />
                <span className="hidden whitespace-nowrap leading-tight xl:block">
                  <span className="block text-sm font-medium text-slate-800">{usuario.nome}</span>
                  <span className="block text-xs text-slate-500">{ROTULO_PERFIL[usuario.perfil]}</span>
                </span>
              </Link>
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
              <NavLink to="/perfil" className={classeLink}>
                <UserRound aria-hidden className="size-4" />
                Meu perfil
              </NavLink>
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <div className="flex items-center gap-3">
                <Avatar nome={usuario.nome} cor={usuario.corAvatar} />
                <div className="leading-tight">
                  <p className="text-sm font-medium text-slate-800">{usuario.nome}</p>
                  <p className="text-xs text-slate-500">{ROTULO_PERFIL[usuario.perfil]}</p>
                </div>
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
